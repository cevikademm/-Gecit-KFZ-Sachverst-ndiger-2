const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf8');

// 1. Add Typewriter effect to Hero
const aiText = `
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex items-center gap-2 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-[#E30613] animate-pulse" />
            <span className="text-xs font-black tracking-[0.3em] text-[#E30613] uppercase">KI-GESTÜTZTE KFZ-BEGUTACHTUNG</span>
          </motion.div>`;

// Insert before the H1 in Hero
if (!content.includes('KI-GESTÜTZTE KFZ-BEGUTACHTUNG')) {
    content = content.replace(/<h1 className="text-6xl md:text-8xl font-black tracking-tighter text-\[#0A0A0A\] leading-none mb-2">/, (match) => aiText + '\n          ' + match);
}

// 2. Translations
const trans = [
    [/Neden <span style={{ color: '#e10600' }}>Gecit<\/span> Kfz Sachverständiger'u Tercih Etmelisiniz\?/g, 'Warum <span style={{ color: "#e10600" }}>Gecit</span> Kfz Sachverständiger wählen?'],
    [/Belgeleriniz güvende, süreçleriniz şeffaf, herkes aynı sayfada\./g, 'Ihre Dokumente sind sicher, Ihre Prozesse transparent, alle auf demselben Stand.'],
    [/Özellikler/g, 'FUNKTIONEN'],
    [/Oto Ekspertizin <span style={{ color: C.neon }}>Dijital Standardı<\/span>\./g, 'Der <span style={{ color: C.neon }}>digitale Standard</span> der Kfz-Begutachtung.'],
    [/Ruhsat tarama, tramer geçmişi, termin yönetimi, canlı ekspertiz takibi ve müşteri portalı — hepsi tek çatı altında\./g, 'Fahrzeugschein-Scan, Historie, Terminmanagement und Kundenportal — alles unter einem Dach.'],
    [/AI Ruhsat Okuma \(OCR\)/g, 'KI-Fahrzeugschein-Scan (OCR)'],
    [/Ruhsat fotoğrafını yükle — şasi numarası, plaka, marka, model ve yıl saniyeler içinde otomatik doldurulsun\. Yazım hatası sıfır\./g, 'Laden Sie ein Foto des Fahrzeugscheins hoch — Fahrgestellnummer, Kennzeichen, Marke und Modell werden in Sekunden ausgefüllt.'],
    [/Anlık Araç Geçmişi/g, 'Echtzeit-Fahrzeughistorie'],
    [/Şasi ya da plaka üzerinden tramer, kaza ve değişen parça raporuna tek tıkla eriş\./g, 'Greifen Sie mit einem Klick auf die Historie, Unfälle und Teileberichte über Fahrgestellnummer oder Kennzeichen zu.'],
    [/Online Termin Sistemi/g, 'Online-Terminsystem'],
    [/Google Takvim senkronlu boş saatler\. Müşteri randevu alır, servis ajandasına anında işlenir\./g, 'Synchronisiert mit Google Kalender. Kunden buchen Termine, die sofort in Ihren Kalender eingetragen werden.'],
    [/Canlı Ekspertiz Takibi/g, 'Live-Begutachtungs-Tracking'],
    [/Mekanik, kaporta, boya, rapor\. Müşteri sürecin her aşamasını bar üzerinde gerçek zamanlı görür\./g, 'Mechanik, Karosserie, Lackierung, Bericht. Der Kunde sieht jede Phase des Prozesses in Echtzeit.'],
    [/Nasıl Çalışır/g, 'SO FUNKTIONIERT ES'],
    [/3 Adımda <span style={{ color: C.neon }}>Güvenli Ekspertiz<\/span>/g, 'In 3 Schritten zum <span style={{ color: C.neon }}>Sicheren Gutachten</span>'],
    [/Termin Al/g, 'Termin vereinbaren'],
    [/Ruhsatını Yükle/g, 'Fahrzeugschein hochladen'],
    [/Raporunu Al/g, 'Bericht erhalten'],
    [/Online takvimden uygun saati seç\. Randevu Google Takvim üzerinde işaretlenir, SMS ve e-posta ile onay gelir\./g, 'Wählen Sie einen passenden Termin im Online-Kalender. Bestätigung erfolgt per SMS und E-Mail.'],
    [/Ruhsat fotoğrafını sürükle-bırak ile yükle\. AI saniyeler içinde araç bilgisini okur; tramer ve kaza geçmişi anında görünür\./g, 'Laden Sie den Fahrzeugschein per Drag & Drop hoch. Die KI liest die Daten in Sekunden aus.'],
    [/Mekanik, kaporta ve boya kontrolü tamamlandığında detaylı PDF rapor müşteri portalına ve e-postana düşer\./g, 'Nach Abschluss der Prüfung erhalten Sie das detaillierte PDF-Gutachten im Portal und per E-Mail.'],
    [/Güven/g, 'VERTRAUEN'],
    [/Sayılarla güvenin adı\./g, 'Vertrauen in Zahlen.'],
    [/Ruhsat OCR Süresi/g, 'Scan-Zeit'],
    [/Kontrol Noktası/g, 'Prüfpunkte'],
    [/Müşteri Memnuniyeti/g, 'Kundenzufriedenheit'],
    [/Ömür Boyu Erişim/g, 'Lebenslanger Zugriff'],
    [/Ekspertiz raporlarınız ve belgeleriniz sonsuza kadar dijital arşivde\. İstediğiniz zaman, istediğiniz yerden ulaşın\./g, 'Ihre Gutachten sind dauerhaft in Ihrem digitalen Archiv gespeichert. Jederzeit abrufbar.'],
    [/Sınırsız Saklama/g, 'Unbegrenzte Speicherung'],
    [/Her Yerden Erişim/g, 'Zugriff von überall'],
    [/Mobil, tablet veya bilgisayar — fark etmez\. Belgeleriniz her cihazda, her zaman yanınızda\./g, 'Smartphone, Tablet oder Computer — Ihre Dokumente sind auf jedem Gerät dabei.'],
    [/Tek Portal, Üç Kullanıcı/g, 'Ein Portal, drei Nutzer'],
    [/Müşteri, avukat ve sigortacı aynı platformu kullanır\. Bilgi akışı kopma olmadan, tek merkezden yönetilir\./g, 'Kunden, Anwälte und Versicherer nutzen dieselbe Plattform für einen reibungslosen Informationsfluss.'],
    [/Birleşik Platform/g, 'Vereinte Plattform'],
    [/Canlı Veri Akışı/g, 'Live-Datenfluss'],
    [/Ekspertiz sürecini adım adım canlı takip edin\. Mekanik, kaporta, rapor — her aşama anlık güncellenir\./g, 'Verfolgen Sie die Begutachtung live. Mechanik, Karosserie, Bericht — alles in Echtzeit.'],
    [/Gerçek Zamanlı/g, 'Echtzeit'],
    [/Her araç için doğru paket\./g, 'Das richtige Paket für jedes Fahrzeug.'],
    [/Bireysel araç sahipleri için temel ekspertiz paketi\./g, 'Das Basis-Paket für Privatpersonen.'],
    [/İkinci el alıcılar ve oto galerilerinin ilk tercihi\./g, 'Die erste Wahl für Gebrauchtwagenkäufer und Autohäuser.'],
    [/Premium Seç/g, 'Premium wählen'],
    [/Galeri, sigorta ve filo firmalarına özel çözümler\./g, 'Spezielle Lösungen für Autohäuser, Versicherungen und Flotten.'],
    [/Bizimle Görüş/g, 'Kontaktieren Sie uns'],
    [/Aracının Gerçek Hikayesini Öğren\./g, 'Entdecken Sie die wahre Geschichte Ihres Fahrzeugs.'],
    [/İlk ekspertizinde %15 indirim\. 5 dakikada online termin\./g, '15% Rabatt auf Ihr erstes Gutachten. Termin in 5 Minuten.'],
    [/Terminin Oluşturuldu 🎉/g, 'Termin vereinbart 🎉'],
    [/Google Takvim'e eklendi, SMS ile onay gönderildi/g, 'In Google Kalender eingetragen, Bestätigung per SMS gesendet.'],
    [/Online Termin Al/g, 'Online-Termin buchen'],
    [/Boş saatlerden seç, 30 saniyede tamamla/g, 'Wählen Sie freie Zeiten, fertig in 30 Sekunden.'],
    [/Hizmet Paketi/g, 'Service-Paket'],
    [/Tarih/g, 'Datum'],
    [/Saat/g, 'Uhrzeit'],
    [/Ad Soyad/g, 'Vor- & Nachname'],
    [/Telefon/g, 'Telefon'],
    [/E-posta/g, 'E-Mail'],
    [/Plaka/g, 'Kennzeichen'],
    [/Termin Oluştur/g, 'Termin buchen'],
    [/Google Takvim'e otomatik eklenir/g, 'Wird automatisch in Google Kalender eingetragen'],
    [/Randevunuz başarıyla alındı! Teşekkür ederiz\./g, 'Ihr Termin wurde erfolgreich vereinbart! Vielen Dank.'],
    [/Tamam/g, 'Ok'],
    [/En Popüler/g, 'AM BELIEBTESTEN'],
    [/Özel/g, 'Individuell'],
    [/Şimdi Bilgi Al/g, 'Jetzt informieren'],
    [/Şimdi Yükle/g, 'Jetzt hochladen'],
    [/Detaylı incele/g, 'Details ansehen'],
    [/Büyüt/g, 'Vergrößern'],
    [/Tek Dosya, <span style={{ color: C.neon }}>Dört Portal<\/span>, Tüm Ekosistem/g, 'Eine Datei, <span style={{ color: C.neon }}>Vier Portale</span>, Ein Ökosystem'],
    [/Gecit Kfz Sachverständiger'nin mimari özeti: KFZ-ekspertiz iş kolunun tüm halkaları tek bir dosyada birleşir\./g, 'Architektur-Zusammenfassung: Alle Glieder der Kfz-Expertise-Kette vereint in einer Datei.'],
    [/Kurulum yok, sunucu yok\. Tüm ekosistem tarayıcıda doğrudan çalışır\./g, 'Keine Installation, kein Server. Das gesamte Ökosystem läuft direkt im Browser.'],
    [/Müşteri, avukat, sigortacı ve admin — dört rolün dört portali, tek `index.html` dosyasında\./g, 'Kunden, Anwälte, Versicherer und Admin — vier Portale in einer index.html Datei.'],
    [/Almanya'nın güvenilir ekspertiz ağı · 500\+ servis/g, 'Deutschlands zuverlässiges Gutachternetzwerk · 500+ Partner'],
    [/Als Geschädigter stehen Ihnen viele Rechte zu\. Wir setzen diese für Sie durch\./g, 'Als Geschädigter haben Sie viele Rechte. Wir setzen diese für Sie durch.'],
    [/İkinci el araç aldık; Gecit Kfz Sachverständiger ruhsattan saniyede okudu, 20 yıllık galericinin bile kaçırdığı değişen parçayı yakaladı\. Paranın tam karşılığı\./g, 'Wir haben einen Gebrauchtwagen gekauft; Gecit Kfz Sachverständiger hat den Schein in Sekunden gelesen und den Mangel gefunden. Absolut empfehlenswert.'],
    [/Kurucu Ortak @ Yıldız Motors/g, 'Mitbegründer @ Yıldız Motors'],
    [/OtoGüven/g, 'AutoSafe'],
    [/ŞasiPro/g, 'ChassisPro'],
    [/Dinamo/g, 'Dynamo'],
    [/İmza/g, 'Unterschrift'],
    [/Giriş Yap/g, 'Anmelden'],
    [/Beni hatırla/g, 'Angemeldet bleiben'],
    [/Şifremi unuttum/g, 'Passwort vergessen'],
    [/Giriş yapılıyor…/g, 'Anmeldung läuft…'],
    [/HIZLI GİRİŞ \(DEMO\)/g, 'SCHNELLANMELDUNG (DEMO)'],
    [/Tek tıkla istediğin role gir — şifreler henüz devre dışı/g, 'Mit einem Klick einloggen — Passwörter sind noch deaktiviert'],
    [/Sizin İçin Buradayız/g, 'Wir sind für Sie da'],
    [/ADRESSE/g, 'ADRESSE'],
    [/KONTAKT/g, 'KONTAKT'],
    [/Ihr unabhängiger Partner für professionelle Kfz-Gutachten\. Schnell, zuverlässig und immer in Ihrem Interesse\./g, 'Ihr unabhängiger Partner für professionelle Kfz-Gutachten. Schnell, zuverlässig und immer in Ihrem Interesse.'],
    [/Alle Rechte vorbehalten\./g, 'Alle Rechte vorbehalten.'],
    [/Süreci Başlat/g, 'Prozess starten'],
    [/Standart Ekspertiz/g, 'Standard-Begutachtung'],
    [/Premium Ekspertiz/g, 'Premium-Begutachtung'],
    [/Kurumsal Filo/g, 'Unternehmensflotte'],
    [/Standart/g, 'Standard'],
    [/Premium/g, 'Premium'],
    [/Kurumsal/g, 'Business']
];

trans.forEach(([reg, rep]) => {
    content = content.replace(reg, rep);
});

fs.writeFileSync('src/pages/Landing.jsx', content);
