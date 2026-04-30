import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText, ScaleIcon as Scale, PhoneIcon as Phone, MailIcon as Mail, MapPin } from '../components/icons.jsx';

export const SubPageLayout = ({ title, children, onBack }) => (
  <div className="min-h-screen bg-white pt-32 pb-20 px-6">
    <div className="mx-auto max-w-4xl">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-[#E30613] transition-colors mb-12 group"
      >
        <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
        <span>Zurück zur Startseite</span>
      </button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0A0A0A] mb-12">
          {title}
        </h1>
        <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
          {children}
        </div>
      </motion.div>
    </div>
  </div>
);

export const Impressum = () => (
  <div className="space-y-8">
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">Angaben gemäß § 5 TMG</h2>
      <p>
        Gecit Kfz Sachverständiger<br />
        Am Gutshof 37<br />
        52080 Aachen
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">Kontakt</h2>
      <p>
        Telefon: 015732624362<br />
        E-Mail: Gecit@kfzgutachter.ac
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
      <p>
        Adem Çevik<br />
        Am Gutshof 37<br />
        52080 Aachen
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
        <a href="https://ec.europa.eu/consumers/odr/" className="text-[#E30613] hover:underline ml-1">
          https://ec.europa.eu/consumers/odr/
        </a>.<br />
        Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
      <p>
        Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </section>
  </div>
);

export const Datenschutz = () => (
  <div className="space-y-8">
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">1. Datenschutz auf einen Blick</h2>
      <h3 className="font-bold mb-2">Allgemeine Hinweise</h3>
      <p>
        Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">2. Datenerfassung auf dieser Website</h2>
      <h3 className="font-bold mb-2">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h3>
      <p>
        Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">3. Analyse-Tools und Tools von Drittanbietern</h2>
      <p>
        Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden. Das geschieht vor allem mit sogenannten Analyseprogrammen.
      </p>
    </section>
  </div>
);

export const AGB = () => (
  <div className="space-y-8">
    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">§ 1 Geltungsbereich</h2>
      <p>
        Für die Geschäftsbeziehung zwischen Gecit Kfz Sachverständiger und dem Kunden gelten ausschließlich die nachfolgenden Allgemeinen Geschäftsbedingungen.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wider">§ 2 Vertragsschluss</h2>
      <p>
        Die Darstellung der Dienstleistungen auf der Website stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Bestellung dar.
      </p>
    </section>
  </div>
);

export const Unfallgutachten = () => (
  <div className="space-y-8">
    <p className="text-xl">
      Nach einem unverschuldeten Verkehrsunfall haben Sie das Recht, einen unabhängigen Kfz-Sachverständigen Ihrer Wahl zu beauftragen. 
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-lg mb-3">Vollständige Beweissicherung</h3>
        <p className="text-sm">Wir dokumentieren alle Schäden an Ihrem Fahrzeug detailliert und fachgerecht.</p>
      </div>
      <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <h3 className="font-bold text-lg mb-3">Ermittlung der Schadenshöhe</h3>
        <p className="text-sm">Wir berechnen präzise die Reparaturkosten sowie eine eventuelle Wertminderung.</p>
      </div>
    </div>
  </div>
);

export const Wertgutachten = () => (
  <div className="space-y-8">
    <p className="text-xl">
      Wissen Sie, was Ihr Fahrzeug wirklich wert ist? Ob für den Verkauf, die Versicherung oder zur Wertermittlung Ihres Fuhrparks.
    </p>
  </div>
);

export const Kontakt = () => (
  <div className="space-y-12">
    <p className="text-xl">
      Haben Sie Fragen oder benötigen Sie ein Gutachten? Wir sind für Sie da.
    </p>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="flex flex-col items-center p-8 bg-gray-50 rounded-3xl text-center border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E30613] flex items-center justify-center mb-4">
          <MapPin size={24} />
        </div>
        <h3 className="font-bold mb-2">Adresse</h3>
        <p className="text-sm text-gray-500">Am Gutshof 37<br />52080 Aachen</p>
      </div>

      <div className="flex flex-col items-center p-8 bg-gray-50 rounded-3xl text-center border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E30613] flex items-center justify-center mb-4">
          <Phone size={24} />
        </div>
        <h3 className="font-bold mb-2">Telefon</h3>
        <p className="text-sm text-gray-500">015732624362</p>
      </div>

      <div className="flex flex-col items-center p-8 bg-gray-50 rounded-3xl text-center border border-gray-100">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E30613] flex items-center justify-center mb-4">
          <Mail size={24} />
        </div>
        <h3 className="font-bold mb-2">E-Mail</h3>
        <p className="text-sm text-gray-500">Gecit@kfzgutachter.ac</p>
      </div>
    </div>

    <div className="p-8 bg-[#0A0A0A] rounded-3xl text-white">
      <h3 className="text-2xl font-bold mb-6">Senden Sie uns eine Nachricht</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input type="text" placeholder="Name" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E30613]" />
        <input type="email" placeholder="E-Mail" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E30613]" />
        <textarea placeholder="Ihre Nachricht" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#E30613] md:col-span-2 h-32"></textarea>
        <button type="button" className="bg-[#E30613] text-white font-bold py-4 rounded-xl md:col-span-2 hover:bg-[#c40510] transition-colors">
          Absenden
        </button>
      </div>
    </div>
  </div>
);

