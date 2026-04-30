const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf8');

const trans = [
    [/60 nokta görsel kontrol/g, '60 Punkte Sichtprüfung'],
    [/Dijital PDF rapor/g, 'Digitaler PDF-Bericht'],
    [/Tramer geçmişi sorgulama/g, 'Abfrage der Fahrzeughistorie'],
    [/Online termin \+ SMS bildirim/g, 'Online-Termin + SMS-Benachrichtigung'],
    [/120 nokta detaylı kontrol/g, '120 Punkte Detailprüfung'],
    [/AI ruhsat OCR analizi/g, 'KI-Fahrzeugschein-OCR-Analyse'],
    [/Kaporta \+ boya kalınlık ölçümü/g, 'Karosserie + Lackdickenmessung'],
    [/Motor \+ şanzıman testi/g, 'Motor + Getriebetest'],
    [/Müşteri portalına tam erişim/g, 'Vollständiger Zugriff auf das Kundenportal'],
    [/Aylık sınırsız ekspertiz/g, 'Monatlich unbegrenzte Gutachten'],
    [/Individuell CRM \+ API entegrasyonu/g, 'CRM + API Integration'],
    [/Business fatura & cari takip/g, 'Rechnungsstellung & Tracking'],
    [/Öncelikli servis hattı \+ SLA/g, 'Priorisierte Service-Hotline + SLA'],
    [/Hesap Girişi/g, 'Konto-Anmeldung'],
    [/Tekrar hoş geldin\./g, 'Willkommen zurück.'],
    [/Gecit Kfz Sachverständiger Yönetim Paneli'ne erişmek için giriş yapın\./g, 'Melden Sie sich an, um auf das Gecit Kfz Dashboard zuzugreifen.'],
    [/Şifre/g, 'Passwort'],
    [/Yönetim Paneli/g, 'Verwaltungs-Dashboard'],
    [/Müşteri Portalı/g, 'Kundenportal'],
    [/Avukat Portalı/g, 'Anwaltsportal'],
    [/Şifreyle giriş için yukarıdaki formu kullan · Hızlı giriş yalnızca demo amaçlıdır/g, 'Nutzen Sie das Formular oben für den Login mit Passwort · Der Schnell-Login dient nur Demo-Zwecken'],
    [/VERTRAUENli bağlantı · KVKK uyumlu · Supabase Auth/g, 'Sichere Verbindung · DSGVO-konform · Supabase Auth'],
    [/Ana Ekrana Ekle/g, 'Zum Home-Bildschirm'],
    [/Push bildirimleri sadece PWA'da çalışır\./g, 'Push-Benachrichtigungen funktionieren nur in der PWA.'],
    [/Uygulamayı telefonuna yükle — push bildirimleri al, çevrimdışı çalış\./g, 'Installieren Sie die App auf Ihrem Telefon — erhalten Sie Push-Benachrichtigungen und arbeiten Sie offline.'],
    [/E-Mail veya şifre hatalı\. Şifre en az 4 karakter olmalı\./g, 'E-Mail oder Passwort falsch. Das Passwort muss mindestens 4 Zeichen lang sein.'],
    [/Demo Müşteri/g, 'Demo Kunde'],
    [/Adem Çevik/g, 'Adem Cevik'],
    [/Mehmet Yıldız/g, 'Mehmet Yildiz'],
    [/Müşteri/g, 'Kunde'],
    [/Avukat/g, 'Anwalt'],
    [/Admin/g, 'Admin'],
    [/ÜBER MICH/g, 'ÜBER UNS'],
    [/ueber-mich/g, 'ueber-uns']
];

trans.forEach(([reg, rep]) => {
    content = content.replace(reg, rep);
});

fs.writeFileSync('src/pages/Landing.jsx', content);
