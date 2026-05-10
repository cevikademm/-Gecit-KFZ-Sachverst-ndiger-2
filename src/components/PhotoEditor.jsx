// Foto Editör — AutoiXpert / müşteri foto galerisi için tam özellikli, SVG tabanlı annotation editörü.
// Aletler: Ok, Metin/Sayı, Filigran, Daire (içi boş/dolu), Dikdörtgen (içi boş/dolu),
//          Çokgen (içi boş/dolu), Döndür, Kesmek, Büyüt, Şekli kaldır, Filtre, Plakaları karart.
// Saklama: annotations + filtre + rotation + description → localStorage (her zaman),
//          render edilmiş JPEG → Supabase storage <bucket>/edits/<photo.id>.jpg (best-effort).
// Açılışta annotations restore edilir; kullanıcı dilediği zaman tekrar düzenleyebilir.

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { XClose, TrashIcon, DownloadIcon, Check, ArrowLeft, ArrowRight } from './icons.jsx';
import { getSupabaseClient } from '../utils/supabaseAuth.js';

// ─── localStorage helpers ────────────────────────────────────
const EDIT_KEY = (id) => `photo_edit_${id}`;
const RENDER_KEY = (id) => `photo_edit_render_${id}`; // dataURL fallback

function loadEdit(photoId) {
  try { return JSON.parse(localStorage.getItem(EDIT_KEY(photoId)) || 'null'); }
  catch (e) { return null; }
}
function saveEdit(photoId, edit) {
  try { localStorage.setItem(EDIT_KEY(photoId), JSON.stringify(edit)); }
  catch (e) { console.warn('PhotoEditor: localStorage edit kaydedilemedi', e); }
}
function loadRender(photoId) {
  try { return localStorage.getItem(RENDER_KEY(photoId)); }
  catch (e) { return null; }
}
function saveRender(photoId, dataUrl) {
  try { localStorage.setItem(RENDER_KEY(photoId), dataUrl); }
  catch (e) { /* dataURL too big — silent */ }
}

// ─── Default state ───────────────────────────────────────────
const defaultEdit = {
  shapes: [],          // [{ id, type, ... }]
  rotation: 0,         // 0/90/180/270
  filter: 'none',      // 'none' | 'grayscale' | 'sepia' | 'bright' | 'cold' | 'warm'
  description: '',
  zoom: 1,
  color: '#EF4444',    // varsayılan annotation rengi
  strokeWidth: 4,
  textSize: 28,
  updatedAt: null,
};

const FILTER_CSS = {
  none: 'none',
  grayscale: 'grayscale(1)',
  sepia: 'sepia(0.7)',
  bright: 'brightness(1.25) contrast(1.1)',
  cold: 'hue-rotate(180deg) saturate(1.1)',
  warm: 'sepia(0.3) saturate(1.4) brightness(1.05)',
};

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#A855F7', '#000000', '#FFFFFF'];

// SVG marker (arrow head) — sayfada bir kez render edilir
function ArrowMarker({ id, color }) {
  return (
    <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  );
}

// ─── Tool buttons ────────────────────────────────────────────
const TOOLS = [
  { id: 'arrow',       label: 'Ok',                glyph: '↗' },
  { id: 'text',        label: 'Metin ve Sayı',     glyph: 'T' },
  { id: 'watermark',   label: 'Filigran',          glyph: '💧' },
  { id: 'circle-out',  label: 'Daire',             glyph: '○', filled: false },
  { id: 'rect-out',    label: 'Dikdörtgen',        glyph: '▢', filled: false },
  { id: 'polygon-out', label: 'Çokgen',            glyph: '⬠', filled: false },
  { id: 'circle-fill', label: 'Daire (dolu)',      glyph: '●', filled: true },
  { id: 'rect-fill',   label: 'Dikdörtgen (dolu)', glyph: '▬', filled: true },
  { id: 'polygon-fill',label: 'Çokgen (dolu)',     glyph: '⬟', filled: true },
  { id: 'plate-blur',  label: 'Plakayı karart',    glyph: '🚗' },
];

const ACTIONS = [
  { id: 'rotate', label: 'Döndür', glyph: '↻' },
  { id: 'crop',   label: 'Kesmek', glyph: '✂' },
  { id: 'zoom',   label: 'Büyüt',  glyph: '🔍' },
];

