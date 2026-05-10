// Bir Supabase projesindeki veri envanterini çıkarır.
// Çalıştır:
//   SUPABASE_DB_URL='postgresql://postgres.<ref>:<pass>@aws-0-...pooler.supabase.com:6543/postgres' \
//     node migration/01-inventory.mjs
// Veya tek tek env vars: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
import pg from 'pg';

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const config = dbUrl
  ? {
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    }
  : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 6543),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    };

if (!dbUrl && (!config.host || !config.user || !config.password)) {
  console.error('✗ Bağlantı bilgisi yok. SUPABASE_DB_URL veya PGHOST+PGUSER+PGPASSWORD env vars tanımlayın.');
  process.exit(1);
}

const client = new pg.Client(config);

async function main() {
  console.log('→ Eski projeye bağlanılıyor...');
  await client.connect();
  console.log('✓ Bağlantı başarılı\n');

  // public schema tabloları
  const tables = await client.query(`
    SELECT table_name
      FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name;
  `);

  console.log(`═══ public schema: ${tables.rows.length} tablo ═══`);
  let totalRows = 0;
  for (const { table_name } of tables.rows) {
    try {
      const r = await client.query(`SELECT COUNT(*)::BIGINT AS n FROM public."${table_name}"`);
      const n = Number(r.rows[0].n);
      totalRows += n;
      if (n > 0) console.log(`  ${table_name.padEnd(40)} ${n.toLocaleString()} satır`);
    } catch (e) {
      console.log(`  ${table_name.padEnd(40)} HATA: ${e.message}`);
    }
  }
  console.log(`  ─────────\n  TOPLAM: ${totalRows.toLocaleString()} satır\n`);

  // auth.users
  try {
    const u = await client.query(`SELECT COUNT(*)::BIGINT AS n FROM auth.users`);
    console.log(`═══ auth.users: ${Number(u.rows[0].n)} kullanıcı ═══\n`);
  } catch (e) {
    console.log(`auth.users sorgusu başarısız: ${e.message}\n`);
  }

  // storage.buckets + objects
  try {
    const b = await client.query(`SELECT id, public, created_at FROM storage.buckets ORDER BY id`);
    console.log(`═══ storage.buckets: ${b.rows.length} bucket ═══`);
    for (const row of b.rows) {
      const o = await client.query(
        `SELECT COUNT(*)::BIGINT AS n,
                COALESCE(SUM((metadata->>'size')::BIGINT), 0)::BIGINT AS bytes
           FROM storage.objects WHERE bucket_id = $1`,
        [row.id]
      );
      const n = Number(o.rows[0].n);
      const mb = (Number(o.rows[0].bytes) / 1024 / 1024).toFixed(2);
      console.log(`  ${row.id.padEnd(20)} ${row.public ? 'public ' : 'private'} ${n} dosya, ${mb} MB`);
    }
  } catch (e) {
    console.log(`storage sorgusu başarısız: ${e.message}`);
  }

  await client.end();
  console.log('\n✓ Bitti.');
}

main().catch(err => {
  console.error('✗ HATA:', err.message);
  process.exit(1);
});
