// Alman Zulassungsbescheinigung Teil I (Fahrzeugschein) ve Teil II (Fahrzeugbrief)
// icin standart EU alanlari. Mock parser — yuklenen ruhsat dosyasindan
// alan listesi dondurur. Ileride OCR/Vision API ile degistirilecek.

export const RUHSAT_FIELDS = [
  { code: 'DRUCK',  de: 'Druckstücknummer',                  tr: 'Belge Numarası' },
  { code: 'A',      de: 'Amtl. Kennzeichen',                 tr: 'Plaka' },
  { code: 'B',      de: 'Datum der Erstzulassung',           tr: 'İlk Tescil Tarihi' },
  { code: 'C.1.1',  de: 'Name des Halters',                  tr: 'Sahibinin Soyadı' },
  { code: 'C.1.2',  de: 'Vorname des Halters',               tr: 'Sahibinin Adı' },
  { code: 'C.1.3',  de: 'Anschrift',                         tr: 'Adres' },
  { code: '0.1',    de: 'Behörden-Schlüssel',                tr: 'Daire Kodu' },
  { code: '0.2',    de: 'Verfahrenskennung',                 tr: 'İşlem Kodu' },
  { code: '1',      de: 'Fahrzeugklasse',                    tr: 'Araç Sınıfı' },
  { code: '2',      de: 'Aufbau / Karosserie',               tr: 'Kasa Tipi' },
  { code: '4',      de: 'Verwendungsart',                    tr: 'Kullanım Türü' },
  { code: '5',      de: 'FIN / VIN',                         tr: 'Şasi Numarası (VIN)' },
  { code: 'D.1',    de: 'Marke',                             tr: 'Marka' },
  { code: 'D.2',    de: 'Typ, Variante, Version',            tr: 'Tip / Versiyon' },
  { code: 'D.3',    de: 'Handelsbezeichnung',                tr: 'Ticari Ad' },
  { code: 'F.1',    de: 'Tech. zul. Gesamtmasse (kg)',       tr: 'İzin Verilen Toplam Ağırlık' },
  { code: 'F.2',    de: 'Im Mitgliedstaat zul. Gesamtmasse', tr: 'Üye Devlet İzin Verilen Ağırlık' },
  { code: 'G',      de: 'Leermasse (kg)',                    tr: 'Boş Ağırlık' },
  { code: 'J',      de: 'Fahrzeugart',                       tr: 'Araç Türü' },
  { code: 'K',      de: 'EG-Typgenehmigungsnummer',          tr: 'AB Tip Onay No' },
  { code: 'L',      de: 'Achsen',                            tr: 'Aks Sayısı' },
  { code: 'O.1',    de: 'Anhängelast gebremst (kg)',         tr: 'Frenli Römork Ağırlığı' },
  { code: 'O.2',    de: 'Anhängelast ungebremst (kg)',       tr: 'Frensiz Römork Ağırlığı' },
  { code: 'P.1',    de: 'Hubraum (cm³)',                     tr: 'Motor Hacmi' },
  { code: 'P.2',    de: 'Nennleistung (kW)',                 tr: 'Motor Gücü' },
  { code: 'P.3',    de: 'Kraftstoffart',                     tr: 'Yakıt Türü' },
  { code: 'P.5',    de: 'Motornummer',                       tr: 'Motor Numarası' },
  { code: 'Q',      de: 'Leistungs-/Masse-Verhältnis',       tr: 'Güç/Ağırlık Oranı' },
  { code: 'R',      de: 'Farbe',                             tr: 'Renk' },
  { code: 'S.1',    de: 'Sitzplätze',                        tr: 'Koltuk Sayısı' },
  { code: 'S.2',    de: 'Stehplätze',                        tr: 'Ayakta Yer Sayısı' },
  { code: 'T',      de: 'Höchstgeschwindigkeit (km/h)',      tr: 'Azami Hız' },
  { code: 'U.1',    de: 'Standgeräusch (dB)',                tr: 'Yerinde Gürültü' },
  { code: 'U.2',    de: 'Drehzahl Standgeräusch',            tr: 'Standgeräusch Devri' },
  { code: 'U.3',    de: 'Fahrgeräusch (dB)',                 tr: 'Sürüş Gürültüsü' },
  { code: 'V.7',    de: 'CO₂-Emission (g/km)',               tr: 'CO₂ Emisyonu' },
  { code: 'V.9',    de: 'Emissionsklasse',                   tr: 'Emisyon Sınıfı' },
  { code: '14',     de: 'Typgenehmigung Emission',           tr: 'Emisyon Tip Onayı' },
  { code: '15',     de: 'Bereifung',                         tr: 'Lastik Ölçüsü' },
  { code: '15.1',   de: 'Bereifung Antriebsachse',           tr: 'Tahrik Aksı Lastiği' },
  { code: '18',     de: 'Länge (mm)',                        tr: 'Uzunluk' },
  { code: '19',     de: 'Breite (mm)',                       tr: 'Genişlik' },
  { code: '20',     de: 'Höhe (mm)',                         tr: 'Yükseklik' },
  { code: '22',     de: 'Anhängelast',                       tr: 'Çeki Yükü' },
  { code: 'AUSST',  de: 'Ausstellungsdatum',                 tr: 'Belge Düzenleme Tarihi' },
  { code: 'BEH',    de: 'Ausstellende Behörde',              tr: 'Düzenleyen Daire' },
];

