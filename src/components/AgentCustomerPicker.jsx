// Agent Customer Picker — Modal: müşteri seç → (varsa) araç seç → onPick(customerId, vehicleId)
// "Agent ile Doldur" tıklandığında bu modal açılır; seçim sonrası drawer'a customer + vehicle ID geçer.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { C } from '../utils/tokens.js';

export default function AgentCustomerPicker({ open, onClose, onPick, db }) {
  const [step, setStep] = useState('customer'); // 'customer' | 'vehicle'
  const [search, setSearch] = useState('');
  const [pickedCustomer, setPickedCustomer] = useState(null);
  const inputRef = useRef(null);

  // Açılınca state sıfırla, input'a focus ver
  useEffect(() => {
    if (!open) return;
    setStep('customer');
    setSearch('');
    setPickedCustomer(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const customers = db?.customers || [];
  const vehicles = db?.vehicles || [];

  // Filtreli müşteri listesi (arama)
  const filtered = useMemo(() => {
    if (!search.trim()) {
      // Default: en son eklenenler önce (created_at DESC)
      return customers.slice().sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }
    const q = search.toLowerCase();
    return customers.filter((c) => {
      const haystack = [
        c.full_name,
        c.company,
        c.email,
        c.phone,
        c.tax_no,
      ].filter(Boolean).join(' ').toLowerCase();
      // Plaka ile arama: müşterinin araçlarındaki plakalardan herhangi biri eşleşirse
      const customerVehicles = vehicles.filter((v) => v.owner_id === c.id);
      const plateMatch = customerVehicles.some((v) =>
        (v.plate || '').toLowerCase().includes(q),
      );
      return haystack.includes(q) || plateMatch;
    });
  }, [customers, vehicles, search]);

  const handleCustomerPick = (customer) => {
    const ownVehicles = vehicles.filter((v) => v.owner_id === customer.id);
    if (ownVehicles.length === 0) {
      // Aracı yok → direkt agent'ı başlat
      onPick({ customerId: customer.id, vehicleId: null });
    } else if (ownVehicles.length === 1) {
      // Tek aracı var → otomatik seç
      onPick({ customerId: customer.id, vehicleId: ownVehicles[0].id });
    } else {
      // Birden fazla araç → araç seçim adımına geç
      setPickedCustomer(customer);
      setStep('vehicle');
    }
  };

  const handleVehiclePick = (vehicleId) => {
    if (!pickedCustomer) return;
    onPick({ customerId: pickedCustomer.id, vehicleId });
  };

  const handleSkip = () => {
    onPick({ customerId: null, vehicleId: null });
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
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.45)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '92%', maxWidth: 560, maxHeight: '82vh',
              zIndex: 61,
              background: C.surface, borderRadius: 16,
              border: `1px solid ${C.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '18px 20px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div className="flex items-center gap-2">
                {step === 'vehicle' && (
                  <button onClick={() => setStep('customer')} type="button"
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: 'transparent', border: `1px solid ${C.border}`,
                      color: C.textDim, cursor: 'pointer', fontSize: 14,
                    }}>←</button>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {step === 'customer' ? 'Müşteri Seç' : `${pickedCustomer?.full_name || pickedCustomer?.company} — Araç Seç`}
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                    {step === 'customer'
                      ? 'Agent rapor için bu müşterinin tüm bilgilerini otomatik alacak'
                      : 'Birden fazla aracı var — hangisi için rapor?'}
                  </div>
                </div>
              </div>
              <button onClick={onClose} type="button"
                aria-label="Kapat"
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.textDim, cursor: 'pointer', fontSize: 16,
                }}>×</button>
            </div>

            {step === 'customer' ? (
              <>
                {/* Arama */}
                <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{
                    position: 'relative',
                    background: 'rgba(0,0,0,0.04)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                  }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%',
                      transform: 'translateY(-50%)', color: C.textDim, fontSize: 14,
                    }}>🔍</span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Ad, firma, telefon, e-posta veya plaka..."
                      style={{
                        width: '100%', padding: '10px 12px 10px 36px',
                        background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 13, color: C.text,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: C.textDim, marginTop: 6 }}>
                    {filtered.length} müşteri{search ? ` (filtre)` : ''}
                  </div>
                </div>

                {/* Liste */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '8px 12px',
                }}>
                  {filtered.length === 0 ? (
                    <div style={{
                      padding: '32px 16px', textAlign: 'center',
                      color: C.textDim, fontSize: 13,
                    }}>
                      {search ? `"${search}" için sonuç yok` : 'Hiç müşteri yok'}
                    </div>
                  ) : (
                    filtered.map((c) => (
                      <CustomerRow
                        key={c.id}
                        customer={c}
                        vehicles={vehicles.filter((v) => v.owner_id === c.id)}
                        onClick={() => handleCustomerPick(c)}
                      />
                    ))
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  padding: '14px 20px', borderTop: `1px solid ${C.border}`,
                  background: 'rgba(0,0,0,0.015)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 11, color: C.textDim }}>
                    Müşteri yoksa → agent yeni müşteri ekleyebilir
                  </span>
                  <button onClick={handleSkip} type="button"
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: 'transparent', border: `1px solid ${C.border}`,
                      color: C.textDim, cursor: 'pointer',
                      fontSize: 12, fontWeight: 500,
                    }}>
                    Müşterisiz devam →
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Vehicle picker */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '12px 16px',
                }}>
                  {pickedCustomer && vehicles.filter((v) => v.owner_id === pickedCustomer.id).map((v) => (
                    <VehicleRow key={v.id} vehicle={v} onClick={() => handleVehiclePick(v.id)} />
                  ))}
                </div>
                <div style={{
                  padding: '14px 20px', borderTop: `1px solid ${C.border}`,
                  background: 'rgba(0,0,0,0.015)',
                  display: 'flex', justifyContent: 'flex-end', gap: 10,
                }}>
                  <button onClick={() => handleVehiclePick(null)} type="button"
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: 'transparent', border: `1px solid ${C.border}`,
                      color: C.textDim, cursor: 'pointer',
                      fontSize: 12, fontWeight: 500,
                    }}>
                    Araçsız devam →
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Customer Row ───────────────────────────────────────────────────────
function CustomerRow({ customer, vehicles, onClick }) {
  const displayName = customer.full_name || customer.company || '(İsimsiz)';
  const subText = customer.type === 'kurumsal'
    ? customer.full_name || customer.tax_no
    : customer.company || customer.email;
  // İlk araç bilgisi (özet için)
  const firstVehicle = vehicles[0];

  // İnisyaller
  const initials = String(displayName).split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

  return (
    <button onClick={onClick} type="button"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 10,
        background: 'transparent', border: `1px solid transparent`,
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,0,0,0.035)';
        e.currentTarget.style.borderColor = C.border;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: customer.type === 'kurumsal'
          ? 'linear-gradient(135deg, #06B6D4, #0284C7)'
          : `linear-gradient(135deg, ${C.neon}, ${C.neon}AA)`,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, letterSpacing: '0.02em',
      }}>
        {initials || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
        }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{displayName}</span>
          <span style={{
            fontSize: 9.5, padding: '1px 6px', borderRadius: 4,
            background: customer.type === 'kurumsal' ? 'rgba(6,182,212,0.12)' : 'rgba(227,6,19,0.10)',
            color: customer.type === 'kurumsal' ? '#0E7490' : C.neon,
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {customer.type === 'kurumsal' ? 'Firma' : 'Bireysel'}
          </span>
        </div>
        <div style={{
          fontSize: 11, color: C.textDim,
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          {subText && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{subText}</span>}
          {customer.phone && <span>📞 {customer.phone}</span>}
          {firstVehicle && (
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              🚗 {firstVehicle.plate}{vehicles.length > 1 ? ` +${vehicles.length - 1}` : ''}
            </span>
          )}
        </div>
      </div>
      <span style={{ fontSize: 12, color: C.textDim }}>→</span>
    </button>
  );
}

// ─── Vehicle Row ────────────────────────────────────────────────────────
function VehicleRow({ vehicle, onClick }) {
  return (
    <button onClick={onClick} type="button"
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', borderRadius: 10, marginBottom: 6,
        background: 'rgba(0,0,0,0.025)', border: `1px solid ${C.border}`,
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.neon;
        e.currentTarget.style.background = `${C.neon}08`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
        e.currentTarget.style.background = 'rgba(0,0,0,0.025)';
      }}>
      <div style={{
        fontFamily: 'monospace', fontWeight: 700, fontSize: 14,
        padding: '5px 10px', borderRadius: 6,
        background: '#fff', border: '1.5px solid #1F2937',
        color: '#1F2937', letterSpacing: '0.04em',
        flexShrink: 0,
      }}>
        {vehicle.plate || '— —'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {vehicle.brand || 'Bilinmiyor'} {vehicle.model || ''}
        </div>
        <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
          {[vehicle.year, vehicle.color, vehicle.fuel].filter(Boolean).join(' · ')}
          {vehicle.chassis && <span style={{ fontFamily: 'monospace', marginLeft: 6 }}>VIN: {vehicle.chassis.slice(-6)}</span>}
        </div>
      </div>
      <span style={{ fontSize: 12, color: C.textDim }}>→</span>
    </button>
  );
}
