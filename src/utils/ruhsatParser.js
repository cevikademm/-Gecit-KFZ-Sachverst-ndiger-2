// Alman Zulassungsbescheinigung Teil I (Fahrzeugschein) — resmi EU/Almanya standardı
// Kaynak: Anlage 5 zu § 11 Abs. 1, 2 und 4 FZV (Fahrzeug-Zulassungsverordnung)
// 70+ field — eksiksiz EU/Almanya ruhsat şeması.

export const RUHSAT_FIELDS = [
  // ─── Belge bilgileri ──────────────────────────────────────────────
  { code: 'DRUCK',  de: 'Druckstücknummer',                        tr: 'Belge Numarası' },
  { code: 'AUSST',  de: 'Ausstellungsdatum',                       tr: 'Belge Düzenleme Tarihi' },
  { code: 'BEH',    de: 'Ausstellende Behörde',                    tr: 'Düzenleyen Daire' },
  { code: 'Z',      de: 'Datum der Zulassung',                     tr: 'Tescil Tarihi' },
  { code: '0.1',    de: 'Behörden-Schlüssel',                      tr: 'Daire Kodu' },
  { code: '0.2',    de: 'Verfahrenskennung',                       tr: 'İşlem Kodu' },

  // ─── Sahip (Halter) bilgileri ─────────────────────────────────────
  { code: 'C.1.1',  de: 'Name oder Firmenname des Halters',        tr: 'Sahip Soyadı / Firma' },
  { code: 'C.1.2',  de: 'Vorname des Halters',                     tr: 'Sahip Adı' },
  { code: 'C.1.3',  de: 'Anschrift des Halters',                   tr: 'Sahip Adresi' },
  { code: 'C.2.1',  de: 'Name des Eigentümers',                    tr: 'Mülk Sahibi Soyadı' },
  { code: 'C.2.2',  de: 'Vorname des Eigentümers',                 tr: 'Mülk Sahibi Adı' },
  { code: 'C.2.3',  de: 'Anschrift des Eigentümers',               tr: 'Mülk Sahibi Adresi' },
  { code: 'C.4.1',  de: 'Halter = Eigentümer',                     tr: 'Sahip = Mülk Sahibi' },
  { code: 'C.4.2',  de: 'Halter ≠ Eigentümer',                     tr: 'Sahip ≠ Mülk Sahibi' },
  { code: 'C.4.3',  de: 'Halterhinweis',                           tr: 'Sahip Notu' },

  // ─── Plaka & kimlik ───────────────────────────────────────────────
  { code: 'A',      de: 'Amtliches Kennzeichen',                   tr: 'Plaka' },
  { code: 'B',      de: 'Datum der Erstzulassung',                 tr: 'İlk Tescil Tarihi' },
  { code: 'E',      de: 'Fahrzeug-Identifizierungsnummer (FIN/VIN)', tr: 'Şasi Numarası (VIN)' },
  { code: '5',      de: 'FIN / VIN (alt format)',                  tr: 'Şasi No (5)' },
  { code: 'H',      de: 'Datum der Eintragung',                    tr: 'Kayıt Tarihi' },

  // ─── Marka / Tip / Variant ────────────────────────────────────────
  { code: 'D.1',    de: 'Marke',                                   tr: 'Marka' },
  { code: 'D.2',    de: 'Typ / Variante / Version',                tr: 'Tip / Versiyon' },
  { code: 'D.3',    de: 'Handelsbezeichnung',                      tr: 'Ticari Ad / Model' },
  { code: 'K',      de: 'EG-Typgenehmigungsnummer',                tr: 'AB Tip Onay No' },

  // ─── Araç sınıfı / kasa / kullanım ────────────────────────────────
  { code: '1',      de: 'Fahrzeugklasse',                          tr: 'Araç Sınıfı' },
  { code: '2',      de: 'Aufbau / Karosserie (Kasa Kodu)',         tr: 'Kasa Kodu' },
  { code: 'J',      de: 'Fahrzeugart / Karosserie',                tr: 'Araç Türü / Kasa' },
  { code: '4',      de: 'Verwendungsart',                          tr: 'Kullanım Türü' },
  { code: '3',      de: 'Klassifizierungs-Code',                   tr: 'Sınıf Kodu' },
  { code: '6',      de: 'Klassifizierungs-Code-Erläuterung',       tr: 'Sınıf Açıklaması' },
  { code: '7',      de: 'Sondermerkmale',                          tr: 'Özel Donanım Kodu' },

  // ─── EG-Übereinstimmungsbescheinigung ─────────────────────────────
  { code: '8',      de: 'Beschränkungen, Auflagen',                tr: 'Kısıtlamalar' },
  { code: '9',      de: 'Genehmigungsvermerk',                     tr: 'Onay Şerhi' },
  { code: '10',     de: 'Hersteller-Schlüsselnummer (HSN)',        tr: 'HSN (Üretici Kodu)' },
  { code: '11',     de: 'Hersteller-Kurzbezeichnung',              tr: 'Üretici Kısa Adı' },
  { code: '12',     de: 'Klartext Hersteller-Bezeichnung',         tr: 'Üretici Tam Adı' },

  // ─── Ağırlık & boyut ──────────────────────────────────────────────
  { code: 'F.1',    de: 'Technisch zulässige Gesamtmasse (kg)',    tr: 'Teknik Maks. Toplam Ağırlık' },
  { code: 'F.2',    de: 'Im Mitgliedstaat zul. Gesamtmasse (kg)',  tr: 'Üye Devlet Maks. Ağırlık' },
  { code: 'F.3',    de: 'Zul. Gesamtmasse d. Fahrzeugkombinationsmasse', tr: 'Kombine Maks. Ağırlık' },
  { code: 'G',      de: 'Leermasse (kg)',                          tr: 'Boş Ağırlık' },
  { code: '18',     de: 'Länge (mm)',                              tr: 'Uzunluk' },
  { code: '19',     de: 'Breite (mm)',                             tr: 'Genişlik' },
  { code: '20',     de: 'Höhe (mm)',                               tr: 'Yükseklik' },
  { code: 'M',      de: 'Achsabstand (mm)',                        tr: 'Dingil Mesafesi' },
  { code: '17',     de: 'Spurweite vorne (mm)',                    tr: 'Ön İz Aralığı' },
  { code: '17.1',   de: 'Spurweite hinten (mm)',                   tr: 'Arka İz Aralığı' },

  // ─── Aks / Tahrik / Römork ────────────────────────────────────────
  { code: 'L',      de: 'Anzahl der Achsen',                       tr: 'Aks Sayısı' },
  { code: 'L.1',    de: 'Antriebsachsen',                          tr: 'Tahrik Aksı' },
  { code: 'N',      de: 'Stützlast (kg)',                          tr: 'Destek Yükü' },
  { code: 'O.1',    de: 'Anhängelast gebremst (kg)',               tr: 'Frenli Römork Yükü' },
  { code: 'O.2',    de: 'Anhängelast ungebremst (kg)',             tr: 'Frensiz Römork Yükü' },
  { code: '21',     de: 'Anhängelast bei 12% Steigung (kg)',       tr: 'Frenli Römork %12 Eğim' },
  { code: '22',     de: 'Sonstige Vermerke / Bemerkungen',         tr: 'Özel Notlar / Açıklamalar' },

  // ─── Motor ────────────────────────────────────────────────────────
  { code: 'P.1',    de: 'Hubraum (cm³)',                           tr: 'Motor Hacmi' },
  { code: 'P.2',    de: 'Nennleistung (kW)',                       tr: 'Motor Gücü (kW)' },
  { code: 'P.2.1',  de: 'Dauernennleistung (kW) — Elektro',        tr: 'Sürekli Güç (Elektrikli)' },
  { code: 'P.3',    de: 'Kraftstoffart / Energiequelle',           tr: 'Yakıt Türü' },
  { code: 'P.4',    de: 'Nenndrehzahl (1/min)',                    tr: 'Nominal Devir' },
  { code: 'P.5',    de: 'Motornummer / Kennzeichen',               tr: 'Motor Numarası' },
  { code: 'P.6',    de: 'Höchstes Drehmoment (Nm)',                tr: 'Maks. Tork' },
  { code: 'Q',      de: 'Leistungs-/Masseverhältnis (kW/kg)',      tr: 'Güç/Ağırlık Oranı' },

  // ─── Emisyon ──────────────────────────────────────────────────────
  { code: '14',     de: 'Emissions-Typgenehmigung',                tr: 'Emisyon Tip Onayı' },
  { code: '14.1',   de: 'Emissionsklasse-Schlüssel',               tr: 'Emisyon Sınıf Kodu' },
  { code: 'V.7',    de: 'CO₂-Emission kombiniert (g/km)',          tr: 'CO₂ Emisyonu (Kombine)' },
  { code: 'V.5',    de: 'Partikelmasse (g/km)',                    tr: 'Partikül Kütlesi' },
  { code: 'V.6',    de: 'Partikelanzahl',                          tr: 'Partikül Sayısı' },
  { code: 'V.8',    de: 'CO₂ — WLTP',                              tr: 'CO₂ (WLTP)' },
  { code: 'V.9',    de: 'Emissionsklasse / EURO-Norm',             tr: 'Emisyon Sınıfı (EURO)' },

  // ─── Gürültü ──────────────────────────────────────────────────────
  { code: 'U.1',    de: 'Standgeräusch (dB(A))',                   tr: 'Yerinde Gürültü' },
  { code: 'U.2',    de: 'Drehzahl bei Standgeräusch (1/min)',      tr: 'Gürültü Devri' },
  { code: 'U.3',    de: 'Fahrgeräusch (dB(A))',                    tr: 'Sürüş Gürültüsü' },

  // ─── Lastikler ────────────────────────────────────────────────────
  { code: '15',     de: 'Bereifung (Achse 1)',                     tr: 'Lastik (Aks 1)' },
  { code: '15.1',   de: 'Bereifung (Achse 2)',                     tr: 'Lastik (Aks 2)' },
  { code: '15.2',   de: 'Bereifung (Achse 3)',                     tr: 'Lastik (Aks 3)' },
  { code: '15.3',   de: 'Bereifung (Achse 4)',                     tr: 'Lastik (Aks 4)' },

  // ─── Renk / Koltuk / Hız ──────────────────────────────────────────
  { code: 'R',      de: 'Farbe des Fahrzeugs',                     tr: 'Renk' },
  { code: 'S.1',    de: 'Sitzplätze (inkl. Fahrersitz)',           tr: 'Koltuk Sayısı' },
  { code: 'S.2',    de: 'Stehplätze',                              tr: 'Ayakta Yer Sayısı' },
  { code: 'T',      de: 'Höchstgeschwindigkeit (km/h)',            tr: 'Azami Hız' },

  // ─── HU / TÜV ────────────────────────────────────────────────────
  { code: 'X.1',    de: 'Nächste Hauptuntersuchung (HU)',          tr: 'Sonraki Muayene (TÜV)' },
  { code: 'X',      de: 'Hauptuntersuchung — Stempel',             tr: 'Muayene Mührü' },
  { code: 'Y',      de: 'Bemerkungen (HU)',                        tr: 'Muayene Notları' },

  // ─── Ek tip onay & teknik ─────────────────────────────────────────
  { code: '13',     de: 'Genehmigte Bereifungs-Stempelung',        tr: 'Onaylı Lastik İşareti' },
  { code: '16',     de: 'EG-Bereifung Achse',                      tr: 'EG Lastik Aks' },
  { code: '23',     de: 'Tankvolumen (l)',                         tr: 'Yakıt Tankı (L)' },
  { code: '24',     de: 'Elektromotor — Leistung pro Stunde',      tr: 'Elektrik Saatlik Güç' },
  { code: '25',     de: 'Batterietyp — Elektro',                   tr: 'Batarya Tipi' },

  // ─── Boya / Önceki sahipler (otorite işareti) ────────────────────
  { code: '30',     de: 'Vorbesitzer-Anzahl',                      tr: 'Önceki Sahip Sayısı' },
  { code: '31',     de: 'Erstmalige Zulassung im Inland',          tr: 'Yurtiçi İlk Tescil' },
  { code: '32',     de: 'Letzter Halterwechsel',                   tr: 'Son Sahip Değişimi' },
  { code: '33',     de: 'Tag der Außerbetriebsetzung',             tr: 'Trafikten Çekiliş' },
];

