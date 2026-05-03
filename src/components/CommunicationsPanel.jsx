import React, { useState, useMemo, useEffect } from 'react';
import { inviteUser, sendMail } from '../utils/mailService.js';

const C = {
  bg: '#0B0B0F', surface: '#FFFFFF', border: '#E5E5EA', borderSoft: '#F0F0F2',
  text: '#0B0B0F', textDim: '#6B6B73', textMute: '#9494A0',
  brand: '#E11D2E', brandSoft: 'rgba(225,29,46,0.08)', brandBorder: 'rgba(225,29,46,0.25)',
  brandDark: '#B0162A',
  ok: '#16A34A', okSoft: 'rgba(34,197,94,0.1)',
  warn: '#F59E0B',
  err: '#DC2626', errSoft: 'rgba(239,68,68,0.1)',
};

const ROLES = [
  { v: 'customer', label: 'Müşteri (Kunde)' },
  { v: 'lawyer', label: 'Avukat (Anwalt)' },
  { v: 'insurance', label: 'Sigorta (Versicherung)' },
  { v: 'staff', label: 'Personel (Mitarbeiter)' },
  { v: 'admin', label: 'Yönetici (Admin)' },
];

const TEMPLATES = [
  {
    id: 'blank',
    icon: '✏️',
    accent: '#6B6B73',
    title: 'Boş Şablon',
    description: 'Kendi mesajını sıfırdan yaz',
    category: 'genel',
    subject: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
  },
  {
    id: 'appointment_confirmed',
    icon: '✅',
    accent: '#16A34A',
    title: 'Randevu Onayı',
    description: 'Tarih, saat ve adres bilgisiyle randevu onayı',
    category: 'randevu',
    subject: 'Randevunuz onaylandı — {{tarih}}',
    body:
`Sayın {{ad}},

{{tarih}} tarihinde saat {{saat}} için Gecit KFZ Sachverständigenbüro'da randevunuz onaylanmıştır.

🚗 Araç: {{marka}} {{model}} — {{plaka}}
📍 Adres: Lützowstraße 102-104, 10785 Berlin
☎ İletişim: info@kfzgutachter.ac

Lütfen randevu saatinizden 10 dakika önce gelmenizi rica ederiz.

İyi günler dileriz.`,
    ctaLabel: 'Randevu Detayları',
    ctaUrl: 'https://kfzgutachter.ac',
  },
  {
    id: 'appointment_reminder',
    icon: '⏰',
    accent: '#F59E0B',
    title: 'Randevu Hatırlatması',
    description: 'Bir gün öncesinden hatırlatma maili',
    category: 'randevu',
    subject: 'Yarınki randevunuzu hatırlatmak isteriz',
    body:
`Sayın {{ad}},

Yarın saat {{saat}}'de Gecit KFZ Sachverständigenbüro'da randevunuz olduğunu hatırlatmak isteriz.

🚗 Araç: {{marka}} {{model}} — {{plaka}}
📍 Adres: Lützowstraße 102-104, 10785 Berlin

Eğer randevunuzu erteleme veya iptal etme ihtiyacınız olursa lütfen en kısa sürede bizimle iletişime geçiniz.

İyi günler.`,
    ctaLabel: 'Randevuyu Görüntüle',
    ctaUrl: 'https://kfzgutachter.ac',
  },
  {
    id: 'report_ready',
    icon: '📑',
    accent: '#E11D2E',
    title: 'Gutachten Hazır',
    description: 'Rapor tamamlandı — müşteriye PDF linki',
    category: 'rapor',
    subject: 'Gutachten raporunuz hazır — {{plaka}}',
    body:
`Sayın {{ad}},

{{plaka}} plakalı {{marka}} {{model}} aracınız için hazırlamış olduğumuz Kfz-Gutachten raporunuz tamamlanmıştır.

Aşağıdaki butona tıklayarak raporunuzu görüntüleyebilir ve PDF olarak indirebilirsiniz.

Sorularınız için info@kfzgutachter.ac adresinden bize ulaşabilirsiniz.

İyi günler dileriz.`,
    ctaLabel: 'Raporu Görüntüle',
    ctaUrl: 'https://kfzgutachter.ac/rapor',
  },
  {
    id: 'document_request',
    icon: '📋',
    accent: '#0EA5E9',
    title: 'Belge Talebi',
    description: 'Eksik belge bildirimi ve nasıl yükleneceği',
    category: 'belge',
    subject: 'Eksik belgeleriniz hakkında bilgi',
    body:
`Sayın {{ad}},

Dosyanızın işleme alınabilmesi için aşağıdaki belgelere ihtiyacımız bulunmaktadır:

• Fahrzeugschein (Ruhsat fotoğrafı — ön/arka)
• KFZ-Versicherungsbescheinigung (Sigorta belgesi)
• Schadenfotos (Hasar fotoğrafları — minimum 4 açı)

Belgeleri info@kfzgutachter.ac adresine e-posta ile veya müşteri portalı üzerinden yükleyebilirsiniz.

İlginiz için teşekkür ederiz.`,
    ctaLabel: 'Belgeleri Yükle',
    ctaUrl: 'https://kfzgutachter.ac/belge-yukle',
  },
  {
    id: 'welcome',
    icon: '👋',
    accent: '#8B5CF6',
    title: 'Hoş Geldiniz',
    description: 'Yeni müşteriye karşılama mesajı',
    category: 'genel',
    subject: 'Gecit KFZ Sachverständigenbüro\'ya hoş geldiniz',
    body:
`Sayın {{ad}},

Gecit KFZ Sachverständigenbüro ailesine hoş geldiniz! Aracınızla ilgili her türlü ekspertiz, hasar değerlendirme ve danışmanlık hizmetlerinde yanınızdayız.

📞 Telefon: ...
📧 E-posta: info@kfzgutachter.ac
🌐 Web: kfzgutachter.ac

Müşteri portalımıza giriş yaparak randevu oluşturabilir, raporlarınızı takip edebilirsiniz.

Bizi tercih ettiğiniz için teşekkür ederiz.`,
    ctaLabel: 'Müşteri Portalı',
    ctaUrl: 'https://kfzgutachter.ac',
  },
  {
    id: 'invoice_notice',
    icon: '💰',
    accent: '#16A34A',
    title: 'Fatura Bildirimi',
    description: 'Hazırlanan fatura ve ödeme bilgisi',
    category: 'fatura',
    subject: 'Faturanız hazır — {{plaka}}',
    body:
`Sayın {{ad}},

{{plaka}} plakalı aracınız için hazırlanan faturayı ekte bulabilirsiniz.

Ödeme bilgileri:
• IBAN: DE...
• Banka: ...
• Açıklama: Fatura numarası ve plakanızı belirtmenizi rica ederiz

Sorularınız için info@kfzgutachter.ac adresine yazabilirsiniz.

İyi günler.`,
    ctaLabel: 'Faturayı Görüntüle',
    ctaUrl: 'https://kfzgutachter.ac/fatura',
  },
  {
    id: 'insurance_update',
    icon: '🛡️',
    accent: '#0EA5E9',
    title: 'Sigorta Güncellemesi',
    description: 'Hasar dosyası ile ilgili gelişme',
    category: 'sigorta',
    subject: 'Hasar dosyanızla ilgili güncelleme — {{plaka}}',
    body:
`Sayın {{ad}},

{{plaka}} plakalı aracınızın hasar dosyasıyla ilgili sigorta şirketinden gelen güncellemeyi sizinle paylaşmak isteriz.

Detayları ekte bulabilir ve müşteri portalı üzerinden tam dosyaya erişebilirsiniz.

Sorularınız için bizimle iletişime geçebilirsiniz.

İyi günler.`,
    ctaLabel: 'Dosyayı Gör',
    ctaUrl: 'https://kfzgutachter.ac/sigorta',
  },
  {
    id: 'tuv_reminder',
    icon: '🔧',
    accent: '#F59E0B',
    title: 'TÜV/HU Hatırlatması',
    description: 'Muayene süresi yaklaşan araç bildirimi',
    category: 'tuv',
    subject: 'TÜV/HU süresi yaklaşıyor — {{plaka}}',
    body:
`Sayın {{ad}},

{{plaka}} plakalı {{marka}} {{model}} aracınızın TÜV/HU muayene süresi yaklaşmaktadır.

Erken randevu oluşturarak son güne kalmadan işlemlerinizi tamamlayabilirsiniz.

📅 Yeni randevu için: kfzgutachter.ac

İyi günler.`,
    ctaLabel: 'Randevu Oluştur',
    ctaUrl: 'https://kfzgutachter.ac',
  },
  {
    id: 'thank_you',
    icon: '🙏',
    accent: '#8B5CF6',
    title: 'Teşekkür Mesajı',
    description: 'Hizmet sonrası teşekkür ve geri bildirim talebi',
    category: 'genel',
    subject: 'Bizi tercih ettiğiniz için teşekkürler',
    body:
`Sayın {{ad}},

{{plaka}} plakalı aracınız için bizden hizmet aldığınız için teşekkür ederiz.

Deneyiminizi değerlendirmemize yardımcı olmak için kısa bir geri bildirim formunu doldurmanızı rica ederiz. Geri bildirimleriniz hizmetimizi sürekli iyileştirmemize yardımcı olmaktadır.

Tekrar görüşmek dileğiyle.`,
    ctaLabel: 'Geri Bildirim Ver',
    ctaUrl: 'https://kfzgutachter.ac/feedback',
  },
];

