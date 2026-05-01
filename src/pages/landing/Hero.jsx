import React from 'react';
import { motion } from 'framer-motion';
import { easeOut } from '../../utils/tokens.js';
import { useReducedMotion } from '../../utils/hooks.js';
import { PhoneIcon } from '../../components/icons.jsx';
import { useLang } from '../../i18n/LangContext.jsx';

export default function Hero({ onBook }) {
  const rm = useReducedMotion();
  const { t } = useLang();
  return (
    <section id="home" className="relative min-h-[85vh] flex items-center overflow-hidden bg-white pt-[140px] pb-16">
      <div className="mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" style={{ maxWidth: 1200 }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-[#0A0A0A] leading-[0.9] mb-4">
            {t('hero.title')}
          </h1>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#E30613] mb-8 flex items-center gap-3">
            <span className="w-12 h-1 bg-[#E30613]" />
            {t('hero.subtitle')}
          </h2>
          <div className="w-20 h-1.5 bg-[#E30613] mb-8" />
          <p className="text-lg md:text-xl text-[#4B5563] leading-relaxed max-w-lg mb-10">
            {t('hero.description')}
          </p>
          <button
            onClick={onBook}
            className="group flex items-center gap-3 px-8 py-4 bg-[#E30613] text-white font-bold rounded-md hover:bg-[#B0050F] transition-all transform hover:scale-105 shadow-xl shadow-red-500/30 keep-white"
          >
            <PhoneIcon size={20} className="group-hover:animate-bounce" />
            {t('hero.cta')}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, ease: easeOut }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="/hero-car.png"
              alt="KFZ Gutachter Schadenfall"
              className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
