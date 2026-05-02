import React, { useState } from 'react';
import { inviteUser, sendMail } from '../utils/mailService.js';

const C = {
  bg: '#0B0B0F', surface: '#FFFFFF', border: '#E5E5EA',
  text: '#0B0B0F', textDim: '#6B6B73',
  brand: '#E11D2E', brandSoft: 'rgba(225,29,46,0.08)',
};

const ROLES = [
  { v: 'customer', label: 'Müşteri (Kunde)' },
  { v: 'lawyer', label: 'Avukat (Anwalt)' },
  { v: 'insurance', label: 'Sigorta (Versicherung)' },
  { v: 'staff', label: 'Personel (Mitarbeiter)' },
  { v: 'admin', label: 'Yönetici (Admin)' },
];

export default function CommunicationsPanel({ db }) {
  const [tab, setTab] = useState('invite');
  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, margin: 0 }}>İletişim Merkezi</h1>
        <p style={{ color: C.textDim, marginTop: 4, fontSize: 14 }}>
          Kullanıcı daveti ve manuel e-posta gönderimi — info@kfzgutachter.ac üzerinden.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.border}` }}>
        <TabBtn active={tab === 'invite'} onClick={() => setTab('invite')}>👤 Kullanıcı Davet Et</TabBtn>
        <TabBtn active={tab === 'mail'} onClick={() => setTab('mail')}>✉️ E-posta Gönder</TabBtn>
      </div>

      {tab === 'invite' && <InviteForm />}
      {tab === 'mail' && <MailForm db={db} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        background: 'transparent',
        border: 'none',
        borderBottom: active ? `2px solid ${C.brand}` : '2px solid transparent',
        color: active ? C.brand : C.textDim,
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        marginBottom: -1,
      }}>
      {children}
    </button>
  );
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
      setResult({ ok: true, msg: `Davet gönderildi → ${email}`, id: r.userId });
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
        <Field label="Tam Ad">
          <Input value={fullName} onChange={(v) => setFullName(v)} placeholder="Örn: Ahmet Yılmaz" />
        </Field>
        <Field label="E-posta *">
          <Input type="email" required value={email} onChange={(v) => setEmail(v)} placeholder="ornek@mail.com" />
        </Field>
        <Field label="Rol *">
          <select value={role} onChange={(e) => setRole(e.target.value)}
            style={inputStyle()}>
            {ROLES.map(r => <option key={r.v} value={r.v}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Telefon (opsiyonel)">
          <Input value={phone} onChange={(v) => setPhone(v)} placeholder="+49 ..." />
        </Field>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 8 }}>
          <button type="submit" disabled={busy || !email}
            style={primaryBtn(busy || !email)}>
            {busy ? 'Davet gönderiliyor…' : 'Daveti Gönder'}
          </button>
          {result && <ResultBanner ok={result.ok} msg={result.msg} />}
        </div>

        <Note>
          Davet edilen kullanıcı e-postasındaki bağlantıya tıklayarak kendi parolasını belirler ve hesabı aktive eder.
          Bağlantı 24 saat geçerlidir.
        </Note>
      </form>
    </Card>
  );
}

function MailForm({ db }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const customers = (db?.customers || []).filter(c => c.email);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const r = await sendMail({
        to: to.split(',').map(s => s.trim()).filter(Boolean),
        subject,
        message,
        ctaLabel: ctaLabel || undefined,
        ctaUrl: ctaUrl || undefined,
      });
      setResult({ ok: true, msg: `Gönderildi → ${r.accepted?.join(', ') || to}` });
      setTo(''); setSubject(''); setMessage(''); setCtaLabel(''); setCtaUrl('');
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  const pickRecipient = (email) => {
    const list = to ? to.split(',').map(s => s.trim()) : [];
    if (!list.includes(email)) list.push(email);
    setTo(list.filter(Boolean).join(', '));
    setPickerOpen(false);
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Alıcı(lar) — virgülle ayır *">
          <div style={{ display: 'flex', gap: 8 }}>
            <Input type="text" required value={to} onChange={(v) => setTo(v)}
              placeholder="ornek@mail.com, ikinci@mail.com" />
            {customers.length > 0 && (
              <button type="button" onClick={() => setPickerOpen(!pickerOpen)}
                style={{ padding: '0 14px', background: '#F5F5F7', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Müşteriden seç ({customers.length})
              </button>
            )}
          </div>
          {pickerOpen && (
            <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto', border: `1px solid ${C.border}`, borderRadius: 8, padding: 4 }}>
              {customers.map(c => (
                <button key={c.id} type="button" onClick={() => pickRecipient(c.email)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, borderRadius: 4 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F5F5F7'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <strong>{c.full_name || c.name || '—'}</strong> · {c.email}
                </button>
              ))}
            </div>
          )}
        </Field>
        <Field label="Konu *">
          <Input required value={subject} onChange={(v) => setSubject(v)} placeholder="Örn: Randevunuz onaylandı" />
        </Field>
        <Field label="Mesaj *">
          <textarea required value={message} onChange={(e) => setMessage(e.target.value)}
            rows={8} style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            placeholder="Mesajınızı yazın. Boş satır paragraf olarak geçer." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <Field label="Buton Etiketi (opsiyonel)">
            <Input value={ctaLabel} onChange={(v) => setCtaLabel(v)} placeholder="Detayları Gör" />
          </Field>
          <Field label="Buton URL (opsiyonel)">
            <Input value={ctaUrl} onChange={(v) => setCtaUrl(v)} placeholder="https://kfzgutachter.ac/..." />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 8 }}>
          <button type="submit" disabled={busy || !to || !subject || !message}
            style={primaryBtn(busy || !to || !subject || !message)}>
            {busy ? 'Gönderiliyor…' : 'E-postayı Gönder'}
          </button>
          {result && <ResultBanner ok={result.ok} msg={result.msg} />}
        </div>

        <Note>
          Gönderici: <strong>info@kfzgutachter.ac</strong> · Yanıtlar Outlook gelen kutusuna düşer.
        </Note>
      </form>
    </Card>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: 24,
      boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    }}>{children}</div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

function Input({ value, onChange, ...rest }) {
  return (
    <input {...rest} value={value || ''} onChange={(e) => onChange(e.target.value)}
      style={inputStyle()} />
  );
}

function inputStyle() {
  return {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    background: '#FFFFFF',
    color: C.text,
    outline: 'none',
    boxSizing: 'border-box',
  };
}

function primaryBtn(disabled) {
  return {
    padding: '11px 22px',
    background: disabled ? '#D1D1D6' : C.brand,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background .15s',
  };
}

function ResultBanner({ ok, msg }) {
  return (
    <div style={{
      padding: '8px 14px',
      background: ok ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
      color: ok ? '#16A34A' : '#DC2626',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
    }}>{ok ? '✓ ' : '✕ '}{msg}</div>
  );
}

function Note({ children }) {
  return (
    <div style={{
      padding: 12,
      background: '#F5F5F7',
      borderRadius: 8,
      fontSize: 12,
      color: C.textDim,
      lineHeight: 1.5,
    }}>💡 {children}</div>
  );
}