const PLACEHOLDER_LABELS = {
  ad: 'Müşteri Adı',
  email: 'E-posta',
  telefon: 'Telefon',
  adres: 'Adres',
  sirket: 'Şirket',
  plaka: 'Plaka',
  marka: 'Marka',
  model: 'Model',
  yil: 'Model Yılı',
  tarih: 'Tarih',
  saat: 'Saat',
};

export default function CommunicationsPanel({ db }) {
  const [tab, setTab] = useState('mail');
  return (
    <div className="space-y-6">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFF', fontSize: 22, boxShadow: `0 4px 12px ${C.brandSoft}`,
          }}>✉️</div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0, letterSpacing: -0.4 }}>
              İletişim Merkezi
            </h1>
            <p style={{ color: C.textDim, marginTop: 2, fontSize: 13 }}>
              Hazır şablonlar · Müşteri otomatik doldurma · Canlı önizleme — info@kfzgutachter.ac
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: 4, background: C.borderSoft, borderRadius: 12, width: 'fit-content' }}>
        <TabBtn active={tab === 'mail'} onClick={() => setTab('mail')}>📧 Toplu / Tek E-posta</TabBtn>
        <TabBtn active={tab === 'invite'} onClick={() => setTab('invite')}>👤 Kullanıcı Davet Et</TabBtn>
      </div>

      {tab === 'mail' && <MailComposer db={db} />}
      {tab === 'invite' && <InviteForm />}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '10px 18px',
        background: active ? '#FFFFFF' : 'transparent',
        border: 'none',
        borderRadius: 8,
        color: active ? C.text : C.textDim,
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
        transition: 'all .15s',
      }}>
      {children}
    </button>
  );
}

