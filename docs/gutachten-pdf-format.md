# Gecit-KFZ-Sachverständigenbüro — Gutachten PDF Format Spec

**Kaynak:** Gerçek üretim raporu (Issa Aya, AC AI 88, Aktenzeichen GA-HS-2026-04-052) tersine mühendisliği.
**Standart uzunluk:** 29 sayfa
**Yapan:** Sachverständiger Rohat Gecit, Am Gutshof 37, 52080 Aachen
**Üretim aracı:** AutoiXpert + DAT myClaim

Bu doküman gelecekteki PDF generator için **kesin** referanstır. Agent draft'ı bu spec'e uygun veri üretmek zorunda.

---

## 1. Üst Header (Her Sayfada)

```
[Logo: GECIT-KFZ SACHVERSTÄNDIGER]    📞 +49 157 3262 436 2     ✉ gecit.kfz.sachverstaendiger@gmail.com
Gecit-Kfz-Sachverständigenbüro
```

## 2. Alt Footer (Her Sayfada)

```
Gecit-Kfz-Sachverständiger          Am Gutshof 37
Rohat Gecit                          52080                                   N von 29
www.gecit-kfz-sachverständigenbüro.de  Aachen
```

---

## 3. Sayfa Sayfa İçerik

### Sayfa 1 — Kapak

| Element | İçerik | Stil |
|---|---|---|
| Üst başlık | Rapor türü (Haftpflichtschaden / Kasko / Wertgutachten) | 60pt, koyu gri |
| Plaka rozeti | DE plaka (örn. AC ⊙ AI 88) | Mavi-beyaz, 80pt |
| Anspruchsteller kutusu | "Frau/Herr Adı Soyadı" | KIRMIZI dolgu, beyaz yazı |
| Aktenzeichen | GA-HS-YYYY-MM-NNN | sol orta |
| Datum | TT.MM.YYYY | sağ orta |
| Hersteller | Marka adı + logo daire | sol alt orta |
| Modell | Model adı | sağ alt orta |
| Ayraç çizgi | — | gri |
| Sachverständiger | "Rohat Gecit" | merkezde, 24pt |

### Sayfa 2 — Zusammenfassung

```
Gecit-KFZ-Sachverständigen Büro – Am gutshof 37 – 52080 Aachen

Frau / Herr
Adı Soyadı
Sokak No
PLZ Şehir

                                                    Aachen, TT.MM.YYYY

[plaka rozeti]    │    Aktenzeichen
                  │    GA-HS-YYYY-MM-NNN

Zusammenfassung

Es handelt sich um einen Reparaturschaden.    (veya Totalschaden)

┌───────────────────┬──────────────────────────────────────┬──────────────┐
│ Schadenhöhe       │ Reparaturkosten ohne MwSt.           │ X.XXX,XX €   │
│                   │ Schadenhöhe ohne MwSt.               │ X.XXX,XX €   │
│                   │ Schadenhöhe inkl. MwSt. (XXX,XX €)   │ X.XXX,XX €   │
│                   │ Wiederherstellungsaufwand ÷ WBW      │ XX %         │
│                   │ Fiktive Abrechnung                   │ Ja/Nein      │
├───────────────────┼──────────────────────────────────────┼──────────────┤
│ Reparatur         │ Reparaturkosten inkl. MwSt.          │ X.XXX,XX €   │
│                   │ Reparaturdauer                       │ ca. N-M Tage │
├───────────────────┼──────────────────────────────────────┼──────────────┤
│ Nutzungsausfall   │ Entschädigung pro Tag                │ XX,XX €      │
│                   │ Mietwagenklasse                      │ N - Sınıf    │
├───────────────────┼──────────────────────────────────────┼──────────────┤
│ Fahrzeugwert      │ Wiederbeschaffungswert (steuerneutral)│ X.XXX,XX €   │
│                   │ Wiederbeschaffungsdauer              │ N Kalendert. │
└───────────────────┴──────────────────────────────────────┴──────────────┘
```

### Sayfa 3 — Beteiligte, Besichtigungen & Auftrag

3 tablo:

**Anspruchsteller** — Name / Straße / PLZ Ort / Vorsteuerabzug

**Besichtigung** — Datum-Uhrzeit / Besichtigung bei / Ort / Sachverständiger / Anwesende

**Auftrag** — Datum / Erteilt durch / Beauftragung (persönlich / telefonisch / schriftlich)

