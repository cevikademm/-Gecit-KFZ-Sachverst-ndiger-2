// Gutachten Agent Wizard — kart-bazlı, çok-adımlı sürgülü panel.
// Eski chat drawer'ın yerine: müşteri+araç verisi otomatik dolar; kullanıcı
// sadece teyit eder ve gerekli yerde seçim/yazım yapar. AI sadece serbest
// metin üretiminde (Unfallhergang, Bemerkung) kullanılır.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';
import { generateText } from '../utils/gutachtenAgentClient.js';
import { getSupabaseClient } from '../utils/supabaseAuth.js';

// ─── Adımlar ───────────────────────────────────────────────────────────
const STEPS = [
  { key: 'review',     label: 'Onay',        title: 'Müşteri ve Araç Onayı' },
  { key: 'type',       label: 'Tür',         title: 'Rapor Türü' },
  { key: 'accident',   label: 'Kaza',        title: 'Kaza Bilgisi' },
  { key: 'damages',    label: 'Hasar',       title: 'Hasar Bölgeleri' },
  { key: 'photos',     label: 'Foto',        title: 'Rapora Eklenecek Fotoğraflar' },
  { key: 'calc',       label: 'Hesap',       title: 'Hesaplama' },
  { key: 'bvsk',       label: 'BVSK',        title: 'Fatura Koridoru' },
  { key: 'narrative',  label: 'Metin',       title: 'Uzman Görüşü & Açıklama' },
  { key: 'signatures', label: 'İmza',        title: 'İmzalar' },
  { key: 'submit',     label: 'Tamamla',     title: 'Önizleme & Kaydet' },
];

// ─── Sabit Veriler ─────────────────────────────────────────────────────
const REPORT_TYPES = [
  { key: 'Sorumluluk talebi', label: 'Haftpflicht', desc: 'Karşı taraf suçlu — sorumluluk talebi', icon: '🚧', color: '#E30613' },
  { key: 'Tam kasko',          label: 'Vollkasko',   desc: 'Kendi kasko — tüm hasarlar',         icon: '🛡', color: '#3B82F6' },
  { key: 'Kısmi kasko',        label: 'Teilkasko',   desc: 'Hırsızlık, dolu, vandalizm',         icon: '⚡', color: '#F59E0B' },
  { key: 'Değerleme',          label: 'Wertgutachten', desc: 'Satış öncesi piyasa değeri',       icon: '💎', color: '#10B981' },
  { key: 'Kısa rapor',         label: 'Kostenvoranschlag', desc: 'Düşük hasar maliyet tahmini',  icon: '📋', color: '#8B5CF6' },
];

const DAMAGE_AREAS = [
  { key: 'frontLeft',              label: 'Sol Ön Köşe' },
  { key: 'frontCenter',            label: 'Ön Orta' },
  { key: 'frontRight',             label: 'Sağ Ön Köşe' },
  { key: 'fenderFrontLeft',        label: 'Sol Ön Çamurluk' },
  { key: 'hood',                   label: 'Kaput' },
  { key: 'fenderFrontRight',       label: 'Sağ Ön Çamurluk' },
  { key: 'doorDriver',             label: 'Sürücü Kapısı' },
  { key: 'windshield',             label: 'Ön Cam' },
  { key: 'doorFrontPassenger',     label: 'Yolcu Kapısı' },
  { key: 'doorBackPassengerLeft',  label: 'Sol Arka Kapı' },
  { key: 'roof',                   label: 'Tavan' },
  { key: 'doorBackPassengerRight', label: 'Sağ Arka Kapı' },
  { key: 'fenderRearLeft',         label: 'Sol Arka Çamurluk' },
  { key: 'rearWindow',             label: 'Arka Cam' },
  { key: 'fenderRearRight',        label: 'Sağ Arka Çamurluk' },
  { key: 'rearLeft',               label: 'Sol Arka Köşe' },
  { key: 'rearCenter',             label: 'Arka Orta' },
  { key: 'rearRight',              label: 'Sağ Arka Köşe' },
];

const BVSK_LEVELS = [
  { key: 'HB I',   schaden: '< 750€',     desc: 'Çok düşük hasar' },
  { key: 'HB II',  schaden: '750-1500€',  desc: 'Düşük hasar' },
  { key: 'HB III', schaden: '1500-5000€', desc: 'Orta hasar (default)', recommended: true },
  { key: 'HB IV',  schaden: '5000-15000€',desc: 'Yüksek hasar' },
  { key: 'HB V',   schaden: '> 15000€',   desc: 'Çok yüksek hasar' },
];

