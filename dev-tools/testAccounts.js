// =====================================================================
// TEST HESAPLARI — seed / list / delete çekirdek mantığı (service-role)
// =====================================================================
// Bu modül SADECE geliştirme ortamında (Vite dev plugin) ya da bir CLI
// scriptinden, Supabase SERVICE_ROLE anahtarıyla çalıştırılır. Service role
// RLS'i bypass eder; bu yüzden her işlem KATI bir güvenlik etiketiyle sınırlıdır:
//
//   • Üretilen TÜM test verisi  @gecit-test.local  e-posta alanını taşır.
//   • Silme işlemi ASLA bu alana sahip olmayan bir satıra dokunmaz.
//     (Canlı DB'de 240 gerçek müşteri + gerçek sigortacılar var — korunur.)
//
// Roller: lawyer (avukat), insurance (sigorta), kaporta (body shop).
// =====================================================================

export const TEST_DOMAIN = 'gecit-test.local';
export const TEST_PASSWORD = 'GecitTest1234!'; // tüm test hesapları için ortak şifre
const isTestEmail = (e) => typeof e === 'string' && e.toLowerCase().endsWith('@' + TEST_DOMAIN);

// ─── Rastgele Alman firma verisi havuzları ──────────────────────────
const FIRST = ['Thomas', 'Stefan', 'Michael', 'Andreas', 'Mehmet', 'Ali', 'Murat', 'Daniel', 'Sven', 'Jürgen', 'Katrin', 'Sabine', 'Ayşe', 'Fatma', 'Markus', 'Klaus'];
const LAST = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Yıldız', 'Demir', 'Kaya', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer'];
const CITY = ['Köln', 'Düsseldorf', 'Dortmund', 'Essen', 'Bonn', 'Aachen', 'Wuppertal', 'Bochum', 'Münster', 'Bielefeld', 'Duisburg', 'Krefeld'];
const CAR_BRANDS = [['BMW', '320d'], ['Mercedes-Benz', 'C 220'], ['Audi', 'A4'], ['VW', 'Golf'], ['Opel', 'Astra'], ['Ford', 'Focus'], ['Skoda', 'Octavia']];
const INS_BRANDS = ['Allianz', 'HUK', 'AXA', 'Gothaer', 'DEVK', 'Provinzial', 'R+V', 'Signal Iduna'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd = () => Math.random().toString(36).slice(2, 7);
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const phone = () => '+49 ' + (200 + Math.floor(Math.random() * 700)) + ' ' + (100000 + Math.floor(Math.random() * 899999));

function makeFirm(role) {
  const first = pick(FIRST), last = pick(LAST), city = pick(CITY);
  const person = `${first} ${last}`;
  let company;
  if (role === 'lawyer') company = `Kanzlei ${last} & Partner`;
  else if (role === 'insurance') company = `${pick(INS_BRANDS)} Versicherung ${city}`;
  else company = `Karosserie & Lack ${last} ${city}`;
  const email = `${role}.${slug(last)}.${rnd()}@${TEST_DOMAIN}`;
  return { company, name: person, email, phone: phone(), city };
}

// ─── Yardımcı: tek satır insert + id döndür ─────────────────────────
async function insertReturning(admin, table, row) {
  const { data, error } = await admin.from(table).insert(row).select('id').single();
  if (error) throw new Error(`${table} insert: ${error.message}`);
  return data.id;
}

// ─── SEED ───────────────────────────────────────────────────────────
export async function seedTestAccounts(admin, { counts = {}, withDemoData = true } = {}) {
  const created = [];
  const errors = [];
  const roles = [
    { role: 'lawyer', table: 'lawyers', n: Number(counts.lawyer) || 0 },
    { role: 'insurance', table: 'insurers', n: Number(counts.insurance) || 0 },
    { role: 'kaporta', table: 'bodyshops', n: Number(counts.kaporta) || 0 },
  ];

  for (const { role, table, n } of roles) {
    for (let i = 0; i < n; i++) {
      const firm = makeFirm(role);
      let linkedId = null, userId = null, demo = null;
      try {
        // 1) domain satırı
        const domainRow = role === 'lawyer'
          ? { name: firm.name, email: firm.email, phone: firm.phone, password: TEST_PASSWORD, active: true }
          : { company: firm.company, name: firm.name, email: firm.email, phone: firm.phone, password: TEST_PASSWORD, active: true };
        linkedId = await insertReturning(admin, table, domainRow);

        // 2) auth kullanıcısı — NOT: role'ü metadata'ya koymuyoruz; bir
        // handle_new_user trigger'ı varsa onu default ('customer') ile oluştursun,
        // biz aşağıda upsert ile doğru role + linked_id'yi yazalım.
        const { data: au, error: auErr } = await admin.auth.admin.createUser({
          email: firm.email, password: TEST_PASSWORD, email_confirm: true,
          user_metadata: { gecit_test: true, full_name: firm.name, linked_id: linkedId },
        });
        if (auErr) throw new Error(`auth createUser: ${auErr.message}`);
        userId = au.user.id;

        // 3) user_profiles — trigger satırı olabileceği için upsert (onConflict id).
        //    role CHECK 'kaporta' içermiyorsa burada 23514 patlar.
        const { error: pErr } = await admin.from('user_profiles').upsert({
          id: userId, email: firm.email, full_name: firm.name, role,
          linked_id: linkedId, phone: firm.phone, active: true,
        }, { onConflict: 'id' });
        if (pErr) {
          const hint = pErr.code === '23514'
            ? ' — user_profiles role CHECK "kaporta" içermiyor. Önce supabase_migration_kaporta_role.sql çalıştırın.'
            : '';
          throw new Error(`user_profiles insert: ${pErr.message}${hint}`);
        }

        // 4) bağlı demo veri
        if (withDemoData) demo = await seedDemoData(admin, role, linkedId, firm);

        created.push({ role, company: firm.company, name: firm.name, email: firm.email, password: TEST_PASSWORD, linkedId, userId, demo });
      } catch (e) {
        // Geri al: yarım kalan auth user + domain satırı
        if (userId) { try { await admin.auth.admin.deleteUser(userId); } catch {} }
        if (linkedId) { try { await admin.from(table).delete().eq('id', linkedId).eq('email', firm.email); } catch {} }
        errors.push({ role, email: firm.email, error: String(e.message || e) });
      }
    }
  }
  return { ok: errors.length === 0, created, errors, password: TEST_PASSWORD };
}

async function seedDemoData(admin, role, linkedId, firm) {
  const custId = await insertReturning(admin, 'customers', {
    full_name: `${firm.name} (Demo Müşteri)`,
    email: `kunde.${rnd()}@${TEST_DOMAIN}`,
    phone: firm.phone, type: 'bireysel', address: `${firm.city}, Deutschland`,
  });
  const [brand, model] = pick(CAR_BRANDS);
  const vehId = await insertReturning(admin, 'vehicles', {
    owner_id: custId, plate: `TEST-${rnd().toUpperCase()}`, brand, model,
    year: 2015 + Math.floor(Math.random() * 9),
  });
  await admin.from('appraisals').insert({
    vehicle_id: vehId, status: role === 'kaporta' ? 'kaporta' : 'tamamlandi',
    date: new Date().toISOString().slice(0, 10), expert: 'Test Ekspertiz',
  });

  if (role === 'lawyer') {
    await admin.from('lawyer_assignments').insert({ lawyer_id: linkedId, customer_id: custId });
    await admin.from('lawyer_cases').insert({ lawyer_id: linkedId, customer_id: custId, title: 'Test İtiraz Davası', description: 'Otomatik üretilmiş demo dava.', status: 'aktif' });
  } else if (role === 'insurance') {
    await admin.from('insurance_assignments').insert({ insurer_id: linkedId, customer_id: custId });
    await admin.from('insurance_claims').insert({ customer_id: custId, vehicle_id: vehId, insurer_id: linkedId, status: 'inceleniyor', claim_date: new Date().toISOString().slice(0, 10), damage_description: 'Demo hasar talebi (test).', claim_amount: 2500 + Math.floor(Math.random() * 5000) });
  } else if (role === 'kaporta') {
    await admin.from('bodyshop_assignments').insert({ bodyshop_id: linkedId, customer_id: custId });
  }
  return { customerId: custId, vehicleId: vehId };
}

// ─── LIST ───────────────────────────────────────────────────────────
export async function listTestAccounts(admin) {
  const like = `%@${TEST_DOMAIN}`;
  const [law, ins, bs, profs, assignL, assignI, assignB] = await Promise.all([
    admin.from('lawyers').select('id,name,email,phone,active').ilike('email', like),
    admin.from('insurers').select('id,company,name,email,phone,active').ilike('email', like),
    admin.from('bodyshops').select('id,company,name,email,phone,active').ilike('email', like),
    admin.from('user_profiles').select('id,email,role,linked_id,active').ilike('email', like),
    admin.from('lawyer_assignments').select('lawyer_id,customer_id'),
    admin.from('insurance_assignments').select('insurer_id,customer_id'),
    admin.from('bodyshop_assignments').select('bodyshop_id,customer_id'),
  ]);
  const profByLink = {};
  for (const p of (profs.data || [])) profByLink[`${p.role}:${p.linked_id}`] = p;
  const cnt = (rows, key, id) => (rows || []).filter((r) => r[key] === id).length;

  const accounts = [];
  for (const r of (law.data || [])) accounts.push({ role: 'lawyer', linkedId: r.id, company: `Kanzlei ${r.name}`, name: r.name, email: r.email, phone: r.phone, active: r.active, userId: profByLink[`lawyer:${r.id}`]?.id || null, assigned: cnt(assignL.data, 'lawyer_id', r.id) });
  for (const r of (ins.data || [])) accounts.push({ role: 'insurance', linkedId: r.id, company: r.company, name: r.name, email: r.email, phone: r.phone, active: r.active, userId: profByLink[`insurance:${r.id}`]?.id || null, assigned: cnt(assignI.data, 'insurer_id', r.id) });
  for (const r of (bs.data || [])) accounts.push({ role: 'kaporta', linkedId: r.id, company: r.company, name: r.name, email: r.email, phone: r.phone, active: r.active, userId: profByLink[`kaporta:${r.id}`]?.id || null, assigned: cnt(assignB.data, 'bodyshop_id', r.id) });

  return { accounts, total: accounts.length, password: TEST_PASSWORD };
}

// ─── DELETE ─────────────────────────────────────────────────────────
// body: { all: true }  veya  { targets: [{ role, linkedId }] }
export async function deleteTestAccounts(admin, body = {}) {
  let targets = [];
  if (body.all) {
    const { accounts } = await listTestAccounts(admin);
    targets = accounts.map((a) => ({ role: a.role, linkedId: a.linkedId }));
  } else if (Array.isArray(body.targets)) {
    targets = body.targets.filter((t) => t && t.role && t.linkedId);
  }

  const TBL = { lawyer: 'lawyers', insurance: 'insurers', kaporta: 'bodyshops' };
  const ASSIGN = { lawyer: ['lawyer_assignments', 'lawyer_id'], insurance: ['insurance_assignments', 'insurer_id'], kaporta: ['bodyshop_assignments', 'bodyshop_id'] };
  const deleted = [];
  const errors = [];
  let customersRemoved = 0, usersRemoved = 0;

  for (const t of targets) {
    const table = TBL[t.role];
    if (!table) { errors.push({ ...t, error: 'geçersiz rol' }); continue; }
    try {
      // GÜVENLİK: firma kaydı gerçekten test mi?
      const { data: firm } = await admin.from(table).select('id,email').eq('id', t.linkedId).maybeSingle();
      if (!firm) { errors.push({ ...t, error: 'firma bulunamadı' }); continue; }
      if (!isTestEmail(firm.email)) { errors.push({ ...t, error: 'GÜVENLİK: test firması değil, atlandı' }); continue; }

      // 1) bağlı demo müşterileri bul (sadece test alanı) ve sil (cascade → araç/ekspertiz/talep)
      const [assignTbl, fk] = ASSIGN[t.role];
      const { data: assigns } = await admin.from(assignTbl).select('customer_id').eq(fk, t.linkedId);
      const custIds = [...new Set((assigns || []).map((a) => a.customer_id).filter(Boolean))];
      if (custIds.length) {
        const { data: custs } = await admin.from('customers').select('id,email').in('id', custIds);
        const testCustIds = (custs || []).filter((c) => isTestEmail(c.email)).map((c) => c.id);
        if (testCustIds.length) {
          const { error: cErr } = await admin.from('customers').delete().in('id', testCustIds);
          if (cErr) throw new Error(`customers delete: ${cErr.message}`);
          customersRemoved += testCustIds.length;
        }
      }

      // 2) firma domain satırını sil (cascade → firma tarafı assignment/case/task/court/offers)
      const { error: dErr } = await admin.from(table).delete().eq('id', t.linkedId).eq('email', firm.email);
      if (dErr) throw new Error(`${table} delete: ${dErr.message}`);

      // 3) profil + auth kullanıcısı
      const { data: prof } = await admin.from('user_profiles').select('id,email').eq('linked_id', t.linkedId).eq('role', t.role).maybeSingle();
      if (prof?.id) {
        try { await admin.from('user_profiles').delete().eq('id', prof.id); } catch {}
        const { error: uErr } = await admin.auth.admin.deleteUser(prof.id);
        if (!uErr) usersRemoved += 1;
      }

      deleted.push({ role: t.role, linkedId: t.linkedId, email: firm.email });
    } catch (e) {
      errors.push({ ...t, error: String(e.message || e) });
    }
  }

  return { ok: errors.length === 0, deleted, customersRemoved, usersRemoved, errors };
}