// Mantıklı gruplandırma — RuhsatPanel render sırası
const RUHSAT_GROUPS = [
  { title: 'Belge Bilgileri',         codes: ['DRUCK', 'AUSST', 'BEH', 'Z', '0.1', '0.2'] },
  { title: 'Sahip Bilgileri',         codes: ['C.1.1', 'C.1.2', 'C.1.3', 'C.2.1', 'C.2.2', 'C.2.3', 'C.4.1', 'C.4.2', 'C.4.3'] },
  { title: 'Plaka & Kimlik',          codes: ['A', 'B', 'E', '5', 'H'] },
  { title: 'Marka & Model',           codes: ['D.1', 'D.2', 'D.3', 'K'] },
  { title: 'Sınıflandırma',           codes: ['1', '2', 'J', '4', '3', '6', '7'] },
  { title: 'Üretici & Onay',          codes: ['8', '9', '10', '11', '12', '13', '14', '14.1', '16'] },
  { title: 'Motor',                   codes: ['P.1', 'P.2', 'P.2.1', 'P.3', 'P.4', 'P.5', 'P.6', 'Q', '23', '24', '25'] },
  { title: 'Emisyon',                 codes: ['V.5', 'V.6', 'V.7', 'V.8', 'V.9'] },
  { title: 'Gürültü',                 codes: ['U.1', 'U.2', 'U.3'] },
  { title: 'Ağırlık & Boyut',         codes: ['F.1', 'F.2', 'F.3', 'G', '18', '19', '20', 'M', '17', '17.1'] },
  { title: 'Aks & Römork',            codes: ['L', 'L.1', 'N', 'O.1', 'O.2', '21'] },
  { title: 'Lastikler',               codes: ['15', '15.1', '15.2', '15.3'] },
  { title: 'Renk & Koltuk & Hız',     codes: ['R', 'S.1', 'S.2', 'T'] },
  { title: 'TÜV / Hauptuntersuchung', codes: ['X.1', 'X', 'Y'] },
  { title: 'Sahiplik Geçmişi',        codes: ['30', '31', '32', '33'] },
  { title: 'Notlar',                  codes: ['22'] },
];

