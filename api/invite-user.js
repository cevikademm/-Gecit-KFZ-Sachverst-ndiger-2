import { sendMail } from './_lib/mailer.js';
import { requireAdmin, readJsonBody, getAdminClient } from './_lib/auth.js';
import { inviteTemplate } from './_lib/templates.js';

export const config = { runtime: 'nodejs' };

const VALID_ROLES = ['customer', 'lawyer', 'insurance', 'staff', 'admin'];

// user_profiles tablo şeması cache'i (TTL: process ömrü).
let _userProfilesColumnsCache = null;

/**
 * user_profiles tablosunun mevcut kolonlarını information_schema'dan çeker.
 * `debug_table_schema` RPC'si varsa onu kullanır, yoksa boş SELECT fallback.
 * Şema çekilemezse null döner; çağıran tarafta filtreleme atlanır.
 */
async function getUserProfilesColumns(admin) {
  if (_userProfilesColumnsCache) return _userProfilesColumnsCache;

  // 1) RPC dene
  const { data: rpcData, error: rpcErr } = await admin.rpc('debug_table_schema', {
    p_table: 'user_profiles',
  });
  if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
    _userProfilesColumnsCache = new Set(rpcData.map((r) => r.column_name));
    return _userProfilesColumnsCache;
  }

  // 2) Fallback — 1 satır seç, anahtarlardan çıkar
  const { data, error } = await admin.from('user_profiles').select('*').limit(1);
  if (!error && Array.isArray(data) && data.length > 0) {
    _userProfilesColumnsCache = new Set(Object.keys(data[0]));
    return _userProfilesColumnsCache;
  }

  console.warn('[invite-user] user_profiles şeması çekilemedi; payload filtresiz gönderilecek');
  return null;
}

function stripToColumns(payload, columns) {
  if (!columns) return payload;
  const out = {};
  for (const k of Object.keys(payload)) {
    if (columns.has(k)) out[k] = payload[k];
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return cors(res).status(204).end();
  cors(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST kabul edilir' });
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  let body;
  try { body = await readJsonBody(req); }
  catch (e) { return res.status(400).json({ error: e.message }); }

  const email = String(body?.email || '').trim().toLowerCase();
  const fullName = String(body?.fullName || '').trim();
  const role = String(body?.role || '').trim();
  const linkedId = body?.linkedId || null;
  const phone = body?.phone || null;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta gerekli' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `Geçersiz rol. Olası: ${VALID_ROLES.join(', ')}` });
  }

  const admin = getAdminClient();
  const redirectTo = `https://kfzgutachter.ac/?invite=accepted`;

  try {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo,
        data: { full_name: fullName, role, phone },
      },
    });

    if (linkErr) {
      if (/already.*registered|already.*exists|duplicate/i.test(linkErr.message || '')) {
        return res.status(409).json({ error: 'Bu e-posta ile zaten bir kullanıcı kayıtlı' });
      }
      throw linkErr;
    }

    const userId = linkData?.user?.id;
    const inviteUrl = linkData?.properties?.action_link;

    if (!inviteUrl) {
      throw new Error('Davet linki oluşturulamadı');
    }

    if (userId) {
      const fullPayload = {
        id: userId,
        email,
        full_name: fullName || null,
        role,
        active: true,
        linked_id: linkedId,
        phone,
      };
      const cols = await getUserProfilesColumns(admin);
      const profilePayload = stripToColumns(fullPayload, cols);
      const dropped = cols
        ? Object.keys(fullPayload).filter((k) => !cols.has(k))
        : [];
      if (dropped.length > 0) {
        console.warn(`[invite-user] user_profiles şemasında olmayan alanlar atlandı: ${dropped.join(', ')}`);
      }
      const { error: profErr } = await admin
        .from('user_profiles')
        .upsert(profilePayload, { onConflict: 'id' });
      if (profErr) console.warn('[invite-user] user_profiles upsert hata:', profErr.message);
    }

    const html = inviteTemplate({
      name: fullName,
      role,
      inviteUrl,
      inviterName: auth.profile?.full_name || auth.profile?.email,
    });

    const result = await sendMail({
      to: email,
      subject: `${fullName || 'Sayın kullanıcı'} — Gecit KFZ portalına davetiniz`,
      html,
    });

    return res.status(200).json({
      ok: true,
      userId,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[invite-user] hata:', err);
    return res.status(500).json({ error: err.message || 'Davet gönderim hatası' });
  }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
