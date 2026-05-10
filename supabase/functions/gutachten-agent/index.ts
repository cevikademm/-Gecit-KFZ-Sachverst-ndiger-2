// ════════════════════════════════════════════════════════════════════════
// Gutachten Agent — Supabase Edge Function
// ════════════════════════════════════════════════════════════════════════
// Endpoint: POST /functions/v1/gutachten-agent
//
// Actions:
//   • start    → yeni session aç, ilk agent mesajını üret
//   • message  → kullanıcı mesajını al, Claude'a gönder, cevabı döndür+kaydet
//   • get      → session + tüm mesajlar (resume için)
//
// Secrets (Supabase Dashboard → Project Settings → Edge Functions → Secrets):
//   • ANTHROPIC_API_KEY  ✅ kullanıcı tarafından eklendi
//   • SUPABASE_URL                   (otomatik)
//   • SUPABASE_ANON_KEY              (otomatik)
//   • SUPABASE_SERVICE_ROLE_KEY      (otomatik)
//
// Deploy:
//   supabase functions deploy gutachten-agent --no-verify-jwt
//   (no-verify-jwt çünkü auth kontrolü manuel yapıyoruz; admin RLS check için service role)
// ════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { GUTACHTEN_AGENT_PROMPT } from './prompt.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 2048;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ─── Tool: submit_draft ────────────────────────────────────────────────
// Akış tamamlandığında LLM bu tool ile final JSON'u döndürür.
// Frontend bu draft'ı AdminReportEditor.jsx form'una inject eder.
const SUBMIT_DRAFT_TOOL = {
  name: 'submit_draft',
  description:
    "14 adımlı akış tamamlandığında ve kullanıcı onayladığında çağır. " +
    "Final draft'ı AdminReportEditor.jsx initialDraft formatında JSON olarak döndür. " +
    "Bu tool çağrıldığında session 'completed' olarak işaretlenir ve form'a inject edilir.",
  input_schema: {
    type: 'object',
    properties: {
      draft: {
        type: 'object',
        description:
          'Tam draft objesi. Anahtarlar: claimant, report, accident, visit, opponent, ' +
          'insurance, vehicle, condition, damages, tires, calculation, invoice, signatures.',
      },
      summary: {
        type: 'string',
        description: 'Kullanıcıya gösterilecek 1-2 cümlelik kısa özet',
      },
    },
    required: ['draft'],
  },
};

