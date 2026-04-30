import React from 'react';
import { PhoneIcon, MailIcon, PlusIcon, Zap } from '../../components/icons.jsx';
import { useLang } from '../../i18n/LangContext.jsx';

export default function Footer({ setActiveSubPage }) {
  const { t } = useLang();
  const cols = [
    { title: t('footer.cols.services'), links: ['Unfallgutachten', 'Wertgutachten', 'Reparaturkosten', 'Leasing-Check', 'Oldtimer'] },
    { title: t('footer.cols.company'),  links: ['Über uns', 'Philosophie', 'Standorte', 'Karriere', 'Kontakt'] },
    { title: t('footer.cols.legal'),    links: ['Impressum', 'Datenschutz', 'AGB', 'Cookie-Richtlinie'] },
  ];

  return (
    <footer id="kontakt" className="relative pt-24 pb-12 bg-white border-t border-gray-100 overflow-hidden" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6 relative" style={{ maxWidth: 1200 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-20">
          <div className="lg:col-span-2">
            <div className="mb-8 flex items-center" style={{ height: '50px' }}>
              <img src="/logocustom3.png" alt="Gecit Kfz Sachverständiger"
                className="h-12 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-10">
              {t('footer.tagline')}
            </p>
            <div className="space-y-4">
              <a href="tel:+4915739647834" className="group flex items-center gap-4 text-sm text-gray-600 hover:text-[#E30613] transition-colors w-fit">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-[#E30613] group-hover:bg-[#E30613] group-hover:text-white transition-all duration-300">
                  <PhoneIcon size={16} />
                </div>
                <span className="tracking-wide font-medium">+49 157 326 243 62</span>
              </a>
              <a href="mailto:info@kfz-gutachter-aachen.de" className="group flex items-center gap-4 text-sm text-gray-600 hover:text-[#E30613] transition-colors w-fit">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-[#E30613] group-hover:bg-[#E30613] group-hover:text-white transition-all duration-300">
                  <MailIcon size={16} />
                </div>
                <span className="tracking-wide font-medium">Gecit@kfzgutachter.ac</span>
              </a>
              <div className="group flex items-start gap-4 text-sm text-gray-600 w-fit">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 text-[#E30613] mt-1">
                  <PlusIcon size={16} />
                </div>
                <address className="not-italic tracking-wide leading-loose font-medium">
                  Am Gutshof 37 <br />
                  52080 Aachen
                </address>
              </div>
            </div>
          </div>

          {cols.map((col, i) => (
            <div key={i} className="pt-2">
              <h3 className="text-[#0A0A0A] font-bold text-sm mb-8 uppercase tracking-widest flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#E30613]"></span>
                {col.title}
              </h3>
              <ul className="space-y-5">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <button onClick={() => setActiveSubPage(l.toLowerCase().replace(' ', '-'))} className="text-sm text-gray-700 hover:text-[#E30613] hover:translate-x-1.5 inline-block transition-all duration-300 font-medium">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm border-t border-gray-100">
          <p className="text-gray-400 tracking-wider text-xs md:text-sm">{t('footer.copyright')}</p>
          <p className="flex items-center gap-2 text-gray-400 tracking-wider text-xs md:text-sm">
            {t('footer.built')} <Zap size={14} className="text-[#E30613]" /> Aachen
          </p>
        </div>
      </div>
    </footer>
  );
}
