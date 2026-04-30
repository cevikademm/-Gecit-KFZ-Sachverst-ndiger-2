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
            style={{ zIndex: 70, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }} />
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            role="dialog" aria-modal="true"
            className="fixed left-1/2 top-1/2 max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
            style={{ zIndex: 71, width: `min(${width}px, 92vw)`, translate: '-50% -50%',
              background: '#FFFFFF',
              border: `1px solid rgba(0,0,0,0.10)`,
              boxShadow: '0 24px 64px -16px rgba(0,0,0,0.20)' }}>
            <div className="flex items-start justify-between p-6" style={{ borderBottom: `1px solid rgba(0,0,0,0.08)` }}>
              <div>
                <h3 className="text-xl font-bold" style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>{title}</h3>
                {subtitle && <p className="text-sm mt-1" style={{ color: '#6B6B6B' }}>{subtitle}</p>}
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition"
                style={{ color: '#6B6B6B', border: '1px solid rgba(0,0,0,0.10)' }}><XClose size={16} /></button>
            </div>
            <div className="p-6 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