// ════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ════════════════════════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Auth: kullanıcı JWT'sini doğrula
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    // 2. Service role client — RLS bypass eden DB yazıcısı
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 3. Action dispatcher
    const body = await req.json();
    const action = body.action;

    if (action === 'start') return await handleStart(sb, user, body);
    if (action === 'message') return await handleMessage(sb, user, body);
    if (action === 'get') return await handleGet(sb, body);
    if (action === 'generate_text') return await handleGenerateText(body);

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err) {
    console.error('[gutachten-agent] error:', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

// ════════════════════════════════════════════════════════════════════════
// HANDLERS
// ════════════════════════════════════════════════════════════════════════

async function handleStart(
  sb: ReturnType<typeof createClient>,
  user: { id: string },
  body: { customer_id?: string; vehicle_id?: string; report_type?: string },
) {
  // Yeni session aç
  const { data: session, error } = await sb
    .from('gutachten_agent_sessions')
    .insert({
      user_id: user.id,
      customer_id: body.customer_id ?? null,
      vehicle_id: body.vehicle_id ?? null,
      report_type: body.report_type ?? null,
      status: 'active',
      current_step: '1',
      model: MODEL,
      draft: {},
    })
    .select()
    .single();

  if (error) throw new Error(`Session create failed: ${error.message}`);

  // Bağlam mesajı: customer + vehicle seçildiyse tam veriyi yükle ve agent'a bildir
  let contextNote = '';
  let prefilledDraft: Record<string, unknown> = {};

  if (body.customer_id) {
    const { data: customer } = await sb
      .from('customers')
      .select('id, full_name, company, email, phone, street, zip, city, type, tc, birthdate')
      .eq('id', body.customer_id)
      .single();
    if (customer) {
      // Ad parse: "Anna Marie Meyer" → firstName="Anna", lastName="Marie Meyer"
      const tokens = String(customer.full_name || '').trim().split(/\s+/);
      const firstName = tokens[0] || '';
      const lastName = tokens.slice(1).join(' ') || '';

      const claimantPatch = {
        company: customer.company || '',
        firstName,
        lastName,
        street: customer.street || '',
        zip: customer.zip || '',
        city: customer.city || '',
        phone: customer.phone || '',
        email: customer.email || '',
        isOwner: true,
      };
      prefilledDraft.claimant = claimantPatch;

      contextNote += `\n\n═══ MÜŞTERİ ÖN-BAĞLAMI (claimant.* zaten dolu) ═══`;
      contextNote += `\nAd: ${customer.full_name || '—'}`;
      if (customer.company) contextNote += `\nFirma: ${customer.company}`;
      contextNote += `\nTip: ${customer.type}`;
      if (customer.email) contextNote += `\nE-posta: ${customer.email}`;
      if (customer.phone) contextNote += `\nTelefon: ${customer.phone}`;
      if (customer.street || customer.zip || customer.city) {
        contextNote += `\nAdres: ${customer.street || ''} ${customer.zip || ''} ${customer.city || ''}`.trim();
      }
    }
  }

  if (body.vehicle_id) {
    const { data: vehicle } = await sb
      .from('vehicles')
      .select('id, plate, brand, model, year, chassis, vin, first_registration, color, fuel, engine_cc')
      .eq('id', body.vehicle_id)
      .single();
    if (vehicle) {
      // Plaka parse: "AC-RN-788" → { city: "AC", initials: "RN", number: "788" }
      const plateMatch = String(vehicle.plate || '').match(/^([A-ZÄÖÜ]+)-([A-ZÄÖÜ]+)-(\d+E?)$/i);
      const platePatch = plateMatch
        ? { city: plateMatch[1].toUpperCase(), initials: plateMatch[2].toUpperCase(), number: plateMatch[3] }
        : null;

      const vehiclePatch: Record<string, unknown> = {
        vin: vehicle.chassis || vehicle.vin || '',
        manufacturer: vehicle.brand || '',
        mainType: vehicle.model || '',
        yearOfManufacture: vehicle.year ? String(vehicle.year) : '',
        firstRegistration: vehicle.first_registration || '',
      };
      prefilledDraft.vehicle = vehiclePatch;

      if (platePatch && prefilledDraft.claimant) {
        (prefilledDraft.claimant as Record<string, unknown>).plate = platePatch;
      }

      contextNote += `\n\n═══ ARAÇ ÖN-BAĞLAMI (vehicle.* zaten dolu) ═══`;
      contextNote += `\nPlaka: ${vehicle.plate || '—'}`;
      contextNote += `\nMarka/Model: ${vehicle.brand || '—'} ${vehicle.model || ''}`;
      if (vehicle.year) contextNote += `\nYıl: ${vehicle.year}`;
      if (vehicle.chassis || vehicle.vin) contextNote += `\nVIN/Şasi: ${vehicle.chassis || vehicle.vin}`;
      if (vehicle.color) contextNote += `\nRenk: ${vehicle.color}`;
      if (vehicle.fuel) contextNote += `\nYakıt: ${vehicle.fuel}`;
      if (vehicle.engine_cc) contextNote += `\nMotor: ${vehicle.engine_cc} cc`;
    }
  }

  // Adım atlama talimatı: ön-bağlam doluysa
  let skipInstruction = '';
  if (body.customer_id && body.vehicle_id) {
    skipInstruction = '\n\nADIM 2 (Müşteri) ve ADIM 4-5 (Araç + Plaka) zaten doldu — atla, ADIM 1 (Rapor Türü) sonrasında doğrudan ADIM 3 (Kaza) ile devam et. Kullanıcıya kısaca onaylat: "Sabrina Mai için MON-RR-4711 plakalı Range Rover Evoque ile devam ediyoruz, doğru mu?" sonra Rapor türünü sor.';
  } else if (body.customer_id) {
    skipInstruction = '\n\nADIM 2 (Müşteri) zaten doldu — atla. ADIM 1 (Rapor Türü) sonrası ADIM 3 (Kaza) ile devam, sonra ADIM 4 (Araç).';
  }

  // İlk turdaki user mesajı — bağlam + akış başlatma talimatı
  const seedUserMessage = `Yeni Gutachten oluşturalım.${contextNote}${skipInstruction}\n\nAkışı 1. adımdan (Rapor Türü) başlat — ama ön-bağlamı kullanıcıya 1 cümle özetleyerek doğrula.`;

  // Anthropic'e ilk istek
  const reply = await callAnthropic([{ role: 'user', content: seedUserMessage }]);

  // Mesajları kaydet
  await sb.from('gutachten_agent_messages').insert([
    {
      session_id: session.id,
      role: 'user',
      content: seedUserMessage,
      metadata: { kind: 'seed' },
    },
    {
      session_id: session.id,
      role: 'assistant',
      content: reply.text,
      tokens_input: reply.tokens_input,
      tokens_output: reply.tokens_output,
    },
  ]);

  // Session: token sayacı + prefilled draft (varsa)
  const sessionUpdate: Record<string, unknown> = {
    total_tokens_input: reply.tokens_input,
    total_tokens_output: reply.tokens_output,
  };
  if (Object.keys(prefilledDraft).length > 0) {
    sessionUpdate.draft = prefilledDraft;
  }
  await sb
    .from('gutachten_agent_sessions')
    .update(sessionUpdate)
    .eq('id', session.id);

  return jsonResponse({
    session_id: session.id,
    message: reply.text,
    status: 'active',
    current_step: '1',
  });
}

async function handleMessage(
  sb: ReturnType<typeof createClient>,
  _user: { id: string },
  body: { session_id?: string; user_message?: string },
) {
  const sessionId = body.session_id;
  const userMessage = (body.user_message ?? '').trim();

  if (!sessionId || !userMessage) {
    return jsonResponse({ error: 'session_id and user_message required' }, 400);
  }

  // Session yükle
  const { data: session, error: sErr } = await sb
    .from('gutachten_agent_sessions')
    .select('id, status, total_tokens_input, total_tokens_output, draft')
    .eq('id', sessionId)
    .single();

  if (sErr || !session) {
    return jsonResponse({ error: 'Session not found' }, 404);
  }

  if (session.status !== 'active') {
    return jsonResponse(
      { error: `Session is "${session.status}", not active` },
      400,
    );
  }

  // Sohbet geçmişini yükle (kronolojik)
  const { data: history } = await sb
    .from('gutachten_agent_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  // Anthropic için role normalize: 'system' ve 'tool' → atla; 'assistant' ve 'user' bırak
  const conversation = (history ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));

  conversation.push({ role: 'user', content: userMessage });

  // Kullanıcı mesajını DB'ye kaydet
  await sb.from('gutachten_agent_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: userMessage,
  });

  // Anthropic'e gönder
  const reply = await callAnthropic(conversation);

  // Tool kullanımı? (submit_draft)
  const updateData: Record<string, unknown> = {
    total_tokens_input:
      (session.total_tokens_input ?? 0) + reply.tokens_input,
    total_tokens_output:
      (session.total_tokens_output ?? 0) + reply.tokens_output,
  };

  let responseStatus = 'active';
  let responseDraft: unknown = null;

  if (reply.tool_use && reply.tool_use.name === 'submit_draft') {
    const newDraft = reply.tool_use.input?.draft ?? null;
    if (newDraft) {
      updateData.draft = newDraft;
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      updateData.current_step = 'completed';
      responseStatus = 'completed';
      responseDraft = newDraft;
    }
  }

  await sb
    .from('gutachten_agent_sessions')
    .update(updateData)
    .eq('id', sessionId);

  // Asistan cevabını kaydet
  await sb.from('gutachten_agent_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content: reply.text || '(araç çağrısı yapıldı)',
    tokens_input: reply.tokens_input,
    tokens_output: reply.tokens_output,
    metadata: reply.tool_use
      ? { tool_use: reply.tool_use.name }
      : null,
  });

  return jsonResponse({
    session_id: sessionId,
    message: reply.text,
    status: responseStatus,
    draft: responseDraft,
  });
}

