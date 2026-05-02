import { sendMail } from './_lib/mailer.js';
import { requireAdmin, readJsonBody, getAdminClient } from './_lib/auth.js';
import { inviteTemplate } from './_lib/templates.js';

export const config = { runtime: 'nodejs' };

const VALID_ROLES = ['customer', 'lawyer', 'insurance', 'staff', 'admin'];

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
      const { error: profErr } = await admin.from('user_profiles').upsert({
        id: userId,
        email,
        full_name: fullName || null,
        role,
        active: true,
        linked_id: linkedId,
        phone,
      }, { onConflict: 'id' });
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