// ─── Main component ──────────────────────────────────────────
export default function PhotoEditor({ photo, imageUrl, onClose, onDelete, onSaved, onPrev, onNext, hasPrev, hasNext }) {
  const stageRef = useRef(null);    // image+svg wrapper
  const imgRef = useRef(null);
  const svgRef = useRef(null);

  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [edit, setEdit] = useState(() => ({ ...defaultEdit, ...(loadEdit(photo?.id) || {}) }));
  const [tool, setTool] = useState(null);
  const [drawing, setDrawing] = useState(null);   // şu an çizilen şekil (taslak)
  const [polyPoints, setPolyPoints] = useState([]); // çokgen modu için tıklanan noktalar
  const [selectedId, setSelectedId] = useState(null);
  const [cropRect, setCropRect] = useState(null);  // {x,y,w,h} normalized 0-1
  const [cropDraft, setCropDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const [dragging, setDragging] = useState(null); // { id, startX, startY, original }

  // Photo değişirse editör state'ini yeniden yükle
  useEffect(() => {
    setEdit({ ...defaultEdit, ...(loadEdit(photo?.id) || {}) });
    setTool(null);
    setDrawing(null);
    setPolyPoints([]);
    setSelectedId(null);
    setCropRect(null);
    setCropDraft(null);
  }, [photo?.id]);

  // Image yüklendiğinde natural boyutu kaydet
  const onImgLoad = (e) => {
    setNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  // ─── Stage koordinat sistemi (SVG viewBox: natural pixel coords) ──
  const screenToSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  // ─── Şekil taşıma yardımcıları ────────────────────────────
  const translateShape = (s, dx, dy) => {
    switch (s.type) {
      case 'arrow':
        return { ...s, x0: s.x0 + dx, y0: s.y0 + dy, x1: s.x1 + dx, y1: s.y1 + dy };
      case 'rect-out':
      case 'rect-fill':
      case 'plate-blur':
        return { ...s, x: s.x + dx, y: s.y + dy };
      case 'circle-out':
      case 'circle-fill':
        return { ...s, cx: s.cx + dx, cy: s.cy + dy };
      case 'polygon-out':
      case 'polygon-fill':
        return { ...s, points: (s.points || []).map((p) => ({ x: p.x + dx, y: p.y + dy })) };
      case 'text':
      case 'watermark':
        return { ...s, x: s.x + dx, y: s.y + dy };
      default:
        return s;
    }
  };

  const beginDragShape = (e, shape) => {
    if (tool) return; // çizim/crop modunda iken drag etme
    e.stopPropagation();
    const { x, y } = screenToSvg(e.clientX, e.clientY);
    setSelectedId(shape.id);
    setDragging({ id: shape.id, startX: x, startY: y, original: { ...shape } });
    try {
      const target = svgRef.current;
      if (target && target.setPointerCapture) target.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
  };

  // ─── Pointer handlers ─────────────────────────────────────
  const onPointerDown = (e) => {
    if (!tool) {
      // Boş alana tıklandı → seçimi temizle
      if (e.target === svgRef.current) setSelectedId(null);
      return;
    }
    if (tool === 'text' || tool === 'watermark') {
      const { x, y } = screenToSvg(e.clientX, e.clientY);
      const txt = window.prompt(tool === 'watermark' ? 'Filigran metni:' : 'Metin / Sayı:', tool === 'watermark' ? 'GECIT KFZ' : '');
      if (txt && txt.trim()) {
        addShape({
          id: uid(),
          type: tool,
          x, y,
          text: txt.trim(),
          color: tool === 'watermark' ? '#FFFFFF' : edit.color,
          fontSize: tool === 'watermark' ? Math.max(60, naturalSize.w / 8) : edit.textSize * (naturalSize.w / 1000 || 1),
          opacity: tool === 'watermark' ? 0.45 : 1,
        });
      }
      setTool(null);
      return;
    }
    if (tool === 'polygon-out' || tool === 'polygon-fill') {
      const { x, y } = screenToSvg(e.clientX, e.clientY);
      setPolyPoints((pts) => [...pts, { x, y }]);
      return;
    }
    if (tool === 'crop') {
      const { x, y } = screenToSvg(e.clientX, e.clientY);
      setCropDraft({ x0: x, y0: y, x1: x, y1: y });
      return;
    }
    // arrow / circle / rect / plate-blur
    const { x, y } = screenToSvg(e.clientX, e.clientY);
    setDrawing({ id: uid(), type: tool, x0: x, y0: y, x1: x, y1: y });
  };

  const onPointerMove = (e) => {
    if (dragging) {
      const { x, y } = screenToSvg(e.clientX, e.clientY);
      const dx = x - dragging.startX;
      const dy = y - dragging.startY;
      setEdit((ed) => ({
        ...ed,
        shapes: ed.shapes.map((s) => (s.id === dragging.id ? translateShape(dragging.original, dx, dy) : s)),
      }));
      return;
    }
    if (drawing) {
      const { x, y } = screenToSvg(e.clientX, e.clientY);
      setDrawing((d) => ({ ...d, x1: x, y1: y }));
    } else if (cropDraft) {
      const { x, y } = screenToSvg(e.clientX, e.clientY);
      setCropDraft((d) => ({ ...d, x1: x, y1: y }));
    }
  };

  const onPointerUp = (e) => {
    if (dragging) {
      try {
        const target = svgRef.current;
        if (target && target.releasePointerCapture && e?.pointerId != null) target.releasePointerCapture(e.pointerId);
      } catch (err) { /* ignore */ }
      setDragging(null);
      return;
    }
    if (drawing) {
      const { id, type, x0, y0, x1, y1 } = drawing;
      const w = Math.abs(x1 - x0);
      const h = Math.abs(y1 - y0);
      if (w < 4 && h < 4) { setDrawing(null); return; }
      let shape = null;
      if (type === 'arrow') {
        shape = { id, type, x0, y0, x1, y1, color: edit.color, strokeWidth: edit.strokeWidth };
      } else if (type === 'rect-out' || type === 'rect-fill') {
        shape = {
          id, type,
          x: Math.min(x0, x1), y: Math.min(y0, y1), w, h,
          color: edit.color, strokeWidth: edit.strokeWidth, filled: type === 'rect-fill',
        };
      } else if (type === 'circle-out' || type === 'circle-fill') {
        const cx = (x0 + x1) / 2;
        const cy = (y0 + y1) / 2;
        const rx = w / 2;
        const ry = h / 2;
        shape = {
          id, type, cx, cy, rx, ry,
          color: edit.color, strokeWidth: edit.strokeWidth, filled: type === 'circle-fill',
        };
      } else if (type === 'plate-blur') {
        shape = {
          id, type,
          x: Math.min(x0, x1), y: Math.min(y0, y1), w, h,
          color: '#000000',
        };
      }
      if (shape) addShape(shape);
      setDrawing(null);
      setTool(null);
    } else if (cropDraft) {
      const { x0, y0, x1, y1 } = cropDraft;
      const x = Math.max(0, Math.min(x0, x1));
      const y = Math.max(0, Math.min(y0, y1));
      const w = Math.min(naturalSize.w - x, Math.abs(x1 - x0));
      const h = Math.min(naturalSize.h - y, Math.abs(y1 - y0));
      if (w > 10 && h > 10) {
        setCropRect({ x, y, w, h });
      }
      setCropDraft(null);
    }
  };

  // Çokgen tamamlama (çift tıkla / Enter)
  const finishPolygon = () => {
    if (polyPoints.length >= 3) {
      addShape({
        id: uid(),
        type: tool,
        points: polyPoints,
        color: edit.color,
        strokeWidth: edit.strokeWidth,
        filled: tool === 'polygon-fill',
      });
    }
    setPolyPoints([]);
    setTool(null);
  };

  // ─── Shape ops ─────────────────────────────────────────────
  function addShape(shape) {
    setEdit((e) => ({ ...e, shapes: [...e.shapes, shape] }));
    setSelectedId(shape.id);
  }
  function removeShape(id) {
    setEdit((e) => ({ ...e, shapes: e.shapes.filter((s) => s.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  }
  function clearAll() {
    if (window.confirm('Tüm şekiller silinsin mi?')) {
      setEdit((e) => ({ ...e, shapes: [] }));
      setSelectedId(null);
      setCropRect(null);
    }
  }

  const rotate = () => setEdit((e) => ({ ...e, rotation: (e.rotation + 90) % 360 }));
  const zoomIn = () => setEdit((e) => ({ ...e, zoom: Math.min(3, Number((e.zoom + 0.25).toFixed(2))) }));
  const zoomOut = () => setEdit((e) => ({ ...e, zoom: Math.max(0.5, Number((e.zoom - 0.25).toFixed(2))) }));
  const zoomReset = () => setEdit((e) => ({ ...e, zoom: 1 }));

  const applyCrop = () => {
    if (!cropRect) return;
    // Crop'u annotation olarak da koymak yerine, shapes ve size'ı geometrik olarak ofsetlemek gerekir.
    // Basit yaklaşım: cropRect kaydet, render anında uygulanır. Annotations koordinatları natural pixel
    // bazlı olduğu için crop sadece çıktı sınırını değiştirir.
    setEdit((e) => ({ ...e, crop: cropRect }));
    setCropRect(null);
    setTool(null);
  };
  const cancelCrop = () => { setCropRect(null); setCropDraft(null); setTool(null); };
  const removeCrop = () => setEdit((e) => ({ ...e, crop: null }));

  // ─── Render edilmiş çıktı ─────────────────────────────────
  const renderToCanvas = useCallback(async () => {
    if (!naturalSize.w || !naturalSize.h) return null;
    const img = imgRef.current;
    if (!img) return null;
    const c = edit.crop;
    const srcX = c?.x || 0;
    const srcY = c?.y || 0;
    const srcW = c?.w || naturalSize.w;
    const srcH = c?.h || naturalSize.h;

    // Rotasyona göre canvas boyutunu ayarla
    const rot = (edit.rotation || 0) % 360;
    const swap = rot === 90 || rot === 270;
    const outW = swap ? srcH : srcW;
    const outH = swap ? srcW : srcH;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');

    // CSS filter equivalents
    const cssFilter = FILTER_CSS[edit.filter] || 'none';
    if (cssFilter !== 'none') ctx.filter = cssFilter;

    // Rotasyonu uygulayarak görüntüyü çiz
    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
    ctx.restore();
    ctx.filter = 'none';

    // Şekilleri çiz — koordinatlar natural pixel bazlı.
    // Crop varsa şekilleri offsetleyip rotasyona da uydurmamız gerekir.
    const drawShape = (s) => {
      // Crop offset uygula
      const tx = (px) => px - srcX;
      const ty = (py) => py - srcY;
      // Rotasyon için ctx zaten döndürülmemiş — biz elle dönüş matrisi uygularız
      const transform = (px, py) => {
        let x = tx(px);
        let y = ty(py);
        // Rotasyon: 90° CW = (x,y) → (h - y, x). Burada h = srcH öncesi; ama biz outW/outH cinsinden döndürdük.
        // Aşağıdaki formüller kanvas merkezi etrafında rotasyonu manuel uygular.
        if (rot === 90)  return { x: srcH - y, y: x };
        if (rot === 180) return { x: srcW - x, y: srcH - y };
        if (rot === 270) return { x: y, y: srcW - x };
        return { x, y };
      };

      ctx.save();
      ctx.strokeStyle = s.color || '#EF4444';
      ctx.fillStyle = s.color || '#EF4444';
      ctx.lineWidth = s.strokeWidth || 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (s.type === 'arrow') {
        const p0 = transform(s.x0, s.y0);
        const p1 = transform(s.x1, s.y1);
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
        // Arrowhead
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const headLen = (s.strokeWidth || 4) * 4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x - headLen * Math.cos(ang - Math.PI / 6), p1.y - headLen * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(p1.x - headLen * Math.cos(ang + Math.PI / 6), p1.y - headLen * Math.sin(ang + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      } else if (s.type === 'rect-out' || s.type === 'rect-fill' || s.type === 'plate-blur') {
        // Köşeleri dönüştür ve sınırlayıcı kutu çiz (yalnızca 90° artırımları olduğu için bu doğru)
        const c1 = transform(s.x, s.y);
        const c2 = transform(s.x + s.w, s.y + s.h);
        const x = Math.min(c1.x, c2.x);
        const y = Math.min(c1.y, c2.y);
        const w = Math.abs(c2.x - c1.x);
        const h = Math.abs(c2.y - c1.y);
        if (s.type === 'rect-fill' || s.type === 'plate-blur') {
          ctx.fillStyle = s.color || '#000000';
          ctx.fillRect(x, y, w, h);
        } else {
          ctx.strokeRect(x, y, w, h);
        }
      } else if (s.type === 'circle-out' || s.type === 'circle-fill') {
        const c = transform(s.cx, s.cy);
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, s.rx, s.ry, 0, 0, Math.PI * 2);
        if (s.type === 'circle-fill') ctx.fill(); else ctx.stroke();
      } else if (s.type === 'polygon-out' || s.type === 'polygon-fill') {
        ctx.beginPath();
        s.points.forEach((p, i) => {
          const t = transform(p.x, p.y);
          if (i === 0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y);
        });
        ctx.closePath();
        if (s.type === 'polygon-fill') ctx.fill(); else ctx.stroke();
      } else if (s.type === 'text' || s.type === 'watermark') {
        const t = transform(s.x, s.y);
        ctx.fillStyle = s.color || '#FFFFFF';
        ctx.globalAlpha = s.opacity != null ? s.opacity : 1;
        ctx.font = `bold ${Math.max(12, s.fontSize || 28)}px Inter, system-ui, sans-serif`;
        ctx.textBaseline = 'top';
        // Hafif siyah outline (okunurluk)
        if (s.type === 'text') {
          ctx.strokeStyle = 'rgba(0,0,0,0.55)';
          ctx.lineWidth = Math.max(2, (s.fontSize || 28) / 12);
          ctx.strokeText(s.text || '', t.x, t.y);
        }
        ctx.fillText(s.text || '', t.x, t.y);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    edit.shapes.forEach(drawShape);

    return canvas;
  }, [edit, naturalSize]);

  // ─── Save ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (busy || !photo?.id) return;
    setBusy(true);
    try {
      const next = { ...edit, updatedAt: new Date().toISOString() };
      saveEdit(photo.id, next);
      setEdit(next);

      const canvas = await renderToCanvas();
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        // localStorage fallback (küçük olasılıkla başarısız olur, ama dene)
        saveRender(photo.id, dataUrl);
        // Supabase storage best-effort upload
        try {
          const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
          if (blob && photo.storage_bucket) {
            const sb = getSupabaseClient();
            if (sb) {
              const editedPath = `edits/${photo.id}.jpg`;
              await sb.storage.from(photo.storage_bucket).upload(editedPath, blob, {
                contentType: 'image/jpeg',
                upsert: true,
              });
            }
          }
        } catch (uploadErr) {
          console.warn('PhotoEditor: Supabase upload başarısız (localStorage olarak saklandı)', uploadErr);
        }
      }
      if (onSaved) onSaved({ photoId: photo.id, edit: next });
      setSavedHint(true);
      setTimeout(() => setSavedHint(false), 1800);
    } finally {
      setBusy(false);
    }
  };

  // ─── Export (download) ─────────────────────────────────────
  const handleDownload = async () => {
    const canvas = await renderToCanvas();
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `edited-${photo?.original_name || photo?.id || 'photo'}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/jpeg', 0.92);
  };

  // ─── Delete photo ──────────────────────────────────────────
  const handleDelete = () => {
    if (!onDelete) return;
    if (window.confirm('Bu fotoğraf tamamen silinsin mi? Geri alınamaz.')) {
      try { localStorage.removeItem(EDIT_KEY(photo.id)); } catch (e) {}
      try { localStorage.removeItem(RENDER_KEY(photo.id)); } catch (e) {}
      onDelete(photo);
    }
  };

  // ─── Keyboard shortcuts ────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (drawing) setDrawing(null);
        else if (polyPoints.length) setPolyPoints([]);
        else if (cropDraft || cropRect) cancelCrop();
        else if (tool) setTool(null);
        else onClose && onClose();
      } else if (e.key === 'Enter' && polyPoints.length >= 3) {
        finishPolygon();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        removeShape(selectedId);
      } else if (e.key === 'ArrowLeft' && hasPrev && !drawing && !polyPoints.length) {
        onPrev && onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && !drawing && !polyPoints.length) {
        onNext && onNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawing, polyPoints.length, cropDraft, cropRect, tool, selectedId, hasPrev, hasNext]);

  // ─── Render ────────────────────────────────────────────────
  const stageStyle = {
    transform: `scale(${edit.zoom || 1}) rotate(${edit.rotation || 0}deg)`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s ease',
    filter: FILTER_CSS[edit.filter] || 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex"
      style={{ background: 'rgba(10,10,12,0.92)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}
    >
      {/* SOL: Görüntü alanı */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ minWidth: 0 }}>
        {/* Üst başlık */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)' }}>
          <div className="text-white">
            <p className="text-sm font-semibold truncate">{photo?.title || photo?.original_name || 'Fotoğraf'}</p>
            <p className="text-xs opacity-70">{photo?.report_token || ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasPrev && (
              <button onClick={onPrev} className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                style={{ background: 'rgba(255,255,255,0.15)' }} title="Önceki (←)">
                <ArrowLeft size={16} />
              </button>
            )}
            {hasNext && (
              <button onClick={onNext} className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                style={{ background: 'rgba(255,255,255,0.15)' }} title="Sonraki (→)">
                <ArrowRight size={16} />
              </button>
            )}
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white"
              style={{ background: 'rgba(255,255,255,0.15)' }} title="Kapat (Esc)">
              <XClose size={16} />
            </button>
          </div>
        </div>

        {/* Stage */}
        <div ref={stageRef} className="relative max-w-full max-h-full" style={stageStyle}>
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt={photo?.title || ''}
              onLoad={onImgLoad}
              crossOrigin="anonymous"
              draggable={false}
              className="block max-w-[88vw] max-h-[80vh] select-none"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {naturalSize.w > 0 && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${naturalSize.w} ${naturalSize.h}`}
              className="absolute inset-0 w-full h-full"
              style={{ cursor: tool ? 'crosshair' : 'default', touchAction: 'none' }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onDoubleClick={() => { if (polyPoints.length >= 3) finishPolygon(); }}
            >
              <defs>
                {COLORS.map((c) => <ArrowMarker key={c} id={`arrow-${c.replace('#','')}`} color={c} />)}
              </defs>

              {/* Crop bölgesinin dışını maskele */}
              {edit.crop && (
                <>
                  <defs>
                    <mask id="crop-mask">
                      <rect x="0" y="0" width={naturalSize.w} height={naturalSize.h} fill="white" />
                      <rect x={edit.crop.x} y={edit.crop.y} width={edit.crop.w} height={edit.crop.h} fill="black" />
                    </mask>
                  </defs>
                  <rect x="0" y="0" width={naturalSize.w} height={naturalSize.h}
                    fill="rgba(0,0,0,0.5)" mask="url(#crop-mask)" pointerEvents="none" />
                  <rect x={edit.crop.x} y={edit.crop.y} width={edit.crop.w} height={edit.crop.h}
                    fill="none" stroke="#3B82F6" strokeWidth={Math.max(2, naturalSize.w / 400)} strokeDasharray="8 4" pointerEvents="none" />
                </>
              )}

              {/* Çizilmiş şekiller */}
              {edit.shapes.map((s) => (
                <ShapeRenderer key={s.id} shape={s} selected={s.id === selectedId}
                  disabled={!!tool}
                  onSelect={() => setSelectedId(s.id)}
                  onPointerDown={(e) => beginDragShape(e, s)} />
              ))}

              {/* Seçili şekil için resize handle'ları */}
              {(() => {
                const sel = edit.shapes.find((sh) => sh.id === selectedId);
                if (!sel || tool) return null;
                return (
                  <ResizeHandles
                    shape={sel}
                    naturalSize={naturalSize}
                    screenToSvg={screenToSvg}
                    svgRef={svgRef}
                    onUpdate={(next) => setEdit((ed) => ({
                      ...ed,
                      shapes: ed.shapes.map((s) => (s.id === sel.id ? next : s)),
                    }))}
                  />
                );
              })()}

              {/* Çizim taslağı */}
              {drawing && <DraftShape draft={drawing} edit={edit} />}

              {/* Çokgen taslağı */}
              {polyPoints.length > 0 && (
                <g pointerEvents="none">
                  <polyline
                    points={polyPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={edit.color}
                    strokeWidth={edit.strokeWidth}
                    strokeDasharray="6 3"
                  />
                  {polyPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={edit.strokeWidth + 2}
                      fill="white" stroke={edit.color} strokeWidth="2" />
                  ))}
                </g>
              )}

              {/* Crop draft */}
              {cropDraft && (
                <rect
                  x={Math.min(cropDraft.x0, cropDraft.x1)}
                  y={Math.min(cropDraft.y0, cropDraft.y1)}
                  width={Math.abs(cropDraft.x1 - cropDraft.x0)}
                  height={Math.abs(cropDraft.y1 - cropDraft.y0)}
                  fill="rgba(59,130,246,0.15)"
                  stroke="#3B82F6"
                  strokeWidth={Math.max(2, naturalSize.w / 400)}
                  strokeDasharray="8 4"
                  pointerEvents="none"
                />
              )}
              {cropRect && !cropDraft && (
                <rect
                  x={cropRect.x} y={cropRect.y}
                  width={cropRect.w} height={cropRect.h}
                  fill="rgba(59,130,246,0.12)"
                  stroke="#3B82F6"
                  strokeWidth={Math.max(2, naturalSize.w / 400)}
                  strokeDasharray="8 4"
                  pointerEvents="none"
                />
              )}
            </svg>
          )}
        </div>

        {/* Çokgen / crop alt panel */}
        <AnimatePresence>
          {(polyPoints.length > 0 || cropRect) && (
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl"
              style={{ background: 'rgba(20,20,24,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {polyPoints.length > 0 && (
                <>
                  <span className="text-xs text-white/70">{polyPoints.length} nokta — Enter veya çift tıkla bitir</span>
                  <button onClick={finishPolygon} disabled={polyPoints.length < 3}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                    style={{ background: '#10B981', color: '#fff' }}>Bitir</button>
                  <button onClick={() => { setPolyPoints([]); setTool(null); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>İptal</button>
                </>
              )}
              {cropRect && (
                <>
                  <span className="text-xs text-white/70">Kesim alanı seçildi — uygula?</span>
                  <button onClick={applyCrop}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: '#3B82F6', color: '#fff' }}>Uygula</button>
                  <button onClick={cancelCrop}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>İptal</button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {savedHint && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
            style={{ background: '#10B981', color: '#fff' }}
          >
            <Check size={14} /> Düzenleme kaydedildi
          </motion.div>
        )}
      </div>

      {/* SAĞ: Editor paneli */}
      <div className="w-[340px] flex-shrink-0 flex flex-col overflow-hidden" style={{ background: '#FFFFFF' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-xs uppercase tracking-widest font-bold" style={{ color: C.text, letterSpacing: '0.18em' }}>Fotoğraf Editörü</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: C.textDim }}>
            <XClose size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Renk + kalınlık */}
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>Renk</p>
            <div className="flex items-center gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setEdit((e) => ({ ...e, color: c }))}
                  className="w-7 h-7 rounded-full transition"
                  style={{
                    background: c,
                    border: `2px solid ${edit.color === c ? C.text : 'rgba(0,0,0,0.1)'}`,
                    boxShadow: edit.color === c ? `0 0 0 3px ${C.text}22` : 'none',
                    transform: edit.color === c ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[11px]" style={{ color: C.textDim }}>Kalınlık</span>
              <input type="range" min="1" max="20" value={edit.strokeWidth}
                onChange={(e) => setEdit((s) => ({ ...s, strokeWidth: Number(e.target.value) }))}
                className="flex-1" />
              <span className="text-[11px] font-mono w-6 text-right" style={{ color: C.text }}>{edit.strokeWidth}</span>
            </div>
          </div>

          {/* Aletler */}
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>Aletler</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TOOLS.map((t) => (
                <button key={t.id} onClick={() => { setTool(t.id); setPolyPoints([]); }}
                  className="px-2 py-2.5 rounded-lg flex flex-col items-center gap-1 transition text-[11px]"
                  style={{
                    background: tool === t.id ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${tool === t.id ? C.neon : 'transparent'}`,
                    color: tool === t.id ? C.neon : C.text,
                  }}>
                  <span className="text-base leading-none">{t.glyph}</span>
                  <span className="leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Aksiyonlar: döndür / kesmek / büyüt */}
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>Dönüştürme</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={rotate}
                className="px-2 py-2.5 rounded-lg flex flex-col items-center gap-1 text-[11px] transition"
                style={{ background: 'rgba(0,0,0,0.04)', color: C.text }}>
                <span className="text-base leading-none">↻</span>
                <span>Döndür</span>
              </button>
              <button onClick={() => setTool('crop')}
                className="px-2 py-2.5 rounded-lg flex flex-col items-center gap-1 text-[11px] transition"
                style={{
                  background: tool === 'crop' ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                  border: `1px solid ${tool === 'crop' ? C.neon : 'transparent'}`,
                  color: tool === 'crop' ? C.neon : C.text,
                }}>
                <span className="text-base leading-none">✂</span>
                <span>Kesmek</span>
              </button>
              <div className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
                <span className="text-[10px]" style={{ color: C.textDim }}>Yakınlaştır</span>
                <div className="flex items-center gap-1">
                  <button onClick={zoomOut} className="w-5 h-5 rounded text-xs leading-none" style={{ background: '#fff', color: C.text }}>−</button>
                  <button onClick={zoomReset} className="text-[10px] font-mono" style={{ color: C.text }}>{Math.round(edit.zoom * 100)}%</button>
                  <button onClick={zoomIn} className="w-5 h-5 rounded text-xs leading-none" style={{ background: '#fff', color: C.text }}>+</button>
                </div>
              </div>
            </div>
            {edit.crop && (
              <button onClick={removeCrop}
                className="mt-2 w-full px-2 py-1.5 rounded-lg text-[11px] font-medium"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                Kesimi kaldır
              </button>
            )}
          </div>

          {/* Filtre */}
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>Filtre</p>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.keys(FILTER_CSS).map((f) => (
                <button key={f} onClick={() => setEdit((e) => ({ ...e, filter: f }))}
                  className="px-2 py-1.5 rounded-lg text-[11px] capitalize transition"
                  style={{
                    background: edit.filter === f ? `${C.neon}15` : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${edit.filter === f ? C.neon : 'transparent'}`,
                    color: edit.filter === f ? C.neon : C.text,
                  }}>
                  {f === 'none' ? 'yok' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Şekil sil + temizle + foto sil */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => selectedId && removeShape(selectedId)} disabled={!selectedId}
              className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40"
              style={{ background: 'rgba(0,0,0,0.04)', color: C.text }}>
              <XClose size={12} /> Şekli kaldır
            </button>
            <button onClick={clearAll}
              className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(0,0,0,0.04)', color: C.text }}>
              <TrashIcon size={12} /> Tümünü temizle
            </button>
            <button onClick={handleDownload}
              className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(0,0,0,0.04)', color: C.text }}>
              <DownloadIcon size={12} /> İndir
            </button>
            {onDelete && (
              <button onClick={handleDelete}
                className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                <TrashIcon size={12} /> Fotoğrafı sil
              </button>
            )}
          </div>

          {/* Tanım */}
          <div>
            <p className="text-[11px] uppercase tracking-widest mb-2" style={{ color: C.textDim }}>Tanım</p>
            <textarea
              value={edit.description}
              onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
              placeholder="Bu fotoğraf hakkında not yazın…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.border}`, color: C.text }}
            />
          </div>

          {edit.updatedAt && (
            <p className="text-[10px] text-center" style={{ color: C.textDim }}>
              Son düzenleme: {new Date(edit.updatedAt).toLocaleString('tr-TR')}
            </p>
          )}
        </div>

        {/* Alt: Kaydet */}
        <div className="p-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <button onClick={handleSave} disabled={busy}
            className="w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
            style={{ background: C.neon, color: '#fff' }}>
            {busy ? 'Kaydediliyor…' : (<><Check size={14} /> Kaydet</>)}
          </button>
          <p className="text-[10px] text-center mt-2" style={{ color: C.textDim }}>
            Düzenlemeler her zaman değiştirilebilir; orijinal fotoğraf korunur.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Helpers / sub-components ─────────────────────────────────
function uid() {
  return 'sh_' + Math.random().toString(36).slice(2, 10);
}

function ShapeRenderer({ shape: s, selected, disabled, onSelect, onPointerDown }) {
  const handlePointerDown = (e) => {
    if (disabled) return;
    onSelect && onSelect();
    onPointerDown && onPointerDown(e);
  };
  const cursor = disabled ? 'default' : (selected ? 'grab' : 'move');
  const baseStyle = { cursor, touchAction: 'none' };
  const sel = selected ? { filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.85))' } : null;
  const stroke = s.color || '#EF4444';
  const sw = s.strokeWidth || 4;

  if (s.type === 'arrow') {
    return (
      <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1}
        stroke={stroke} strokeWidth={sw} strokeLinecap="round"
        markerEnd={`url(#arrow-${stroke.replace('#','')})`}
        onPointerDown={handlePointerDown}
        style={{ ...baseStyle, ...sel }}
      />
    );
  }
  if (s.type === 'rect-out' || s.type === 'rect-fill' || s.type === 'plate-blur') {
    const isOutline = s.type === 'rect-out';
    return (
      <rect x={s.x} y={s.y} width={s.w} height={s.h}
        fill={isOutline ? 'none' : (s.color || '#000')}
        stroke={isOutline ? stroke : 'none'}
        strokeWidth={sw}
        pointerEvents={isOutline ? 'visibleStroke' : 'visiblePainted'}
        onPointerDown={handlePointerDown}
        style={{ ...baseStyle, ...sel }}
      />
    );
  }
  if (s.type === 'circle-out' || s.type === 'circle-fill') {
    const isOutline = s.type === 'circle-out';
    return (
      <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
        fill={isOutline ? 'none' : stroke}
        stroke={isOutline ? stroke : 'none'}
        strokeWidth={sw}
        pointerEvents={isOutline ? 'visibleStroke' : 'visiblePainted'}
        onPointerDown={handlePointerDown}
        style={{ ...baseStyle, ...sel }}
      />
    );
  }
  if (s.type === 'polygon-out' || s.type === 'polygon-fill') {
    const isOutline = s.type === 'polygon-out';
    const pts = (s.points || []).map(p => `${p.x},${p.y}`).join(' ');
    return (
      <polygon points={pts}
        fill={isOutline ? 'none' : stroke}
        stroke={stroke}
        strokeWidth={sw}
        pointerEvents={isOutline ? 'visibleStroke' : 'visiblePainted'}
        onPointerDown={handlePointerDown}
        style={{ ...baseStyle, ...sel }}
      />
    );
  }
  if (s.type === 'text' || s.type === 'watermark') {
    return (
      <text x={s.x} y={s.y} fill={s.color || '#fff'}
        opacity={s.opacity != null ? s.opacity : 1}
        fontSize={s.fontSize || 28}
        fontWeight="bold"
        fontFamily="Inter, system-ui, sans-serif"
        dominantBaseline="hanging"
        stroke={s.type === 'text' ? 'rgba(0,0,0,0.55)' : 'none'}
        strokeWidth={s.type === 'text' ? Math.max(1, (s.fontSize || 28) / 18) : 0}
        paintOrder="stroke fill"
        onPointerDown={handlePointerDown}
        style={{ ...baseStyle, ...sel, userSelect: 'none' }}
      >
        {s.text || ''}
      </text>
    );
  }
  return null;
}

// ─── Resize handle'ları — seçili şekli ölçeklendirmek için ────────────────────
function ResizeHandles({ shape: s, naturalSize, screenToSvg, svgRef, onUpdate }) {
  const [drag, setDrag] = React.useState(null); // { handle, original, startX, startY }
  // Handle boyutu — fotonun 1/100'ü kadar (min 8 px)
  const HSIZE = Math.max(8, Math.round(naturalSize.w / 90));
  const HSTROKE = Math.max(1, Math.round(naturalSize.w / 600));

  const beginResize = (handle, e) => {
    e.stopPropagation();
    const { x, y } = screenToSvg(e.clientX, e.clientY);
    setDrag({ handle, original: { ...s, points: s.points ? s.points.map(p => ({ ...p })) : undefined }, startX: x, startY: y });
    try {
      const target = svgRef.current;
      if (target?.setPointerCapture) target.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
  };

  React.useEffect(() => {
    if (!drag) return;
    const move = (ev) => {
      const { x, y } = screenToSvg(ev.clientX, ev.clientY);
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      const next = applyResize(drag.original, drag.handle, dx, dy, x, y);
      if (next) onUpdate(next);
    };
    const up = () => setDrag(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [drag]);

  const handleProps = (handle, key) => ({
    key,
    onPointerDown: (e) => beginResize(handle, e),
    fill: '#FFFFFF',
    stroke: '#3B82F6',
    strokeWidth: HSTROKE,
    style: { cursor: handle.cursor || 'nwse-resize', touchAction: 'none' },
  });

  // ─── Şekil türlerine göre handle pozisyonları ───────────────────────────────
  if (s.type === 'arrow') {
    // 2 uçta handle
    return (
      <g pointerEvents="all">
        <circle cx={s.x0} cy={s.y0} r={HSIZE / 1.5} {...handleProps({ kind: 'arrow-start', cursor: 'crosshair' }, 'a0')} />
        <circle cx={s.x1} cy={s.y1} r={HSIZE / 1.5} {...handleProps({ kind: 'arrow-end', cursor: 'crosshair' }, 'a1')} />
      </g>
    );
  }

  if (s.type === 'rect-out' || s.type === 'rect-fill' || s.type === 'plate-blur') {
    const corners = [
      { kind: 'rect-tl', cx: s.x,         cy: s.y,         cursor: 'nwse-resize' },
      { kind: 'rect-tr', cx: s.x + s.w,   cy: s.y,         cursor: 'nesw-resize' },
      { kind: 'rect-br', cx: s.x + s.w,   cy: s.y + s.h,   cursor: 'nwse-resize' },
      { kind: 'rect-bl', cx: s.x,         cy: s.y + s.h,   cursor: 'nesw-resize' },
    ];
    return (
      <g pointerEvents="all">
        <rect x={s.x} y={s.y} width={s.w} height={s.h}
          fill="none" stroke="#3B82F6" strokeWidth={HSTROKE} strokeDasharray="4 2" pointerEvents="none" />
        {corners.map((c) => (
          <rect key={c.kind} x={c.cx - HSIZE / 2} y={c.cy - HSIZE / 2} width={HSIZE} height={HSIZE}
            {...handleProps(c, c.kind)} />
        ))}
      </g>
    );
  }

  if (s.type === 'circle-out' || s.type === 'circle-fill') {
    const left   = { kind: 'circle-l', cx: s.cx - s.rx, cy: s.cy,         cursor: 'ew-resize' };
    const right  = { kind: 'circle-r', cx: s.cx + s.rx, cy: s.cy,         cursor: 'ew-resize' };
    const top    = { kind: 'circle-t', cx: s.cx,        cy: s.cy - s.ry,  cursor: 'ns-resize' };
    const bottom = { kind: 'circle-b', cx: s.cx,        cy: s.cy + s.ry,  cursor: 'ns-resize' };
    const corners = [
      { kind: 'circle-tl', cx: s.cx - s.rx, cy: s.cy - s.ry, cursor: 'nwse-resize' },
      { kind: 'circle-tr', cx: s.cx + s.rx, cy: s.cy - s.ry, cursor: 'nesw-resize' },
      { kind: 'circle-br', cx: s.cx + s.rx, cy: s.cy + s.ry, cursor: 'nwse-resize' },
      { kind: 'circle-bl', cx: s.cx - s.rx, cy: s.cy + s.ry, cursor: 'nesw-resize' },
    ];
    return (
      <g pointerEvents="all">
        <rect x={s.cx - s.rx} y={s.cy - s.ry} width={s.rx * 2} height={s.ry * 2}
          fill="none" stroke="#3B82F6" strokeWidth={HSTROKE} strokeDasharray="4 2" pointerEvents="none" />
        {[left, right, top, bottom, ...corners].map((c) => (
          <rect key={c.kind} x={c.cx - HSIZE / 2} y={c.cy - HSIZE / 2} width={HSIZE} height={HSIZE}
            {...handleProps(c, c.kind)} />
        ))}
      </g>
    );
  }

  if (s.type === 'polygon-out' || s.type === 'polygon-fill') {
    return (
      <g pointerEvents="all">
        {(s.points || []).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={HSIZE / 1.5}
            {...handleProps({ kind: 'poly-vertex', index: i, cursor: 'move' }, `p${i}`)} />
        ))}
      </g>
    );
  }

  if (s.type === 'text' || s.type === 'watermark') {
    // Tahmini bbox: text ölçümü için font-size'ı kullanırız (genişlik ≈ chars * 0.55 * fontSize)
    const fs = s.fontSize || 28;
    const w = (s.text || '').length * fs * 0.6;
    const h = fs * 1.1;
    return (
      <g pointerEvents="all">
        <rect x={s.x} y={s.y} width={w} height={h}
          fill="none" stroke="#3B82F6" strokeWidth={HSTROKE} strokeDasharray="4 2" pointerEvents="none" />
        <rect x={s.x + w - HSIZE / 2} y={s.y + h - HSIZE / 2} width={HSIZE} height={HSIZE}
          {...handleProps({ kind: 'text-br', cursor: 'nwse-resize' }, 'tbr')} />
      </g>
    );
  }

  return null;
}

// Resize geometrisi — handle türüne göre original şekli güncelle
function applyResize(orig, handle, dx, dy, absX, absY) {
  const min = 4;
  switch (handle.kind) {
    case 'arrow-start':
      return { ...orig, x0: orig.x0 + dx, y0: orig.y0 + dy };
    case 'arrow-end':
      return { ...orig, x1: orig.x1 + dx, y1: orig.y1 + dy };
    case 'rect-tl': {
      const newW = Math.max(min, orig.w - dx);
      const newH = Math.max(min, orig.h - dy);
      return { ...orig, x: orig.x + (orig.w - newW), y: orig.y + (orig.h - newH), w: newW, h: newH };
    }
    case 'rect-tr': {
      const newW = Math.max(min, orig.w + dx);
      const newH = Math.max(min, orig.h - dy);
      return { ...orig, y: orig.y + (orig.h - newH), w: newW, h: newH };
    }
    case 'rect-br': {
      const newW = Math.max(min, orig.w + dx);
      const newH = Math.max(min, orig.h + dy);
      return { ...orig, w: newW, h: newH };
    }
    case 'rect-bl': {
      const newW = Math.max(min, orig.w - dx);
      const newH = Math.max(min, orig.h + dy);
      return { ...orig, x: orig.x + (orig.w - newW), w: newW, h: newH };
    }
    case 'circle-l': return { ...orig, cx: (orig.cx + orig.rx + (orig.cx - orig.rx + dx)) / 2,
      rx: Math.max(min, (orig.cx + orig.rx - (orig.cx - orig.rx + dx)) / 2) };
    case 'circle-r': return { ...orig, cx: (orig.cx - orig.rx + (orig.cx + orig.rx + dx)) / 2,
      rx: Math.max(min, ((orig.cx + orig.rx + dx) - (orig.cx - orig.rx)) / 2) };
    case 'circle-t': return { ...orig, cy: (orig.cy + orig.ry + (orig.cy - orig.ry + dy)) / 2,
      ry: Math.max(min, (orig.cy + orig.ry - (orig.cy - orig.ry + dy)) / 2) };
    case 'circle-b': return { ...orig, cy: (orig.cy - orig.ry + (orig.cy + orig.ry + dy)) / 2,
      ry: Math.max(min, ((orig.cy + orig.ry + dy) - (orig.cy - orig.ry)) / 2) };
    case 'circle-tl': case 'circle-tr': case 'circle-bl': case 'circle-br': {
      // Köşe: rx & ry'yi orantılı değiştir
      const signX = handle.kind.endsWith('r') ? 1 : -1;
      const signY = handle.kind.includes('t') ? -1 : 1;
      const newRx = Math.max(min, orig.rx + signX * dx);
      const newRy = Math.max(min, orig.ry + signY * dy);
      return { ...orig, rx: newRx, ry: newRy };
    }
    case 'poly-vertex': {
      const i = handle.index;
      const next = orig.points.map((p, idx) => idx === i ? { x: absX, y: absY } : p);
      return { ...orig, points: next };
    }
    case 'text-br': {
      // BR köşe: dx ve dy'den fontSize ölçeği çıkar (genişlik ≈ chars * 0.6 * fs)
      const charCount = Math.max(1, (orig.text || '').length);
      const newWidth = Math.max(20, charCount * 0.6 * (orig.fontSize || 28) + dx);
      const newFs = Math.max(8, newWidth / (charCount * 0.6));
      return { ...orig, fontSize: newFs };
    }
    default:
      return orig;
  }
}

function DraftShape({ draft: d, edit }) {
  const stroke = edit.color || '#EF4444';
  const sw = edit.strokeWidth || 4;
  if (d.type === 'arrow') {
    return <line x1={d.x0} y1={d.y0} x2={d.x1} y2={d.y1}
      stroke={stroke} strokeWidth={sw} strokeLinecap="round"
      strokeDasharray="6 3" pointerEvents="none" />;
  }
  if (d.type === 'rect-out' || d.type === 'rect-fill' || d.type === 'plate-blur') {
    const x = Math.min(d.x0, d.x1);
    const y = Math.min(d.y0, d.y1);
    const w = Math.abs(d.x1 - d.x0);
    const h = Math.abs(d.y1 - d.y0);
    return <rect x={x} y={y} width={w} height={h}
      fill={d.type === 'rect-out' ? 'none' : (d.type === 'plate-blur' ? '#000' : stroke)}
      stroke={stroke} strokeWidth={sw} strokeDasharray="6 3" pointerEvents="none" opacity="0.7" />;
  }
  if (d.type === 'circle-out' || d.type === 'circle-fill') {
    const cx = (d.x0 + d.x1) / 2;
    const cy = (d.y0 + d.y1) / 2;
    const rx = Math.abs(d.x1 - d.x0) / 2;
    const ry = Math.abs(d.y1 - d.y0) / 2;
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill={d.type === 'circle-out' ? 'none' : stroke}
      stroke={stroke} strokeWidth={sw} strokeDasharray="6 3" pointerEvents="none" opacity="0.7" />;
  }
  return null;
}