async function handleGenerateText(
  body: { kind?: string; context?: Record<string, unknown> },
) {
  // kind: 'unfallhergang' | 'gutachter_bemerkung' | 'damage_description'
  // context: kazadan ve araçtan toplanmış serbest veri
  const kind = body.kind || 'gutachter_bemerkung';
  const context = body.context || {};

  const promptByKind: Record<string, string> = {
    unfallhergang:
      'Aşağıdaki kaza verisinden, Almanca resmi Sachverständigen-Gutachten için "Unfallhergang" (kaza akışı) paragrafı yaz. ' +
      'Kısa, nesnel, 2-4 cümle. Eğer ayrıntı bilinmiyorsa "Zum Schadenhergang sind Einzelheiten nicht bekannt geworden." ile başla. ' +
      'HTML/markdown YOK, düz metin.\n\nVeri:\n' + JSON.stringify(context, null, 2),
    gutachter_bemerkung:
      'Aşağıdaki rapor verisinden, Almanca "Gutachter-Bemerkung" (uzman görüşü) paragrafı yaz. ' +
      'Sachverständigen-Deutsch tonu. Hasar tutarı, Wertminderung ve Total Loss kontrolünü kısaca özetle. ' +
      '3-5 cümle. Düz metin.\n\nVeri:\n' + JSON.stringify(context, null, 2),
    damage_description:
      'Aşağıdaki hasar bölgesi listesinden Almanca "Schadenbeschreibung" yaz. ' +
      '2-3 cümle, teknik dil, "Beschädigung des... und ..." kalıbı.\n\nVeri:\n' + JSON.stringify(context, null, 2),
  };

  const userPrompt = promptByKind[kind] || promptByKind.gutachter_bemerkung;

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      system:
        'Sen deneyimli bir Alman KFZ-Sachverständiger asistanısın. ' +
        'Resmi, nesnel, teknik Almanca metinler üretirsin. ' +
        'Asla emoji veya tahmin uydurmazsın.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText}`);
  }
  const data = await res.json();

  let text = '';
  for (const block of data.content ?? []) {
    if (block.type === 'text') text += block.text;
  }

  return jsonResponse({
    text: text.trim(),
    tokens_input: data.usage?.input_tokens ?? 0,
    tokens_output: data.usage?.output_tokens ?? 0,
  });
}

