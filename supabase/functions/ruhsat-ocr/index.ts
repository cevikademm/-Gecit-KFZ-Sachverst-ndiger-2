// supabase/functions/ruhsat-ocr/index.ts
// ──────────────────────────────────────────────────────────────────────────
// Alman Zulassungsbescheinigung Teil I (Fahrzeugschein) OCR — Claude Haiku 4.5
//
// POST /functions/v1/ruhsat-ocr
//   { fileBase64: string, mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' }
//
// Yanıt: { ok: true, data: {91-FIELD-MAP}, confidence: 0..1, model, usage }
//
// Secret: ANTHROPIC_API_KEY (Supabase → Functions → Secrets)
// ──────────────────────────────────────────────────────────────────────────

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

const SYSTEM_PROMPT = `Sen Alman Zulassungsbescheinigung Teil I (Fahrzeugschein / KFZ-Schein) belgesini okuyan uzman OCR ajansın.

Görevin: belgeden TÜM alanları AYNEN, TAM ve EKSİKSİZ çıkarmak. Eksik alan yoksa "" (boş string) döndür. ASLA uydurma.

ÇIKTI FORMATI: SADECE geçerli JSON nesnesi. Açıklama/markdown/kod bloku YOK. 91 alanlı şema:

{
  "DRUCK":  "<Druckstücknummer — belgenin sol üst köşesinde, örn. 'AC-A-2-022/25-00116'>",
  "AUSST":  "<Ausstellungsdatum — DD.MM.YYYY>",
  "BEH":    "<Ausstellende Behörde — örn. 'Würselen', 'Aachen'>",
  "Z":      "<Datum der Zulassung — son tescil DD.MM.YYYY>",
  "0.1":    "<Behörden-Schlüssel — 2-3 hane kod, örn. 'AC'>",
  "0.2":    "<Verfahrenskennung — örn. 'BEG001146'>",

  "C.1.1":  "<Halter Soyadı / Firma>",
  "C.1.2":  "<Halter Adı>",
  "C.1.3":  "<Halter Adresi — 'sokak no, plz şehir'>",
  "C.2.1":  "<Eigentümer Soyadı (Halter'dan farklıysa)>",
  "C.2.2":  "<Eigentümer Adı>",
  "C.2.3":  "<Eigentümer Adresi>",
  "C.4.1":  "<Halter = Eigentümer ('ja'/'nein')>",
  "C.4.2":  "<Halter ≠ Eigentümer>",
  "C.4.3":  "<Halterhinweis notu>",

  "A":      "<Plaka — orijinal formatta, örn. 'AC RN 788' veya 'AC-RN-788'>",
  "B":      "<Erstzulassung — DD.MM.YYYY>",
  "E":      "<VIN/FIN — 17 hane, I/O/Q yok>",
  "5":      "<VIN (alt format — E ile aynı olabilir)>",
  "H":      "<Eintragungsdatum — DD.MM.YYYY>",

  "D.1":    "<Marke — örn. 'Mercedes-Benz'>",
  "D.2":    "<Typ / Variante / Version — örn. 'U204T0' veya 'U204T0 / CZAA15AB'>",
  "D.3":    "<Handelsbezeichnung — ticari ad, örn. 'E 220 d'>",
  "K":      "<EG-Typgenehmigungsnummer — örn. 'e1*2007/46*1560*33'>",

  "1":      "<Fahrzeugklasse — örn. 'M1', 'N1'>",
  "2":      "<Aufbau / Karosserie kodu — örn. '2222'>",
  "J":      "<Araç türü açıklama — örn. 'Kombilimousine'>",
  "4":      "<Verwendungsart — örn. 'Personenbeförderung'>",
  "3":      "<Klassifizierungs-Code — örn. 'R1ES'>",
  "6":      "<Klassifizierungs-Code-Erläuterung — örn. '36AP'>",
  "7":      "<Sondermerkmale>",

  "8":      "<Beschränkungen, Auflagen>",
  "9":      "<Genehmigungsvermerk>",
  "10":     "<HSN — Hersteller-Schlüsselnummer, 4 hane>",
  "11":     "<Hersteller-Kurzbezeichnung>",
  "12":     "<Klartext Hersteller-Bezeichnung>",
  "13":     "<Genehmigte Bereifungs-Stempelung>",
  "14":     "<Typgenehmigung Emission — örn. '715/2007*2018/1832AP'>",
  "14.1":   "<Emissionsklasse-Schlüssel>",
  "16":     "<EG-Bereifung Achse>",

  "P.1":    "<Hubraum — cm³ ile, örn. '1993 cm³'>",
  "P.2":    "<Nennleistung — kW ile, örn. '147 kW'>",
  "P.2.1":  "<Dauernennleistung — Elektro araç için kW>",
  "P.3":    "<Kraftstoffart — örn. 'Hybr. Diesel / E', 'Benzin', 'Diesel', 'Elektro'>",
  "P.4":    "<Nenndrehzahl — 1/min>",
  "P.5":    "<Motornummer / Kennzeichen>",
  "P.6":    "<Maks. Tork — Nm>",
  "Q":      "<Leistungs-/Masseverhältnis — kW/kg>",
  "23":     "<Tankvolumen — Liter>",
  "24":     "<Elektromotor saatlik güç>",
  "25":     "<Batterietyp>",

  "V.5":    "<Partikelmasse — g/km>",
  "V.6":    "<Partikelanzahl>",
  "V.7":    "<CO₂-Emission kombiniert — g/km>",
  "V.8":    "<CO₂ WLTP>",
  "V.9":    "<Emissionsklasse — örn. 'EURO 6', 'EURO 6d-TEMP'>",

  "U.1":    "<Standgeräusch — dB(A)>",
  "U.2":    "<Drehzahl bei Standgeräusch — 1/min>",
  "U.3":    "<Fahrgeräusch — dB(A)>",

  "F.1":    "<Tech. zul. Gesamtmasse — kg>",
  "F.2":    "<Mitgliedstaat zul. Gesamtmasse — kg>",
  "F.3":    "<Fahrzeugkombinationsmasse — kg>",
  "G":      "<Leermasse — kg>",
  "18":     "<Länge — mm>",
  "19":     "<Breite — mm>",
  "20":     "<Höhe — mm>",
  "M":      "<Achsabstand / Radstand — mm>",
  "17":     "<Spurweite vorne — mm>",
  "17.1":   "<Spurweite hinten — mm>",

  "L":      "<Anzahl der Achsen — sayı>",
  "L.1":    "<Antriebsachsen — sayı>",
  "N":      "<Stützlast — kg>",
  "O.1":    "<Anhängelast gebremst — kg>",
  "O.2":    "<Anhängelast ungebremst — kg>",
  "21":     "<Anhängelast bei 12% Steigung — kg>",
  "22":     "<Bemerkungen / Sonstige Vermerke — uzun metin>",

  "15":     "<Bereifung (Achse 1) — örn. '245/40 R19 098Y'>",
  "15.1":   "<Bereifung (Achse 2)>",
  "15.2":   "<Bereifung (Achse 3)>",
  "15.3":   "<Bereifung (Achse 4)>",

  "R":      "<Farbe — örn. 'SCHWARZ', 'WEISS'>",
  "S.1":    "<Sitzplätze (Fahrersitz dahil) — sayı>",
  "S.2":    "<Stehplätze — sayı>",
  "T":      "<Höchstgeschwindigkeit — km/h>",

  "X.1":    "<Nächste Hauptuntersuchung / TÜV — MM.YYYY veya 'MM.YY' formatında. Belgede 'HU', 'Nächste HU', 'TÜV bis' ya da kenar plakası üstünde. Örn. '01.27' veya '01.2027'.>",
  "X":      "<HU Stempel detayı — örn. '01.27 WÜRSELEN'>",
  "Y":      "<Bemerkungen (HU)>",

  "30":     "<Vorbesitzer-Anzahl — sayı>",
  "31":     "<Erstmalige Zulassung im Inland — DD.MM.YYYY>",
  "32":     "<Letzter Halterwechsel — DD.MM.YYYY>",
  "33":     "<Tag der Außerbetriebsetzung — DD.MM.YYYY>",

  "_confidence": <0.0..1.0 — okuma güveni>
}

KRİTİK KURALLAR:
1. **Plaka (A):** Orijinal formatta bırak — 'AC RN 788' veya 'AC-RN-788' fark etmez.
2. **VIN (E ve 5):** TAM 17 karakter. "0" sayı, "O" harf — dikkatli ayır. I/O/Q HİÇ yok VIN'de. E ve 5 aynı değeri alır (resmi kod E, alt kod 5).
3. **Tarihler:** DD.MM.YYYY formatında. X.1 (TÜV) için MM.YYYY veya MM.YY de kabul.
4. **Sayısal alanlar (P.1, P.2, F.1, G, T, 18-20, M vb.):** birim ile birlikte ("147 kW", "1925 kg", "232 km/h", "4996 mm"). Sadece S.1, S.2, L, L.1, 30 saf sayı.
5. **Adres (C.1.3):** "sokak no, plz şehir" tek satır. Örn. "Münsterstraße 24, 52076 Aachen".
6. **HSN/TSN:** Belgede ayrı alanlar olarak görünüyorsa: 10=HSN (4 hane), 3 veya 6=TSN. Birleşik "1313/EJJ" görünürse 10="1313", 3="EJJ".
7. **22 (Bemerkungen):** Çok uzun olabilir, tam metin koru. Satır sonlarını boşlukla değiştir.
8. **Asla null kullanma** — okunamayan alanlar "" olsun.
9. **_confidence:** belge kalitesine göre 0.0-1.0. Tüm alanlar net >0.95. Bulanık <0.7.`;

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