// Schadenshöhe → BVSK koridoru otomatik öner
function suggestBVSK(repairCost) {
  const n = parseFloat(repairCost) || 0;
  if (n < 750) return 'HB II';
  if (n < 1500) return 'HB II';
  if (n < 5000) return 'HB III';
  if (n < 15000) return 'HB IV';
  return 'HB V';
}

// Plate parse: "AC-RN-788" → { city, initials, number }
function parsePlateStr(p) {
  const m = String(p || '').match(/^([A-ZÄÖÜ]+)-([A-ZÄÖÜ]+)-(\d+E?)$/i);
  if (!m) return { city: '', initials: '', number: '' };
  return { city: m[1].toUpperCase(), initials: m[2].toUpperCase(), number: m[3] };
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function GutachtenAgentWizard({ open, onClose, onComplete, customerId, vehicleId, db }) {
  const [stepIdx, setStepIdx] = useState(0);
  const customer = useMemo(
    () => (db?.customers || []).find((c) => c.id === customerId),
    [db, customerId],
  );
  const vehicle = useMemo(
    () => (db?.vehicles || []).find((v) => v.id === vehicleId),
    [db, vehicleId],
  );

  // Form state — auto-fill from customer/vehicle
  const [reportType, setReportType] = useState('Sorumluluk talebi');
  const [accident, setAccident] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '',
    location: '',
    policeRecorded: false,
    policeCaseNumber: '',
    circumstances: '',
  });
  const [damageAreas, setDamageAreas] = useState({});  // {frontLeft: true, ...}
  const [calc, setCalc] = useState({
    repairCostNet: '',
    devaluation: '',
    replacementValue: '',
    residualValue: '',
    repairDuration: '',
    vatRate: 19,
  });
  const [bvskHB, setBvskHB] = useState('HB III');
  const [bemerkung, setBemerkung] = useState('');
  const [unfallhergang, setUnfallhergang] = useState('');
  const [signatures, setSignatures] = useState({
    order: false, cancel: false, dataProtection: false,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Foto seçimi: AutoiXpert + damage_photos kaynaklarından
  // photos array: [{ id, src, sourceType, storage_path, storage_bucket, title, signedUrl }]
  const [availablePhotos, setAvailablePhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());
  // Foto sayısı seçilen foto sayısından türetilir (manuel override mümkün ama default = seçilen)
  const photoCount = selectedPhotoIds.size || 0;

  // Drawer açılınca state sıfırla
  useEffect(() => {
    if (!open) return;
    setStepIdx(0);
    setError(null);
    setSelectedPhotoIds(new Set());
  }, [open, customerId, vehicleId]);

  // Wizard açıldığında müşteri+araç fotolarını batch fetch et (AutoiXpert + damage_photos)
  useEffect(() => {
    if (!open || !customerId) return;
    let cancelled = false;
    (async () => {
      setPhotosLoading(true);
      try {
        // 1) Müşterinin araç ID'lerini al
        const myVehicleIds = (db?.vehicles || [])
          .filter((v) => v.owner_id === customerId)
          .map((v) => v.id);

        // 2) Müşterinin appraisal'larını al → autoixpert_report_id'leri
        const myReportIds = (db?.appraisals || [])
          .filter((a) => myVehicleIds.includes(a.vehicle_id) && a.autoixpert_report_id)
          .map((a) => a.autoixpert_report_id);

        // 3) damage_photos: in-memory'den filtrele (vehicle_id'ye göre)
        const damagePhotos = (db?.damage_photos || [])
          .filter((p) => myVehicleIds.includes(p.vehicle_id))
          .map((p) => ({
            id: 'dp_' + p.id,
            sourceType: 'damage',
            url: p.url || null,
            title: p.label || p.part || 'Hasar fotoğrafı',
            created_at: p.created_at,
          }));

        // 4) AutoiXpert photos: Supabase'den fetch + signed URLs
        let axPhotos = [];
        if (myReportIds.length > 0) {
          const sb = getSupabaseClient();
          if (sb) {
            const { data: photos } = await sb
              .from('autoixpert_photos')
              .select('id, report_id, storage_path, storage_bucket, original_name, title, downloaded_at')
              .in('report_id', myReportIds)
              .eq('download_status', 'done');

            if (photos && photos.length > 0) {
              // Bucket'a göre grupla, batch signed URL
              const byBucket = new Map();
              for (const p of photos) {
                const b = p.storage_bucket || 'autoixpert-photos';
                if (!byBucket.has(b)) byBucket.set(b, []);
                byBucket.get(b).push(p);
              }
              const allSigned = [];
              for (const [bucket, bp] of byBucket) {
                const paths = bp.map((p) => p.storage_path);
                const { data: signedList } = await sb.storage.from(bucket).createSignedUrls(paths, 3600);
                bp.forEach((p, idx) => {
                  const url = signedList?.[idx]?.signedUrl;
                  if (url) {
                    allSigned.push({
                      id: 'ax_' + p.id,
                      sourceType: 'autoixpert',
                      url,
                      title: p.title || p.original_name || 'Foto',
                      created_at: p.downloaded_at,
                      _raw: p,
                    });
                  }
                });
              }
              // En yeni en başta
              axPhotos = allSigned.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
            }
          }
        }

        const all = [...axPhotos, ...damagePhotos];
        if (!cancelled) setAvailablePhotos(all);
      } catch (e) {
        console.error('[wizard photos]', e);
      } finally {
        if (!cancelled) setPhotosLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, customerId, db?.appraisals, db?.vehicles, db?.damage_photos]);

  // Schadenshöhe değişince BVSK koridorunu otomatik öner
  useEffect(() => {
    setBvskHB(suggestBVSK(calc.repairCostNet));
  }, [calc.repairCostNet]);

  if (!open) return null;

  const step = STEPS[stepIdx];

  // ─── Total Loss kontrolü ────────────────────────────────────────────
  const isEconomicTotalLoss = (() => {
    const r = parseFloat(calc.repairCostNet) || 0;
    const w = parseFloat(calc.devaluation) || 0;
    const wb = parseFloat(calc.replacementValue) || 0;
    if (wb === 0) return false;
    return r + w > wb * 1.30;
  })();

  // ─── Zorunlu alan kontrolü ──────────────────────────────────────────
  const canProceed = (() => {
    if (step.key === 'accident') return accident.date && accident.location.trim();
    if (step.key === 'damages') return Object.values(damageAreas).some(Boolean);
    if (step.key === 'calc') return calc.repairCostNet && calc.replacementValue;
    if (step.key === 'narrative') return unfallhergang.trim() && bemerkung.trim();
    return true;
  })();

  // ─── AI ile metin üret ──────────────────────────────────────────────
  const handleGenerate = async (kind) => {
    setGenerating(true);
    setError(null);
    try {
      const context = {
        customer: customer ? {
          name: customer.full_name || customer.company,
          city: customer.city,
        } : null,
        vehicle: vehicle ? {
          plate: vehicle.plate,
          make: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
        } : null,
        report_type: reportType,
        accident,
        damages: Object.keys(damageAreas).filter((k) => damageAreas[k]),
        calculation: calc,
        is_total_loss: isEconomicTotalLoss,
      };
      const res = await generateText(kind, context);
      if (kind === 'unfallhergang') setUnfallhergang(res.text);
      if (kind === 'gutachter_bemerkung') setBemerkung(res.text);
    } catch (e) {
      setError(e.message || 'AI metin üretilemedi');
    } finally {
      setGenerating(false);
    }
  };

  // ─── Final draft kur ve gönder ──────────────────────────────────────
  const handleSubmit = () => {
    const tokens = String(customer?.full_name || '').trim().split(/\s+/);
    const firstName = tokens[0] || '';
    const lastName = tokens.slice(1).join(' ') || '';

    const draft = {
      claimant: {
        company: customer?.company || '',
        salutation: '',
        firstName,
        lastName,
        street: customer?.street || '',
        zip: customer?.zip || '',
        city: customer?.city || '',
        phone: customer?.phone || '',
        email: customer?.email || '',
        plate: vehicle ? parsePlateStr(vehicle.plate) : { city: '', initials: '', number: '' },
        canDeductTax: false,
        isOwner: true,
        representedByLawyer: false,
      },
      report: {
        type: reportType,
        assessor: 'Rohat Gecit',
        fileNumber: '',
        completionDate: '',
        orderingMethod: 'kişisel',
        orderDate: accident.date,
        orderTime: accident.time,
        intermediary: '',
      },
      accident: {
        date: accident.date,
        time: accident.time,
        location: accident.location,
        policeRecorded: accident.policeRecorded,
        policeCaseNumber: accident.policeCaseNumber,
        circumstances: unfallhergang,
      },
      visit: {
        place: customer?.city || '',
        date: new Date().toISOString().slice(0, 10),
        time: '',
        assessor: 'Rohat Gecit',
        presentAssessor: true,
        presentClaimant: true,
      },
      vehicle: {
        vin: vehicle?.chassis || vehicle?.vin || '',
        manufacturer: vehicle?.brand || '',
        mainType: vehicle?.model || '',
        yearOfManufacture: vehicle?.year ? String(vehicle.year) : '',
        firstRegistration: vehicle?.first_registration || '',
        shape: 'sedan',
        engineType: 'diesel',
        axles: 2,
        doors: 4,
        seats: 5,
        previousOwners: 1,
      },
      condition: {
        mileageRead: '',
        mileageEstimated: '',
        mileageUnit: 'km',
        paintCondition: '',
        generalCondition: '',
        bodyCondition: '',
        interiorCondition: '',
        drivability: '',
        serviceBookKept: false,
      },
      damages: {
        areas: damageAreas,
        previousRepaired: '',
        oldUnrepaired: '',
        subsequentDamage: '',
      },
      tires: { dimension: '', treadMm: '', manufacturer: '', season: 'allyear' },
      calculation: {
        provider: 'dat',
        repairCostNet: calc.repairCostNet,
        repairCostGross: calc.repairCostNet
          ? String((parseFloat(calc.repairCostNet) * (1 + (calc.vatRate || 19) / 100)).toFixed(2))
          : '',
        vatRate: calc.vatRate || 19,
        devaluation: calc.devaluation,
        replacementValue: calc.replacementValue,
        residualValue: calc.residualValue,
        repairDuration: calc.repairDuration,
        isTotalLoss: isEconomicTotalLoss,
        isEconomicTotalLoss,
        notes: bemerkung,
      },
      invoice: {
        feeTable: 'BVSK 2024',
        selectedHB: bvskHB,
        photoCount: photoCount,
        travelFlat: true,
        travelFee: 55,
        postageAndPhone: 25,
        vatRate: 19,
        daysUntilDue: 14,
      },
      signatures,
      // Rapora eklenecek seçili fotolar — PDF generator bu listeyi kullanır
      selectedPhotos: availablePhotos
        .filter((p) => selectedPhotoIds.has(p.id))
        .map((p) => ({
          id: p.id,
          url: p.url,
          title: p.title,
          sourceType: p.sourceType,
        })),
    };

    onComplete?.(draft);
  };

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)' }}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: 640, zIndex: 51,
              background: C.surface, borderLeft: `1px solid ${C.border}`,
              boxShadow: '-8px 0 24px rgba(0,0,0,0.12)',
              display: 'flex', flexDirection: 'column',
            }}>

            {/* Header — adım göstergesi */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{step.title}</div>
                    <div style={{ fontSize: 11, color: C.textDim }}>
                      Adım {stepIdx + 1} / {STEPS.length} — {customer?.full_name || customer?.company || 'Müşteri'} · {vehicle?.plate || '—'}
                    </div>
                  </div>
                </div>
                <button onClick={onClose} type="button"
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'transparent', border: `1px solid ${C.border}`,
                    color: C.textDim, cursor: 'pointer', fontSize: 16,
                  }}>×</button>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
                  style={{ height: '100%', background: C.neon, borderRadius: 2 }}
                />
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {step.key === 'review' && <StepReview customer={customer} vehicle={vehicle} />}
              {step.key === 'type' && <StepReportType value={reportType} onChange={setReportType} />}
              {step.key === 'accident' && <StepAccident value={accident} onChange={setAccident} />}
              {step.key === 'damages' && <StepDamages value={damageAreas} onChange={setDamageAreas} />}
              {step.key === 'photos' && (
                <StepPhotos
                  photos={availablePhotos}
                  loading={photosLoading}
                  selected={selectedPhotoIds}
                  onToggle={(id) => setSelectedPhotoIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })}
                  onSelectAll={() => setSelectedPhotoIds(new Set(availablePhotos.map((p) => p.id)))}
                  onClearAll={() => setSelectedPhotoIds(new Set())}
                />
              )}
              {step.key === 'calc' && <StepCalc value={calc} onChange={setCalc} isEconomicTotalLoss={isEconomicTotalLoss} />}
              {step.key === 'bvsk' && <StepBVSK value={bvskHB} onChange={setBvskHB} suggested={suggestBVSK(calc.repairCostNet)} photoCount={photoCount} />}
              {step.key === 'narrative' && (
                <StepNarrative
                  unfallhergang={unfallhergang} setUnfallhergang={setUnfallhergang}
                  bemerkung={bemerkung} setBemerkung={setBemerkung}
                  generating={generating} onGenerate={handleGenerate}
                  error={error}
                />
              )}
              {step.key === 'signatures' && <StepSignatures value={signatures} onChange={setSignatures} />}
              {step.key === 'submit' && (
                <StepSubmit
                  customer={customer} vehicle={vehicle}
                  reportType={reportType} accident={accident}
                  damageAreas={damageAreas} calc={calc} bvskHB={bvskHB}
                  isEconomicTotalLoss={isEconomicTotalLoss}
                />
              )}
            </div>

            {/* Footer */}
            <div style={{
              borderTop: `1px solid ${C.border}`, padding: '14px 20px',
              background: 'rgba(0,0,0,0.015)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
            }}>
              <button onClick={() => setStepIdx((i) => Math.max(0, i - 1))} type="button"
                disabled={stepIdx === 0}
                style={{
                  padding: '10px 16px', borderRadius: 8,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: stepIdx === 0 ? C.textDim : C.text,
                  cursor: stepIdx === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
                  opacity: stepIdx === 0 ? 0.4 : 1,
                }}>
                ← Geri
              </button>
              <div style={{ fontSize: 11, color: C.textDim }}>
                {STEPS[stepIdx].label}
              </div>
              {stepIdx < STEPS.length - 1 ? (
                <button onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))} type="button"
                  disabled={!canProceed}
                  style={{
                    padding: '10px 18px', borderRadius: 8,
                    background: canProceed ? C.neon : 'rgba(0,0,0,0.08)',
                    color: canProceed ? '#fff' : C.textDim,
                    border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 600,
                    boxShadow: canProceed ? `0 4px 14px ${C.glow}` : 'none',
                  }}>
                  İleri →
                </button>
              ) : (
                <button onClick={handleSubmit} type="button"
                  style={{
                    padding: '10px 18px', borderRadius: 8,
                    background: '#16A34A', color: '#fff', border: 'none',
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
                  }}>
                  ✓ Kaydet & Form'a Uygula
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function StepReview({ customer, vehicle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 13, color: C.textDim }}>
        Müşteri ve araç bilgileri sistemden çekildi. Doğru olduğundan emin ol → İleri.
      </p>
      <InfoCard title="👤 Müşteri" rows={[
        ['Ad / Firma', customer?.full_name || customer?.company || '—'],
        ['Tip',        customer?.type === 'kurumsal' ? 'Kurumsal' : 'Bireysel'],
        ['E-posta',    customer?.email || '—'],
        ['Telefon',    customer?.phone || '—'],
        ['Adres',      [customer?.street, customer?.zip, customer?.city].filter(Boolean).join(' ') || '—'],
      ]} />
      <InfoCard title="🚗 Araç" rows={vehicle ? [
        ['Plaka',  vehicle.plate || '—'],
        ['Marka',  vehicle.brand || '—'],
        ['Model',  vehicle.model || '—'],
        ['Yıl',    vehicle.year || '—'],
        ['VIN',    vehicle.chassis || vehicle.vin || '—'],
        ['Renk',   vehicle.color || '—'],
        ['Yakıt',  vehicle.fuel || '—'],
      ] : [['Bilgi yok', '—']]} />
    </div>
  );
}

