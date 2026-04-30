import React from 'react';
import { PhoneIcon } from '../../components/icons.jsx';
import { useLang } from '../../i18n/LangContext.jsx';

export default function CTA({ onBook }) {
  const { t } = useLang();
  return (
    <section className="py-12 bg-[#E30613] text-white keep-white">
      <div className="mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8" style={{ maxWidth: 1200 }}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center">
            <PhoneIcon size={32} />
          </div>
          <div>
            <h2 className="text-xl md:text-3xl font-black tracking-tighter uppercase leading-none mb-1 text-center md:text-left">
              {t('cta.tagline')}
            </h2>
            <p className="text-white/80 font-medium">
              {t('cta.location')}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.location.href = 'tel:+4915739647834'}
          className="w-full md:w-auto px-8 py-4 border-2 border-white text-white font-bold rounded-md hover:bg-white hover:text-[#E30613] transition-all"
        >
          {t('cta.call')} <br />
          <span className="text-lg md:text-xl" dir="ltr">+49 157 326 243 62</span>
        </button>
      </div>
    </section>
  );
}
