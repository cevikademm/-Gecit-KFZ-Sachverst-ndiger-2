// supabase/functions/ruhsat-ocr/index.ts
// ──────────────────────────────────────────────────────────────────────────
// Alman Zulassungsbescheinigung Teil I (Fahrzeugschein) OCR — Claude Sonnet 4.6
//
// POST /functions/v1/ruhsat-ocr
//   { fileBase64: string, mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' }
//
// Yanıt: { ok: true, data: {RUHSAT_FIELD_MAP}, confidence: 0..1, model, raw }
//
// Secret: ANTHROPIC_API_KEY (Supabase → Functions → Secrets)
// ──────────────────────────────────────────────────────────────────────────

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT = `Sen Alman Zulassungsbescheinigung Teil I (Fahrzeugschein / KFZ-Schein) belgesini okuyan bir uzman OCR ajanısın.

Görevin: belgeden TÜM alanları AYNEN, TAM ve EKSİKSİZ çıkarmak. Eksik alan yoksa "" (boş string) döndür. Asla uydurma.

ÇIKTI FORMATI: SADECE geçerli JSON. Açıklama, markdown, kod bloku YOK. Sadece şu anahtarları olan tek bir JSON nesnesi:

{
  "DRUCK":  "<Druckstücknummer>",
  "A":      "<Amtl. Kennzeichen / Plaka>",
  "B":      "<Datum der Erstzulassung — DD.MM.YYYY>",
  "C.1.1":  "<Name des Halters / Soyad>",
  "C.1.2":  "<Vorname des Halters / Ad>",
  "C.1.3":  "<Anschrift — sokak no, plz, şehir>",
  "0.1":    "<Behörden-Schlüssel>",
  "0.2":    "<Verfahrenskennung>",
  "1":      "<Fahrzeugklasse — örn. M1>",
  "2":      "<Aufbau / Karosserie>",
  "4":      "<Verwendungsart>",
  "5":      "<FIN / VIN — 17 hane>",
  "D.1":    "<Marke>",
  "D.2":    "<Typ, Variante, Version>",
  "D.3":    "<Handelsbezeichnung>",
  "F.1":    "<Tech. zul. Gesamtmasse — kg ile>",
  "F.2":    "<Im Mitgliedstaat zul. Gesamtmasse>",
  "G":      "<Leermasse — kg ile>",
  "J":      "<Fahrzeugart>",
  "K":      "<EG-Typgenehmigungsnummer>",
  "L":      "<Achsen sayisi>",
  "O.1":    "<Anhängelast gebremst — kg ile>",
  "O.2":    "<Anhängelast ungebremst — kg ile>",
  "P.1":    "<Hubraum — cm³ ile>",
  "P.2":    "<Nennleistung — kW ile>",
  "P.3":    "<Kraftstoffart>",
  "P.5":    "<Motornummer>",
  "Q":      "<Leistungs-/Masse-Verhältnis>",
  "R":      "<Farbe>",
  "S.1":    "<Sitzplätze>",
  "S.2":    "<Stehplätze>",
  "T":      "<Höchstgeschwindigkeit — km/h ile>",
  "U.1":    "<Standgeräusch — dB ile>",
  "U.2":    "<Drehzahl Standgeräusch — 1/min>",
  "U.3":    "<Fahrgeräusch — dB ile>",
  "V.7":    "<CO₂-Emission — g/km ile>",
  "V.9":    "<Emissionsklasse — örn. EURO 6>",
  "14":     "<Typgenehmigung Emission>",
  "15":     "<Bereifung>",
  "15.1":   "<Bereifung Antriebsachse>",
  "18":     "<Länge — mm ile>",
  "19":     "<Breite — mm ile>",
  "20":     "<Höhe — mm ile>",
  "22":     "<Anhängelast>",
  "AUSST":  "<Ausstellungsdatum — DD.MM.YYYY>",
  "BEH":    "<Ausstellende Behörde>",
  "_confidence": <0.0..1.0 — okuma güveni>
}

KRİTİK KURALLAR:
1. Plaka (A): Boşluksuz olarak geri ver, örn. "AC FN 960" yerine "AC-FN-960" — şehir kodu bilinmiyorsa ham haliyle bırak.
2. VIN (5): TAM 17 karakter, harf ve rakam karışık. "0" sayı, "O" harf — dikkatlice ayır. I/O/Q hiç yok VIN'de.
3. Tarihler: DD.MM.YYYY formatında. Eksikse "".
4. Sayısal alanlar (P.1, P.2, F.1, G, T, vb.): birim ile birlikte ("85 kW", "1565 kg", "178 km/h"). Sadece sayı isteniyorsa kullanan parser yapar.
5. Adres (C.1.3): "sokak no, plz şehir" formatında tek satır. Örn. "Amselweg 24 F, 52223 Stolberg"
6. Asla null kullanma — okunamayan alanlar "" olsun.
7. _confidence: belge kalitesine göre 0.0-1.0. Tüm alanlar net okunduysa >0.95. Bulanıksa daha düşük.`;

interface OcrRequest {
  fileBase64: string;
  mimeType: string;
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'ANTHROPIC_API_KEY tanımlı değil (Supabase Functions secrets)' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: OcrRequest = await req.json();
    if (!body?.fileBase64 || !body?.mimeType) {
      return new Response(JSON.stringify({ ok: false, error: 'fileBase64 ve mimeType zorunlu' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supportedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedImages.includes(body.mimeType) && body.mimeType !== 'application/pdf') {
      return new Response(JSON.stringify({ ok: false, error: `Desteklenmeyen mimeType: ${body.mimeType}. Sadece JPEG/PNG/WEBP/PDF.` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PDF → Anthropic 'document' tipi destekliyor (Claude 3.5+)
    const sourceBlock = body.mimeType === 'application/pdf'
      ? {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: body.fileBase64 },
        }
      : {
          type: 'image',
          source: { type: 'base64', media_type: body.mimeType, data: body.fileBase64 },
        };

    const requestBody = {
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            sourceBlock,
            { type: 'text', text: 'Bu Alman Fahrzeugschein belgesini analiz et ve sistemde tanımlanan TAM JSON formatında geri dön. Sadece JSON, başka metin yok.' },
          ],
        },
      ],
    };

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('[ruhsat-ocr] Anthropic error:', apiRes.status, errText);
      return new Response(JSON.stringify({ ok: false, error: `Claude API hata (${apiRes.status}): ${errText.slice(0, 300)}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await apiRes.json();
    const rawText = result?.content?.[0]?.text || '';

    // JSON parsing — modelin başına bazen ```json bloku ya da açıklama ekleyebilir
    let parsed: Record<string, unknown> | null = null;
    try {
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (_) {
      // İlk { ile son } arasını bul
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (_) { /* noop */ }
      }
    }

    if (!parsed) {
      return new Response(JSON.stringify({ ok: false, error: 'Claude yanıtı JSON parse edilemedi', raw: rawText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const confidence = typeof parsed._confidence === 'number'
      ? Math.max(0, Math.min(1, parsed._confidence as number))
      : 0.85;
    delete (parsed as Record<string, unknown>)._confidence;

    return new Response(JSON.stringify({
      ok: true,
      data: parsed,
      confidence,
      model: MODEL,
      usage: result?.usage,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ruhsat-ocr] unexpected:', err);
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message || 'Bilinmeyen hata' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
