import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ShieldIcon as Shield, FileText, ScaleIcon as Scale, 
  PhoneIcon as Phone, MailIcon as Mail, MapPin,
  Check, Zap as Info, ClockIcon as Clock, ShieldIcon as ShieldCheck,
  CarIcon as Car, Wrench, SearchIcon as Search, StarIcon as Star, 
  Sparkles as Award, UsersIcon as Users, Sparkles as Heart,
  ClipboardIcon, Brain, Rocket
} from '../components/icons.jsx';

const CheckCircle2 = Check; // Alias for consistency
const AlertCircle = Info; // Alias

const C = {
  red: '#E30613',
  text: '#0A0A0A',
  textDim: '#666666',
  bg: '#FFFFFF',
  surface: '#FAFAFA',
  border: 'rgba(0,0,0,0.06)'
};

export const SubPageLayout = ({ title, children, onBack }) => (
  <div className="min-h-screen bg-white selection:bg-red-100 selection:text-red-600">
    {/* Navigation Bar */}
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2.5 text-gray-500 hover:text-[#E30613] transition-all group font-medium"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span>Zurück zur Startseite</span>
        </button>
        <div className="hidden md:flex items-center gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Gecit Kfz Sachverständiger</span>
        </div>
      </div>
    </nav>

    {/* Hero Section */}
    <header className="pt-40 pb-20 px-6 bg-gradient-to-b from-gray-50 to-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-red-600 fill-current">
          <path d="M0 100 L100 0 L100 100 Z" />
        </svg>
      </div>
      <div className="mx-auto max-w-4xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#0A0A0A] mb-6 leading-tight">
            {title}
          </h1>
          <div className="h-1.5 w-24 bg-[#E30613] rounded-full mb-8"></div>
        </motion.div>
      </div>
    </header>

    {/* Content Section */}
    <main className="pb-32 px-6">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-lg prose-red max-w-none text-gray-600 leading-relaxed space-y-12"
        >
          {children}
        </motion.div>
      </div>
    </main>

    {/* Footer Call to Action */}
    <section className="bg-gray-50 py-24 px-6 text-[#0A0A0A] border-t border-gray-100 overflow-hidden relative">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-[-50%] left-[-10%] w-[60%] h-[200%] rotate-12 bg-gradient-to-r from-red-600 to-transparent" />
      </div>
      <div className="mx-auto max-w-4xl text-center relative">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Haben Sie weitere Fragen?</h2>
        <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
          Unser Expertenteam steht Ihnen jederzeit beratend zur Seite. Kontaktieren Sie uns für eine kostenlose Ersteinschätzung.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a href="tel:+4915732624362" className="w-full sm:w-auto px-10 py-5 bg-[#E30613] rounded-2xl font-bold text-white hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-red-500/20">
            <Phone size={22} />
            <span>Jetzt anrufen</span>
          </a>
          <button onClick={onBack} className="w-full sm:w-auto px-10 py-5 bg-white rounded-2xl font-bold text-[#0A0A0A] hover:bg-gray-100 transition-all border border-gray-200 shadow-sm">
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </section>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <section className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4 mb-8">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#E30613] flex items-center justify-center flex-shrink-0">
          <Icon size={24} />
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">{title}</h2>
    </div>
    <div className="text-gray-600 leading-relaxed space-y-4">
      {children}
    </div>
  </section>
);

export const SubPageContent = ({ type, onBack }) => {
  switch (type) {
    case 'impressum':
      return (
        <div className="space-y-10">
          <Section title="Angaben gemäß § 5 TMG" icon={Info}>
            <p className="text-xl font-medium text-gray-900 mb-2">Gecit Kfz Sachverständiger</p>
            <p>
              Am Gutshof 37<br />
              52080 Aachen
            </p>
          </Section>

          <Section title="Kontakt" icon={Phone}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Telefon</p>
                <p className="text-lg font-bold text-gray-900">+49 157 326 243 62</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">E-Mail</p>
                <p className="text-lg font-bold text-[#E30613]">Gecit@kfzgutachter.ac</p>
              </div>
            </div>
          </Section>

          <Section title="Verantwortlich für den Inhalt" icon={Users}>
            <p className="text-lg font-bold text-gray-900">Rohat Gecit</p>
            <p>
              Am Gutshof 37<br />
              52080 Aachen
            </p>
          </Section>

          <Section title="Umsatzsteuer-ID" icon={FileText}>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">USt-IdNr. gemäß § 27 a Umsatzsteuergesetz</p>
            <p className="text-lg font-bold text-gray-900">DE366304119</p>
          </Section>

          <Section title="Bankverbindung" icon={ClipboardIcon}>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Kontoinhaber: Rohat Gecit</p>
            <p className="text-lg font-bold text-gray-900 mb-2">Sparkasse Aachen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">IBAN</p>
                <p className="text-sm font-mono font-bold text-gray-900">DE12 3905 0000 1077 3885 83</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5">BIC</p>
                <p className="text-sm font-mono font-bold text-gray-900">AACSDE33XXX</p>
              </div>
            </div>
          </Section>

          <Section title="EU-Streitschlichtung" icon={Shield}>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-[#E30613] hover:underline ml-1 font-medium">
                https://ec.europa.eu/consumers/odr/
              </a>.
            </p>
            <p className="mt-4 italic">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </Section>
        </div>
      );

    case 'datenschutz':
      return (
        <div className="space-y-10">
          <Section title="1. Datenschutz auf einen Blick" icon={ShieldCheck}>
            <h3 className="text-lg font-bold text-gray-900">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
          </Section>

          <Section title="2. Datenerfassung auf dieser Website" icon={Search}>
            <h3 className="text-lg font-bold text-gray-900">Wer ist verantwortlich für die Datenerfassung?</h3>
            <p>
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">Wie erfassen wir Ihre Daten?</h3>
            <p>
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst.
            </p>
          </Section>

          <Section title="3. Ihre Rechte" icon={Award}>
            <p>
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
            </p>
          </Section>
        </div>
      );

    case 'agb':
      return (
        <div className="space-y-10">
          <Section title="§ 1 Geltungsbereich" icon={FileText}>
            <p>
              Für die Geschäftsbeziehung zwischen Gecit Kfz Sachverständiger und dem Kunden gelten ausschließlich die nachfolgenden Allgemeinen Geschäftsbedingungen in ihrer zum Zeitpunkt der Beauftragung gültigen Fassung.
            </p>
          </Section>

          <Section title="§ 2 Auftragserteilung" icon={CheckCircle2}>
            <p>
              Die Auftragserteilung kann schriftlich, mündlich, telefonisch oder über unsere Online-Plattform erfolgen. Ein Vertrag kommt erst mit der Bestätigung durch den Sachverständigen zustande.
            </p>
          </Section>

          <Section title="§ 3 Vergütung" icon={Scale}>
            <p>
              Die Vergütung richtet sich nach der jeweils gültigen Honorartabelle oder wird individuell vereinbart. Bei Haftpflichtschäden erfolgt die Abrechnung in der Regel direkt mit der gegnerischen Versicherung.
            </p>
          </Section>
        </div>
      );

    case 'unfallgutachten':
      return (
        <div className="space-y-10">
          <Section title="Ihr Recht nach einem Unfall" icon={AlertCircle}>
            <p className="text-xl leading-relaxed">
              Nach einem unverschuldeten Verkehrsunfall haben Sie das Recht, einen **unabhängigen Kfz-Sachverständigen Ihrer Wahl** zu beauftragen. Die Kosten hierfür müssen von der Versicherung des Unfallverursachers getragen werden.
            </p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E30613] flex items-center justify-center mb-6">
                <Search size={20} />
              </div>
              <h3 className="text-xl font-bold mb-3">Vollständige Beweissicherung</h3>
              <p className="text-gray-500">Wir dokumentieren alle Schäden an Ihrem Fahrzeug detailliert und fachgerecht, inklusive Lichtbildern und technischer Analyse.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E30613] flex items-center justify-center mb-6">
                <Scale size={20} />
              </div>
              <h3 className="text-xl font-bold mb-3">Ermittlung der Schadenshöhe</h3>
              <p className="text-gray-500">Wir berechnen präzise die Reparaturkosten, den Wiederbeschaffungswert sowie eine eventuelle merkantile Wertminderung.</p>
            </div>
          </div>

          <Section title="Warum ein freies Gutachten?" icon={Star}>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-[#E30613] mt-1 flex-shrink-0" />
                <span>Sicherung Ihrer vollen Schadensersatzansprüche</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-[#E30613] mt-1 flex-shrink-0" />
                <span>Unabhängigkeit von der gegnerischen Versicherung</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-[#E30613] mt-1 flex-shrink-0" />
                <span>Beweissicherung für eventuelle rechtliche Auseinandersetzungen</span>
              </li>
            </ul>
          </Section>
        </div>
      );

    case 'wertgutachten':
      return (
        <div className="space-y-10">
          <Section title="Was ist Ihr Fahrzeug wirklich wert?" icon={Info}>
            <p className="text-xl leading-relaxed">
              Ob für den Privatverkauf, die Versicherungseinstufung oder bei Leasing-Ende – wir ermitteln den tatsächlichen Marktwert Ihres Fahrzeugs unter Berücksichtigung aller wertsteigernden Faktoren.
            </p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Privatverkauf', 'Oldtimer', 'Versicherung'].map((item, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-2">{item}</h4>
                <p className="text-xs text-gray-500">Professionelle Wertermittlung für maximale Sicherheit.</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'ueber-uns':
      return (
        <div className="space-y-10">
          <Section title="Unsere Vision" icon={Heart}>
            <p className="text-xl leading-relaxed">
              Seit unserer Gründung steht **Gecit Kfz Sachverständiger** für Unabhängigkeit, Präzision und modernste Technologie. Wir glauben, dass jeder Fahrzeughalter Zugang zu erstklassiger Expertise haben sollte – ohne bürokratische Hürden.
            </p>
          </Section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Über 15.000 Gutachten</h3>
              <p>Unsere Erfahrung ist Ihr Vorteil. Wir haben tausende Fälle erfolgreich abgewickelt und dabei stets die Interessen unserer Kunden in den Mittelpunkt gestellt.</p>
            </div>
            <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
              <h3 className="text-2xl font-bold text-[#E30613] mb-4">Digitale Innovation</h3>
              <p className="text-red-900/70">Mit unserer "One File Architecture" setzen wir neue Maßstäbe in der Branche. Wir digitalisieren den gesamten Prozess für maximale Effizienz.</p>
            </div>
          </div>
        </div>
      );

    case 'kontakt':
      return (
        <div className="space-y-12">
          <Section title="Kontaktieren Sie uns" icon={Phone}>
            <p className="text-xl">
              Haben Sie Fragen oder benötigen Sie ein Gutachten? Wir sind 24/7 für Sie da.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="flex flex-col items-center p-8 bg-gray-50 rounded-3xl text-center border border-gray-100 group hover:border-red-200 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#E30613] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <MapPin size={28} />
                </div>
                <h3 className="font-bold mb-2">Adresse</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Am Gutshof 37<br />52080 Aachen</p>
              </div>

              <div className="flex flex-col items-center p-8 bg-gray-50 rounded-3xl text-center border border-gray-100 group hover:border-red-200 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#E30613] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Phone size={28} />
                </div>
                <h3 className="font-bold mb-2">Telefon</h3>
                <p className="text-sm text-gray-500">+49 157 326 243 62</p>
              </div>

              <div className="flex flex-col items-center p-8 bg-gray-50 rounded-3xl text-center border border-gray-100 group hover:border-red-200 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#E30613] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Mail size={28} />
                </div>
                <h3 className="font-bold mb-2">E-Mail</h3>
                <p className="text-sm text-gray-500">Gecit@kfzgutachter.ac</p>
              </div>
            </div>
          </Section>

          {/* Map Section */}
          <div className="w-full h-[450px] rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 relative group">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2522.8258673752533!2d6.1360879!3d50.7781745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c09971936990d7%3A0x6d9f71936990d7!2sAm%20Gutshof%2037%2C%2052080%20Aachen%2C%20Germany!5e0!3m2!1sen!2str!4v1714500000000!5m2!1sen!2str"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[0.1] contrast-[1.05] brightness-[1.02]"
            ></iframe>
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-gray-100 shadow-xl pointer-events-none group-hover:translate-x-2 transition-transform duration-500">
              <p className="text-xs uppercase font-bold text-[#E30613] mb-1">Unser Standort</p>
              <p className="text-sm font-bold text-gray-900">Am Gutshof 37, 52080 Aachen</p>
            </div>
          </div>

          <div className="p-10 md:p-16 bg-gray-50 rounded-[3rem] text-[#0A0A0A] relative overflow-hidden border border-gray-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E30613] opacity-[0.03] blur-[100px] pointer-events-none"></div>
            <div className="relative">
              <h3 className="text-3xl font-bold mb-8">Senden Sie uns eine Nachricht</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Ihr Name</label>
<<<<<<< HEAD
                  <input type="text" placeholder="Rohat Geçit" className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:border-[#E30613] transition-colors" />
=======
                  <input type="text" placeholder="Rohat Gecit" className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:border-[#E30613] transition-colors" />
>>>>>>> 6b267c6 (son guncellemeler en kararli surum)
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">E-Mail Adresse</label>
                  <input type="email" placeholder="beispiel@mail.de" className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:border-[#E30613] transition-colors" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs uppercase tracking-widest text-gray-400 font-bold">Ihre Nachricht</label>
                  <textarea placeholder="Wie können wir Ihnen helfen?" className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:border-[#E30613] transition-colors h-40"></textarea>
                </div>
                <button type="button" className="bg-[#E30613] text-white font-bold py-5 rounded-2xl md:col-span-2 hover:bg-red-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-red-600/20">
                  Nachricht absenden
                </button>
              </div>
            </div>
          </div>
        </div>
      );

    case 'reparaturkosten':
      return (
        <div className="space-y-10">
          <Section title="Reparaturkosten-Ermittlung" icon={Wrench}>
            <p className="text-xl leading-relaxed">
              Nicht jeder Schaden erfordert ein vollständiges Gutachten. Oft reicht eine präzise **Reparaturkosten-Kalkulation**, um die Basis für eine Abrechnung oder Instandsetzung zu schaffen.
            </p>
          </Section>
          <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Digitale Kalkulation</h3>
            <p>Wir nutzen modernste Softwarelösungen (z.B. Audatex/DAT), um die Kosten exakt nach Herstellervorgaben zu ermitteln. So haben Sie die Sicherheit, dass keine Kostenposition vergessen wird.</p>
          </div>
        </div>
      );

    case 'leasing-check':
      return (
        <div className="space-y-10">
          <Section title="Leasing-Zustandsbericht" icon={ClipboardIcon}>
            <p className="text-xl leading-relaxed">
              Vermeiden Sie böse Überraschungen bei der Leasingrückgabe. Wir prüfen Ihr Fahrzeug vorab nach den Kriterien der Leasinggeber und unterscheiden klar zwischen **Gebrauchsspuren** und **Schäden**.
            </p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
              <h4 className="font-bold text-[#E30613] mb-2">Kostenschutz</h4>
              <p className="text-sm">Vermeiden Sie überzogene Nachforderungen der Leasinggesellschaften.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2">Objektivität</h4>
              <p className="text-sm">Wir bewerten neutral und nach fairen Branchenstandards.</p>
            </div>
          </div>
        </div>
      );

    case 'oldtimer':
      return (
        <div className="space-y-10">
          <Section title="Oldtimer-Bewertung" icon={Car}>
            <p className="text-xl leading-relaxed">
              Klassische Fahrzeuge benötigen eine besondere Expertise. Wir bewerten den **Zustand**, die **Originalität** und den **Marktwert** Ihres Oldtimers für die Versicherungseinstufung oder den Verkauf.
            </p>
          </Section>
          <Section title="Zustandsnoten" icon={Star}>
            <p>Von Note 1 (Makellos) bis Note 5 (Restaurierungsobjekt) – wir ordnen Ihr Fahrzeug präzise ein und dokumentieren alle wertrelevanten Details.</p>
          </Section>
        </div>
      );
    
    case 'baumaschinen':
      return (
        <div className="space-y-10">
          <Section title="Baumaschinen-Gutachten" icon={Wrench}>
            <p className="text-xl leading-relaxed">
              Spezialisierte Bewertungen für **Bagger, Kräne, Radlader** und andere Baumaschinen. Wir erfassen technische Mängel, Betriebsstunden und den allgemeinen Verschleißzustand.
            </p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-3">Zertifizierte Expertise</h3>
              <p className="text-gray-500">Unsere Gutachter sind speziell für die komplexen Hydraulik- und Antriebssysteme von Baumaschinen geschult.</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-3">Einsatzbereitschaft</h3>
              <p className="text-gray-500">Wir prüfen die Sicherheit und Funktionalität nach aktuellen UVV-Vorschriften.</p>
            </div>
          </div>
        </div>
      );

    case 'elektro-hybrid':
      return (
        <div className="space-y-10">
          <Section title="Elektro- & Hybridfahrzeuge" icon={Info}>
            <p className="text-xl leading-relaxed">
              Die Begutachtung von E-Fahrzeugen erfordert Fachwissen über **Hochvolt-Systeme** und Batteriezustände. Wir sind zertifiziert für alle gängigen Elektro- und Hybrid-Modelle.
            </p>
          </Section>
          <Section title="Hochvolt-Sicherheit" icon={ShieldCheck}>
            <p>Sicherheit geht vor. Wir prüfen die Integrität der Batteriegehäuse und die Funktionsfähigkeit der Abschaltsysteme nach einem Unfall.</p>
          </Section>
        </div>
      );

    case 'lkw-tir':
      return (
        <div className="space-y-10">
          <Section title="LKW- & TIR-Gutachten" icon={Car}>
            <p className="text-xl leading-relaxed">
              Nutzfahrzeuge sind das Rückgrat der Logistik. Wir bieten schnelle und präzise Gutachten für **Sattelzüge, LKWs und Transporter**, um Standzeiten zu minimieren.
            </p>
          </Section>
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Logistik-Fokus</h3>
            <p>Wir berücksichtigen Aufbauarten, Kühlaggregate und Ladebordwände in unserer Bewertung.</p>
          </div>
        </div>
      );

    case 'spezial-anhaenger':
      return (
        <div className="space-y-10">
          <Section title="Spezial-Anhänger & Dorsen" icon={ClipboardIcon}>
            <p className="text-xl leading-relaxed">
              Ob Tieflader, Kipper oder Spezial-Dorsen – wir begutachten alle Arten von Anhängern auf technische Sicherheit und Wert.
            </p>
          </Section>
          <Section title="Schwerlast-Expertise" icon={Wrench}>
            <p>Besonderes Augenmerk legen wir auf die Rahmenstruktur und die Bremssysteme bei Schwerlast-Einheiten.</p>
          </Section>
        </div>
      );

    case 'zweiraeder':
      return (
        <div className="space-y-10">
          <Section title="Zweiräder-Gutachten" icon={Star}>
            <p className="text-xl leading-relaxed">
              Motorräder, Roller und hochwertige E-Bikes benötigen eine feinfühlige Begutachtung, da versteckte Rahmenschäden oft fatal sein können.
            </p>
          </Section>
          <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
            <h3 className="text-xl font-bold text-[#E30613] mb-4">Rahmenvermessung</h3>
            <p className="text-red-900/70">Wir nutzen modernste Verfahren zur Prüfung der Rahmengeometrie nach Unfällen.</p>
          </div>
        </div>
      );

    case 'tir-schulungen':
      return (
        <div className="space-y-10">
          <Section title="TIR-Schulungen & Fachtrainings" icon={Award}>
            <p className="text-xl leading-relaxed">
              Wissen ist Sicherheit. Wir bieten **zertifizierte Schulungen** für Fahrer und Logistikunternehmen an.
            </p>
          </Section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2">Ladungssicherung</h4>
              <p className="text-sm">Praxisnahe Trainings nach VDI 2700ff.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2">TIR-Verfahren</h4>
              <p className="text-sm">Schulungen zu Zollabwicklungen und internationalen Transportstandards.</p>
            </div>
          </div>
        </div>
      );

    case 'philosophie':
      return (
        <div className="space-y-10">
          <Section title="Unsere Philosophie" icon={Brain}>
            <p className="text-xl leading-relaxed">
              Technik trifft auf Transparenz. Wir verstehen uns nicht nur als Gutachter, sondern als **digitaler Wegbereiter** im Kfz-Wesen. Unsere Arbeit basiert auf drei Säulen:
            </p>
            <div className="mt-8 space-y-6">
              <div className="flex gap-4">
                <div className="font-black text-4xl text-red-100">01</div>
                <div>
                  <h4 className="font-bold text-gray-900">Absolute Unabhängigkeit</h4>
                  <p>Wir sind an keine Versicherung gebunden. Unser einziges Ziel ist die objektive Wahrheit.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="font-black text-4xl text-red-100">02</div>
                <div>
                  <h4 className="font-bold text-gray-900">Digitale Exzellenz</h4>
                  <p>Durch Automatisierung und KI verkürzen wir Wartezeiten, ohne die Qualität zu mindern.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="font-black text-4xl text-red-100">03</div>
                <div>
                  <h4 className="font-bold text-gray-900">Menschliche Nähe</h4>
                  <p>Hinter jeder Technik steht ein Experte, der Ihnen im Ernstfall persönlich zur Seite steht.</p>
                </div>
              </div>
            </div>
          </Section>
        </div>
      );

    case 'standorte':
      return (
        <div className="space-y-10">
          <Section title="Unsere Präsenz" icon={MapPin}>
            <p className="text-xl leading-relaxed">
              Hauptsitz in Aachen, aktiv in der gesamten Region. Wir kommen zu Ihnen – ob nach Hause, in die Werkstatt oder zum Unfallort.
            </p>
          </Section>
          <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Einzugsgebiet</h3>
            <ul className="grid grid-cols-2 gap-4">
              {['Aachen', 'Düren', 'Stolberg', 'Eschweiler', 'Alsdorf', 'Herzogenrath'].map(city => (
                <li key={city} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E30613]" />
                  <span>{city}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case 'karriere':
      return (
        <div className="space-y-10">
          <Section title="Wachsen Sie mit uns" icon={Rocket}>
            <p className="text-xl leading-relaxed">
              Wir suchen kluge Köpfe, die Lust haben, das Kfz-Gutachterwesen zu revolutionieren. Bei uns verbinden sich klassisches Handwerk und moderne IT.
            </p>
          </Section>
          <div className="bg-gray-50 p-10 rounded-[3rem] text-[#0A0A0A] border border-gray-100">
            <h3 className="text-2xl font-bold mb-4 text-[#E30613]">Initiativbewerbung</h3>
            <p className="text-gray-600 mb-6">Wir sind immer auf der Suche nach Talenten im Bereich Kfz-Technik, IT-Entwicklung und Kundenmanagement.</p>
            <p className="font-bold">Senden Sie Ihre Unterlagen an: <span className="text-[#E30613]">Gecit@kfzgutachter.ac</span></p>
          </div>
        </div>
      );

    case 'cookie-richtlinie':
      return (
        <div className="space-y-10">
          <Section title="Cookie-Richtlinie" icon={ShieldCheck}>
            <p>
              Diese Website verwendet Cookies, um die Benutzerfreundlichkeit zu verbessern. Einige sind essenziell, andere helfen uns, das Angebot zu optimieren.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">Was sind Cookies?</h3>
            <p>Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden. Sie richten keinen Schaden an und enthalten keine Viren.</p>
          </Section>
        </div>
      );

    default:
      return (
        <div className="py-20 text-center space-y-8">
          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
            <Clock size={40} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">Demnächst verfügbar</h2>
            <p className="text-gray-500 max-w-md mx-auto text-lg">
              Wir arbeiten intensiv daran, Ihnen hier alle Details zu unseren Dienstleistungen bereitzustellen. Vielen Dank für Ihre Geduld.
            </p>
          </div>
          <button 
            onClick={() => {
              window.scrollTo(0, 0);
              onBack();
            }}
            className="inline-flex items-center gap-2 text-[#E30613] font-bold hover:underline"
          >
            Zurück zur Übersicht
          </button>
        </div>
      );
  }
};


