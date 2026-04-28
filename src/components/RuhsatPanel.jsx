import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { XClose, FileText, ImageIcon, DownloadIcon, SearchIcon } from './icons.jsx';
import { getRuhsatGroups, parseRuhsatMock } from '../utils/ruhsatParser.js';

export function RuhsatPanel({ doc, onClose, onUpdate }) {
  const open = !!doc;
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  // Eski belgelerde ruhsatData yoksa anlik mock uret (geri uyum)
  const data = useMemo(() => {
    if (!doc) return null;
    if (doc.ruhsatData) return doc.ruhsatData;
    return parseRuhsatMock(doc);
  }, [doc]);

  const groups = useMemo(() => (data ? getRuhsatGroups(data) : []), [data]);
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
      .map(g => ({ ...g, rows: g.rows.filter(r =>
        r.code.toLowerCase().includes(q) ||
        r.de.toLowerCase().includes(q) ||
        r.tr.toLowerCase().includes(q) ||
        String(r.value).toLowerCase().includes(q)
      )}))
      .filter(g => g.rows.length > 0);
  }, [groups, query]);

  if (!doc) return null;

  const isPdf = doc.mime === 'application/pdf' || doc.name?.endsWith('.pdf');
  const isImage = doc.mime?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.name || '');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0"
            style={{ zIndex: 80, background: 'rgba(7,6,11,0.85)', backdropFilter: 'blur(8px)' }} />
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            role="dialog" aria-modal="true"
            className="fixed inset-4 sm:inset-8 flex flex-col rounded-3xl overflow-hidden"
            style={{ zIndex: 81,
              background: `linear-gradient(180deg, ${C.surface2} 0%, ${C.surface} 100%)`,
              border: `1px solid ${C.border}`,
              boxShadow: `0 40px 80px -20px rgba(0,0,0,0.7), 0 0 60px ${C.glow}` }}>

            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 flex-shrink-0"
              style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-mono mb-1" style={{ color: C.neon, letterSpacing: '0.2em' }}>
                  Zulassungsbescheinigung Teil I · Fahrzeugschein
                </p>
                <h3 className="text-xl font-semibold truncate" style={{ color: C.text, letterSpacing: '-0.01em' }}>
                  Ruhsat Detayı — {data?.['D.3'] || data?.['D.1'] || 'Araç'} · {data?.['A'] || ''}
                </h3>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {doc.data && (
                  <a href={doc.data} download={doc.name}
                    className="h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-medium hover:bg-white/5 transition"
                    style={{ color: C.neon, border: `1px solid ${C.neon}44`, background: `${C.neon}10` }}>
                    <DownloadIcon size={14} /> İndir
                  </a>
                )}
                <button onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 transition"
                  style={{ color: C.textDim, border: `1px solid ${C.border}` }}>
                  <XClose size={16} />
                </button>
              </div>
            </div>

            {/* Body — split layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

              {/* SOL — Bilgiler satır satır */}
              <div className="flex flex-col overflow-hidden" style={{ borderRight: `1px solid ${C.border}` }}>
                <div className="px-6 py-3 flex items-center gap-2 flex-shrink-0"
                  style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                  <SearchIcon size={14} style={{ color: C.textDim }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Alan adı, kod veya değer ara..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: C.text }} />
                  <span className="text-[10px] font-mono" style={{ color: C.textDim }}>
                    {filteredGroups.reduce((a, g) => a + g.rows.length, 0)} alan
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                  {filteredGroups.map(group => (
                    <div key={group.title}>
                      <p className="text-[10px] uppercase font-mono mb-2 px-2" style={{ color: C.neon, letterSpacing: '0.2em' }}>
                        {group.title}
                      </p>
                      <div className="rounded-xl overflow-hidden"
                        style={{ border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                        {group.rows.map((row, i) => (
                          <div key={row.code}
                            className="grid grid-cols-[60px_1fr_1.2fr] gap-3 px-3 py-2.5 items-center"
                            style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.border}` }}>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md text-center"
                              style={{ color: C.neon, background: `${C.neon}10`, border: `1px solid ${C.neon}22` }}>
                              {row.code}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs truncate" style={{ color: C.textDim }}>{row.de}</p>
                              <p className="text-[10px] truncate" style={{ color: C.textDim, opacity: 0.6 }}>{row.tr}</p>
                            </div>
                            <p className="text-sm font-mono truncate" style={{ color: C.text }} title={row.value}>
                              {row.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredGroups.length === 0 && (
                    <p className="text-center text-sm py-8" style={{ color: C.textDim }}>
                      Aramayla eşleşen alan bulunamadı.
                    </p>
                  )}
                </div>
              </div>

              {/* SAĞ — Ruhsat görüntüsü */}
              <div className="flex flex-col overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>
                <div className="px-6 py-3 flex items-center gap-2 flex-shrink-0"
                  style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                  {isPdf ? <FileText size={14} style={{ color: C.cyan }} /> : <ImageIcon size={14} style={{ color: C.cyan }} />}
                  <p className="text-xs font-medium truncate flex-1" style={{ color: C.text }}>{doc.name}</p>
                  <span className="text-[10px] font-mono" style={{ color: C.textDim }}>{doc.uploaded_at}</span>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
                  {doc.data ? (
                    isPdf ? (
                      <iframe src={doc.data} className="w-full h-full rounded-xl"
                        style={{ border: 'none', minHeight: 400, background: 'white' }} />
                    ) : isImage ? (
                      <img src={doc.data} alt={doc.name}
                        className="max-w-full max-h-full object-contain rounded-xl"
                        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }} />
                    ) : (
                      <div className="text-center p-10">
                        <FileText size={48} style={{ color: C.textDim, margin: '0 auto 16px' }} />
                        <p className="text-sm" style={{ color: C.textDim }}>Bu dosya türü önizleme desteklemiyor.</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center p-10">
                      <FileText size={48} style={{ color: C.textDim, margin: '0 auto 16px' }} />
                      <p className="text-sm" style={{ color: C.textDim }}>Belge verisi bulunamadı.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
