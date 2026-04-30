const fs = require('fs');
let content = fs.readFileSync('src/pages/Landing.jsx', 'utf8');

const trans = [
    [/setError\('E-Mail veya şifre hatalı\. Passwort en az 4 karakter olmalı\.'\);/g, "setError('E-Mail oder Passwort falsch. Das Passwort muss mindestens 4 Zeichen lang sein.');"],
    [/Passwortyle giriş için yukarıdaki formu kullan · Hızlı giriş yalnızca demo amaçlıdır/g, "Nutzen Sie das Formular oben für den Login mit Passwort · Der Schnell-Login dient nur Demo-Zwecken"],
    [/Yönetim Paneli/g, 'Dashboard'],
    [/Müşteri Portalı/g, 'Kundenportal'],
    [/Avukat Portalı/g, 'Anwaltsportal'],
    [/Sayılarla güvenin adı\./g, 'Vertrauen in Zahlen.'],
    [/Süreci Başlat/g, 'Prozess starten']
];

trans.forEach(([reg, rep]) => {
    content = content.replace(reg, rep);
});

fs.writeFileSync('src/pages/Landing.jsx', content);
