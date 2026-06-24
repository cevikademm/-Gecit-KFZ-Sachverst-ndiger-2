// ═══════════════════════════════════════════════════════════════
// mailTemplates.js — Paylaşılan hazır mail şablonları (tek doğruluk kaynağı)
// ───────────────────────────────────────────────────────────────
// "İletişim & Davet" (CommunicationsPanel) ve "Müşteri Bulma"
// (MusteriBulmaPanel) panelleri AYNI şablon listesini kullanır.
//
// audience alanı hangi panelde gösterileceğini belirler:
//   'customer' → müşteriye yönelik (randevu/rapor/fatura...)
//   'firma'    → işletme/iş birliği daveti (Müşteri Bulma)
//   'genel'    → her ikisinde de
//
// Yer tutucular: {{ad}} {{sirket}} {{email}} {{telefon}} {{adres}}
//                {{plaka}} {{marka}} {{model}} {{yil}} {{tarih}} {{saat}}
//   (eski {isim} tek-süslü biçimi de desteklenir → firma adına eşlenir)
// ═══════════════════════════════════════════════════════════════

export const MAIL_TEMPLATES = [
  {
    id: 'blank',
    icon: '✏️',
    accent: '#6B6B73',
    title: 'Boş Şablon',
    description: 'Kendi mesajını sıfırdan yaz',
    category: 'genel',
    audience: 'genel',
    subject: '',
    body: '',
    ctaLabel: '',
    ctaUrl: '',
  },

  // ─────────────── FİRMA / İŞ BİRLİĞİ (B2B) ───────────────
  {
    id: 'b2b_collab',
    icon: '🤝',
    accent: '#E11D2E',
    title: 'İş Birliği Daveti',
    description: 'İşletmeye iş birliği / yönlendirme teklifi (DE)',
    category: 'isbirligi',
    audience: 'firma',
    subject: 'Zusammenarbeit — Gecit KFZ Sachverständigenbüro',
    body:
`Sehr geehrtes Team von {{sirket}},

wir sind das Gecit KFZ Sachverständigenbüro und erstellen unabhängige Kfz-Gutachten (Unfall, Wertgutachten, HU/AU-Begleitung).

Gerne würden wir mit {{sirket}} zusammenarbeiten und Ihre Kunden bei Schadensfällen schnell und zuverlässig unterstützen — von der Begutachtung bis zur Abwicklung.

Bei Interesse melden Sie sich einfach unter info@kfzgutachter.ac oder telefonisch. Wir freuen uns auf die Zusammenarbeit.

Mit freundlichen Grüßen
Gecit KFZ Sachverständigenbüro`,
    ctaLabel: 'Mehr erfahren',
    ctaUrl: 'https://kfzgutachter.ac',
  },
  {
    id: 'b2b_intro',
    icon: '📣',
    accent: '#2563EB',
    title: 'Tanıtım / İlk Temas',
    description: 'Kısa tanıtım maili — yeni işletmeye ilk temas (TR)',
    category: 'isbirligi',
    audience: 'firma',
    subject: '{{sirket}} için bağımsız Kfz-Gutachten hizmeti',
    body:
`Merhaba {{sirket}} ekibi,

Gecit KFZ Sachverständigenbüro olarak bağımsız araç ekspertizi, hasar değerlendirme ve Gutachten hizmeti veriyoruz.

Müşterilerinize hızlı ve güvenilir bir ekspertiz çözümü sunabilmek için sizinle tanışmak isteriz. Dilerseniz kısa bir görüşmeyle nasıl birlikte çalışabileceğimizi konuşabiliriz.

İlgilenirseniz bu maile yanıt vermeniz veya bizi aramanız yeterli.

İyi çalışmalar dileriz.
Gecit KFZ Sachverständigenbüro · info@kfzgutachter.ac`,
    ctaLabel: 'Web sitemiz',
    ctaUrl: 'https://kfzgutachter.ac',
  },
  {
    id: 'b2b_followup',
    icon: '🔁',
    accent: '#F59E0B',
    title: 'Takip / Hatırlatma',
    description: 'Daha önce ulaşılan işletmeye nazik takip maili',
    category: 'isbirligi',
    audience: 'firma',
    subject: 'Kısa bir hatırlatma — {{sirket}}',
    body:
`Merhaba {{sirket}} ekibi,

Geçtiğimiz günlerde iş birliği hakkında size yazmıştık. Yoğunluğunuzu biliyoruz; sadece kısa bir hatırlatma yapmak istedik.

Bağımsız Kfz-Gutachten ihtiyaçlarınızda yanınızdayız. Uygun olduğunuzda kısa bir görüşme ayarlayabiliriz.

İlginiz için teşekkür ederiz.
Gecit KFZ Sachverständigenbüro · info@kfzgutachter.ac`,
    ctaLabel: 'Randevu / İletişim',
    ctaUrl: 'https://kfzgutachter.ac',
  },

  // ─────────────── MÜŞTERİYE YÖNELİK ───────────────
  {
    id: 'appointment_confirmed',
    icon: '✅',
    accent: '#16A34A',
    title: 'Randevu Onayı',
    description: 'Tarih, saat ve adres bilgisiyle randevu onayı',
    category: 'randevu',
    audience: 'customer',
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
    audience: 'customer',
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
    audience: 'customer',
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
    audience: 'customer',
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
    audience: 'genel',
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
    audience: 'customer',
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
    audience: 'customer',
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
    audience: 'customer',
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
    audience: 'genel',
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

// Belirli bir hedef kitle (audience) için şablonları döndür.
// 'genel' her zaman dahil edilir.
export function templatesFor(audience) {
  return MAIL_TEMPLATES.filter((t) => t.audience === audience || t.audience === 'genel');
}

// Şablon metnindeki yer tutucuları doldur.
// Hem {{key}} hem eski {isim} biçimini destekler. Bilinmeyenleri olduğu gibi bırakır.
export function fillTemplate(text, data = {}) {
  if (!text) return '';
  let out = String(text);
  // {{key}}
  out = out.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (m, key) => {
    const v = data[key];
    return (v === undefined || v === null || v === '') ? m : String(v);
  });
  // eski {isim} → firma adı (data.sirket veya data.ad)
  out = out.replace(/\{isim\}/g, data.sirket || data.ad || data.isim || '');
  return out;
}
