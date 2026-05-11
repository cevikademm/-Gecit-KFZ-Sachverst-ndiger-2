// Dosya Durum Paneli — saf türetme (Case Ownership Engine)
// Bir appraisal'ın "şu an kimde", "hangi adımda", "ne kadar bekliyor"
// olduğunu hesaplar. UI tarafında useMemo ile cache'lenir.
//
// Kullanım:
//   import { getCaseOwnership } from '../utils/caseOwnership.js';
//   const own = getCaseOwnership(appraisal, db);
//   own.currentParty // 'admin' | 'customer' | 'insurance' | 'lawyer' | 'closed' | 'unknown'

import { PARTY_COLORS, PARTY_LABELS } from './tokens.js';

// STAGES'lerden türetilen "admin'de devam ediyor" sayılan durumlar.
// (App.jsx içinde STAGES export edilmediği için burada key'leri sabit tutuyoruz.)
const ADMIN_IN_PROGRESS_STATUSES = new Set(['bekliyor', 'mekanik', 'kaporta', 'rapor']);

// Stage → progress yüzdesi (App.jsx STAGES ile birebir)
const STAGE_PCT = {
  bekliyor: 20,
  mekanik: 45,
  kaporta: 70,
  rapor: 90,
  tamamlandi: 100,
};

// SLA — bir parti dosyayı bu kadar saatten fazla beklettiyse "gecikti"
export const PARTY_SLA_HOURS = {
  admin: 72,
  insurance: 168,   // 7 gün
  customer: 240,    // 10 gün
  lawyer: 168,
};

// Avukat ataması — getAssignedLawyer (mevcut helper App.jsx içinde, burada da yardımcı koyalım)
export function getAssignedLawyer(customerId, db) {
  const a = (db?.lawyer_assignments || []).find((x) => x.customer_id === customerId);
  return a ? (db?.lawyers || []).find((l) => l.id === a.lawyer_id) : null;
}

// Sigorta ataması — yeni helper (mevcut yok)
export function getAssignedInsurer(customerId, db) {
  const a = (db?.insurance_assignments || []).find((x) => x.customer_id === customerId);
  return a ? (db?.insurers || []).find((i) => i.id === a.insurer_id) : null;
}

// Bir appraisal için en son ilgili insurance_claim'i bul
function findClaimForAppraisal(appraisal, db) {
  if (!appraisal) return null;
  const claims = db?.insurance_claims || [];
  // 1) appraisal_id direkt eşleşme
  const direct = claims.find((c) => c.appraisal_id === appraisal.id);
  if (direct) return direct;
  // 2) vehicle_id + customer_id eşleşme (en yenisini al)
  const veh = (db?.vehicles || []).find((v) => v.id === appraisal.vehicle_id);
  const customerId = veh?.owner_id;
  const matched = claims
    .filter((c) => c.vehicle_id === appraisal.vehicle_id || c.customer_id === customerId)
    .sort((a, b) => (b.claim_date || b.created_at || '').localeCompare(a.claim_date || a.created_at || ''));
  return matched[0] || null;
}

// Bir appraisal/vehicle/customer üçlüsüne dair en son aktiviteyi bul
function findLastEvent(appraisal, customerId, db) {
  if (!appraisal) return null;
  const logs = db?.activity_logs || [];
  const candidates = logs.filter((l) => {
    const t = l?.target;
    if (!t) return false;
    if (t.kind === 'appraisal' && t.id === appraisal.id) return true;
    if (t.kind === 'vehicle' && t.id === appraisal.vehicle_id) return true;
    if (t.kind === 'customer' && t.id === customerId) return true;
    return false;
  });
  candidates.sort((a, b) => (b.created_at || b.timestamp || '').localeCompare(a.created_at || a.timestamp || ''));
  return candidates[0] || null;
}

// Saat farkı (now - iso) → number (saat). null/invalid → null.
function hoursSince(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / 36e5;
}

/**
 * Bir dosyanın anlık ownership'i + sonraki adım + SLA durumu.
 * @returns {{
 *   currentParty: 'admin'|'customer'|'insurance'|'lawyer'|'closed'|'unknown',
 *   partyLabel: string,
 *   partyColor: string,
 *   stage: string,
 *   stagePct: number,
 *   nextAction: string,
 *   lastEvent: object|null,
 *   waitingHours: number|null,
 *   slaWarning: boolean,
 *   slaThreshold: number|null,
 *   claim: object|null,
 *   assignedLawyer: object|null,
 *   assignedInsurer: object|null,
 * }}
 */
