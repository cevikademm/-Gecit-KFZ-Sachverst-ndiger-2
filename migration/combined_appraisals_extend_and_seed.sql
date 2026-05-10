-- ════════════════════════════════════════════════════════════════════════
-- BİRLEŞİK MIGRATION: Appraisals Extend + Reference Gutachten Seed
-- ════════════════════════════════════════════════════════════════════════
-- Bu dosya tek seferde çalıştırılır. Supabase SQL Editor → New query →
-- bu dosyanın TAMAMINI yapıştır → Run.
--
-- 2 bölüm:
--   1. appraisals tablosuna agent için kolonları ekler
--   2. Issa Aya referans Gutachten'ini Ekspertiz alanına ekler
-- Idempotent: tekrar çalıştırılabilir, varsa atlar.
-- ════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────
-- BÖLÜM 1 — appraisals tablosu kolon eklemeleri
-- ──────────────────────────────────────────────────────────────────────

ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS customer_id        text REFERENCES customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS draft_data         jsonb,
  ADD COLUMN IF NOT EXISTS created_by         text NOT NULL DEFAULT 'manual'
    CHECK (created_by IN ('manual', 'ai_agent', 'autoixpert')),
  ADD COLUMN IF NOT EXISTS agent_session_id   text REFERENCES gutachten_agent_sessions(id) ON DELETE SET NULL;

-- Backfill: mevcut appraisals için customer_id'yi vehicle.owner_id'den doldur
UPDATE appraisals a
   SET customer_id = v.owner_id
  FROM vehicles v
 WHERE a.vehicle_id = v.id
   AND a.customer_id IS NULL;

-- Performans index'leri
CREATE INDEX IF NOT EXISTS idx_appraisals_customer    ON appraisals(customer_id);
CREATE INDEX IF NOT EXISTS idx_appraisals_created_by  ON appraisals(created_by);
CREATE INDEX IF NOT EXISTS idx_appraisals_session     ON appraisals(agent_session_id);

-- PostgREST schema cache reload (kolonlar görünür olsun)
NOTIFY pgrst, 'reload schema';


-- ──────────────────────────────────────────────────────────────────────
-- BÖLÜM 2 — Issa Aya referans Gutachten seed
-- ──────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_customer_id text;
  v_vehicle_id text;
  v_existing_appraisal text;