Standart paragraf: _"Gemäß Auftrag wurde das in den Fahrzeugdaten näher bezeichnete Fahrzeug zur Beweissicherung und Feststellung der Schadenhöhe besichtigt und darüber ein Gutachten erstellt."_

### Sayfa 4 — Inhaltsverzeichnis

Otomatik. Sayfa numaraları sağa hizalı, başlıklar sola.

### Sayfa 5 — Fahrzeugdaten (Fahrzeug + Zustand)

**Fahrzeug** tablosu (17 satır):
- Amtliches Kennzeichen
- Hersteller
- Modell/Haupttyp
- Untertyp
- Baujahr
- Erstzulassung
- Letzte Zulassung
- Fahrzeugart (Coupé / Limousine / Kombi / SUV / ...)
- Fahrzeugidentifikationsnummer (VIN)
- Schlüssel-Nr.
- Antriebsart (Diesel/Benzin/Elektro + N-Zylinder + Reihenmotor/V/Boxer)
- Getriebe (5-Gang manuell / 7-Gang DSG / Automatik)
- Leistung /Hubraum (kW / ccm)
- Anzahl Türen
- Achsen (davon angetrieben) — örn. "2 (1)" veya "4 (1)"
- Sitzplätze
- Schadstoffgruppe (Abgasnorm) — yeşil rozet (Gruppe 4 = EU6)

**Zustand** tablosu (8 satır):
- Allgemeinzustand (default: "dem Alter entsprechend")
- Karosseriezustand
- Innenraumzustand
- Lackzustand
- Lack (örn. "Grau Silber Metallic (2-Schicht)")
- Laufleistung abgelesen (km)
- Laufleistung geschätzt (km)
- Nächste HU (MM/YYYY)

### Sayfa 6 — Bereifung + Vorschäden + Fahrfähigkeit + Zustand bei Besichtigung

**Bereifung** — araç şeması + tablo:
| Achse | Position | Dimension | Hersteller | Art | Profil |

Çoklu aks desteği (motorrad: 2 aks, PKW: 2 aks, transporter: 2-3 aks, LKW: 4+ aks).

**Nicht reparierte Vorschäden** — bullet list:
- Stoßstange hinten
- Seitenwand Fahrerseite
- vb.

**Fahrfähigkeit** — paragraf, örn:
- "Das Fahrzeug ist fahrbereit."
- "Das Fahrzeug war nach dem Schadenereignis rollfähig, konnte sich aber nicht aus eigener Kraft fortbewegen."
- "Das Fahrzeug ist nicht fahrbereit."

**Zustand des Fahrzeugs bei Besichtigung**:
> "Besichtigungsort: [Anspruchsteller], [Adres]
> Während der Besichtigung am [DATUM] war das Fahrzeug [unzerlegt/zerlegt]. Das Fahrzeug befand sich offensichtlich noch im gleichen Zustand wie unmittelbar nach dem Schadenereignis. Die Besichtigungsbedingungen waren ausreichend."

### Sayfa 7 — Anstoß-/Schadenbereich + Airbags + Quelle der technischen Daten

**Anstoß-/Schadenbereich** — Araç üstten görünüm şeması:
- 21 standart bölge (frontLeft, frontCenter, ..., rearRight)
- Hasarlı bölgeler **kırmızı oklar** ile işaretli
- Sol-üst, ön-orta, ön-sağ, kapı, çamurluk, cam, tavan, arka cam, arka köşeler vb.

**Airbags** — paragraf:
- "Durch das Schadensereignis wurden die Airbags im Fahrzeug nicht ausgelöst."
- veya: "Die Front-/Seitenairbags wurden ausgelöst."

**Quelle der technischen Daten**:
> "Der Fahrzeugschein lag bei der Besichtigung im Original vor und diente als Grundlage zur Erhebung der technischen Daten. Die Fahrzeugidentifikationsnummer wurde durch den Sachverständigen [NAME] am Fahrzeug überprüft."

### Sayfa 8-9 — Instandsetzungskosten — Boilerplate

**Grundlage der Instandsetzungskostenermittlung** — uzun standart paragraf (DAT EDV-Kalkulation, Hersteller AWs, Reparaturlogik, "P" Prüfen pozisyonları, Hinweis bloğu).

**Beilackierung erforderlich** — eğer renk eşleşmesi zorsa, paragraf gösterilir.

**Achsvermessung (nicht erforderlich)** — boilerplate (nadiren erforderlich olur).

**Karosserievermessung (nicht erforderlich)** — boilerplate.

**Instandsetzung/Ersatz von Kunststoffteilen** — boilerplate.

