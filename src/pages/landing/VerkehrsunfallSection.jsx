import React from 'react';
import { motion } from 'framer-motion';
import { C, easeOut } from '../../utils/tokens.js';
import { useLang } from '../../i18n/LangContext.jsx';

export default function VerkehrsunfallSection({ onBook }) {
  const { t } = useLang();
  const points = t('about.points');
  return (
    <section id="ueber-uns" className="relative py-24 md:py-32" style={{ zIndex: 2 }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch mb-12">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="relative rounded-3xl overflow-hidden order-2 md:order-1"
            style={{ border: '1px solid rgba(227,6,19,0.25)', boxShadow: '0 0 50px rgba(227,6,19,0.15)' }}>
            <img src="/images/unfall.jpg" alt="Unfallfahrzeug mit Warndreieck" loading="lazy"
              className="block w-full h-full object-cover" />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: easeOut }}
            className="order-1 md:order-2">
            <p className="text-xs uppercase mb-4 font-semibold tracking-widest" style={{ color: '#E30613' }}>
              {t('about.eyebrow')}
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6"
              style={{ color: C.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {t('about.heading_pre')} <span style={{ color: '#E30613' }}>{t('about.heading_red')}</span>!
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: C.textDim }}>
              {t('about.description')}
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {points.map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.1 }}
              className="rounded-2xl p-6 flex gap-5"
              style={{ background: '#FAFAFA', border: `1px solid ${C.border}`,
                backdropFilter: 'blur(4px)' }}>
              <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #E30613, #B0050F)',
                    boxShadow: '0 0 20px rgba(227,6,19,0.25)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1" style={{ color: C.text }}>{p.title}</h3>
                <p className="leading-relaxed" style={{ color: C.textDim }}>{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