BEGIN
  -- 1. Müşteri: Issa Aya
  SELECT id INTO v_customer_id
  FROM customers
  WHERE full_name ILIKE '%Issa%Aya%' OR full_name ILIKE '%Aya%Issa%'
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO customers (full_name, type, street, zip, city, created_at)
    VALUES ('Issa Aya', 'bireysel', 'Robert Koch Str. 6', '52477', 'Alsdorf', now())
    RETURNING id INTO v_customer_id;
    RAISE NOTICE 'Yeni müşteri oluşturuldu: % (Issa Aya)', v_customer_id;
  ELSE
    RAISE NOTICE 'Mevcut müşteri kullanıldı: %', v_customer_id;
  END IF;

  -- 2. Araç: AC AI 88 (Smart forfour)
  SELECT id INTO v_vehicle_id
  FROM vehicles
  WHERE plate ILIKE 'AC%AI%88' OR chassis = 'WME4530441Y068496'
  LIMIT 1;

  IF v_vehicle_id IS NULL THEN
    INSERT INTO vehicles (
      owner_id, plate, brand, model, year, chassis, color, fuel, engine_cc, created_at
    )
    VALUES (
      v_customer_id, 'AC AI 88',
      'Smart', 'forfour (11.2014->2022)', 2016,
      'WME4530441Y068496', 'Grau Silber', 'Diesel', 898, now()
    )
    RETURNING id INTO v_vehicle_id;
    RAISE NOTICE 'Yeni araç oluşturuldu: % (AC AI 88)', v_vehicle_id;
  ELSE
    UPDATE vehicles SET owner_id = v_customer_id
      WHERE id = v_vehicle_id AND owner_id IS NULL;
    RAISE NOTICE 'Mevcut araç kullanıldı: %', v_vehicle_id;
  END IF;

  -- 3. Appraisal: Aktenzeichen GA-HS-2026-04-052 (idempotent kontrol)
  SELECT id INTO v_existing_appraisal
  FROM appraisals
  WHERE draft_data->>'_reference_aktenzeichen' = 'GA-HS-2026-04-052'
  LIMIT 1;

  IF v_existing_appraisal IS NOT NULL THEN
    RAISE NOTICE 'Bu Aktenzeichen zaten kayıtlı: % — atlanıyor', v_existing_appraisal;
    RETURN;
  END IF;

  INSERT INTO appraisals (
    vehicle_id, customer_id, status, date, expert,
    notes, draft_data, created_by,
    created_at, updated_at
  )
  VALUES (
    v_vehicle_id, v_customer_id, 'tamamlandi',
    '2026-04-30', 'Rohat Gecit',
    'Haftpflichtschaden — Smart forfour AC AI 88. Reparaturkosten 3.129,04 € netto. Wiederbeschaffungswert 8.450 €. Wiederherstellungsaufwand 44%. Reparaturschaden, freigegeben.',
    $JSON$
{
  "_reference_aktenzeichen": "GA-HS-2026-04-052",
  "_reference_pdf_pages": 29,
  "_reference_photo_count": 27,
  "_reference_summary": {
    "schadenklasse": "Reparaturschaden",
    "schadenhoehe_netto": 3129.04,
    "schadenhoehe_mwst": 594.52,
    "schadenhoehe_brutto": 3723.56,
    "wiederherstellungsaufwand_pct": 44,
    "fiktive_abrechnung": true,
    "reparaturdauer_tage": "2-3",
    "nutzungsausfall_per_tag": 35.00,
    "mietwagenklasse": "2 - Kleinwagen",
    "wbw_steuerneutral": 8450.00,
    "wbw_dauer_kalendertage": 14,
    "merkantiler_minderwert": null,
    "restwert": null,
    "beilackierung_erforderlich": true,
    "achsvermessung_erforderlich": false,
    "karosserievermessung_erforderlich": false
  },
  "claimant": {
    "company": "", "salutation": "Frau",
    "firstName": "Issa", "lastName": "Aya",
    "street": "Robert Koch Str. 6", "zip": "52477", "city": "Alsdorf",
    "phone": "", "email": "",
    "plate": { "city": "AC", "initials": "AI", "number": "88" },
    "canDeductTax": false, "isOwner": true, "representedByLawyer": false
  },
  "report": {
    "type": "Sorumluluk talebi", "assessor": "Rohat Gecit",
    "fileNumber": "GA-HS-2026-04-052",
    "completionDate": "2026-04-30",
    "orderingMethod": "kişisel",
    "orderDate": "2026-04-30", "orderTime": "11:00",
    "intermediary": ""
  },
  "accident": {
    "date": "2026-04-30", "time": "11:00",
    "location": "Robert Koch Str. 6, 52477 Alsdorf",
    "policeRecorded": false, "policeCaseNumber": "",
    "circumstances": "Zum Schadenhergang sind Einzelheiten nicht bekannt geworden."
  },
  "visit": {
    "place": "Issa Aya (Anspruchsteller)",
    "street": "Robert Koch Str 6", "zip": "52477", "city": "Alsdorf",
    "date": "2026-04-30", "time": "11:00",
    "assessor": "Rohat Gecit",
    "presentAssessor": true, "presentClaimant": true,
    "conditions": "ausreichend"
  },
  "vehicle": {
    "vin": "WME4530441Y068496",
    "manufacturer": "Smart",
    "mainType": "forfour (11.2014->2022)",
    "subType": "Basis 66 kW (453.044)",
    "kbaCode": "1313/EJJ",
    "datEuropaCode": "01 560 070 044 0004",
    "ausstattungslinie": "Design- und Ausstattungslinie passion",
    "powerKw": "66", "powerPs": "90", "displacement": "898",
    "engineConfig": "3-Zylinder / Reihenmotor", "cylinders": "3",
    "transmission": "5-Gang manuell",
    "yearOfManufacture": "2016",
    "firstRegistration": "2016-03-23", "lastRegistration": "2025-05-28",
    "nextInspection": "2026-10",
    "shape": "coupe", "engineType": "diesel",
    "axles": 4, "poweredAxles": 1, "doors": 4, "seats": 4,
    "previousOwners": null
  },
  "condition": {
    "mileageRead": "112977", "mileageEstimated": "112977", "mileageUnit": "km",
    "paintCondition": "dem Alter entsprechend",
    "generalCondition": "dem Alter entsprechend",
    "bodyCondition": "dem Alter entsprechend",
    "interiorCondition": "dem Alter entsprechend",
    "drivability": "Das Fahrzeug war nach dem Schadenereignis rollfähig, konnte sich aber nicht aus eigener Kraft fortbewegen.",
    "serviceBookKept": false,
    "emissionGroup": 4, "emissionNorm": "EU6",
    "paintColor": "Grau Silber Metallic", "paintType": "2-Schicht", "paintCode": "ER2"
  },
  "damages": {
    "areas": {
      "frontLeft": true, "frontCenter": true, "frontRight": false,
      "fenderFrontLeft": false, "hood": false, "fenderFrontRight": false,
      "doorDriver": false, "windshield": false, "doorFrontPassenger": false,
      "doorBackPassengerLeft": false, "roof": false, "doorBackPassengerRight": false,
      "fenderRearLeft": false, "fenderRearRight": false,
      "rearLeft": false, "rearWindow": false, "rearCenter": false, "rearRight": true
    },
    "previousRepaired": "",
    "oldUnrepaired": "Stoßstange hinten; Seitenwand Fahrerseite; Stoßstange vorne",
    "subsequentDamage": "",
    "airbagsTriggered": false
  },
  "tires": {
    "dimension": "165/65 R 15", "treadMm": "5",
    "manufacturer": "", "season": "allyear"
  },
  "calculation": {
    "provider": "dat",
    "repairCostNet": "3129.04", "repairCostGross": "3723.56", "vatRate": 19,
    "laborHours": "10.55", "laborCostPerHour": "178.50",
    "paintCostNet": "2354.96", "sparePartsNet": "328.26",
    "sparePartsSurcharge": 20, "smallParts": 2,
    "devaluation": "0", "replacementValue": "8450", "residualValue": "",
    "repairDuration": "3",
    "isTotalLoss": false, "isEconomicTotalLoss": false,
    "notes": "Beilackierung erforderlich (Grau Silber Metallic 2-Schicht). Achsvermessung und Karosserievermessung nicht erforderlich. DEKRA Reparatur-Stundensätze (DRS) der Region. Beurteilung: Reparaturschaden, aus Sachverständigensicht freigegeben."
  },
  "invoice": {
    "feeTable": "BVSK 2024", "selectedHB": "HB III",
    "photoCount": 27,
    "travelFlat": true, "travelFee": 55,
    "postageAndPhone": 25,
    "vatRate": 19, "daysUntilDue": 14
  },
  "signatures": { "order": true, "cancel": true, "dataProtection": true }
}
$JSON$::jsonb,
    'ai_agent',
    now(), now()
  );

  RAISE NOTICE 'Referans Gutachten eklendi: GA-HS-2026-04-052 → müşteri %, araç %', v_customer_id, v_vehicle_id;
END $$;


-- ──────────────────────────────────────────────────────────────────────
-- DOĞRULAMA
-- ──────────────────────────────────────────────────────────────────────

-- Kolonlar var mı?
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'appraisals'
   AND column_name IN ('customer_id', 'draft_data', 'created_by', 'agent_session_id')
 ORDER BY column_name;

-- AI Agent rozetli appraisals listesi
SELECT
  a.id,
  a.draft_data->>'_reference_aktenzeichen' AS aktenzeichen,
  c.full_name AS musteri,
  v.plate AS plaka,
  a.created_by, a.status
FROM appraisals a
LEFT JOIN customers c ON c.id = a.customer_id
LEFT JOIN vehicles v ON v.id = a.vehicle_id
WHERE a.created_by = 'ai_agent'
ORDER BY a.created_at DESC
LIMIT 5;