function MailComposer({ db }) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [extraVars, setExtraVars] = useState({ tarih: '', saat: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [previewMode, setPreviewMode] = useState('text');

  const customers = (db?.customers || []).filter(c => c?.email);
  const vehicles = db?.vehicles || [];

  const customerOptions = useMemo(() => {
    return customers.map(c => {
      const veh = vehicles.find(v => v.owner_id === c.id);
      return { customer: c, vehicle: veh };
    });
  }, [customers, vehicles]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customerOptions;
    return customerOptions.filter(({ customer: c, vehicle: v }) => {
      return (
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (v?.plate || '').toLowerCase().includes(q)
      );
    });
  }, [customerOptions, search]);

  useEffect(() => {
    setSubject(selectedTemplate.subject);
    setBody(selectedTemplate.body);
    setCtaLabel(selectedTemplate.ctaLabel || '');
    setCtaUrl(selectedTemplate.ctaUrl || '');
  }, [selectedTemplate.id]);

  const usedPlaceholders = useMemo(() => {
    const matches = `${subject}\n${body}`.match(/\{\{(\w+)\}\}/g) || [];
    return Array.from(new Set(matches.map(m => m.slice(2, -2))));
  }, [subject, body]);

  const firstRecipientData = useMemo(() => {
    const first = recipients[0];
    if (!first) return null;
    const veh = vehicles.find(v => v.owner_id === first.id);
    return {
      ad: first.full_name || '',
      email: first.email || '',
      telefon: first.phone || '',
      adres: first.address || '',
      sirket: first.company || '',
      plaka: veh?.plate || '',
      marka: veh?.brand || '',
      model: veh?.model || '',
      yil: veh?.year || '',
    };
  }, [recipients, vehicles]);

  const renderedSubject = useMemo(
    () => fillTemplate(subject, { ...firstRecipientData, ...extraVars }),
    [subject, firstRecipientData, extraVars]
  );
  const renderedBody = useMemo(
    () => fillTemplate(body, { ...firstRecipientData, ...extraVars }),
    [body, firstRecipientData, extraVars]
  );

  const addRecipient = (customer) => {
    if (recipients.find(r => r.id === customer.id)) return;
    setRecipients([...recipients, customer]);
  };
  const removeRecipient = (id) => setRecipients(recipients.filter(r => r.id !== id));

  const canSend = recipients.length > 0 && renderedSubject.trim() && renderedBody.trim() && !busy;

  const submit = async (e) => {
    e?.preventDefault();
    if (!canSend) return;
    setBusy(true);
    setResult(null);
    try {
      let sentCount = 0;
      const errors = [];
      for (const r of recipients) {
        const veh = vehicles.find(v => v.owner_id === r.id);
        const personalData = {
          ad: r.full_name || '',
          email: r.email || '',
          telefon: r.phone || '',
          adres: r.address || '',
          sirket: r.company || '',
          plaka: veh?.plate || '',
          marka: veh?.brand || '',
          model: veh?.model || '',
          yil: veh?.year || '',
          ...extraVars,
        };
        const personalSubject = fillTemplate(subject, personalData);
        const personalBody = fillTemplate(body, personalData);
        try {
          await sendMail({
            to: r.email,
            subject: personalSubject,
            message: personalBody,
            ctaLabel: ctaLabel || undefined,
            ctaUrl: ctaUrl || undefined,
          });
          sentCount += 1;
        } catch (err) {
          errors.push(`${r.email}: ${err.message}`);
        }
      }
      if (errors.length === 0) {
        setResult({ ok: true, msg: `✓ ${sentCount} alıcıya kişiselleştirilmiş e-posta gönderildi.` });
        setRecipients([]);
      } else {
        setResult({
          ok: sentCount > 0,
          msg: `${sentCount} başarılı, ${errors.length} hata: ${errors.slice(0, 2).join(' / ')}${errors.length > 2 ? '…' : ''}`,
        });
      }
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
      <TemplateSidebar
        templates={TEMPLATES}
        selectedId={selectedTemplate.id}
        onSelect={setSelectedTemplate}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, minWidth: 0 }}>
        <Card>
          <SectionTitle icon="👥" text={`Alıcılar (${recipients.length})`}>
            <button type="button" onClick={() => setRecipientPickerOpen(o => !o)}
              style={pillBtn(recipientPickerOpen)}>
              {recipientPickerOpen ? 'Kapat' : `Müşteriden seç (${customerOptions.length})`}
            </button>
          </SectionTitle>

          {recipients.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {recipients.map(r => (
                <span key={r.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 6px 4px 10px', borderRadius: 999,
                  background: C.brandSoft, border: `1px solid ${C.brandBorder}`,
                  fontSize: 12, color: C.brand, fontWeight: 500,
                }}>
                  <span>{r.full_name || r.email}</span>
                  <button type="button" onClick={() => removeRecipient(r.id)}
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: 'none', background: 'rgba(225,29,46,0.15)',
                      color: C.brand, cursor: 'pointer', fontSize: 11, lineHeight: 1,
                    }}>×</button>
                </span>
              ))}
            </div>
          ) : (
            <div style={emptyHint}>
              Henüz alıcı yok. Sağdaki "Müşteriden seç" düğmesinden ekleyebilir, veya manuel e-posta yazabilirsin.
            </div>
          )}

          <input
            type="text"
            placeholder="veya e-posta yapıştır (Enter ile ekle)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.includes('@')) {
                const v = e.currentTarget.value.trim();
                addRecipient({ id: `manual-${Date.now()}`, full_name: v, email: v });
                e.currentTarget.value = '';
              }
            }}
            style={inputStyle({ marginTop: 8 })}
          />

          {recipientPickerOpen && (
            <div style={{ marginTop: 10 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Ara: ad, email, plaka, şirket..."
                style={inputStyle({ marginBottom: 8 })}
              />
              <div style={{
                maxHeight: 280, overflow: 'auto',
                border: `1px solid ${C.border}`, borderRadius: 10, padding: 4,
              }}>
                {filteredOptions.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: C.textMute, fontSize: 13 }}>
                    Eşleşme yok
                  </div>
                )}
                {filteredOptions.map(({ customer: c, vehicle: v }) => {
                  const selected = recipients.some(r => r.id === c.id);
                  return (
                    <button key={c.id} type="button"
                      onClick={() => selected ? removeRecipient(c.id) : addRecipient(c)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '8px 10px', borderRadius: 8,
                        background: selected ? C.brandSoft : 'transparent',
                        border: `1px solid ${selected ? C.brandBorder : 'transparent'}`,
                        cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = C.borderSoft; }}
                      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: selected ? C.brand : C.borderSoft,
                        color: selected ? '#FFF' : C.textDim,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600, flexShrink: 0,
                      }}>
                        {(c.full_name || c.email || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.full_name || '—'}
                          {c.company && <span style={{ color: C.textMute, fontWeight: 400 }}> · {c.company}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.email}{v ? ` · 🚗 ${v.plate || ''} ${v.brand || ''} ${v.model || ''}` : ''}
                        </div>
                      </div>
                      {selected && <span style={{ color: C.brand, fontSize: 16, fontWeight: 600 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle icon="🎨" text="Şablonu Düzenle" />

          <Field label="Konu *">
            <input value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="Örn: Randevunuz onaylandı"
              style={inputStyle()} />
          </Field>

          <Field label="Mesaj *">
            <textarea value={body} onChange={(e) => setBody(e.target.value)}
              rows={9}
              placeholder="Mesaj gövdesi. {{ad}}, {{plaka}}, {{tarih}} gibi değişkenler kullanılabilir."
              style={inputStyle({ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55, fontSize: 13.5 })} />
          </Field>

          {usedPlaceholders.length > 0 && (
            <div style={{ marginTop: 6, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: C.textDim, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Kullanılan değişkenler
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {usedPlaceholders.map(ph => (
                  <span key={ph} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 6,
                    background: ['tarih', 'saat'].includes(ph) ? '#FEF3C7' : C.borderSoft,
                    color: ['tarih', 'saat'].includes(ph) ? '#A16207' : C.textDim,
                    fontFamily: 'ui-monospace, monospace',
                  }}>
                    {`{{${ph}}}`}
                    {firstRecipientData?.[ph] && <span style={{ marginLeft: 6, color: C.ok }}>✓</span>}
                  </span>
                ))}
              </div>
              {usedPlaceholders.includes('tarih') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  <input
                    placeholder="Tarih (örn: 12 Mart 2026)"
                    value={extraVars.tarih}
                    onChange={(e) => setExtraVars(v => ({ ...v, tarih: e.target.value }))}
                    style={inputStyle({ fontSize: 12, padding: '7px 10px' })}
                  />
                  <input
                    placeholder="Saat (örn: 10:30)"
                    value={extraVars.saat}
                    onChange={(e) => setExtraVars(v => ({ ...v, saat: e.target.value }))}
                    style={inputStyle({ fontSize: 12, padding: '7px 10px' })}
                  />
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 8 }}>
            <Field label="Buton (opsiyonel)">
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Detaylar"
                style={inputStyle({ fontSize: 13 })} />
            </Field>
            <Field label="Buton URL">
              <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://kfzgutachter.ac/..."
                style={inputStyle({ fontSize: 13 })} />
            </Field>
          </div>
        </Card>

        <div style={{ gridColumn: '1 / -1' }}>
          <Card>
            <SectionTitle icon="👁" text="Canlı Önizleme">
              <div style={{ display: 'flex', gap: 4, padding: 3, background: C.borderSoft, borderRadius: 7 }}>
                <button type="button" onClick={() => setPreviewMode('text')}
                  style={previewBtn(previewMode === 'text')}>Metin</button>
                <button type="button" onClick={() => setPreviewMode('html')}
                  style={previewBtn(previewMode === 'html')}>HTML görünüm</button>
              </div>
            </SectionTitle>

            {recipients.length === 0 ? (
              <div style={emptyHint}>
                İlk alıcıyı seçtiğinde önizleme onun verisiyle (ad, plaka, marka...) otomatik dolar.
              </div>
            ) : (
              <div style={{
                fontSize: 11, color: C.textMute, marginBottom: 8,
                padding: '6px 10px', background: C.borderSoft, borderRadius: 6,
              }}>
                💡 Önizleme <strong style={{ color: C.text }}>{recipients[0].full_name}</strong> için yapılıyor.
                Kalan {recipients.length - 1} alıcıya kendi verilerine göre kişiselleştirilmiş gönderilecek.
              </div>
            )}

            {previewMode === 'text' && (
              <EmailPreviewText
                from="Gecit KFZ Sachverständigenbüro <Gecit@kfzgutachter.ac>"
                to={recipients[0]?.email || '...'}
                subject={renderedSubject || '(konu yok)'}
                body={renderedBody || '(mesaj yok)'}
                ctaLabel={ctaLabel}
                ctaUrl={ctaUrl}
              />
            )}
            {previewMode === 'html' && (
              <EmailPreviewHtml
                subject={renderedSubject || '(konu yok)'}
                body={renderedBody || '(mesaj yok)'}
                ctaLabel={ctaLabel}
                ctaUrl={ctaUrl}
              />
            )}
          </Card>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, padding: '4px 4px' }}>
          <button onClick={submit} disabled={!canSend} style={primaryBtn(!canSend)}>
            {busy ? 'Gönderiliyor…' : recipients.length > 1 ? `📨 ${recipients.length} kişiye gönder` : '📨 Gönder'}
          </button>
          {result && <ResultBanner ok={result.ok} msg={result.msg} />}
        </div>
      </div>
    </div>
  );
}

function TemplateSidebar({ templates, selectedId, onSelect }) {
  return (
    <div style={{ position: 'sticky', top: 12 }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: C.textDim,
          padding: '4px 8px 10px 8px', textTransform: 'uppercase', letterSpacing: 0.6,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>Hazır Şablonlar</span>
          <span style={{ background: C.borderSoft, padding: '2px 8px', borderRadius: 999, fontSize: 10 }}>
            {templates.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '70vh', overflow: 'auto' }}>
          {templates.map(t => {
            const active = t.id === selectedId;
            return (
              <button key={t.id} type="button" onClick={() => onSelect(t)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: 10, borderRadius: 10, textAlign: 'left',
                  background: active ? `linear-gradient(135deg, ${C.brandSoft}, rgba(225,29,46,0.04))` : 'transparent',
                  border: `1px solid ${active ? C.brandBorder : 'transparent'}`,
                  cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.borderSoft; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: active ? '#FFFFFF' : C.borderSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                  border: active ? `1px solid ${C.brandBorder}` : 'none',
                }}>{t.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: active ? C.brand : C.text,
                    marginBottom: 2,
                  }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.4 }}>
                    {t.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmailPreviewText({ from, to, subject, body, ctaLabel, ctaUrl }) {
  return (
    <div style={{
      border: `1px solid ${C.border}`, borderRadius: 10,
      background: '#FAFAFB', overflow: 'hidden',
    }}>
      <div style={{ padding: 14, borderBottom: `1px solid ${C.border}`, fontSize: 12, color: C.textDim, lineHeight: 1.7 }}>
        <div><strong style={{ color: C.text }}>From:</strong> {from}</div>
        <div><strong style={{ color: C.text }}>To:</strong> {to}</div>
        <div><strong style={{ color: C.text }}>Subject:</strong> <span style={{ color: C.text }}>{subject}</span></div>
      </div>
      <div style={{ padding: 16, fontSize: 13.5, lineHeight: 1.6, color: C.text, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
        {body}
      </div>
      {ctaLabel && ctaUrl && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          <span style={{
            display: 'inline-block', padding: '10px 20px', background: C.brand,
            color: '#FFFFFF', borderRadius: 6, fontSize: 13, fontWeight: 600,
          }}>{ctaLabel}</span>
          <span style={{ marginLeft: 8, fontSize: 11, color: C.textMute }}>→ {ctaUrl}</span>
        </div>
      )}
    </div>
  );
}

function EmailPreviewHtml({ subject, body, ctaLabel, ctaUrl }) {
  const paragraphs = String(body || '').split(/\n\s*\n/).map((p, i) => (
    <p key={i} style={{ margin: '0 0 12px 0' }}>
      {p.split('\n').map((line, j) => (
        <React.Fragment key={j}>{line}{j < p.split('\n').length - 1 && <br />}</React.Fragment>
      ))}
    </p>
  ));
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: '#F5F5F7', padding: 24 }}>
      <div style={{
        maxWidth: 560, margin: '0 auto', background: '#FFFFFF',
        borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
      }}>
        <div style={{ padding: '24px 28px 6px', textAlign: 'center' }}>
          <img src="/logocustom3.png" alt="Gecit KFZ"
            style={{ maxWidth: 220, width: '100%', height: 'auto' }} />
        </div>
        <div style={{ padding: '8px 28px 24px', fontSize: 14.5, lineHeight: 1.6, color: '#0B0B0F' }}>
          <h1 style={{ fontSize: 19, fontWeight: 700, margin: '8px 0 14px 0' }}>{subject}</h1>
          {paragraphs}
          {ctaLabel && ctaUrl && (
            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <span style={{
                display: 'inline-block', padding: '13px 26px',
                background: C.brand, color: '#FFFFFF', borderRadius: 8,
                fontSize: 14, fontWeight: 600,
              }}>{ctaLabel}</span>
            </div>
          )}
        </div>
        <div style={{
          padding: 14, borderTop: '1px solid #EAEAEC',
          color: '#6B6B73', fontSize: 11, textAlign: 'center', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#0B0B0F' }}>Gecit KFZ Sachverständigenbüro</strong><br />
          kfzgutachter.ac · info@kfzgutachter.ac
        </div>
      </div>
    </div>
  );
}

function fillTemplate(text, data) {
  if (!text) return '';
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    const v = data?.[key];
    return v ? v : m;
  });
}

function InviteForm() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('customer');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const r = await inviteUser({ email, fullName, role, phone: phone || null });
      setResult({ ok: true, msg: `✓ Davet gönderildi → ${email}`, id: r.userId });
      setEmail(''); setFullName(''); setPhone(''); setRole('customer');
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tam Ad">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Örn: Ahmet Yılmaz" style={inputStyle()} />
          </Field>
          <Field label="E-posta *">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com" style={inputStyle()} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Rol *">
            <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle()}>
              {ROLES.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Telefon (opsiyonel)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+49 ..." style={inputStyle()} />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 8 }}>
          <button type="submit" disabled={busy || !email} style={primaryBtn(busy || !email)}>
            {busy ? 'Davet gönderiliyor…' : '👤 Daveti Gönder'}
          </button>
          {result && <ResultBanner ok={result.ok} msg={result.msg} />}
        </div>

        <Note>
          Davet edilen kullanıcı e-postasındaki bağlantıya tıklayarak kendi parolasını belirler.
          Bağlantı 24 saat geçerlidir.
        </Note>
      </form>
    </Card>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    }}>{children}</div>
  );
}

function SectionTitle({ icon, text, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.borderSoft}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: C.text }}>
        <span style={{ fontSize: 16 }}>{icon}</span> {text}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.textDim, marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}