### Sayfa 10-12 — Reparaturkostenkalkulation (DAT formatı)

**Reparaturkosten-Kalkulation** başlığı:
- Vorgangsname
- Auftragsnummer (= Aktenzeichen)
- Anlagedatum
- Ordnungsnummer

**Fahrzeugdaten** bloğu (DAT formatı, sol-sağ iki sütun):
- Hersteller, Haupttyp, Untertyp, VIN
- DAT €uropa-Code®
- KBA-Schlüssel
- Ausstattungslinie
- Motor / Karosserie / Getriebe
- Bauzeit
- Sağ: Amtliches Kennzeichen, Erstzulassung, Letzte Zulassung, Nächste HU, Laufleistung Anzeige, Laufleistung geschätzt, Fahrzeugfarbe, Farbcode

**Halter** bloğu — adres

**Serienausstattung** — KBA kod + açıklama listesi (2 sütun)

**Sonderausstattung** — KBA kod + açıklama listesi (2 sütun)

**Ersatzteile** — başlık + tablo:
- Teile-Aufschlag: 20,00%
- Sütunlar: RC, DVN, ETN, Benennung, Anz., Pr./Stk., Ges. Pr.

**Arbeitslohn** — tablo:
- Sütunlar: RC, DVN, APN, Benennung, Art (K/M/E/A/S), Stufe, Std., Pr./Std., Ges. Pr.

**Lackierung** — başlık + tablo:
- Lackiermethode: Eurolack | Lackart: Metallic (2-Schicht)
- Sütunlar: LS, DVN, Stufe, Benennung, Std., Lohn, MK (45,00), Ges. Pr.

**Zusammenfassung** blokları:
- Summenblock Ersatzteile (laut Einzelaufstellung + 2% Verbrauchsmaterial)
- Summenblock Arbeitslohn (Karosserie + Mechanik + Elektrik + ...)
- Summenblock Lackierung (Lohn + Material + Toplam)
- Gesamtsummen (Ersatzteile + Arbeitslöhne + Lackierung)
- **Reparaturkosten netto** + Mehrwertsteuer 19% + **Reparaturkosten brutto**

### Sayfa 13 — Legende + Werkstattkostensätze + Reparaturrisiken + Reparaturdauer

