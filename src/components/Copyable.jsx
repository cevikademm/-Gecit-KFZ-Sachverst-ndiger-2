// ─── Copyable ────────────────────────────────────────────────────────────
// Kopyalanabilir metin / e-posta bileşeni. Sistemdeki TÜM e-posta adresleri
// bununla gösterilir → tek tıkla panoya kopyalanır, kısa "Kopyalandı" geri
// bildirimi verir. Parent tıklamasını (kart açma vb.) engeller (stopPropagation).
//
// Kullanım:
//   <CopyableEmail value={c.email} />
//   <CopyableEmail value={c.email} className="truncate" style={{ color: C.text }} />
//   <CopyableEmail value={c.email} href={`mailto:${c.email}`} />   // metin link, ikon kopyalar
import React, { useState, useCallback, useRef } from 'react';

const GREEN = '#16A34A';
const DIM = '#6B7280';

// Panoya yaz — clipboard API + güvensiz bağlam (http) için execCommand fallback.
export async function copyText(text) {
  const str = String(text ?? '');
  if (!str) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(str);
      return true;
    }
  } catch (e) { /* fallback'e düş */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = str;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

function CopyGlyph({ size = 12, color = DIM }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="13" height="13" x="9" y="9" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckGlyph({ size = 12, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Kopyalanabilir metin. E-posta için <CopyableEmail/> sarmalayıcısını kullanın.
 * @param {string} value - kopyalanacak metin
 * @param {string} [className] - kök <span> sınıfı (truncate, text-xs vb.)
 * @param {object} [style] - kök <span> stili (renk vb.)
 * @param {number} [iconSize=12]
 * @param {boolean} [showIcon=true] - kopya ikonunu göster
 * @param {string} [href] - verilirse metin bir <a href> olur (ikon yine kopyalar)
 * @param {string} [label='Kopyala'] - aria/title öneki
 */
export function CopyableText({
  value, className = '', style, iconSize = 12, showIcon = true, href, label = 'Kopyala', children, ...rest
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const text = value ?? (typeof children === 'string' ? children : '');

  const doCopy = useCallback(async (e) => {
    if (e) { e.preventDefault?.(); e.stopPropagation?.(); }
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1300);
    }
  }, [text]);

  if (!text) return null;

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(e); }
  };

  const textNode = href
    ? <a href={href} onClick={(e) => e.stopPropagation()} style={{ color: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{children ?? text}</a>
    : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{children ?? text}</span>;

  return (
    <span
      className={className}
      onClick={doCopy}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      title={copied ? 'Kopyalandı ✓' : `${label}: ${text}`}
      aria-label={`${label}: ${text}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        cursor: 'pointer', maxWidth: '100%', verticalAlign: 'bottom',
        ...style,
      }}
      {...rest}
    >
      {textNode}
      {showIcon && (
        <span style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', opacity: copied ? 1 : 0.65 }}>
          {copied ? <CheckGlyph size={iconSize} /> : <CopyGlyph size={iconSize} />}
        </span>
      )}
    </span>
  );
}

/**
 * Kopyalanabilir e-posta. `value` boşsa `fallback` (varsayılan '—') gösterilir,
 * o durumda kopyalama/ikon olmaz.
 */
export function CopyableEmail({ value, email, fallback = '—', ...rest }) {
  const mail = value ?? email ?? '';
  if (!mail) {
    return <span style={rest.style} className={rest.className}>{fallback}</span>;
  }
  return <CopyableText value={mail} label="E-posta kopyala" {...rest} />;
}

export default CopyableEmail;