export function getRuhsatGroups(data) {
  return RUHSAT_GROUPS.map(g => ({
    title: g.title,
    rows: g.codes.map(code => {
      const meta = RUHSAT_FIELDS.find(f => f.code === code);
      const value = data?.[code];
      return { code, de: meta?.de || code, tr: meta?.tr || code, value: value ?? '—' };
    }),
  }));
}

// Mock parser — paylaşılan örnek (Mercedes E 220 d, Jawish Hiba) verilerini kullanır.
// Gerçek OCR entegrasyonu için bu fonksiyonu Vision API çağrısıyla değiştir.
export function parseRuhsatMock(file) {
  return {
    // Belge
    'DRUCK':  'AC-A-2-022/25-00116',
    'AUSST':  '22.01.2025',
    'BEH':    'Würselen',
    'Z':      '22.01.2025',
    '0.1':    'AC',
    '0.2':    'BEG001146',
    // Sahip
    'C.1.1':  'Jawish',
    'C.1.2':  'Hiba',
    'C.1.3':  'Münsterstraße 24, 52076 Aachen',
    'C.4.1':  'ja',
    // Plaka & VIN
    'A':      'AC RN788',
    'B':      '24.04.2023',
    'E':      'W1KZH0EB6PB146398',
    '5':      'W1KZH0EB6PB146398',
    'H':      '22.01.2025',
    // Marka & Model
    'D.1':    'Mercedes-Benz',
    'D.2':    'U204T0 / CZAA15AB',
    'D.3':    'E 220 d',
    'K':      'e1*2007/46*1560*33',
    // Sınıflandırma
    '1':      'M1',
    '2':      '2222',
    'J':      'Kombilimousine',
    '4':      'Personenbeförderung',
    '3':      'R1ES',
    '6':      '36AP',
    // Üretici & Onay
    '10':     'R1',
    '14':     '715/2007*2018/1832AP',
    '14.1':   'EURO 6 WLTP AP PI/CI M N1 I',
    // Motor
    'P.1':    '1993 cm³',
    'P.2':    '147 kW',
    'P.3':    'Hybr. Diesel / E',
    'P.4':    '3600 1/min',
    'P.5':    'GS708937',
    'P.6':    '—',
    'Q':      '0,068 kW/kg',
    // Emisyon
    'V.7':    '144 g/km',
    'V.9':    'EURO 6',
    'V.8':    '—',
    // Ağırlık & Boyut
    'F.1':    '2605 kg',
    'F.2':    '2605 kg',
    'G':      '1925 kg',
    '18':     '4996 mm',
    '19':     '1868 mm',
    '20':     '1499 mm',
    'M':      '2939 mm',
    '17':     '1160 mm',
    '17.1':   '1445 mm',
    // Aks & Römork
    'L':      '2',
    'L.1':    '1',
    'O.1':    '2100 kg',
    'O.2':    '750 kg',
    '21':     '2100 kg',
    // Lastikler
    '15':     '245/40 R19 098Y',
    '15.1':   '275/35 R19 100Y',
    // Renk & Koltuk & Hız
    'R':      'SCHWARZ (Siyah)',
    'S.1':    '8',
    'S.2':    '0',
    'T':      '232 km/h',
    // TÜV / HU
    'X.1':    '01.2027',     // Nächste HU — Ocak 2027
    'X':      '01.27 WÜRSELEN',
    // Notlar
    '22':     '7,2/8,2 *+120 B.ANH.BETR.* FZ IST BEI WERKSSEITIG MONTIERT.AHK U.ESP M.SPEZ.FAHRDYN.STABI.SYST.F.ANH.BETR.F.TEMPO 100 KM/H GEM.5.AEND.VO.Z.9.AUSN.VO.Z.STVO AUSGESTATTET*',
    '_meta':  { parsedAt: new Date().toISOString(), source: 'mock', filename: file?.name },
  };
}

