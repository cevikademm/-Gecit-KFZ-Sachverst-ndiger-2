const BRAND_NAME = 'Gecit KFZ Sachverständigenbüro';
const BRAND_COLOR = '#E11D2E';
const BRAND_DARK = '#0B0B0F';
const BRAND_DOMAIN = 'kfzgutachter.ac';
const BRAND_URL = 'https://kfzgutachter.ac';
const LOGO_URL = `${BRAND_URL}/logocustom3.png`;

function layout({ title, body, ctaLabel, ctaUrl, footerNote }) {
  const cta = ctaLabel && ctaUrl ? `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto">
      <tr><td style="border-radius:8px;background:${BRAND_COLOR}">
        <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:.02em">${ctaLabel}</a>
      </td></tr>
    </table>` : '';

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#F5F5F7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${BRAND_DARK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F7;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);overflow:hidden">
        <tr><td style="padding:28px 32px 8px 32px;text-align:center">
          <img src="${LOGO_URL}" alt="${BRAND_NAME}" style="max-width:240px;width:100%;height:auto" />
        </td></tr>
        <tr><td style="padding:8px 32px 32px 32px;color:${BRAND_DARK};font-size:15px;line-height:1.6">
          <h1 style="margin:8px 0 16px 0;font-size:20px;font-weight:700;color:${BRAND_DARK}">${escapeHtml(title)}</h1>
          ${body}
          ${cta}
        </td></tr>
        <tr><td style="padding:18px 32px;border-top:1px solid #EAEAEC;color:#6B6B73;font-size:12px;line-height:1.5;text-align:center">
          ${footerNote || ''}
          <div style="margin-top:8px">
            <strong style="color:${BRAND_DARK}">${BRAND_NAME}</strong><br/>
            <a href="${BRAND_URL}" style="color:${BRAND_COLOR};text-decoration:none">${BRAND_DOMAIN}</a> &middot;
            <a href="mailto:info@${BRAND_DOMAIN}" style="color:${BRAND_COLOR};text-decoration:none">info@${BRAND_DOMAIN}</a>
          </div>
        </td></tr>
      </table>
      <div style="max-width:560px;margin:16px auto 0;color:#9494A0;font-size:11px;text-align:center;line-height:1.5">
        Bu otomatik bir e-postadır. Yanıt verebilirsiniz, mesajınız bize ulaşır.
      </div>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function inviteTemplate({ name, role, inviteUrl, inviterName }) {
  const roleTr = {
    customer: 'Müşteri',
    lawyer: 'Avukat',
    insurance: 'Sigorta Yetkilisi',
    staff: 'Personel',
    admin: 'Yönetici',
  }[role] || role;

  const greeting = name ? `Merhaba <strong>${escapeHtml(name)}</strong>,` : 'Merhaba,';
  const inviterLine = inviterName
    ? `<strong>${escapeHtml(inviterName)}</strong> sizi <strong>${BRAND_NAME}</strong> portalına <strong>${escapeHtml(roleTr)}</strong> olarak davet etti.`
    : `<strong>${BRAND_NAME}</strong> portalına <strong>${escapeHtml(roleTr)}</strong> olarak davet edildiniz.`;

  return layout({
    title: 'Davetiniz hazır',
    body: `
      <p style="margin:0 0 12px 0">${greeting}</p>
      <p style="margin:0 0 12px 0">${inviterLine}</p>
      <p style="margin:0 0 12px 0">Aşağıdaki butona tıklayarak hesabınızı aktive edin ve bir parola belirleyin. Bu davet bağlantısı <strong>24 saat</strong> içinde geçerlidir.</p>
    `,
    ctaLabel: 'Hesabımı Aktive Et',
    ctaUrl: inviteUrl,
    footerNote: 'Bu daveti siz beklemiyorsanız bu e-postayı yok sayabilirsiniz.',
  });
}

export function genericTemplate({ heading, message, ctaLabel, ctaUrl }) {
  const paragraphs = String(message || '')
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 12px 0">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return layout({
    title: heading || 'Bildirim',
    body: paragraphs,
    ctaLabel,
    ctaUrl,
  });
}

export function reportReadyTemplate({ name, reportNumber, reportUrl }) {
  return layout({
    title: 'Gutachten raporunuz hazır',
    body: `
      <p style="margin:0 0 12px 0">Merhaba <strong>${escapeHtml(name || '')}</strong>,</p>
      <p style="margin:0 0 12px 0">${reportNumber ? `<strong>${escapeHtml(reportNumber)}</strong> numaralı ` : ''}Gutachten raporunuz hazırlandı.</p>
      <p style="margin:0 0 12px 0">Aşağıdaki butona tıklayarak raporunuzu görüntüleyebilir ve indirebilirsiniz.</p>
    `,
    ctaLabel: 'Raporu Görüntüle',
    ctaUrl: reportUrl,
  });
}
