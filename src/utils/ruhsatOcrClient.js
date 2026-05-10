// Ruhsat OCR — Edge Function client (frontend tarafı)
// supabase/functions/ruhsat-ocr/index.ts ile konuşur, Claude Haiku 4.5 ile
// Alman Zulassungsbescheinigung Teil I belgesini parse eder.
//
// Kullanım:
//   import { parseRuhsatWithClaude } from './utils/ruhsatOcrClient.js';
//   const result = await parseRuhsatWithClaude(file);
//   // result: { data: {91 field}, confidence: 0..1, source: 'claude_haiku_4_5' }

import { getSupabaseClient, getSession } from './supabaseAuth.js';
import { parseRuhsatMock } from './ruhsatParser.js';

const FUNCTION_PATH = '/functions/v1/ruhsat-ocr';

function getFunctionUrl() {
  const sb = getSupabaseClient();
  if (!sb) throw new Error('Supabase yapılandırılmamış');
  const baseUrl = sb?.supabaseUrl || sb?.rest?.url?.replace(/\/rest\/v1\/?$/, '');
  if (!baseUrl) throw new Error('Supabase URL alınamadı');
  return baseUrl.replace(/\/$/, '') + FUNCTION_PATH;
}

// File → base64 (data: prefix'siz, sadece body)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader sonucu string değil'));
        return;
      }
      // "data:image/jpeg;base64,XXX..." → "XXX..."
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader hata'));
    reader.readAsDataURL(file);
  });
}

/**
 * Bir ruhsat dosyasını Claude Haiku 4.5 ile parse et.
 * Hata olursa veya yapılandırma eksikse mock'a fallback (geliştirme için).
 *
 * @param {File} file - Yüklenen ruhsat dosyası (JPEG/PNG/WEBP/PDF)
 * @param {object} [opts]
 * @param {boolean} [opts.fallbackToMock=true] - Hata durumunda mock veri dön
 * @returns {Promise<{ data: object, confidence: number, source: string, model?: string, error?: string }>}
 */
export async function parseRuhsatWithClaude(file, opts = {}) {
  const { fallbackToMock = true } = opts;

  if (!file) {
    return { data: null, confidence: 0, source: 'error', error: 'Dosya yok' };
  }

  // MIME doğrulama
  const supportedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
  ];
  const mimeType = file.type || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
  if (!supportedTypes.includes(mimeType)) {
    return {
      data: fallbackToMock ? parseRuhsatMock(file) : null,
      confidence: 0,
      source: 'mock_unsupported_type',
      error: `Desteklenmeyen dosya tipi: ${mimeType}`,
    };
  }

  // Dosya boyutu kontrolü (Claude API ~5MB image, ~32MB PDF limit)
  const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
  if (file.size > MAX_SIZE) {
    return {
      data: fallbackToMock ? parseRuhsatMock(file) : null,
      confidence: 0,
      source: 'mock_file_too_large',
      error: `Dosya çok büyük (${(file.size / 1024 / 1024).toFixed(1)} MB > 20 MB)`,
    };
  }

  try {
    const session = await getSession();
    if (!session?.access_token) {
      throw new Error('Oturum yok — lütfen giriş yapın');
    }

    const fileBase64 = await fileToBase64(file);
    const url = getFunctionUrl();

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileBase64, mimeType }),
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        errMsg = errBody?.error || errMsg;
      } catch (_) { /* json parse hatası — text olarak oku */ }
      throw new Error(errMsg);
    }

    const result = await res.json();
    if (!result?.ok || !result?.data) {
      throw new Error(result?.error || 'Geçersiz yanıt');
    }

    // Meta bilgisini ekle
    const data = {
      ...result.data,
      _meta: {
        parsedAt: new Date().toISOString(),
        source: 'claude_haiku_4_5',
        filename: file.name,
        confidence: result.confidence,
        usage: result.usage,
      },
    };

    return {
      data,
      confidence: result.confidence ?? 0.85,
      source: 'claude_haiku_4_5',
      model: result.model,
      usage: result.usage,
    };
  } catch (err) {
    console.warn('[ruhsat-ocr] Claude API failed, falling back to mock:', err?.message);
    if (!fallbackToMock) {
      return {
        data: null,
        confidence: 0,
        source: 'error',
        error: err?.message || 'Bilinmeyen hata',
      };
    }
    // Geliştirme/offline modu: mock veri dön
    return {
      data: parseRuhsatMock(file),
      confidence: 0.5,
      source: 'mock_fallback',
      error: err?.message,
    };
  }
}

/**
 * Sync wrapper — eski kod parseRuhsatMock'u sync çağırıyor olabilir.
 * Doğrudan kullanma; yerine parseRuhsatWithClaude (async) tercih et.
 * @deprecated parseRuhsatWithClaude kullan
 */
export function parseRuhsatSyncFallback(file) {
  return parseRuhsatMock(file);
}