// ─── Ruhsat → form autofill mapping ────────────────────────────────
// Yüklenen ruhsattan alınan verileri form'un ilgili alanlarına yansıt.
// Kullanım: AdminReportEditor / Yeni rapor akışında ruhsat upload sonrası çağrılır.
//
// Dönüş yapısı: { claimant, vehicle, condition }
// Mevcut form değerlerine merge etmek için kullanan tarafın sorumluluğunda.

function parseGermanDate(str) {
  // "24.04.2023" → "2023-04-24" (ISO)
  if (!str || typeof str !== 'string') return '';
  const m = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

function parseGermanMonthYear(str) {
  // "01.27" → "2027-01-01" (yıl YY → 20YY); "01.2027" → "2027-01-01"
  if (!str || typeof str !== 'string') return '';
  const m4 = str.match(/(\d{2})\.(\d{4})/);
  if (m4) return `${m4[2]}-${m4[1]}-01`;
  const m2 = str.match(/(\d{2})\.(\d{2})(?!\d)/);
  if (m2) {
    const yy = parseInt(m2[2], 10);
    const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
    return `${yyyy}-${m2[1]}-01`;
  }
  return '';
}

function parseNumeric(str) {
  // "1993 cm³" → 1993; "147 kW" → 147; "2605 kg" → 2605
  if (str == null) return '';
  const m = String(str).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? m[0] : '';
}

function parsePlateString(raw) {
  // "AC RN788" → "AC RN 788" (boşlukları normalize)
  if (!raw) return '';
  return String(raw).replace(/\s+/g, ' ').trim();
}

function parseAddressLine(raw) {
  // "Münsterstraße 24, 52076 Aachen" → { street, zip, city }
  if (!raw) return { street: '', zip: '', city: '' };
  const parts = String(raw).split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const street = parts[0];
    const zipCity = parts[1].match(/(\d{5})\s+(.+)/);
    if (zipCity) return { street, zip: zipCity[1], city: zipCity[2] };
    return { street, zip: '', city: parts[1] };
  }
  return { street: raw, zip: '', city: '' };
}