function inputStyle(extra) {
  return {
    width: '100%', padding: '9px 12px', fontSize: 13.5,
    border: `1px solid ${C.border}`, borderRadius: 8,
    background: '#FFFFFF', color: C.text, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
    ...extra,
  };
}

function primaryBtn(disabled) {
  return {
    padding: '11px 24px',
    background: disabled ? '#D1D1D6' : `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`,
    color: '#FFFFFF', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : `0 4px 12px ${C.brandSoft}`,
    transition: 'all .15s',
  };
}

function pillBtn(active) {
  return {
    padding: '6px 14px',
    background: active ? C.brand : '#FFFFFF',
    color: active ? '#FFFFFF' : C.text,
    border: `1px solid ${active ? C.brand : C.border}`,
    borderRadius: 999, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
  };
}

function previewBtn(active) {
  return {
    padding: '5px 12px', background: active ? '#FFFFFF' : 'transparent',
    color: active ? C.text : C.textDim, border: 'none', borderRadius: 5,
    fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
  };
}

function ResultBanner({ ok, msg }) {
  return (
    <div style={{
      padding: '8px 14px',
      background: ok ? C.okSoft : C.errSoft,
      color: ok ? C.ok : C.err,
      border: `1px solid ${ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 8, fontSize: 12.5, fontWeight: 500,
      flex: 1, lineHeight: 1.4,
    }}>{msg}</div>
  );
}

function Note({ children }) {
  return (
    <div style={{
      padding: 12, background: C.borderSoft, borderRadius: 8,
      fontSize: 12, color: C.textDim, lineHeight: 1.55, marginTop: 6,
    }}>💡 {children}</div>
  );
}

const emptyHint = {
  padding: 14, background: C.borderSoft, borderRadius: 8,
  fontSize: 12.5, color: C.textDim, lineHeight: 1.5, textAlign: 'center',
};