const RUHSAT_GROUPS = [
  { title: 'Belge Bilgileri',         codes: ['DRUCK', 'AUSST', 'BEH', '0.1', '0.2'] },
  { title: 'Sahip Bilgileri',         codes: ['C.1.1', 'C.1.2', 'C.1.3'] },
  { title: 'Araç Kimlik',             codes: ['A', 'B', '5', 'D.1', 'D.2', 'D.3', 'K'] },
  { title: 'Sınıflandırma',           codes: ['1', '2', '4', 'J'] },
  { title: 'Motor & Yakıt',           codes: ['P.1', 'P.2', 'P.3', 'P.5', 'Q', 'V.7', 'V.9', '14'] },
  { title: 'Boyut & Ağırlık',         codes: ['F.1', 'F.2', 'G', '18', '19', '20', 'L', 'O.1', 'O.2', '22'] },
  { title: 'Donanım & Performans',    codes: ['R', 'S.1', 'S.2', 'T', 'U.1', 'U.2', 'U.3', '15', '15.1'] },
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

// Mock parser — paylasilan ornek ruhsattaki verileri kullanir.
// Gercek OCR entegrasyonu icin bu fonksiyonu Vision API cagrisiyla degistir.
export function parseRuhsatMock(file) {
  return {
    'DRUCK':  'AC-A-2-020/26-00242',
    'A':      'AC FN960',
    'B':      '29.12.2016',
    'C.1.1':  'Onoğlu',
    'C.1.2':  'Mehmet',
    'C.1.3':  'Amselweg 24 F, 52223 Stolberg',
    '0.1':    'AE',
    '0.2':    '1329',
    '1':      'M1',
    '2':      '01',
    '4':      'Mehrzweckfahrzeug',
    '5':      'SJNFEAF15U7296995',
    'D.1':    'NISSAN',
    'D.2':    'F15',
    'D.3':    'NISSAN JUKE (CH)',
    'F.1':    '1565 kg',
    'F.2':    '—',
    'G':      '1278 kg',
    'J':      'Mehrzweckfahrzeug',
    'K':      'e11*2007/46*0132*23',
    'L':      '2',
    'O.1':    '1710 kg',
    'O.2':    '639 kg',
    'P.1':    '1197 cm³',
    'P.2':    '85 kW',
    'P.3':    'Benzin',
    'P.5':    'AID000172',
    'Q':      '—',
    'R':      'SCHWARZ (Siyah)',
    'S.1':    '5',
    'S.2':    '0',
    'T':      '178 km/h',
    'U.1':    '75 dB',
    'U.2':    '—',
    'U.3':    '—',
    'V.7':    '130 g/km',
    'V.9':    'EURO 6',
    '14':     '715/2007*2015/45W',
    '15':     '215/55R17 82S',
    '15.1':   '215/55R17 82S',
    '18':     '4135 mm',
    '19':     '1765 mm',
    '20':     '1565 mm',
    '22':     '1710 kg',
    'AUSST':  '20.01.2026',
    'BEH':    'Würselen',
    '_meta':  { parsedAt: new Date().toISOString(), source: 'mock', filename: file?.name },
  };
}