export function getCaseOwnership(appraisal, db) {
  const stage = appraisal?.status || 'bekliyor';
  const stagePct = STAGE_PCT[stage] ?? 0;
  const veh = (db?.vehicles || []).find((v) => v.id === appraisal?.vehicle_id);
  const customerId = veh?.owner_id;
  const claim = findClaimForAppraisal(appraisal, db);
  const assignedLawyer = customerId ? getAssignedLawyer(customerId, db) : null;
  const assignedInsurer = customerId ? getAssignedInsurer(customerId, db) : null;
  const lastEvent = findLastEvent(appraisal, customerId, db);

  let currentParty = 'unknown';
  let nextAction = '—';

  if (ADMIN_IN_PROGRESS_STATUSES.has(stage)) {
    currentParty = 'admin';
    nextAction = 'Ekspertiz devam ediyor';
  } else if (stage === 'tamamlandi') {
    // Rapor müşteriye iletildi mi? (appraisal.report_sent_at veya benzeri yok →
    // gönderildiğini göstermek için müşteriye bir rapor mail/notification log'u
    // varsa kabul et. MVP: claim varsa rapor zaten iletilmiş varsay.)
    const claimStatus = (claim?.status || '').toLowerCase();
    if (!claim) {
      // Rapor hazır ama henüz sigortaya gitmedi → karar müşteride
      currentParty = 'customer';
      nextAction = 'Sigortaya iletme kararı bekleniyor';
    } else if (['accepted', 'paid', 'closed'].includes(claimStatus)) {
      currentParty = 'closed';
      nextAction = 'Dosya kapandı';
    } else if (['rejected', 'red', 'reddedildi'].includes(claimStatus)) {
      if (assignedLawyer) {
        currentParty = 'lawyer';
        nextAction = 'İtiraz dilekçesi hazırlanmalı';
      } else {
        currentParty = 'customer';
        nextAction = 'Avukat atayın veya kararı kabul edin';
      }
    } else if (['offer_received', 'teklif_geldi'].includes(claimStatus)) {
      currentParty = 'customer';
      nextAction = 'Sigorta teklifini kabul/red et';
    } else if (['submitted', 'offer_pending', 'pending', 'iletildi'].includes(claimStatus)) {
      currentParty = 'insurance';
      nextAction = 'Sigorta teklifi bekleniyor';
    } else {
      // Bilinmeyen claim status → yine de sigortada say
      currentParty = 'insurance';
      nextAction = 'Sigorta süreci devam ediyor';
    }
  }

  const waitingHours = hoursSince(lastEvent?.created_at || lastEvent?.timestamp);
  const slaThreshold = PARTY_SLA_HOURS[currentParty] || null;
  const slaWarning = !!(slaThreshold && waitingHours != null && waitingHours > slaThreshold);

  return {
    currentParty,
    partyLabel: PARTY_LABELS[currentParty] || PARTY_LABELS.unknown,
    partyColor: PARTY_COLORS[currentParty] || PARTY_COLORS.unknown,
    stage,
    stagePct,
    nextAction,
    lastEvent,
    waitingHours,
    slaWarning,
    slaThreshold,
    claim,
    assignedLawyer,
    assignedInsurer,
  };
}

// Tek bir parti için meta info (renk/label)
export function getPartyMeta(party) {
  return {
    color: PARTY_COLORS[party] || PARTY_COLORS.unknown,
    label: PARTY_LABELS[party] || PARTY_LABELS.unknown,
  };
}

// Bir dosyanın birleşik kronolojisi — CaseTimeline drawer kullanır.
// activity_logs + insurance_claim history + STAGES geçişleri + flow_exec
// olaylarını tek listeye birleştirir.
export function getCaseTimeline(appraisal, db) {
  if (!appraisal) return [];
  const veh = (db?.vehicles || []).find((v) => v.id === appraisal.vehicle_id);
  const customerId = veh?.owner_id;
  const events = [];

  // 1) Ekspertiz oluşturuldu
  if (appraisal.created_at) {
    events.push({
      id: `apr-create-${appraisal.id}`,
      kind: 'stage',
      party: 'admin',
      label: 'Ekspertiz açıldı',
      details: `Plaka: ${veh?.plate || '—'} · ${veh?.brand || ''} ${veh?.model || ''}`.trim(),
      at: appraisal.created_at,
    });
  }

  // 2) Mevcut stage
  events.push({
    id: `apr-stage-${appraisal.id}`,
    kind: 'stage',
    party: 'admin',
    label: `Durum: ${appraisal.status || 'bekliyor'}`,
    details: `İlerleme %${STAGE_PCT[appraisal.status] ?? 0}`,
    at: appraisal.updated_at || appraisal.created_at,
  });

  // 3) Insurance claim
  const claim = findClaimForAppraisal(appraisal, db);
  if (claim) {
    events.push({
      id: `claim-${claim.id}`,
      kind: 'claim',
      party: 'insurance',
      label: `Sigorta talebi: ${claim.status || '—'}`,
      details: claim.damage_description || claim.notes || '—',
      at: claim.claim_date || claim.created_at,
    });
    // Insurance offers
    const offers = (db?.insurance_offers || []).filter((o) => o.claim_id === claim.id);
    offers.forEach((o) => {
      events.push({
        id: `offer-${o.id}`,
        kind: 'offer',
        party: o.status === 'rejected' ? 'lawyer' : 'customer',
        label: `Sigorta teklifi: ${o.amount ? `${o.amount} €` : '—'} (${o.status || '—'})`,
        details: o.description || o.notes || '—',
        at: o.created_at,
      });
    });
  }

  // 4) Activity logs (target ile bağlı)
  const logs = (db?.activity_logs || []).filter((l) => {
    const t = l?.target;
    if (!t) return false;
    if (t.kind === 'appraisal' && t.id === appraisal.id) return true;
    if (t.kind === 'vehicle' && t.id === appraisal.vehicle_id) return true;
    if (t.kind === 'customer' && t.id === customerId) return true;
    return false;
  });
  logs.forEach((l) => {
    let party = 'admin';
    if ((l.action || '').includes('customer')) party = 'customer';
    if ((l.action || '').includes('lawyer')) party = 'lawyer';
    if ((l.action || '').includes('insurance')) party = 'insurance';
    events.push({
      id: `log-${l.id}`,
      kind: l.action === 'flow_exec' ? 'flow' : 'log',
      party,
      label: l.details || l.action || 'Olay',
      details: l.user?.email ? `Kaynak: ${l.user.email}` : '',
      at: l.created_at || l.timestamp,
    });
  });

  // 5) Sırala — en yeni üstte
  events.sort((a, b) => (b.at || '').localeCompare(a.at || ''));
  return events;
}