**Legende** — DAT Kürzel açıklamaları (#, (, ), », IFL, BFA, ✓, ^, RC, APN, ETN, vb.)

**Werkstattkostensätze**:
> "Bei den Arbeitslöhnen in der Kalkulation wurden die durchschnittlichen DEKRA Reparatur-Stundensätze (DRS) der Region verwendet."

**Reparaturrisiken** — boilerplate (yukarı bak)

**Reparaturdauer** — başlık + paragraf

### Sayfa 14 — Wiederbeschaffungswert + Merkantiler Minderwert + Restwertermittlung + Nutzungsentschädigung + Beurteilung

**Wiederbeschaffungswert** — sağ-hizalı:
- Wiederbeschaffungswert: X.XXX €
- Wiederbeschaffungsdauer: ca. N Kalendertage
- Besteuerungsart: steuerneutral / regelbesteuert / differenzbesteuert

Paragraf: standart açıklama (Erhaltungszustand, Investitionen, Bereifung, Sonderzubehör, HU, Marktlage)

**Merkantiler Minderwert** — başlık + boilerplate (varsa tutar, yoksa "keiner")

**Restwertermittlung** — başlık + boilerplate (varsa tutar, yoksa "keine")

**Nutzungsentschädigung pro Ausfalltag** — sağ-hizalı:
- Entschädigung pro Ausfalltag: XX,XX € (Gruppe: ?)
- Mietwagenklasse: N - SınıfAdı

Paragraf: "Schwacke entnommen (Berechnungsschema Sanden/Danner)."

**Beurteilung** — sağ-hizalı: Schadenklasse: Reparaturschaden / Totalschaden / Wirtschaftlicher Totalschaden

Paragraf: kostengünstige Instandsetzung + freigegeben

### Sayfa 15 — Gutachtenfertigstellung

```
Gutachtenfertigstellung

Lichtbilder wurden dem Originalgutachten sowie der Gutachtenkopie beigefügt.

Dieses Gutachten umfasst:
  • N Seiten
  • M Fotos

Aachen, den TT.MM.YYYY

Der Sachverständige

Rohat Gecit
```

### Sayfa 16+ — Fotoanlage

Başlık: "Fotoanlage"
Düzen: 2 foto/sayfa (büyük format), her foto altına "Foto N" başlığı.
Genelde 20-30 foto: dış görünümler (4 köşe, 4 yan), iç görünümler (kokpit, koltuklar), detay (VIN levha, ruhsat, odometre), hasar yakın çekim, lastik vb.

---

## 4. Aktenzeichen Üretme Mantığı

```
GA-{TYPE}-{YYYY}-{MM}-{NNN}

TYPE:
  HS = Haftpflichtschaden
  TK = Teilkasko
  VK = Vollkasko
  WG = Wertgutachten
  KV = Kostenvoranschlag (kısa rapor)
  LR = Leasingrückläufer
  AT = Oldtimer-Wertgutachten
  GW = Gebrauchtwagen-Check
  RP = Rechnungsprüfung

YYYY: 4 hane yıl
MM: 2 hane ay
NNN: 3 hane sıra (yıl içinde sıfırdan başlar, her ay sıfırlanmaz)
```

---

## 5. Standart Almanca Boilerplate Listesi

Bunlar tam olarak şu metinler:

| Anahtar | Metin |
|---|---|
| `auftrag` | Gemäß Auftrag wurde das in den Fahrzeugdaten näher bezeichnete Fahrzeug zur Beweissicherung und Feststellung der Schadenhöhe besichtigt und darüber ein Gutachten erstellt. |
| `zustand_besichtigung` | Während der Besichtigung am [DATUM] war das Fahrzeug unzerlegt. Das Fahrzeug befand sich offensichtlich noch im gleichen Zustand wie unmittelbar nach dem Schadenereignis. Die Besichtigungsbedingungen waren ausreichend. |
| `quelle_techdaten` | Der Fahrzeugschein lag bei der Besichtigung im Original vor und diente als Grundlage zur Erhebung der technischen Daten. Die Fahrzeugidentifikationsnummer wurde durch den Sachverständigen [NAME] am Fahrzeug überprüft. |
| `airbags_nicht` | Durch das Schadensereignis wurden die Airbags im Fahrzeug nicht ausgelöst. |
| `airbags_ausgeloest` | Durch das Schadensereignis wurden die [Front-/Seiten-]Airbags ausgelöst. |
| `achsvermessung_nicht` | Aufgrund des vorliegenden Schadenbildes ist nicht von einer Beschädigung der Fahrzeugachsen auszugehen. Deshalb ist eine Achsvermessung nicht erforderlich. |
| `karosserievermessung_nicht` | Aufgrund des vorliegenden Schadenbildes ist nicht von einer Beschädigung des Fahrzeugrahmens auszugehen. Deshalb ist eine Karosserievermessung nicht erforderlich. |
| `kunststoff_keine_analyse` | Das vorliegende Schadensbild erfordert keine gesonderte Analyse der Wirtschaftlichkeit zwischen dem Ersatz oder der Instandsetzung von Kunststoffbauteilen. |
| `werkstattkostensaetze` | Bei den Arbeitslöhnen in der Kalkulation wurden die durchschnittlichen DEKRA Reparatur-Stundensätze (DRS) der Region verwendet. |
| `reparaturrisiken_keine` | Im angetroffenen Zustand ließ die Schadenaufnahme eine ausreichende Schadenfeststellung zu. Wesentliche Reparaturrisiken sind nicht gegeben. ... |
| `reparaturdauer_text` | Bei der Beurteilung der Reparaturdauer wird davon ausgegangen, dass die Instandsetzung des Fahrzeuges zügig und ohne Unterbrechung durchgeführt wird. ... |
| `wbw_text` | Der Wiederbeschaffungswert für das beschädigte Fahrzeug wurde für den Zeitpunkt vor Eintritt des Schadenereignisses unter Berücksichtigung des Erhaltungszustandes, der Investitionen, der Bereifung, des mitbewerteten Sonderzubehörs, der nächsten Hauptuntersuchung, der allgemeinen und der derzeitigen örtlichen Marktlage ermittelt. |
| `merkantiler_keiner` | Aufgrund der Schadenart und des Schadenumfangs sind die Voraussetzungen für einen merkantilen Minderwert nicht gegeben. |
| `restwert_keine` | Auf die Ermittlung eines Restwertes wurde in Anbetracht der hohen Differenz zwischen dem zu erwartenden Wiederbeschaffungswert und den voraussichtlichen Reparaturkosten verzichtet. |
| `nutzungsausfall_text` | Die ausgewiesene Nutzungsentschädigung für das beschädigte Fahrzeug pro schadenbedingtem Ausfalltag wurde der Liste Eurotax - Schwacke entnommen (Berechnungsschema Sanden/Danner). |
| `beurteilung_freigegeben` | Die durch die EDV-Kalkulation ausgewiesenen Reparaturkosten und der vom Sachverständigen vorgeschlagene Reparaturweg gewährleisten eine kostengünstige Instandsetzung unter Berücksichtigung der technischen Voraussetzungen und der Sicherheitserfordernisse. Die Reparatur wurde aus Sachverständigensicht freigegeben. |

---

## 6. Mietwagenklasse → Nutzungsausfall (Schwacke)

| Klasse | Sınıf | Tipik Araç | €/Tag |
|---|---|---|---|
| 1 | Mikrowagen | Smart fortwo, Fiat 500 | 23 |
| 2 | Kleinwagen | Smart forfour, VW Polo, Ford Ka, Fiat Panda | 35 |
| 3 | Kompaktwagen | VW Golf, Audi A3, Ford Focus, Opel Astra | 38 |
| 4 | Mittelklasse | BMW 3er, Mercedes C, Audi A4, Passat | 50 |
| 5 | Obere Mittelklasse | BMW 5er, E-Klasse, A6, Insignia | 65 |
| 6 | Oberklasse | S-Klasse, A8, BMW 7er | 79 |
| SUV | bir sınıf üstte fiyatlandır | | +5..15 |
| Van/Transporter | sınıf 4-5 arası | | 45-60 |

---

## 7. BVSK 2024 Honorarkoridor (özet)

| Schadenshöhe | HB I | HB II | HB III* | HB IV | HB V |
|---|---|---|---|---|---|
| 500 € | 185 | 211 | **306** | 299 | 265-306 |
| 750 € | 225 | 256 | **365** | 359 | 320-365 |
| 1.000 € | 268 | 301 | **425** | 418 | 376-425 |
| 1.500 € | 318 | 358 | **488** | 481 | 425-488 |
| 2.000 € | 350 | 393 | **536** | 528 | 469-536 |
| 3.000 € | 401 | 451 | **615** | 605 | 540-615 |
| 5.000 € | 484 | 543 | **743** | 731 | 654-743 |
| 7.500 € | 568 | 638 | **870** | 856 | 766-870 |
| 10.000 € | 644 | 723 | **985** | 970 | 868-985 |
| 15.000 € | 791 | 888 | **1212** | 1193 | 1066-1212 |
| 20.000 € | 922 | 1035 | **1411** | 1390 | 1242-1411 |
| 25.000 € | 1041 | 1169 | **1593** | 1568 | 1402-1593 |

*HB III = default koridor.

Nebenkosten:
- Foto: 2.50 €/Stk (ilk set), 1.50 €/Stk (kopya set)
- Yol/Reise: 55 € flat (≤30km), aksi €/km
- Schreibgebühr: 1.80 €/Seite
- Schreibkopie: 0.50 €/Seite
- Porto + Telefon: 25 € flat

---

## 8. Foto Düzeni

Tipik foto seti (en az 12, ortalama 20-30):

| # | Konu |
|---|---|
| 1-4 | 4 yön dış görünüm (Front, Hinten, Links, Rechts) |
| 5-6 | Kennzeichen yakın (TÜV pulu görünür) |
| 7 | Odometre (km göstergesi) |
| 8 | Fahrzeugschein (ruhsat) |
| 9-10 | Genel köşe görünümler |
| 11-15 | Hasar yakın çekim (her bölge için 2-3 foto) |
| 16-20 | Detay: lastik diş, lastik yan duvar (DOT), şasi numarası levhası |
| 21-25 | İç mekan: koltuklar, direksiyon, kombi, vites |
| 26-27 | Önceki hasar / aşınma kanıtları |

Genelde 27-30 foto. Kapak fotosu = front-left 3/4 view.

---

## 9. Veri Akışı Özeti

```
[Müşteri/Araç DB] ─┐
                    ├→ [Agent Wizard 9 adım] ─→ [Draft JSON] ─→ [PDF Generator] ─→ [29 sayfa PDF]
[DAT myClaim] ─────┘
                                                      │
                                                      ↓
                                              [Supabase Storage]
                                                      │
                                                      ↓
                                              [appraisals.draft_data]
                                              [autoixpert_documents (PDF binary)]
```

**Şu an mevcut:** Draft JSON üretimi (agent wizard).
**Henüz yok:** PDF generator (bu spec'e göre yapılacak — `src/utils/generateGutachtenPDF.js` zaten var ama kısa formatta).
