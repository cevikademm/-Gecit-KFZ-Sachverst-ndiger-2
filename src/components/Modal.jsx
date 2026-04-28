import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { XClose } from './icons.jsx';

export function GecitKfzModal({ open, onClose, title, subtitle, children, width = 560 }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0"
            style={{ zIndex: 70, background: 'rgba(7,6,11,0.75)', backdropFilter: 'blur(6px)' }} />
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            role="dialog" aria-modal="true"
            className="fixed left-1/2 top-1/2 max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
            style={{ zIndex: 71, width: `min(${width}px, 92vw)`, translate: '-50% -50%',
              background: `linear-gradient(180deg, ${C.surface2} 0%, ${C.surface} 100%)`,
              border: `1px solid ${C.border}`,
              boxShadow: `0 40px 80px -20px rgba(0,0,0,0.6), 0 0 40px ${C.glow}` }}>
            <div className="flex items-start justify-between p-6" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div>
                <h3 className="text-xl font-semibold" style={{ color: C.text, letterSpacing: '-0.01em' }}>{title}</h3>
                {subtitle && <p className="text-sm mt-1" style={{ color: C.textDim }}>{subtitle}</p>}
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 transition"
                style={{ color: C.textDim, border: `1px solid ${C.border}` }}><XClose size={16} /></button>
            </div>
            <div className="p-6 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
