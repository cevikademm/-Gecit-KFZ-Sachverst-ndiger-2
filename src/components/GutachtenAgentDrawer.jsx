// Gutachten Agent Drawer — sağdan sürgülü chat paneli.
// "Rapor Oluştur" sayfasındaki "Agent ile Doldur" seçeneğinde açılır.
// Edge Function ile konuşur (supabase/functions/gutachten-agent).

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { startSession, sendMessage } from '../utils/gutachtenAgentClient.js';

export default function GutachtenAgentDrawer({ open, onClose, onComplete, customerId, vehicleId, reportType }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // [{ role, content }]
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [completedDraft, setCompletedDraft] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Drawer açıldığında session başlat
  useEffect(() => {
    if (!open) return;
    if (sessionId) return; // zaten başlatılmış
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await startSession({ customerId, vehicleId, reportType });
        if (cancelled) return;
        setSessionId(res.session_id);
        setMessages([{ role: 'assistant', content: res.message }]);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Agent başlatılamadı');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, customerId, vehicleId, reportType]); // eslint-disable-line

  // Drawer kapanınca state'i sıfırla
  useEffect(() => {
    if (open) return;
    // Geçici: kapanınca state'i sıfırlama, böylece tekrar açıldığında devam edebilir.
    // İptal niyetiyle kapatıldıysa parent zaten yeni mount eder.
  }, [open]);

  // Yeni mesaj geldiğinde scroll'u en alta götür
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  // Input'a focus
  useEffect(() => {
    if (open && !isLoading && !isComplete) {
      inputRef.current?.focus();
    }
  }, [open, isLoading, isComplete]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !sessionId || isLoading) return;
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);
    try {
      const res = await sendMessage(sessionId, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
      if (res.status === 'completed' && res.draft) {
        setIsComplete(true);
        setCompletedDraft(res.draft);
      }
    } catch (e) {
      setError(e.message || 'Cevap alınamadı');
      // Hata olursa kullanıcı mesajını geri al
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplyDraft = () => {
    if (!completedDraft) return;
    onComplete?.(completedDraft);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.4)',
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: 520, zIndex: 51,
              background: C.surface, borderLeft: `1px solid ${C.border}`,
              boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div className="flex items-center gap-3">
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${C.neon}15`, border: `1px solid ${C.neon}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                    Gutachten Agent
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim }}>
                    {isComplete ? 'Tamamlandı — form\'a uygulamaya hazır' : 'Soruları sırayla yanıtla'}
                  </div>
                </div>
              </div>
              <button onClick={onClose} type="button"
                aria-label="Kapat"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.textDim, cursor: 'pointer', fontSize: 16,
                }}>×</button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {messages.map((m, i) => (
                <MessageBubble key={i} role={m.role} content={m.content} />
              ))}
              {isLoading && <TypingIndicator />}
              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10,
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.25)',
                  color: '#B91C1C', fontSize: 12.5,
                }}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            {/* Footer: input veya tamamlandı butonu */}
            <div style={{
              borderTop: `1px solid ${C.border}`,
              padding: '14px 20px',
              background: 'rgba(0,0,0,0.015)',
            }}>
              {isComplete ? (
                <button onClick={handleApplyDraft} type="button"
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10,
                    background: C.neon, color: '#fff', border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 4px 14px ${C.glow}`,
                  }}>
                  ✓ Form'a Uygula
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Cevabını yaz… (Enter göndermek için)"
                    rows={1}
                    disabled={isLoading || !sessionId}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10,
                      background: C.surface, color: C.text,
                      border: `1px solid ${C.border}`,
                      fontSize: 13, outline: 'none', resize: 'none',
                      minHeight: 40, maxHeight: 120, fontFamily: 'inherit',
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <button onClick={handleSend} type="button"
                    disabled={!input.trim() || isLoading || !sessionId}
                    style={{
                      padding: '10px 16px', borderRadius: 10,
                      background: input.trim() && sessionId && !isLoading ? C.neon : 'rgba(0,0,0,0.1)',
                      color: '#fff', border: 'none',
                      fontSize: 13, fontWeight: 600,
                      cursor: input.trim() && sessionId && !isLoading ? 'pointer' : 'not-allowed',
                      transition: 'background 0.15s',
                    }}>
                    Gönder
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────
function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        maxWidth: '85%', padding: '10px 14px', borderRadius: 12,
        background: isUser ? C.neon : 'rgba(0,0,0,0.04)',
        color: isUser ? '#fff' : C.text,
        fontSize: 13.5, lineHeight: 1.55,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        border: isUser ? 'none' : `1px solid ${C.border}`,
        boxShadow: isUser ? `0 2px 8px ${C.glow}` : 'none',
      }}>
        {content}
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{
        padding: '12px 16px', borderRadius: 12,
        background: 'rgba(0,0,0,0.04)', border: `1px solid ${C.border}`,
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: C.textDim, opacity: 0.5,
            }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