function StepReportType({ value, onChange }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: C.textDim, marginBottom: 12 }}>
        Hangi tür rapor hazırlıyoruz?
      </p>
      <div style={{ display: 'grid', gap: 10 }}>
        {REPORT_TYPES.map((t) => (
          <button key={t.key} onClick={() => onChange(t.key)} type="button"
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 14,
              borderRadius: 12, textAlign: 'left',
              background: value === t.key ? `${t.color}10` : C.surface,
              border: `${value === t.key ? '2px' : '1px'} solid ${value === t.key ? t.color : C.border}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <span style={{ fontSize: 26 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                {t.label} <span style={{ fontWeight: 400, color: C.textDim, fontSize: 12 }}>({t.key})</span>
              </div>
              <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 2 }}>{t.desc}</div>
            </div>
            {value === t.key && <span style={{ fontSize: 18, color: t.color }}>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepAccident({ value, onChange }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Kaza Tarihi *">
        <input type="date" value={value.date} onChange={(e) => set('date')(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Saat">
        <input type="time" value={value.time} onChange={(e) => set('time')(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Yer / Adres *">
        <input type="text" placeholder="örn. B10 Otoyolu Aachen Çıkışı"
          value={value.location} onChange={(e) => set('location')(e.target.value)} style={inputStyle} />
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={value.policeRecorded} onChange={(e) => set('policeRecorded')(e.target.checked)} />
        <span style={{ fontSize: 13, color: C.text }}>Polis tutanağı tutuldu</span>
      </label>
      {value.policeRecorded && (
        <Field label="Tutanak Numarası">
          <input type="text" placeholder="örn. AC-2026-0512"
            value={value.policeCaseNumber} onChange={(e) => set('policeCaseNumber')(e.target.value)} style={inputStyle} />
        </Field>
      )}
    </div>
  );
}

function StepDamages({ value, onChange }) {
  const toggle = (k) => onChange({ ...value, [k]: !value[k] });
  const selectedCount = Object.values(value).filter(Boolean).length;
  return (
    <div>
      <p style={{ fontSize: 13, color: C.textDim, marginBottom: 12 }}>
        Hasarlı bölgeleri seç (çoklu seçim) — <strong>{selectedCount} seçili</strong>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {DAMAGE_AREAS.map((a) => {
          const isOn = !!value[a.key];
          return (
            <button key={a.key} onClick={() => toggle(a.key)} type="button"
              style={{
                padding: '10px 8px', borderRadius: 10, fontSize: 11.5, fontWeight: 600,
                background: isOn ? `${C.neon}15` : C.surface,
                color: isOn ? C.neon : C.text,
                border: `${isOn ? '2px' : '1px'} solid ${isOn ? C.neon : C.border}`,
                cursor: 'pointer', textAlign: 'center', transition: 'all 0.12s',
              }}>
              {isOn && '✓ '}{a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepCalc({ value, onChange, isEconomicTotalLoss }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Reparaturkosten (Tamir maliyeti) — netto € *">
        <input type="number" placeholder="0" value={value.repairCostNet}
          onChange={(e) => set('repairCostNet')(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Wertminderung (Değer kaybı) — €">
        <input type="number" placeholder="0" value={value.devaluation}
          onChange={(e) => set('devaluation')(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Wiederbeschaffungswert (Yeniden alım değeri) — € *">
        <input type="number" placeholder="0" value={value.replacementValue}
          onChange={(e) => set('replacementValue')(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Restwert (Kalıntı değer) — € (opsiyonel)">
        <input type="number" placeholder="0" value={value.residualValue}
          onChange={(e) => set('residualValue')(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Reparaturdauer (Tamir süresi) — gün">
        <input type="number" placeholder="0" value={value.repairDuration}
          onChange={(e) => set('repairDuration')(e.target.value)} style={inputStyle} />
      </Field>
      {isEconomicTotalLoss && (
        <div style={{
          padding: 12, borderRadius: 10,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.30)',
          fontSize: 12.5, color: '#B91C1C', lineHeight: 1.5,
        }}>
          ⚠️ <strong>Wirtschaftlicher Totalschaden tespit edildi.</strong> (Reparaturkosten + Wertminderung) &gt; Wiederbeschaffungswert × 130%.
          Tamir mantıklı değil; ödeme = Wiederbeschaffungswert − Restwert olarak hesaplanacak.
        </div>
      )}
    </div>
  );
}

function StepPhotos({ photos, loading, selected, onToggle, onSelectAll, onClearAll }) {
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.textDim, fontSize: 13 }}>
        Fotoğraflar yükleniyor…
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div style={{
        padding: 32, textAlign: 'center',
        background: 'rgba(0,0,0,0.025)', border: `1px dashed ${C.border}`,
        borderRadius: 12, fontSize: 13, color: C.textDim,
      }}>
        📷 Bu müşteri için kayıtlı fotoğraf yok.
        <div style={{ fontSize: 11, marginTop: 8 }}>
          AutoiXpert'ten henüz indirilmemiş veya damage_photos'a yüklenmemiş olabilir.
          Sonra elle de eklenebilir.
        </div>
      </div>
    );
  }

  const selectedCount = selected.size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <p style={{ fontSize: 13, color: C.textDim, margin: 0 }}>
          Rapora eklenecek fotoları seç. Toplam <strong>{photos.length}</strong> foto · seçili <strong style={{ color: C.neon }}>{selectedCount}</strong>
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onSelectAll} type="button"
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.text, cursor: 'pointer',
            }}>
            Tümünü Seç
          </button>
          <button onClick={onClearAll} type="button"
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: 'transparent', border: `1px solid ${C.border}`,
              color: C.textDim, cursor: 'pointer',
            }}>
            Temizle
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8,
      }}>
        {photos.map((p) => {
          const isOn = selected.has(p.id);
          return (
            <button key={p.id} onClick={() => onToggle(p.id)} type="button"
              style={{
                position: 'relative', aspectRatio: '1', borderRadius: 10,
                background: '#000', overflow: 'hidden',
                border: `${isOn ? '3px' : '1px'} solid ${isOn ? C.neon : C.border}`,
                cursor: 'pointer', padding: 0,
                transition: 'all 0.12s',
                boxShadow: isOn ? `0 0 0 2px ${C.neon}33` : 'none',
              }}
              title={p.title}>
              {p.url ? (
                <img src={p.url} alt={p.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#888', fontSize: 24,
                }}>📷</div>
              )}
              {/* Sol-üst checkbox */}
              <div style={{
                position: 'absolute', top: 4, left: 4,
                width: 20, height: 20, borderRadius: 6,
                background: isOn ? C.neon : 'rgba(0,0,0,0.6)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                border: `1px solid ${isOn ? '#fff' : 'rgba(255,255,255,0.4)'}`,
              }}>
                {isOn ? '✓' : ''}
              </div>
              {/* Kaynak tipi rozet */}
              <div style={{
                position: 'absolute', top: 4, right: 4,
                fontSize: 8, fontWeight: 700, padding: '2px 5px',
                borderRadius: 4, letterSpacing: '0.04em',
                background: p.sourceType === 'autoixpert' ? 'rgba(59,130,246,0.85)' : 'rgba(16,185,129,0.85)',
                color: '#fff',
              }}>
                {p.sourceType === 'autoixpert' ? 'aX' : 'DMG'}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        padding: 10, borderRadius: 8,
        background: `${C.neon}08`, border: `1px solid ${C.neon}33`,
        fontSize: 11.5, color: C.text,
      }}>
        💡 Sachverständigen-Standart: <strong>en az 8-12 foto</strong>, kapsamlı raporlar için 20-30. Hasarın görülebilirliği için detay foto önemli.
      </div>
    </div>
  );
}

function StepBVSK({ value, onChange, suggested, photoCount }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: C.textDim }}>
        BVSK 2024 koridoru. Sistem önerisi: <strong style={{ color: C.neon }}>{suggested}</strong>
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {BVSK_LEVELS.map((b) => {
          const isOn = value === b.key;
          const isSuggested = b.key === suggested;
          return (
            <button key={b.key} onClick={() => onChange(b.key)} type="button"
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 12,
                borderRadius: 10, textAlign: 'left',
                background: isOn ? `${C.neon}10` : C.surface,
                border: `${isOn ? '2px' : '1px'} solid ${isOn ? C.neon : C.border}`,
                cursor: 'pointer',
              }}>
              <div style={{
                fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
                padding: '4px 10px', borderRadius: 6,
                background: isOn ? C.neon : 'rgba(0,0,0,0.05)',
                color: isOn ? '#fff' : C.text,
                minWidth: 60, textAlign: 'center',
              }}>{b.key}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {b.schaden}
                  {isSuggested && (
                    <span style={{
                      marginLeft: 8, padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: `${C.neon}15`, color: C.neon, letterSpacing: '0.05em',
                    }}>ÖNERİ</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{b.desc}</div>
              </div>
              {isOn && <span style={{ fontSize: 16, color: C.neon }}>✓</span>}
            </button>
          );
        })}
      </div>
      <div style={{
        padding: '10px 12px', borderRadius: 8,
        background: 'rgba(0,0,0,0.025)', border: `1px solid ${C.border}`,
        fontSize: 12, color: C.textDim,
      }}>
        📷 <strong>{photoCount}</strong> foto seçildi (Nebenkosten için: {photoCount} × 2,50 € = {(photoCount * 2.5).toFixed(2)} €).
        Foto sayısını değiştirmek için <strong>Foto</strong> adımına dön.
      </div>
    </div>
  );
}

function StepNarrative({ unfallhergang, setUnfallhergang, bemerkung, setBemerkung, generating, onGenerate, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <p style={{ fontSize: 13, color: C.textDim }}>
        Serbest metin alanları. AI ile taslak üretip düzenleyebilirsin.
      </p>

      <Field label="Unfallhergang (Kaza akışı — Almanca)" hint="Topladığın kaza verisinden AI Almanca paragraf yazar.">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <button type="button" onClick={() => onGenerate('unfallhergang')} disabled={generating}
            style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: `${C.neon}15`, color: C.neon, border: `1px solid ${C.neon}40`,
              cursor: generating ? 'wait' : 'pointer',
            }}>
            🪄 {generating ? 'Yazıyor...' : 'AI ile yaz'}
          </button>
        </div>
        <textarea rows={5} value={unfallhergang}
          onChange={(e) => setUnfallhergang(e.target.value)}
          placeholder="örn. Zum Schadenhergang sind Einzelheiten nicht bekannt geworden..."
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
      </Field>

      <Field label="Gutachter-Bemerkung (Uzman görüşü — Almanca)" hint="Hasar tutarı, Wertminderung, total loss kontrolü özetlenir.">
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <button type="button" onClick={() => onGenerate('gutachter_bemerkung')} disabled={generating}
            style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: `${C.neon}15`, color: C.neon, border: `1px solid ${C.neon}40`,
              cursor: generating ? 'wait' : 'pointer',
            }}>
            🪄 {generating ? 'Yazıyor...' : 'AI ile yaz'}
          </button>
        </div>
        <textarea rows={5} value={bemerkung}
          onChange={(e) => setBemerkung(e.target.value)}
          placeholder="örn. Aufgrund der durchgeführten Inaugenscheinnahme..."
          style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical' }} />
      </Field>

      {error && (
        <div style={{
          padding: 10, borderRadius: 8,
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)',
          color: '#B91C1C', fontSize: 12,
        }}>⚠️ {error}</div>
      )}
    </div>
  );
}

function StepSignatures({ value, onChange }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v });
  const items = [
    { key: 'order', label: 'Auftrag (Sipariş İmzası)', desc: 'Müşteri ekspertiz siparişini imzaladı' },
    { key: 'cancel', label: 'Abtretungserklärung (Devir Beyanı)', desc: 'Tazminat alacağı sigortaya devredildi' },
    { key: 'dataProtection', label: 'Datenschutz (KVKK/GDPR)', desc: 'Kişisel veri işleme onayı verildi' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((it) => (
        <label key={it.key}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12,
            borderRadius: 10, cursor: 'pointer',
            background: value[it.key] ? `${C.neon}08` : C.surface,
            border: `1px solid ${value[it.key] ? `${C.neon}55` : C.border}`,
          }}>
          <input type="checkbox" checked={value[it.key]} onChange={(e) => set(it.key)(e.target.checked)}
            style={{ marginTop: 2, width: 18, height: 18 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{it.label}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{it.desc}</div>
          </div>
        </label>
      ))}
    </div>
  );
}

function StepSubmit({ customer, vehicle, reportType, accident, damageAreas, calc, bvskHB, isEconomicTotalLoss }) {
  const damages = Object.keys(damageAreas).filter((k) => damageAreas[k]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 13, color: C.textDim }}>
        Aşağıdaki veriler müşterinin Ekspertiz alanına kaydedilecek:
      </p>
      <InfoCard title="📋 Rapor Özeti" rows={[
        ['Tür', reportType],
        ['Müşteri', customer?.full_name || customer?.company || '—'],
        ['Plaka', vehicle?.plate || '—'],
        ['Marka/Model', `${vehicle?.brand || '—'} ${vehicle?.model || ''}`],
        ['Kaza Tarihi', accident.date],
        ['Yer', accident.location],
        ['Hasar Sayısı', `${damages.length} bölge`],
        ['Reparaturkosten', calc.repairCostNet ? `${calc.repairCostNet} € netto` : '—'],
        ['Wertminderung', calc.devaluation ? `${calc.devaluation} €` : '—'],
        ['Total Loss', isEconomicTotalLoss ? '⚠️ Evet (130%-Regel)' : 'Hayır'],
        ['BVSK', bvskHB],
      ]} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════════════════════════════

function InfoCard({ title, rows }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.025)', border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10, letterSpacing: '0.02em' }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 6, fontSize: 12 }}>
        {rows.map(([k, v], i) => (
          <React.Fragment key={i}>
            <div style={{ color: C.textDim }}>{k}</div>
            <div style={{ color: C.text, fontWeight: 500, wordBreak: 'break-word' }}>{v}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: C.text, marginBottom: 4, letterSpacing: '0.02em' }}>
        {label}
      </div>
      {hint && <div style={{ fontSize: 10.5, color: C.textDim, marginBottom: 6 }}>{hint}</div>}
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  background: C.surface, color: C.text,
  border: `1px solid ${C.border}`,
  fontSize: 13, outline: 'none',
};
