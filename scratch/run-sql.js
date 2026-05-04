/**
 * Supabase'de SQL çalıştırmak için küçük yardımcı script.
 * Kullanım: node --env-file=.env.local scratch/run-sql.js <sql-dosya-yolu>
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Kullanım: node --env-file=.env.local scratch/run-sql.js <sql-dosyası>');
  process.exit(1);
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local dosyasında tanımlı olmalı.');
  process.exit(1);
}

// SQL dosyasını oku — BEGIN/COMMIT satırlarını kaldır (rpc tek statement bekler)
let sql = readFileSync(sqlFile, 'utf-8');

// Supabase REST pg_query yok, doğrudan Management API ile çalıştıramayız.
// Bunun yerine her fonksiyonu ayrı ayrı çalıştıralım.
// rpc('pg') veya raw SQL için Supabase'in pg_net veya supabase-js v2 rpc kullanacağız.

// Supabase JS client ile doğrudan SQL çalıştıramayız.
// Bunun yerine Supabase Database REST API (PostgREST) üzerinden rpc kullanacağız.
// Ancak henüz bir SQL runner fonksiyonu yoksa, Management API kullanmamız gerek.

// En basit yol: Supabase project ref'i URL'den çıkart ve Management API kullan
const projectRef = url.replace('https://', '').split('.')[0];

// Supabase Management API ile SQL çalıştır
const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  },
  body: JSON.stringify({ query: sql }),
});

if (!response.ok) {
  // Management API çalışmadıysa, alternatif yol dene
  console.log('Management API ile çalıştırılamadı, alternatif yol deneniyor...');
  
  // Alternatif: pg modülü ile doğrudan bağlantı
  // Bunun yerine kullanıcıya Supabase Dashboard'a yönlendirelim
  console.log('\n⚠️  SQL dosyasını Supabase SQL Editor üzerinden çalıştırmanız gerekiyor:');
  console.log('   1. https://supabase.com/dashboard/project/' + projectRef + '/sql/new adresine gidin');
  console.log('   2. SQL dosyasının içeriğini yapıştırın');
  console.log('   3. "Run" butonuna basın');
  console.log('\nSQL dosya yolu:', sqlFile);
  process.exit(1);
}

const result = await response.json();
console.log('✓ SQL başarıyla çalıştırıldı!');
console.log(JSON.stringify(result, null, 2));
