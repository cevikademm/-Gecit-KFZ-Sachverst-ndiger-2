// 10-dilli sözlük. Anahtarlar dot.case ile çözümlenir.
// Yön (RTL): ar, fa. Diğerleri LTR.

export const SUPPORTED_LANGS = [
  { code: 'de', name: 'Deutsch',   flag: '🇩🇪', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe',    flag: '🇹🇷', dir: 'ltr' },
  { code: 'en', name: 'English',   flag: '🇬🇧', dir: 'ltr' },
  { code: 'ru', name: 'Русский',   flag: '🇷🇺', dir: 'ltr' },
  { code: 'fa', name: 'فارسی',     flag: '🇮🇷', dir: 'rtl' },
  { code: 'ar', name: 'العربية',   flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'Français',  flag: '🇫🇷', dir: 'ltr' },
  { code: 'es', name: 'Español',   flag: '🇪🇸', dir: 'ltr' },
  { code: 'it', name: 'Italiano',  flag: '🇮🇹', dir: 'ltr' },
  { code: 'pl', name: 'Polski',    flag: '🇵🇱', dir: 'ltr' },
];

export const translations = {
  de: {
    lang: { label: 'Sprache' },
    nav: {
      home: 'STARTSEITE', services: 'LEISTUNGEN', about: 'ÜBER UNS',
      process: 'ABLAUF', contact: 'KONTAKT', book: 'TERMIN VEREINBAREN',
      login: 'LOGIN', dashboard: 'DASHBOARD', logout: 'ABMELDEN',
    },
    topbar: {
      service: 'BUNDESWEITER SERVICE',
      recognized: 'ANERKANNT BEI ALLEN DEUTSCHEN WERKSTÄTTEN',
      emergency: '24/7 NOTFALL-SERVICE',
    },
    hero: {
      title: 'KFZ-GUTACHTER',
      subtitle: 'IHR PARTNER IM SCHADENFALL',
      description: 'Als unabhängiger Kfz-Gutachter stehe ich Ihnen mit fachkompetenter und persönlicher Beratung zur Seite. Ich erstelle schnelle, zuverlässige und rechtssichere Gutachten.',
      cta: 'JETZT TERMIN VEREINBAREN',
    },
    cta: {
      tagline: 'SCHNELL • UNABHÄNGIG • ZUVERLÄSSIG',
      location: 'Ihr Kfz-Gutachter in Aachen und Umgebung',
      call: 'JETZT ANRUFEN',
    },
    features: {
      heading_pre: 'UNSERE', heading_main: 'LEISTUNGEN',
      schaden: {
        title: 'SCHADENGUTACHTEN',
        desc: 'Detaillierte und unabhängige Gutachten nach einem Unfall zur Durchsetzung Ihrer Ansprüche gegenüber der Versicherung.',
        list: ['Unfallaufnahme und Analyse', 'Feststellung der Schadenhöhe', 'Reparaturweg und Wertminderung', 'Unterstützung bei der Schadenregulierung'],
      },
      kfz: {
        title: 'KFZ-GUTACHTEN',
        desc: 'Umfassende Gutachten für verschiedene Anlässe – unabhängig, neutral und rechtssicher.',
        list: ['Unfallgutachten', 'Beweissicherungsgutachten', 'Oldtimer-Gutachten', 'Sonstige Anlässe'],
      },
      wert: {
        title: 'WERTGUTACHTEN',
        desc: 'Ermittlung des aktuellen Marktwertes Ihres Fahrzeugs – z. B. für Verkauf, Versicherung oder Finanzierungszwecke.',
        list: ['Marktwertanalyse', 'Restwertermittlung', 'Wertgutachten für Klassiker und Sammlerfahrzeuge'],
      },
      kosten: {
        title: 'KOSTENVORANSCHLÄGE',
        desc: 'Erstellung von detaillierten Kostenvoranschlägen für Reparaturen – schnell, transparent und nachvollziehbar.',
        list: ['Reparaturkostenaufstellung', 'Teile- und Arbeitskosten', 'Grundlage für die Schadenregulierung'],
      },
      beratung: {
        title: 'ERSTE KUNDENBERATUNG',
        desc: 'Persönliche Beratung und erste Einschätzung – kompetent, unverbindlich und kostenlos.',
        list: ['Ersteinschätzung des Falls', 'Klärung Ihrer Fragen', 'Empfehlung des weiteren Vorgehens'],
      },
      leasing: {
        title: 'LEASINGRÜCKLÄUFER-CHECK',
        desc: 'Professionelle Prüfung Ihres Fahrzeugs zur Rückgabe – vermeiden Sie Nachzahlungen und Diskussionen.',
        list: ['Überprüfung auf Schäden und Mängel', 'Bewertung nach Leasingkriterien', 'Dokumentation mit Prüfbericht', 'Neutrale und faire Einschätzung'],
      },
    },
    about: {
      eyebrow: 'Verkehrsunfall?',
      heading_pre: 'So unterstützen wir Sie',
      heading_red: 'sicher und schnell',
      description: 'Nach einem Verkehrsunfall haben Sie das Recht, einen unabhängigen Sachverständigen zu beauftragen. Lassen Sie sich nicht von der Versicherung unter Druck setzen, deren Gutachter zu akzeptieren, denn diese arbeiten oft nicht in Ihrem besten Interesse. Vertrauen Sie auf unsere Expertise, um Ihre Ansprüche zu wahren.',
      points: [
        { title: 'Unabhängig & neutral', desc: 'Wir arbeiten ausschließlich in Ihrem Interesse — nicht im Auftrag der Versicherung.' },
        { title: 'Schnelle Terminvergabe', desc: 'Begutachtung meist innerhalb von 24 Stunden. Kein langes Warten, kein Druck.' },
        { title: 'Volle Ansprüche sichern', desc: 'Wir dokumentieren jeden Schaden lückenlos, damit Ihnen kein Cent verloren geht.' },
      ],
    },
    footer: {
      tagline: 'Ihr unabhängiger Partner für professionelle Kfz-Gutachten. Schnell, zuverlässig und immer in Ihrem Interesse. Wir setzen uns für Ihre Rechte ein.',
      cols: {
        services: 'Leistungen', company: 'Unternehmen', legal: 'Rechtliches',
      },
      copyright: '© 2024 KFZ-Gutachter Aachen. Alle Rechte vorbehalten.',
      built: 'Entwickelt mit',
    },
    common: {
      save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen', edit: 'Bearbeiten',
      new: 'Neu', add: 'Hinzufügen', ok: 'OK', search: 'Suchen', loading: 'Wird geladen...',
    },
  },

  tr: {
    lang: { label: 'Dil' },
    nav: {
      home: 'ANASAYFA', services: 'HİZMETLER', about: 'HAKKIMIZDA',
      process: 'SÜREÇ', contact: 'İLETİŞİM', book: 'TERMİN AL',
      login: 'GİRİŞ', dashboard: 'PANELE GİT', logout: 'ÇIKIŞ YAP',
    },
    topbar: {
      service: 'ÜLKE GENELİ HİZMET',
      recognized: 'TÜM ALMAN SERVİSLERİNDE GEÇERLİ',
      emergency: '7/24 ACİL DESTEK',
    },
    hero: {
      title: 'ARAÇ EKSPERİ',
      subtitle: 'KAZA SONRASI YANINIZDAYIZ',
      description: 'Bağımsız bir araç eksperi olarak uzman ve kişisel danışmanlıkla yanınızdayım. Hızlı, güvenilir ve hukuken sağlam ekspertiz raporları hazırlıyorum.',
      cta: 'HEMEN RANDEVU AL',
    },
    cta: {
      tagline: 'HIZLI • BAĞIMSIZ • GÜVENİLİR',
      location: 'Aachen ve çevresinde araç eksperiniz',
      call: 'HEMEN ARA',
    },
    features: {
      heading_pre: 'SUNDUĞUMUZ', heading_main: 'HİZMETLER',
      schaden: {
        title: 'KAZA EKSPERTİZİ',
        desc: 'Sigortaya karşı haklarınızı korumak için kaza sonrası ayrıntılı ve bağımsız ekspertiz raporları.',
        list: ['Kaza tespiti ve analizi', 'Hasar bedelinin belirlenmesi', 'Onarım yöntemi ve değer kaybı', 'Hasar tazminatında destek'],
      },
      kfz: {
        title: 'ARAÇ EKSPERTİZİ',
        desc: 'Farklı amaçlar için kapsamlı ekspertiz – bağımsız, tarafsız ve hukuken geçerli.',
        list: ['Kaza ekspertizi', 'Delil tespit raporu', 'Klasik araç ekspertizi', 'Diğer durumlar'],
      },
      wert: {
        title: 'DEĞER EKSPERTİZİ',
        desc: 'Aracınızın güncel piyasa değerinin belirlenmesi – satış, sigorta veya finansman amaçlı.',
        list: ['Piyasa değeri analizi', 'Hurda/kalan değer tespiti', 'Klasik ve koleksiyon araç değerlemesi'],
      },
      kosten: {
        title: 'MALİYET TAHMİNLERİ',
        desc: 'Onarım için detaylı maliyet tahmini – hızlı, şeffaf ve izlenebilir.',
        list: ['Onarım maliyet listesi', 'Parça ve işçilik maliyeti', 'Hasar tazminatı için temel'],
      },
      beratung: {
        title: 'İLK MÜŞTERİ DANIŞMANLIĞI',
        desc: 'Kişisel danışmanlık ve ilk değerlendirme – uzman, taahhütsüz ve ücretsiz.',
        list: ['Vakanın ilk değerlendirmesi', 'Sorularınızın yanıtlanması', 'İlerleme önerisi'],
      },
      leasing: {
        title: 'LEASING İADE KONTROLÜ',
        desc: 'Aracınızın iadesi öncesi profesyonel kontrol – ek ödeme ve tartışmalardan kaçının.',
        list: ['Hasar ve eksiklik kontrolü', 'Leasing kriterlerine göre değerlendirme', 'Kontrol raporlu belgeleme', 'Tarafsız ve adil değerlendirme'],
      },
    },
    about: {
      eyebrow: 'Trafik kazası mı geçirdiniz?',
      heading_pre: 'Size nasıl destek oluruz',
      heading_red: 'güvenli ve hızlı',
      description: 'Trafik kazası sonrası bağımsız bir bilirkişi atama hakkına sahipsiniz. Sigortanın eksperini kabul etmeniz için baskı yapmasına izin vermeyin; çünkü onlar genelde sizin değil sigortanın çıkarına çalışır. Haklarınızı korumak için uzmanlığımıza güvenin.',
      points: [
        { title: 'Bağımsız ve tarafsız', desc: 'Yalnızca sizin çıkarınız için çalışırız — sigorta için değil.' },
        { title: 'Hızlı randevu', desc: 'Genellikle 24 saat içinde ekspertiz. Uzun bekleme yok, baskı yok.' },
        { title: 'Tüm haklarınız güvende', desc: 'Her hasarı eksiksiz belgeliyoruz, bir kuruşunuz bile gitmesin.' },
      ],
    },
    footer: {
      tagline: 'Profesyonel araç ekspertizi için bağımsız ortağınız. Hızlı, güvenilir ve daima sizin çıkarınıza. Haklarınız için yanınızdayız.',
      cols: { services: 'Hizmetler', company: 'Kurumsal', legal: 'Yasal' },
      copyright: '© 2024 KFZ-Gutachter Aachen. Tüm hakları saklıdır.',
      built: 'Geliştirildi:',
    },
    common: {
      save: 'Kaydet', cancel: 'İptal', delete: 'Sil', edit: 'Düzenle',
      new: 'Yeni', add: 'Ekle', ok: 'Tamam', search: 'Ara', loading: 'Yükleniyor...',
    },
  },

  en: {
    lang: { label: 'Language' },
    nav: {
      home: 'HOME', services: 'SERVICES', about: 'ABOUT US',
      process: 'PROCESS', contact: 'CONTACT', book: 'BOOK APPOINTMENT',
      login: 'LOGIN', dashboard: 'DASHBOARD', logout: 'LOG OUT',
    },
    topbar: {
      service: 'NATIONWIDE SERVICE',
      recognized: 'ACCEPTED BY ALL GERMAN WORKSHOPS',
      emergency: '24/7 EMERGENCY SERVICE',
    },
    hero: {
      title: 'VEHICLE APPRAISER',
      subtitle: 'YOUR PARTNER WHEN DAMAGE STRIKES',
      description: 'As an independent vehicle appraiser, I support you with professional, personal advice. I deliver fast, reliable and legally sound expert reports.',
      cta: 'BOOK AN APPOINTMENT',
    },
    cta: {
      tagline: 'FAST • INDEPENDENT • RELIABLE',
      location: 'Your vehicle appraiser in Aachen and the surrounding area',
      call: 'CALL NOW',
    },
    features: {
      heading_pre: 'OUR', heading_main: 'SERVICES',
      schaden: {
        title: 'DAMAGE REPORTS',
        desc: 'Detailed and independent reports after an accident to enforce your claims against the insurer.',
        list: ['Accident assessment and analysis', 'Determination of damage amount', 'Repair path and depreciation', 'Support during claim settlement'],
      },
      kfz: {
        title: 'VEHICLE REPORTS',
        desc: 'Comprehensive reports for various occasions — independent, neutral and legally sound.',
        list: ['Accident reports', 'Evidence reports', 'Classic car reports', 'Other occasions'],
      },
      wert: {
        title: 'VALUATION REPORTS',
        desc: 'Determination of the current market value of your vehicle — for sale, insurance or financing.',
        list: ['Market value analysis', 'Residual value calculation', 'Reports for classic and collector vehicles'],
      },
      kosten: {
        title: 'COST ESTIMATES',
        desc: 'Detailed repair cost estimates — fast, transparent and traceable.',
        list: ['Repair cost breakdown', 'Parts and labor costs', 'Basis for claim settlement'],
      },
      beratung: {
        title: 'INITIAL CONSULTATION',
        desc: 'Personal consultation and initial assessment — competent, non-binding and free of charge.',
        list: ['Initial case assessment', 'Answers to your questions', 'Recommendation on next steps'],
      },
      leasing: {
        title: 'LEASE-RETURN CHECK',
        desc: 'Professional inspection of your vehicle prior to return — avoid extra charges and disputes.',
        list: ['Inspection for damage and defects', 'Evaluation against lease criteria', 'Documentation with inspection report', 'Neutral and fair assessment'],
      },
    },
    about: {
      eyebrow: 'Had a traffic accident?',
      heading_pre: 'How we support you',
      heading_red: 'safely and quickly',
      description: 'After a traffic accident, you have the right to engage an independent expert. Do not let the insurer pressure you into accepting their appraiser — they often do not act in your best interest. Trust our expertise to safeguard your claims.',
      points: [
        { title: 'Independent & neutral', desc: 'We work exclusively in your interest — never on behalf of the insurer.' },
        { title: 'Fast scheduling', desc: 'Inspection usually within 24 hours. No long waits, no pressure.' },
        { title: 'Full claims secured', desc: 'We document every damage thoroughly so you do not lose a single cent.' },
      ],
    },
    footer: {
      tagline: 'Your independent partner for professional vehicle reports. Fast, reliable and always in your interest. We stand up for your rights.',
      cols: { services: 'Services', company: 'Company', legal: 'Legal' },
      copyright: '© 2024 KFZ-Gutachter Aachen. All rights reserved.',
      built: 'Built with',
    },
    common: {
      save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit',
      new: 'New', add: 'Add', ok: 'OK', search: 'Search', loading: 'Loading...',
    },
  },

  ru: {
    lang: { label: 'Язык' },
    nav: {
      home: 'ГЛАВНАЯ', services: 'УСЛУГИ', about: 'О НАС',
      process: 'ПРОЦЕСС', contact: 'КОНТАКТЫ', book: 'ЗАПИСАТЬСЯ',
      login: 'ВХОД', dashboard: 'КАБИНЕТ', logout: 'ВЫЙТИ',
    },
    topbar: {
      service: 'СЕРВИС ПО ВСЕЙ СТРАНЕ',
      recognized: 'ПРИНИМАЕТСЯ ВСЕМИ НЕМЕЦКИМИ СТО',
      emergency: 'СРОЧНЫЙ СЕРВИС 24/7',
    },
    hero: {
      title: 'АВТОЭКСПЕРТ',
      subtitle: 'ВАШ ПАРТНЁР ПРИ УЩЕРБЕ',
      description: 'Как независимый автоэксперт я оказываю вам профессиональную и индивидуальную поддержку. Готовлю быстрые, надёжные и юридически безупречные экспертные заключения.',
      cta: 'ЗАПИСАТЬСЯ СЕЙЧАС',
    },
    cta: {
      tagline: 'БЫСТРО • НЕЗАВИСИМО • НАДЁЖНО',
      location: 'Ваш автоэксперт в Аахене и окрестностях',
      call: 'ПОЗВОНИТЬ',
    },
    features: {
      heading_pre: 'НАШИ', heading_main: 'УСЛУГИ',
      schaden: {
        title: 'ЭКСПЕРТИЗА УЩЕРБА',
        desc: 'Подробные и независимые заключения после ДТП для защиты ваших прав перед страховой компанией.',
        list: ['Фиксация и анализ ДТП', 'Определение размера ущерба', 'Способ ремонта и потеря стоимости', 'Поддержка при урегулировании убытка'],
      },
      kfz: {
        title: 'АВТОМОБИЛЬНЫЕ ЗАКЛЮЧЕНИЯ',
        desc: 'Комплексные заключения для разных случаев — независимо, нейтрально и юридически грамотно.',
        list: ['Заключение по ДТП', 'Заключение по фиксации улик', 'Заключение по олдтаймерам', 'Иные случаи'],
      },
      wert: {
        title: 'ОЦЕНКА СТОИМОСТИ',
        desc: 'Определение текущей рыночной стоимости вашего автомобиля — для продажи, страховки или кредита.',
        list: ['Анализ рыночной стоимости', 'Оценка остаточной стоимости', 'Оценка классических и коллекционных авто'],
      },
      kosten: {
        title: 'СМЕТЫ РАСХОДОВ',
        desc: 'Подробные сметы расходов на ремонт — быстро, прозрачно и проверяемо.',
        list: ['Калькуляция расходов на ремонт', 'Стоимость деталей и работы', 'Основа для урегулирования убытка'],
      },
      beratung: {
        title: 'ПЕРВАЯ КОНСУЛЬТАЦИЯ',
        desc: 'Личная консультация и первичная оценка — компетентно, без обязательств и бесплатно.',
        list: ['Первичная оценка случая', 'Ответы на ваши вопросы', 'Рекомендация по дальнейшим шагам'],
      },
      leasing: {
        title: 'ПРОВЕРКА ПРИ ВОЗВРАТЕ ЛИЗИНГА',
        desc: 'Профессиональная проверка автомобиля перед возвратом — избегите доплат и споров.',
        list: ['Проверка повреждений и дефектов', 'Оценка по лизинговым критериям', 'Документация с актом проверки', 'Нейтральная и честная оценка'],
      },
    },
    about: {
      eyebrow: 'Попали в ДТП?',
      heading_pre: 'Как мы вам поможем',
      heading_red: 'безопасно и быстро',
      description: 'После ДТП у вас есть право привлечь независимого эксперта. Не позволяйте страховой давить и навязывать своего эксперта — он часто работает не в ваших интересах. Доверьте нам защиту ваших прав.',
      points: [
        { title: 'Независимо и нейтрально', desc: 'Мы работаем исключительно в ваших интересах, а не страховой.' },
        { title: 'Быстрая запись', desc: 'Обычно осмотр в течение 24 часов. Без долгого ожидания и давления.' },
        { title: 'Полные права сохранены', desc: 'Мы фиксируем каждое повреждение полностью, чтобы вы не потеряли ни цента.' },
      ],
    },
    footer: {
      tagline: 'Ваш независимый партнёр по профессиональной автоэкспертизе. Быстро, надёжно и всегда в ваших интересах. Мы защищаем ваши права.',
      cols: { services: 'Услуги', company: 'Компания', legal: 'Правовая информация' },
      copyright: '© 2024 KFZ-Gutachter Aachen. Все права защищены.',
      built: 'Сделано с',
    },
    common: {
      save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Изменить',
      new: 'Новый', add: 'Добавить', ok: 'OK', search: 'Поиск', loading: 'Загрузка...',
    },
  },

  fa: {
    lang: { label: 'زبان' },
    nav: {
      home: 'صفحه اصلی', services: 'خدمات', about: 'درباره ما',
      process: 'فرآیند', contact: 'تماس', book: 'رزرو وقت',
      login: 'ورود', dashboard: 'داشبورد', logout: 'خروج',
    },
    topbar: {
      service: 'خدمات سراسری',
      recognized: 'مورد قبول تمام تعمیرگاه‌های آلمان',
      emergency: 'خدمات اضطراری ۲۴ ساعته',
    },
    hero: {
      title: 'کارشناس خودرو',
      subtitle: 'همراه شما در زمان حادثه',
      description: 'به عنوان کارشناس مستقل خودرو، با مشاوره تخصصی و شخصی در کنار شما هستم. گزارش‌های کارشناسی سریع، دقیق و معتبر قانونی ارائه می‌دهم.',
      cta: 'همین حالا وقت بگیرید',
    },
    cta: {
      tagline: 'سریع • مستقل • قابل اعتماد',
      location: 'کارشناس خودروی شما در آخن و اطراف آن',
      call: 'تماس فوری',
    },
    features: {
      heading_pre: 'خدمات', heading_main: 'ما',
      schaden: {
        title: 'گزارش خسارت',
        desc: 'گزارش‌های دقیق و مستقل پس از تصادف برای پیگیری حقوق شما در برابر بیمه.',
        list: ['ثبت و تحلیل تصادف', 'تعیین میزان خسارت', 'روش تعمیر و افت ارزش', 'پشتیبانی در تسویه خسارت'],
      },
      kfz: {
        title: 'گزارش کارشناسی خودرو',
        desc: 'گزارش‌های جامع برای موارد گوناگون — مستقل، بی‌طرف و معتبر قانونی.',
        list: ['گزارش تصادف', 'گزارش حفظ مدرک', 'گزارش خودروهای کلاسیک', 'موارد دیگر'],
      },
      wert: {
        title: 'گزارش ارزش‌گذاری',
        desc: 'تعیین ارزش روز خودرو شما — برای فروش، بیمه یا تأمین مالی.',
        list: ['تحلیل ارزش بازار', 'محاسبه ارزش باقی‌مانده', 'ارزیابی خودروهای کلاسیک و کلکسیونی'],
      },
      kosten: {
        title: 'برآورد هزینه',
        desc: 'برآورد دقیق هزینه تعمیرات — سریع، شفاف و قابل پیگیری.',
        list: ['ریز هزینه تعمیرات', 'هزینه قطعات و دستمزد', 'پایه‌ای برای تسویه خسارت'],
      },
      beratung: {
        title: 'مشاوره اولیه',
        desc: 'مشاوره شخصی و ارزیابی اولیه — تخصصی، بدون تعهد و رایگان.',
        list: ['ارزیابی اولیه پرونده', 'پاسخ به پرسش‌های شما', 'پیشنهاد گام‌های بعدی'],
      },
      leasing: {
        title: 'بررسی بازگشت لیزینگ',
        desc: 'بررسی حرفه‌ای خودرو قبل از تحویل — از پرداخت‌های اضافی و اختلاف جلوگیری کنید.',
        list: ['بررسی آسیب‌ها و نواقص', 'ارزیابی بر اساس معیارهای لیزینگ', 'مستندسازی با گزارش بازرسی', 'ارزیابی بی‌طرفانه و منصفانه'],
      },
    },
    about: {
      eyebrow: 'تصادف کرده‌اید؟',
      heading_pre: 'ما چگونه به شما کمک می‌کنیم',
      heading_red: 'ایمن و سریع',
      description: 'پس از تصادف، حق دارید کارشناس مستقل بگیرید. اجازه ندهید بیمه شما را برای پذیرش کارشناس خود تحت فشار قرار دهد؛ آن‌ها معمولاً به نفع شما کار نمی‌کنند. برای حفظ حقوق خود به تخصص ما اعتماد کنید.',
      points: [
        { title: 'مستقل و بی‌طرف', desc: 'فقط به نفع شما کار می‌کنیم — نه به نمایندگی از بیمه.' },
        { title: 'وقت‌دهی سریع', desc: 'کارشناسی معمولاً ظرف ۲۴ ساعت. بدون انتظار طولانی و فشار.' },
        { title: 'حفظ کامل حقوق', desc: 'هر آسیب را کامل مستند می‌کنیم تا حتی یک سنت از دست ندهید.' },
      ],
    },
    footer: {
      tagline: 'شریک مستقل شما برای کارشناسی حرفه‌ای خودرو. سریع، قابل اعتماد و همیشه به نفع شما. ما برای حقوق شما می‌ایستیم.',
      cols: { services: 'خدمات', company: 'شرکت', legal: 'حقوقی' },
      copyright: '© ۲۰۲۴ KFZ-Gutachter Aachen. تمامی حقوق محفوظ است.',
      built: 'ساخته شده با',
    },
    common: {
      save: 'ذخیره', cancel: 'لغو', delete: 'حذف', edit: 'ویرایش',
      new: 'جدید', add: 'افزودن', ok: 'تأیید', search: 'جستجو', loading: 'در حال بارگذاری...',
    },
  },

  ar: {
    lang: { label: 'اللغة' },
    nav: {
      home: 'الرئيسية', services: 'الخدمات', about: 'من نحن',
      process: 'سير العمل', contact: 'اتصل بنا', book: 'احجز موعداً',
      login: 'تسجيل الدخول', dashboard: 'لوحة التحكم', logout: 'تسجيل الخروج',
    },
    topbar: {
      service: 'خدمة على مستوى البلاد',
      recognized: 'معتمد لدى جميع الورش الألمانية',
      emergency: 'خدمة طوارئ ٢٤/٧',
    },
    hero: {
      title: 'خبير السيارات',
      subtitle: 'شريكك في حالة الضرر',
      description: 'بصفتي خبير سيارات مستقل، أقف إلى جانبك بالاستشارة المهنية والشخصية. أُعدّ تقارير خبرة سريعة وموثوقة وآمنة قانونياً.',
      cta: 'احجز موعداً الآن',
    },
    cta: {
      tagline: 'سريع • مستقل • موثوق',
      location: 'خبير سيارتك في آخن وما حولها',
      call: 'اتصل الآن',
    },
    features: {
      heading_pre: 'خدماتنا', heading_main: '',
      schaden: {
        title: 'تقارير الأضرار',
        desc: 'تقارير مفصلة ومستقلة بعد الحادث لإثبات حقوقك أمام شركة التأمين.',
        list: ['تسجيل الحادث وتحليله', 'تحديد حجم الضرر', 'طريق الإصلاح وانخفاض القيمة', 'الدعم في تسوية المطالبات'],
      },
      kfz: {
        title: 'تقارير المركبات',
        desc: 'تقارير شاملة لمناسبات متعددة — مستقلة ومحايدة وقانونية.',
        list: ['تقارير الحوادث', 'تقارير حفظ الأدلة', 'تقارير السيارات الكلاسيكية', 'مناسبات أخرى'],
      },
      wert: {
        title: 'تقارير القيمة',
        desc: 'تحديد القيمة السوقية الحالية لسيارتك — للبيع أو التأمين أو التمويل.',
        list: ['تحليل القيمة السوقية', 'حساب القيمة المتبقية', 'تقييم السيارات الكلاسيكية والمقتنيات'],
      },
      kosten: {
        title: 'تقديرات التكاليف',
        desc: 'تقديرات تفصيلية لتكاليف الإصلاح — سريعة وشفافة وقابلة للتتبع.',
        list: ['كشف تكاليف الإصلاح', 'تكاليف القطع واليد العاملة', 'أساس لتسوية المطالبات'],
      },
      beratung: {
        title: 'الاستشارة الأولى',
        desc: 'استشارة شخصية وتقييم مبدئي — احترافية وغير ملزمة ومجانية.',
        list: ['تقييم أولي للقضية', 'الإجابة على أسئلتك', 'توصية بالخطوات القادمة'],
      },
      leasing: {
        title: 'فحص إعادة التأجير',
        desc: 'فحص احترافي لسيارتك قبل التسليم — تجنب الرسوم الإضافية والجدالات.',
        list: ['فحص الأضرار والعيوب', 'التقييم وفق معايير التأجير', 'توثيق بتقرير الفحص', 'تقييم محايد وعادل'],
      },
    },
    about: {
      eyebrow: 'هل تعرضت لحادث مرور؟',
      heading_pre: 'كيف ندعمك',
      heading_red: 'بأمان وسرعة',
      description: 'بعد حادث المرور، يحق لك الاستعانة بخبير مستقل. لا تدع شركة التأمين تضغط عليك لقبول خبيرها؛ فغالباً ما لا يعملون لمصلحتك. ثق بخبرتنا للحفاظ على حقوقك.',
      points: [
        { title: 'مستقل ومحايد', desc: 'نعمل حصرياً لمصلحتك — وليس نيابةً عن شركة التأمين.' },
        { title: 'حجز سريع للموعد', desc: 'الفحص عادةً خلال ٢٤ ساعة. بلا انتظار طويل ولا ضغط.' },
        { title: 'حقوقك كاملة', desc: 'نوثّق كل ضرر بدقة كي لا تفقد قرشاً واحداً.' },
      ],
    },
    footer: {
      tagline: 'شريكك المستقل لخبرة سيارات احترافية. سريعون وموثوقون ودائماً في صفك. ندافع عن حقوقك.',
      cols: { services: 'الخدمات', company: 'الشركة', legal: 'الأحكام القانونية' },
      copyright: '© ٢٠٢٤ KFZ-Gutachter Aachen. جميع الحقوق محفوظة.',
      built: 'تم تطويره بـ',
    },
    common: {
      save: 'حفظ', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل',
      new: 'جديد', add: 'إضافة', ok: 'موافق', search: 'بحث', loading: 'جارٍ التحميل...',
    },
  },

  fr: {
    lang: { label: 'Langue' },
    nav: {
      home: 'ACCUEIL', services: 'SERVICES', about: 'À PROPOS',
      process: 'PROCESSUS', contact: 'CONTACT', book: 'PRENDRE RDV',
      login: 'CONNEXION', dashboard: 'TABLEAU DE BORD', logout: 'DÉCONNEXION',
    },
    topbar: {
      service: 'SERVICE NATIONAL',
      recognized: 'RECONNU PAR TOUS LES GARAGES ALLEMANDS',
      emergency: 'URGENCE 24/7',
    },
    hero: {
      title: 'EXPERT AUTOMOBILE',
      subtitle: 'VOTRE PARTENAIRE EN CAS DE SINISTRE',
      description: 'En tant qu’expert automobile indépendant, je vous accompagne par des conseils professionnels et personnalisés. Je rédige des rapports rapides, fiables et juridiquement sûrs.',
      cta: 'PRENDRE RENDEZ-VOUS',
    },
    cta: {
      tagline: 'RAPIDE • INDÉPENDANT • FIABLE',
      location: 'Votre expert automobile à Aix-la-Chapelle et environs',
      call: 'APPELER',
    },
    features: {
      heading_pre: 'NOS', heading_main: 'SERVICES',
      schaden: {
        title: 'EXPERTISE DE SINISTRE',
        desc: 'Rapports détaillés et indépendants après un accident pour faire valoir vos droits face à l’assureur.',
        list: ['Constat et analyse de l’accident', 'Détermination du montant du dommage', 'Voie de réparation et dépréciation', 'Soutien lors du règlement du sinistre'],
      },
      kfz: {
        title: 'EXPERTISE VÉHICULE',
        desc: 'Rapports complets pour différentes situations — indépendants, neutres et juridiquement valables.',
        list: ['Expertise d’accident', 'Constat de preuve', 'Expertise de voiture ancienne', 'Autres cas'],
      },
      wert: {
        title: 'EXPERTISE DE VALEUR',
        desc: 'Détermination de la valeur marchande actuelle de votre véhicule — vente, assurance ou financement.',
        list: ['Analyse de la valeur marchande', 'Calcul de la valeur résiduelle', 'Expertise pour véhicules de collection'],
      },
      kosten: {
        title: 'DEVIS DÉTAILLÉS',
        desc: 'Établissement de devis détaillés pour les réparations — rapide, transparent et traçable.',
        list: ['Détail des coûts de réparation', 'Pièces et main-d’œuvre', 'Base pour le règlement du sinistre'],
      },
      beratung: {
        title: 'PREMIER CONSEIL CLIENT',
        desc: 'Conseil personnel et première évaluation — compétent, sans engagement et gratuit.',
        list: ['Première évaluation du dossier', 'Réponses à vos questions', 'Recommandation des prochaines étapes'],
      },
      leasing: {
        title: 'CONTRÔLE FIN DE LEASING',
        desc: 'Inspection professionnelle avant la restitution — évitez surcoûts et discussions.',
        list: ['Vérification des dommages et défauts', 'Évaluation selon les critères de leasing', 'Documentation avec rapport d’inspection', 'Évaluation neutre et équitable'],
      },
    },
    about: {
      eyebrow: 'Accident de la route ?',
      heading_pre: 'Comment nous vous aidons',
      heading_red: 'en toute sécurité et rapidement',
      description: 'Après un accident, vous avez le droit de faire appel à un expert indépendant. Ne laissez pas l’assureur vous imposer son expert — il ne travaille souvent pas dans votre intérêt. Faites confiance à notre expertise pour protéger vos droits.',
      points: [
        { title: 'Indépendant et neutre', desc: 'Nous travaillons exclusivement dans votre intérêt — jamais pour l’assureur.' },
        { title: 'Prise de rendez-vous rapide', desc: 'Expertise généralement sous 24 heures. Pas de longue attente, pas de pression.' },
        { title: 'Droits protégés intégralement', desc: 'Nous documentons chaque dommage pour que vous ne perdiez pas un centime.' },
      ],
    },
    footer: {
      tagline: 'Votre partenaire indépendant pour des expertises automobiles professionnelles. Rapide, fiable et toujours dans votre intérêt. Nous défendons vos droits.',
      cols: { services: 'Services', company: 'Entreprise', legal: 'Mentions légales' },
      copyright: '© 2024 KFZ-Gutachter Aachen. Tous droits réservés.',
      built: 'Conçu avec',
    },
    common: {
      save: 'Enregistrer', cancel: 'Annuler', delete: 'Supprimer', edit: 'Modifier',
      new: 'Nouveau', add: 'Ajouter', ok: 'OK', search: 'Rechercher', loading: 'Chargement...',
    },
  },

  es: {
    lang: { label: 'Idioma' },
    nav: {
      home: 'INICIO', services: 'SERVICIOS', about: 'SOBRE NOSOTROS',
      process: 'PROCESO', contact: 'CONTACTO', book: 'RESERVAR CITA',
      login: 'ACCESO', dashboard: 'PANEL', logout: 'CERRAR SESIÓN',
    },
    topbar: {
      service: 'SERVICIO NACIONAL',
      recognized: 'RECONOCIDO POR TODOS LOS TALLERES ALEMANES',
      emergency: 'EMERGENCIA 24/7',
    },
    hero: {
      title: 'PERITO DE AUTOMÓVILES',
      subtitle: 'SU SOCIO ANTE UN SINIESTRO',
      description: 'Como perito independiente, le acompaño con asesoramiento profesional y personalizado. Elaboro informes rápidos, fiables y jurídicamente sólidos.',
      cta: 'RESERVE SU CITA',
    },
    cta: {
      tagline: 'RÁPIDO • INDEPENDIENTE • FIABLE',
      location: 'Su perito de automóviles en Aquisgrán y alrededores',
      call: 'LLAMAR AHORA',
    },
    features: {
      heading_pre: 'NUESTROS', heading_main: 'SERVICIOS',
      schaden: {
        title: 'PERITAJE DE DAÑOS',
        desc: 'Informes detallados e independientes tras un accidente para hacer valer sus derechos frente a la aseguradora.',
        list: ['Toma y análisis del accidente', 'Determinación del importe del daño', 'Vía de reparación y depreciación', 'Apoyo en la liquidación del siniestro'],
      },
      kfz: {
        title: 'PERITAJE DE VEHÍCULO',
        desc: 'Informes completos para distintas situaciones — independientes, neutrales y jurídicamente válidos.',
        list: ['Peritaje de accidente', 'Acta de aseguramiento de pruebas', 'Peritaje de coches clásicos', 'Otros casos'],
      },
      wert: {
        title: 'PERITAJE DE VALOR',
        desc: 'Determinación del valor de mercado actual de su vehículo — venta, seguro o financiación.',
        list: ['Análisis del valor de mercado', 'Cálculo del valor residual', 'Peritaje de clásicos y coleccionismo'],
      },
      kosten: {
        title: 'PRESUPUESTOS',
        desc: 'Presupuestos detallados de reparación — rápidos, transparentes y trazables.',
        list: ['Desglose de costes de reparación', 'Piezas y mano de obra', 'Base para la liquidación del siniestro'],
      },
      beratung: {
        title: 'PRIMERA CONSULTA',
        desc: 'Asesoramiento personal y evaluación inicial — competente, sin compromiso y gratuita.',
        list: ['Evaluación inicial del caso', 'Respuesta a sus preguntas', 'Recomendación de próximos pasos'],
      },
      leasing: {
        title: 'INSPECCIÓN FIN DE LEASING',
        desc: 'Inspección profesional antes de la devolución — evite cargos y discusiones.',
        list: ['Revisión de daños y defectos', 'Evaluación según criterios de leasing', 'Documentación con informe', 'Evaluación neutral y justa'],
      },
    },
    about: {
      eyebrow: '¿Sufrió un accidente?',
      heading_pre: 'Cómo le ayudamos',
      heading_red: 'con seguridad y rapidez',
      description: 'Tras un accidente tiene derecho a contratar un perito independiente. No deje que la aseguradora le presione para aceptar al suyo — no suelen trabajar en su interés. Confíe en nuestra experiencia para proteger sus derechos.',
      points: [
        { title: 'Independiente y neutral', desc: 'Trabajamos exclusivamente en su interés, nunca para la aseguradora.' },
        { title: 'Cita rápida', desc: 'Peritación normalmente en 24 horas. Sin esperas ni presiones.' },
        { title: 'Derechos plenos asegurados', desc: 'Documentamos cada daño con rigor para que no pierda ni un céntimo.' },
      ],
    },
    footer: {
      tagline: 'Su socio independiente para peritajes profesionales. Rápido, fiable y siempre en su interés. Defendemos sus derechos.',
      cols: { services: 'Servicios', company: 'Empresa', legal: 'Legal' },
      copyright: '© 2024 KFZ-Gutachter Aachen. Todos los derechos reservados.',
      built: 'Hecho con',
    },
    common: {
      save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar', edit: 'Editar',
      new: 'Nuevo', add: 'Añadir', ok: 'OK', search: 'Buscar', loading: 'Cargando...',
    },
  },

  it: {
    lang: { label: 'Lingua' },
    nav: {
      home: 'HOME', services: 'SERVIZI', about: 'CHI SIAMO',
      process: 'PROCESSO', contact: 'CONTATTI', book: 'PRENOTA',
      login: 'ACCEDI', dashboard: 'PANNELLO', logout: 'ESCI',
    },
    topbar: {
      service: 'SERVIZIO NAZIONALE',
      recognized: 'RICONOSCIUTO DA TUTTE LE OFFICINE TEDESCHE',
      emergency: 'EMERGENZA 24/7',
    },
    hero: {
      title: 'PERITO AUTOMOBILISTICO',
      subtitle: 'IL VOSTRO PARTNER IN CASO DI DANNO',
      description: 'Come perito automobilistico indipendente, vi assisto con consulenza professionale e personale. Realizzo perizie rapide, affidabili e giuridicamente solide.',
      cta: 'PRENOTA UN APPUNTAMENTO',
    },
    cta: {
      tagline: 'RAPIDO • INDIPENDENTE • AFFIDABILE',
      location: 'Il vostro perito ad Aquisgrana e dintorni',
      call: 'CHIAMA ORA',
    },
    features: {
      heading_pre: 'I NOSTRI', heading_main: 'SERVIZI',
      schaden: {
        title: 'PERIZIA DEL DANNO',
        desc: 'Perizie dettagliate e indipendenti dopo un incidente per far valere i vostri diritti verso l’assicurazione.',
        list: ['Rilievo e analisi del sinistro', 'Determinazione dell’importo del danno', 'Modalità di riparazione e svalutazione', 'Supporto nella liquidazione'],
      },
      kfz: {
        title: 'PERIZIA AUTO',
        desc: 'Perizie complete per varie occasioni — indipendenti, neutrali e giuridicamente valide.',
        list: ['Perizia d’incidente', 'Verbale probatorio', 'Perizia auto d’epoca', 'Altri casi'],
      },
      wert: {
        title: 'PERIZIA DI VALORE',
        desc: 'Determinazione del valore di mercato attuale del veicolo — vendita, assicurazione o finanziamento.',
        list: ['Analisi del valore di mercato', 'Calcolo del valore residuo', 'Perizia auto d’epoca e da collezione'],
      },
      kosten: {
        title: 'PREVENTIVI',
        desc: 'Preventivi dettagliati per le riparazioni — rapidi, trasparenti e tracciabili.',
        list: ['Dettaglio costi riparazione', 'Pezzi e manodopera', 'Base per la liquidazione del sinistro'],
      },
      beratung: {
        title: 'PRIMA CONSULENZA',
        desc: 'Consulenza personale e valutazione iniziale — competente, senza impegno e gratuita.',
        list: ['Valutazione iniziale del caso', 'Risposta alle vostre domande', 'Raccomandazione dei prossimi passi'],
      },
      leasing: {
        title: 'CONTROLLO FINE LEASING',
        desc: 'Ispezione professionale prima della restituzione — evitate costi e contestazioni.',
        list: ['Verifica danni e difetti', 'Valutazione secondo criteri di leasing', 'Documentazione con rapporto', 'Valutazione neutra ed equa'],
      },
    },
    about: {
      eyebrow: 'Avete avuto un incidente?',
      heading_pre: 'Come vi sosteniamo',
      heading_red: 'in sicurezza e velocemente',
      description: 'Dopo un incidente avete il diritto di nominare un perito indipendente. Non lasciate che l’assicurazione vi imponga il suo perito — spesso non lavora nel vostro interesse. Affidatevi alla nostra esperienza per tutelare i vostri diritti.',
      points: [
        { title: 'Indipendente e neutrale', desc: 'Lavoriamo esclusivamente nel vostro interesse, mai per l’assicurazione.' },
        { title: 'Appuntamento rapido', desc: 'Perizia di solito entro 24 ore. Nessuna attesa, nessuna pressione.' },
        { title: 'Diritti pienamente tutelati', desc: 'Documentiamo ogni danno con cura affinché non perdiate un centesimo.' },
      ],
    },
    footer: {
      tagline: 'Il vostro partner indipendente per perizie auto professionali. Rapidi, affidabili e sempre dalla vostra parte. Tuteliamo i vostri diritti.',
      cols: { services: 'Servizi', company: 'Azienda', legal: 'Note legali' },
      copyright: '© 2024 KFZ-Gutachter Aachen. Tutti i diritti riservati.',
      built: 'Realizzato con',
    },
    common: {
      save: 'Salva', cancel: 'Annulla', delete: 'Elimina', edit: 'Modifica',
      new: 'Nuovo', add: 'Aggiungi', ok: 'OK', search: 'Cerca', loading: 'Caricamento...',
    },
  },

  pl: {
    lang: { label: 'Język' },
    nav: {
      home: 'STRONA GŁÓWNA', services: 'USŁUGI', about: 'O NAS',
      process: 'PROCES', contact: 'KONTAKT', book: 'UMÓW WIZYTĘ',
      login: 'LOGOWANIE', dashboard: 'PANEL', logout: 'WYLOGUJ',
    },
    topbar: {
      service: 'SERWIS OGÓLNOKRAJOWY',
      recognized: 'UZNAWANY W KAŻDYM WARSZTACIE W NIEMCZECH',
      emergency: 'POMOC 24/7',
    },
    hero: {
      title: 'RZECZOZNAWCA SAMOCHODOWY',
      subtitle: 'TWÓJ PARTNER PO SZKODZIE',
      description: 'Jako niezależny rzeczoznawca samochodowy oferuję profesjonalne i indywidualne doradztwo. Sporządzam szybkie, rzetelne i pewne prawnie ekspertyzy.',
      cta: 'UMÓW SIĘ TERAZ',
    },
    cta: {
      tagline: 'SZYBKO • NIEZALEŻNIE • RZETELNIE',
      location: 'Twój rzeczoznawca w Akwizgranie i okolicach',
      call: 'ZADZWOŃ',
    },
    features: {
      heading_pre: 'NASZE', heading_main: 'USŁUGI',
      schaden: {
        title: 'EKSPERTYZA SZKODY',
        desc: 'Szczegółowe i niezależne ekspertyzy po wypadku, aby wyegzekwować Twoje roszczenia od ubezpieczyciela.',
        list: ['Rejestracja i analiza wypadku', 'Ustalenie wysokości szkody', 'Sposób naprawy i utrata wartości', 'Wsparcie przy likwidacji szkody'],
      },
      kfz: {
        title: 'EKSPERTYZA POJAZDU',
        desc: 'Kompleksowe ekspertyzy w różnych sytuacjach — niezależne, bezstronne i pewne prawnie.',
        list: ['Ekspertyza powypadkowa', 'Zabezpieczenie dowodów', 'Ekspertyza youngtimerów', 'Inne sytuacje'],
      },
      wert: {
        title: 'WYCENA WARTOŚCI',
        desc: 'Ustalenie aktualnej wartości rynkowej pojazdu — do sprzedaży, ubezpieczenia lub finansowania.',
        list: ['Analiza wartości rynkowej', 'Wartość pozostała', 'Wycena klasyków i kolekcji'],
      },
      kosten: {
        title: 'KOSZTORYSY',
        desc: 'Szczegółowe kosztorysy napraw — szybko, przejrzyście i sprawdzalnie.',
        list: ['Wyliczenie kosztów naprawy', 'Części i robocizna', 'Podstawa do likwidacji szkody'],
      },
      beratung: {
        title: 'PIERWSZA KONSULTACJA',
        desc: 'Osobista konsultacja i wstępna ocena — fachowa, niezobowiązująca i bezpłatna.',
        list: ['Wstępna ocena sprawy', 'Odpowiedzi na pytania', 'Rekomendacja kolejnych kroków'],
      },
      leasing: {
        title: 'KONTROLA POLEASINGOWA',
        desc: 'Profesjonalna kontrola pojazdu przed zwrotem — unikniesz dopłat i sporów.',
        list: ['Kontrola uszkodzeń i wad', 'Ocena wg kryteriów leasingu', 'Dokumentacja z protokołem', 'Bezstronna i sprawiedliwa ocena'],
      },
    },
    about: {
      eyebrow: 'Miałeś wypadek?',
      heading_pre: 'Jak Cię wspieramy',
      heading_red: 'bezpiecznie i szybko',
      description: 'Po wypadku masz prawo powołać niezależnego rzeczoznawcę. Nie pozwól, by ubezpieczyciel narzucił Ci swojego — często nie działa on w Twoim interesie. Zaufaj naszej wiedzy, by ochronić swoje prawa.',
      points: [
        { title: 'Niezależnie i bezstronnie', desc: 'Działamy wyłącznie w Twoim interesie — nie ubezpieczyciela.' },
        { title: 'Szybki termin', desc: 'Oględziny zwykle w ciągu 24 godzin. Bez kolejek i presji.' },
        { title: 'Pełne roszczenia', desc: 'Dokumentujemy każdą szkodę dokładnie, byś nie stracił ani grosza.' },
      ],
    },
    footer: {
      tagline: 'Twój niezależny partner w profesjonalnych ekspertyzach pojazdów. Szybko, rzetelnie i zawsze w Twoim interesie. Stoimy na straży Twoich praw.',
      cols: { services: 'Usługi', company: 'Firma', legal: 'Informacje prawne' },
      copyright: '© 2024 KFZ-Gutachter Aachen. Wszelkie prawa zastrzeżone.',
      built: 'Zbudowane z',
    },
    common: {
      save: 'Zapisz', cancel: 'Anuluj', delete: 'Usuń', edit: 'Edytuj',
      new: 'Nowy', add: 'Dodaj', ok: 'OK', search: 'Szukaj', loading: 'Ładowanie...',
    },
  },
};