async function handleGet(
  sb: ReturnType<typeof createClient>,
  body: { session_id?: string },
) {
  const sessionId = body.session_id;
  if (!sessionId) {
    return jsonResponse({ error: 'session_id required' }, 400);
  }

  const { data: session } = await sb
    .from('gutachten_agent_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) {
    return jsonResponse({ error: 'Session not found' }, 404);
  }

  const { data: messages } = await sb
    .from('gutachten_agent_messages')
    .select('id, role, content, created_at, metadata')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  return jsonResponse({ session, messages: messages ?? [] });
}

// ════════════════════════════════════════════════════════════════════════
// ANTHROPIC API CLIENT (SDK kullanmadan, sade fetch)
// ════════════════════════════════════════════════════════════════════════

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicReply {
  text: string;
  tool_use: { name: string; input: Record<string, unknown> } | null;
  tokens_input: number;
  tokens_output: number;
}

async function callAnthropic(
  messages: AnthropicMessage[],
): Promise<AnthropicReply> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured in Supabase secrets');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: GUTACHTEN_AGENT_PROMPT,
      tools: [SUBMIT_DRAFT_TOOL],
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // İçerik bloklarını parse et: text + tool_use
  let text = '';
  let toolUse: AnthropicReply['tool_use'] = null;

  for (const block of data.content ?? []) {
    if (block.type === 'text') {
      text += block.text;
    } else if (block.type === 'tool_use') {
      toolUse = { name: block.name, input: block.input ?? {} };
    }
  }

  return {
    text: text.trim() || (toolUse ? "Draft hazır, form'a yerleştiriliyor." : ''),
    tool_use: toolUse,
    tokens_input: data.usage?.input_tokens ?? 0,
    tokens_output: data.usage?.output_tokens ?? 0,
  };
}

// ────────────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