/**
 * Ruhsat verisinden form alanlarına otomatik doldurma patch'i üretir.
 * @param {object} ruhsat - parseRuhsatMock veya gerçek OCR çıktısı
 * @returns {{ claimantPatch, vehiclePatch, conditionPatch }}
 */
export function buildVehicleAutofillFromRuhsat(ruhsat) {
  if (!ruhsat || typeof ruhsat !== 'object') {
    return { claimantPatch: null, vehiclePatch: null, conditionPatch: null };
  }

  // ─ Sahip → claimant ─────────────────────────────────────────────
  const addr = parseAddressLine(ruhsat['C.1.3']);
  const claimantPatch = {};
  if (ruhsat['C.1.1']) claimantPatch.lastName  = ruhsat['C.1.1'];
  if (ruhsat['C.1.2']) claimantPatch.firstName = ruhsat['C.1.2'];
  if (addr.street)     claimantPatch.street    = addr.street;
  if (addr.zip)        claimantPatch.zip       = addr.zip;
  if (addr.city)       claimantPatch.city      = addr.city;

  // ─ Araç → vehicle ───────────────────────────────────────────────
  const vehiclePatch = {};
  if (ruhsat['E'] || ruhsat['5'])    vehiclePatch.vin               = ruhsat['E'] || ruhsat['5'];
  if (ruhsat['D.1'])                 vehiclePatch.manufacturer      = ruhsat['D.1'];
  if (ruhsat['D.3'])                 vehiclePatch.mainType          = ruhsat['D.3'];
  if (ruhsat['D.2'])                 vehiclePatch.subType           = ruhsat['D.2'];
  if (ruhsat['B'])                   vehiclePatch.firstRegistration = parseGermanDate(ruhsat['B']);
  if (ruhsat['Z'])                   vehiclePatch.lastRegistration  = parseGermanDate(ruhsat['Z']);
  if (ruhsat['B'])                   vehiclePatch.yearOfManufacture = (parseGermanDate(ruhsat['B']) || '').slice(0, 4);
  if (ruhsat['P.1'])                 vehiclePatch.displacement      = parseNumeric(ruhsat['P.1']);
  if (ruhsat['P.2']) {
    const kw = parseNumeric(ruhsat['P.2']);
    vehiclePatch.powerKw = kw;
    if (kw) vehiclePatch.powerPs = String(Math.round(parseFloat(kw) * 1.36));
  }
  if (ruhsat['P.3'])                 vehiclePatch.engineType        = ruhsat['P.3'];
  if (ruhsat['S.1'])                 vehiclePatch.seats             = parseInt(parseNumeric(ruhsat['S.1']), 10) || '';
  if (ruhsat['L'])                   vehiclePatch.axles             = parseInt(parseNumeric(ruhsat['L']), 10) || '';
  if (ruhsat['L.1'])                 vehiclePatch.poweredAxles      = parseInt(parseNumeric(ruhsat['L.1']), 10) || '';
  if (ruhsat['J'])                   vehiclePatch.shape             = ruhsat['J'];
  if (ruhsat['10'] && ruhsat['3']) {
    // HSN = 10, TSN = 3 ya da 6 alanında olabilir
    vehiclePatch.kbaCode = `${ruhsat['10']}/${ruhsat['3'] || ruhsat['6'] || ''}`.replace(/\/$/, '');
  }
  // Plaka — claimant.plate olarak da set edilir (App-internal pattern)
  if (ruhsat['A']) {
    const plate = parsePlateString(ruhsat['A']);
    vehiclePatch._plate = plate;
    const parts = plate.split(/\s+/);
    if (parts.length >= 2) {
      claimantPatch.plate = {
        city:     parts[0] || '',
        initials: parts[1] || '',
        number:   parts.slice(2).join('') || '',
      };
    }
  }

  // ─ Durum → condition ────────────────────────────────────────────
  const conditionPatch = {};
  if (ruhsat['X.1']) conditionPatch.nextInspection = parseGermanMonthYear(ruhsat['X.1']);
  if (ruhsat['R'])   conditionPatch.paintColor     = ruhsat['R'];
  if (ruhsat['V.9']) {
    const m = ruhsat['V.9'].match(/EURO\s*(\d+)/i);
    if (m) conditionPatch.emissionNorm = `EURO ${m[1]}`;
    conditionPatch.emissionGroup = 4; // default; UI'da değiştirilebilir
  }

  return {
    claimantPatch:  Object.keys(claimantPatch).length  ? claimantPatch  : null,
    vehiclePatch:   Object.keys(vehiclePatch).length   ? vehiclePatch   : null,
    conditionPatch: Object.keys(conditionPatch).length ? conditionPatch : null,
  };
}
