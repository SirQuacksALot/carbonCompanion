"use strict";
(function () {
  /* ============================================================
     Konstanten & Modell
     ============================================================ */
  var FIXED = { kWhPerTraining: 30, sensorEmbodied: 2.0, gatewayEmbodied: 80, lifetimeYr: 5, networkKWhPerGB: 0.06 };
  var UNC = { savingsPct: 0.25, gridEF: 0.15, dcEF: 0.15, sensorEmbodied: 0.30, networkKWhPerGB: 0.40, kWhPerTraining: 0.50, inferenceW: 0.20 };

  var GRID = [ { v: 50, k: "gridRenew" }, { v: 400, k: "gridEU" }, { v: 420, k: "gridDE" }, { v: 900, k: "gridCoal" } ];
  var DC = [ { v: 50, k: "dcRenew" }, { v: 350, k: "dcMix" }, { v: 800, k: "dcCoal" } ];

  var PRESETS = {
    buero: { k: "p_buero", baselineMWh: 800, savingsPct: 12, gridEF: 420, numSensors: 250, dataGBday: 40, trainingsPerYear: 6, inferenceW: 120, dcEF: 350 },
    cloud: { k: "p_cloud", baselineMWh: 120, savingsPct: 6, gridEF: 400, numSensors: 150, dataGBday: 120, trainingsPerYear: 52, inferenceW: 400, dcEF: 350 },
    grid:  { k: "p_grid", baselineMWh: 30000, savingsPct: 8, gridEF: 420, numSensors: 5000, dataGBday: 2000, trainingsPerYear: 12, inferenceW: 800, dcEF: 350 },
    grau:  { k: "p_grau", baselineMWh: 300, savingsPct: 4, gridEF: 50, numSensors: 100, dataGBday: 60, trainingsPerYear: 26, inferenceW: 300, dcEF: 800 }
  };

  var LANGS = [
    { code: "en", name: "English" }, { code: "de", name: "Deutsch" }, { code: "pl", name: "Polski" },
    { code: "it", name: "Italiano" }, { code: "es", name: "Español" }, { code: "fr", name: "Français" }
  ];
  var LOCALES = { en: "en-US", de: "de-DE", pl: "pl-PL", it: "it-IT", es: "es-ES", fr: "fr-FR" };

  /* ============================================================
     Übersetzungen (neue Sprachen: einfach einen Block ergänzen)
     ============================================================ */
  var I18N = {
    en: {
      brandSub: "Net Carbon Balance · BIP 2026 · E2", hintTap: "tap me", hintMore: "tap again",
      topicsLabel: "Topics", companionAria: "Tap the companion to show the next piece of information",
      debugCloseAria: "Close", grpTitle: "Parameters", grpSave: "Savings", grpCost: "AI footprint",
      l_baseline: "Managed energy", l_savings: "Savings rate by AI", l_grid: "Grid mix (saved energy)",
      l_sensors: "Sensors", l_data: "Data transfer", l_train: "Training runs / year", l_infer: "Inference (avg load)", l_dc: "Data-center power",
      gridRenew: "Renewable (≈ 50 g/kWh)", gridEU: "EU mix (≈ 400 g/kWh)", gridDE: "DE mix (≈ 420 g/kWh)", gridCoal: "Coal (≈ 900 g/kWh)",
      dcRenew: "Renewable DC (≈ 50 g/kWh)", dcMix: "Average mix (≈ 350 g/kWh)", dcCoal: "Coal (≈ 800 g/kWh)",
      p_buero: "Office building", p_cloud: "Cloud-heavy, small", p_grid: "Smart grid", p_grau: "Green saved, grey computed",
      note: "Illustrative example — not real measurements.",
      u_mwhYr: "MWh/yr", u_gbDay: "GB/day", u_timesYr: "×/yr",
      greeting: "Hi! I'm your <b>Carbon Companion</b>. Tap me — I'll show you the AI's net carbon balance.",
      introPrompt: "Tap the companion to start.",
      v_great: "Strongly worth it", v_good: "Worth it", v_ok: "Uncertain", v_bad: "Not worth it", v_awful: "Clearly negative",
      worthQ: "Is the AI worth it?", worthP: "P(worth it)", w_yes: "yes", w_mid: "marginal", w_no: "no",
      topic_result: "The problem", topic_footprint: "Footprint", topic_uncertainty: "Validation & uncertainty", topic_breakeven: "When it's not worth it", topic_boundary: "What we build", topic_impact: "Impact",
      b_result: "Net {net} CO₂e per year — after subtracting the AI's own footprint.",
      b_footprint: "The footprint has four sources — here's which one dominates.",
      b_uncertainty: "Every factor has a spread — I run 2,000 simulations.",
      b_breakeven: "From {be} savings rate it's worth it — below, it isn't.",
      b_boundary: "I account for the whole AI system — not just the server.",
      r_eyebrow: "Result", r_unit: "CO₂e / year net avoided", r_meta: "Median · 90 % interval {a} … {b}",
      f_eyebrow: "What makes up the footprint?", f_sum: "Total", f_meta: "That is {p} % of the emissions avoided.",
      c_hw: "Hardware", c_data: "Data transfer", c_train: "Training", c_infer: "Inference",
      u_eyebrow: "How certain is this?", u_median: "Median", u_ci: "90 % interval", u_p: "P(worth it)",
      u_meta: "Monte-Carlo over emission factors, savings rate and device balance.",
      be_eyebrow: "When is it not worth it?", be_big: "from {be} %", be_unit: "savings rate the balance is positive",
      be_title: "Not worth it when one of these applies:",
      be_savings: "Savings rate ({s}) is below break-even ({be}).",
      be_green: "The saved energy is almost carbon-free (grid ≈ {g} g/kWh).",
      be_coal: "The data center runs on coal power ({g} g/kWh).",
      be_small: "The site is very small ({m} MWh/yr).",
      sy_eyebrow: "What is accounted for?", sy_sensors: "Sensors & gateways (embodied)", sy_data: "Data transfer (network / IoT)",
      sy_train: "Training (GPU power)", sy_infer: "Inference (always-on)", sy_meta: "Boundary = entire AI system incl. embodied hardware.",
      tag_meas: "measured", tag_est: "factor",
      r_source: "Based on: grid losses ≈ 7 %, smart-meter data 96 values/day, energy use kWh/m²/yr",
      what_hint: "Training runs in the cloud, inference at the edge.",
      what_line: "A measurement & accounting system for the net carbon balance of AI energy management.",
      u_risk: "AI Act: likely minimal risk — documentation and transparency.",
      impact_eyebrow: "Impact",
      impact_line: "A system that turns AI saving energy into a verifiable net carbon balance.",
      impact_next: "Next step: a pilot with real metering on one building or grid.",
      b_impact: "Why fund it? Because carbon accounting only works if the net balance is measurable.",
      glossTitle: "Glossary",
      gl_net: "Net carbon balance", gl_net_d: "Avoided CO₂e minus the AI's own footprint — the result of the balance.",
      gl_co2: "CO₂e", gl_co2_d: "CO₂ equivalent: bundles different greenhouse gases into one unit.",
      gl_ef: "Emission factor", gl_ef_d: "Grams of CO₂e per kWh — converts energy use into emissions.",
      gl_save: "Savings rate", gl_save_d: "Share of energy the AI saves through optimisation.",
      gl_be: "Break-even", gl_be_d: "Savings rate from which the net balance turns positive.",
      gl_train: "Training", gl_train_d: "Model retraining — energy of the GPU/server runs.",
      gl_infer: "Inference", gl_infer_d: "Running the model continuously (always-on).",
      gl_data: "Data transfer", gl_data_d: "Energy to transmit sensor data over the network.",
      gl_hw: "Embodied hardware", gl_hw_d: "CO₂ from manufacturing sensors and gateways, spread over their lifetime.",
      gl_mc: "Monte-Carlo simulation", gl_mc_d: "Many random runs (2,000) to estimate the balance's uncertainty.",
      gl_ci: "90 % interval", gl_ci_d: "Range the result lies in with 90 % probability.",
      gl_p: "P(AI is worth it)", gl_p_d: "Probability that the net balance is greater than zero.",
      tour_help: "Show tutorial",
      tour_next: "Next", tour_back: "Back", tour_skip: "Skip", tour_done: "Done",
      tour_1_t: "The companion", tour_1_d: "Tap the avatar to page through the results. It reacts emotionally to the net balance.",
      tour_2_t: "Worth-it gauge", tour_2_d: "Always shows whether the AI is worth it — and how certain that is.",
      tour_3_t: "Data view", tour_3_d: "The details of the current topic appear here.",
      tour_4_t: "Topics", tour_4_d: "The dots show the topics — click one to jump.",
      tour_5_t: "Language", tour_5_d: "Choose between six languages.",
      tour_6_t: "Debug menu", tour_6_d: "Adjust parameters and scenarios.",
      tour_7_t: "Glossary", tour_7_d: "Look up technical terms."
    },
    de: {
      brandSub: "Netto-Carbon-Balance · BIP 2026 · E2", hintTap: "antippen", hintMore: "nochmal antippen",
      topicsLabel: "Themen", companionAria: "Companion antippen — zeigt die nächste Information",
      debugCloseAria: "Schließen", grpTitle: "Parameter", grpSave: "Einsparung", grpCost: "AI-Fußabdruck",
      l_baseline: "Gesteuerte Energie", l_savings: "Einsparrate durch AI", l_grid: "Strommix (gesparte Energie)",
      l_sensors: "Sensoren", l_data: "Datentransfer", l_train: "Trainingsläufe / Jahr", l_infer: "Inferenz (mittlere Last)", l_dc: "Rechenzentrum-Strom",
      gridRenew: "Erneuerbar (≈ 50 g/kWh)", gridEU: "EU-Mix (≈ 400 g/kWh)", gridDE: "DE-Mix (≈ 420 g/kWh)", gridCoal: "Kohle (≈ 900 g/kWh)",
      dcRenew: "Erneuerbares RZ (≈ 50 g/kWh)", dcMix: "Mittlerer Mix (≈ 350 g/kWh)", dcCoal: "Kohle (≈ 800 g/kWh)",
      p_buero: "Bürogebäude", p_cloud: "Cloud-schwer, klein", p_grid: "Smart Grid", p_grau: "Grün gespart, grau gerechnet",
      note: "Illustratives Rechenbeispiel — keine realen Messwerte.",
      u_mwhYr: "MWh/Jahr", u_gbDay: "GB/Tag", u_timesYr: "×/Jahr",
      greeting: "Hi! Ich bin dein <b>Carbon Companion</b>. Tipp mich an — ich zeige dir die Netto-CO₂-Bilanz der AI.",
      introPrompt: "Tipp den Companion an, um zu starten.",
      v_great: "Lohnt sich stark", v_good: "Lohnt sich", v_ok: "Knapp / unsicher", v_bad: "Lohnt sich nicht", v_awful: "Deutlich negativ",
      worthQ: "Lohnt sich die AI?", worthP: "P(lohnt sich)", w_yes: "ja", w_mid: "knapp", w_no: "nein",
      topic_result: "Das Problem", topic_footprint: "Fußabdruck", topic_uncertainty: "Validierung & Unsicherheit", topic_breakeven: "Wann es sich nicht lohnt", topic_boundary: "Was wir bauen", topic_impact: "Impact",
      b_result: "Netto {net} CO₂e im Jahr — nach Abzug des eigenen AI-Fußabdrucks.",
      b_footprint: "Der Fußabdruck hat vier Quellen — hier siehst du, welche dominiert.",
      b_uncertainty: "Jeder Faktor hat eine Streuung — ich rechne 2.000 Simulationen.",
      b_breakeven: "Ab {be} Einsparrate lohnt es sich — darunter nicht.",
      b_boundary: "Ich bilanzieren das ganze AI-System — nicht nur den Server.",
      r_eyebrow: "Ergebnis", r_unit: "CO₂e / Jahr netto vermieden", r_meta: "Median · 90 %-Intervall {a} … {b}",
      f_eyebrow: "Woraus besteht der Fußabdruck?", f_sum: "Summe", f_meta: "Das sind {p} % der vermiedenen Emissionen.",
      c_hw: "Hardware", c_data: "Datentransfer", c_train: "Training", c_infer: "Inferenz",
      u_eyebrow: "Wie sicher ist das?", u_median: "Median", u_ci: "90 %-Intervall", u_p: "P(lohnt sich)",
      u_meta: "Monte-Carlo über Emissionsfaktoren, Einsparrate und Gerätebilanz.",
      be_eyebrow: "Wann lohnt es sich nicht?", be_big: "ab {be} %", be_unit: "Einsparrate ist die Bilanz positiv",
      be_title: "Nicht lohnenswert, wenn einer dieser Punkte zutrifft:",
      be_savings: "Einsparrate ({s}) liegt unter dem Break-even ({be}).",
      be_green: "Die gesparte Energie ist fast CO₂-frei (Netz ≈ {g} g/kWh).",
      be_coal: "Das Rechenzentrum läuft mit Kohle-Strom ({g} g/kWh).",
      be_small: "Das Objekt ist sehr klein ({m} MWh/Jahr).",
      sy_eyebrow: "Was wird bilanziert?", sy_sensors: "Sensoren & Gateways (verkörpert)", sy_data: "Datentransfer (Netz / IoT)",
      sy_train: "Training (GPU-Strom)", sy_infer: "Inferenz (Dauerbetrieb)", sy_meta: "Bilanzgrenze = gesamtes AI-System inkl. verkörperter Hardware.",
      tag_meas: "gemessen", tag_est: "Faktor",
      r_source: "Basierend auf: Netzverluste ≈ 7 %, Smart-Meter-Daten 96 Werte/Tag, Energieverbrauch kWh/m²/Jahr",
      what_hint: "Training läuft in der Cloud, Inferenz am Edge.",
      what_line: "Ein Mess- und Bilanzierungssystem für die Netto-CO₂-Bilanz des AI-Energiemanagements.",
      u_risk: "AI Act: voraussichtlich minimales Risiko — Dokumentation und Transparenz.",
      impact_eyebrow: "Impact",
      impact_line: "Ein System, das AI-Energieeinsparungen in eine nachprüfbare Netto-CO₂-Bilanz überführt.",
      impact_next: "Nächster Schritt: ein Pilot mit echter Messtechnik an einem Gebäude oder Netz.",
      b_impact: "Warum finanzieren? Weil CO₂-Bilanzierung nur funktioniert, wenn die Nettobilanz messbar ist.",
      glossTitle: "Glossar",
      gl_net: "Netto-Carbon-Balance", gl_net_d: "Vermiedene CO₂e minus der eigene AI-Fußabdruck — das Ergebnis der Bilanz.",
      gl_co2: "CO₂e", gl_co2_d: "CO₂-Äquivalent: fasst verschiedene Treibhausgase in einer Einheit zusammen.",
      gl_ef: "Emissionsfaktor", gl_ef_d: "Gramm CO₂e pro kWh — wandelt Energieverbrauch in Emissionen um.",
      gl_save: "Einsparrate", gl_save_d: "Anteil der Energie, den die AI durch Optimierung einspart.",
      gl_be: "Break-even", gl_be_d: "Einsparrate, ab der die Nettobilanz positiv wird.",
      gl_train: "Training", gl_train_d: "Modell-Retraining — Energie der GPU-/Serverläufe.",
      gl_infer: "Inferenz", gl_infer_d: "Laufende Modellausführung im Dauerbetrieb.",
      gl_data: "Datentransfer", gl_data_d: "Energie für die Übertragung der Sensordaten über das Netz.",
      gl_hw: "Verkörperte Hardware", gl_hw_d: "CO₂ aus der Herstellung von Sensoren und Gateways, über die Lebensdauer verteilt.",
      gl_mc: "Monte-Carlo-Simulation", gl_mc_d: "Viele Zufallsläufe (2.000), um die Unsicherheit der Bilanz zu schätzen.",
      gl_ci: "90 %-Intervall", gl_ci_d: "Bereich, in dem das Ergebnis mit 90 % Wahrscheinlichkeit liegt.",
      gl_p: "P(AI lohnt sich)", gl_p_d: "Wahrscheinlichkeit, dass die Nettobilanz größer als null ist.",
      tour_help: "Tutorial anzeigen",
      tour_next: "Weiter", tour_back: "Zurück", tour_skip: "Überspringen", tour_done: "Fertig",
      tour_1_t: "Der Companion", tour_1_d: "Tippe den Avatar an, um durch die Ergebnisse zu blättern. Er reagiert emotional auf die Nettobilanz.",
      tour_2_t: "Lohnt-sich-Anzeige", tour_2_d: "Zeigt immer, ob sich die AI lohnt — und wie sicher das ist.",
      tour_3_t: "Datenansicht", tour_3_d: "Hier erscheinen die Details zum aktuellen Thema.",
      tour_4_t: "Themen", tour_4_d: "Die Punkte zeigen die Themen — Klicken zum Springen.",
      tour_5_t: "Sprache", tour_5_d: "Wähle zwischen sechs Sprachen.",
      tour_6_t: "Debug-Menü", tour_6_d: "Passe Parameter und Szenarien an.",
      tour_7_t: "Glossar", tour_7_d: "Schlage Fachbegriffe nach."
    },
    pl: {
      brandSub: "Bilans węglowy netto · BIP 2026 · E2", hintTap: "dotknij mnie", hintMore: "dotknij ponownie",
      topicsLabel: "Tematy", companionAria: "Dotknij companiona, aby pokazać następną informację",
      debugCloseAria: "Zamknij", grpTitle: "Parametry", grpSave: "Oszczędność", grpCost: "Ślad AI",
      l_baseline: "Zarządzana energia", l_savings: "Stopa oszczędności AI", l_grid: "Miks sieci (oszczędzana energia)",
      l_sensors: "Czujniki", l_data: "Transfer danych", l_train: "Trenowania / rok", l_infer: "Inferencja (śr. obciążenie)", l_dc: "Zasilanie centrum danych",
      gridRenew: "Odnawialna (≈ 50 g/kWh)", gridEU: "Miks UE (≈ 400 g/kWh)", gridDE: "Miks DE (≈ 420 g/kWh)", gridCoal: "Węgiel (≈ 900 g/kWh)",
      dcRenew: "Odnawialne DC (≈ 50 g/kWh)", dcMix: "Miks średni (≈ 350 g/kWh)", dcCoal: "Węgiel (≈ 800 g/kWh)",
      p_buero: "Biurowiec", p_cloud: "Chmurowy, mały", p_grid: "Smart grid", p_grau: "Zielono zaoszczędzone, szaro liczone",
      note: "Przykład ilustracyjny — nie realne pomiary.",
      u_mwhYr: "MWh/rok", u_gbDay: "GB/dzień", u_timesYr: "×/rok",
      greeting: "Cześć! Jestem Twoim <b>Carbon Companionem</b>. Dotknij mnie — pokażę Ci bilans węglowy AI.",
      introPrompt: "Dotknij companiona, aby zacząć.",
      v_great: "Bardzo się opłaca", v_good: "Opłaca się", v_ok: "Niepewne", v_bad: "Nie opłaca się", v_awful: "Wyraźnie ujemny",
      worthQ: "Czy AI się opłaca?", worthP: "P(opłacalne)", w_yes: "tak", w_mid: "granicznie", w_no: "nie",
      topic_result: "Problem", topic_footprint: "Ślad węglowy", topic_uncertainty: "Walidacja i niepewność", topic_breakeven: "Kiedy się nie opłaca", topic_boundary: "Co budujemy", topic_impact: "Wpływ",
      b_result: "Netto {net} CO₂e rocznie — po odjęciu własnego śladu AI.",
      b_footprint: "Ślad ma cztery źródła — zobacz, które dominuje.",
      b_uncertainty: "Każdy czynnik ma rozrzut — robię 2 000 symulacji.",
      b_breakeven: "Od {be} oszczędności się opłaca — poniżej nie.",
      b_boundary: "Bilansuję cały system AI — nie tylko serwer.",
      r_eyebrow: "Wynik", r_unit: "CO₂e / rok uniknięte netto", r_meta: "Mediana · przedział 90 % {a} … {b}",
      f_eyebrow: "Z czego składa się ślad?", f_sum: "Suma", f_meta: "To {p} % unikniętych emisji.",
      c_hw: "Sprzęt", c_data: "Transfer danych", c_train: "Trenowanie", c_infer: "Inferencja",
      u_eyebrow: "Jak pewne to jest?", u_median: "Mediana", u_ci: "przedział 90 %", u_p: "P(opłacalne)",
      u_meta: "Monte-Carlo nad czynnikami emisji, stopą oszczędności i bilansem urządzeń.",
      be_eyebrow: "Kiedy się nie opłaca?", be_big: "od {be} %", be_unit: "oszczędności bilans jest dodatni",
      be_title: "Nie opłaca się, gdy spełniony jest któryś z tych warunków:",
      be_savings: "Stopa oszczędności ({s}) jest poniżej progu ({be}).",
      be_green: "Oszczędzana energia jest prawie bezemisyjna (sieć ≈ {g} g/kWh).",
      be_coal: "Centrum danych działa na prąd z węgla ({g} g/kWh).",
      be_small: "Obiekt jest bardzo mały ({m} MWh/rok).",
      sy_eyebrow: "Co jest bilansowane?", sy_sensors: "Czujniki i bramki (wbudowane)", sy_data: "Transfer danych (sieć / IoT)",
      sy_train: "Trenowanie (moc GPU)", sy_infer: "Inferencja (praca ciągła)", sy_meta: "Granica = cały system AI, włącznie z wbudowanym sprzętem.",
      tag_meas: "mierzone", tag_est: "czynnik",
      r_source: "Na podstawie: straty sieci ≈ 7 %, dane liczników 96 wartości/dzień, zużycie energii kWh/m²/rok",
      what_hint: "Trenowanie w chmurze, inferencja na brzegu sieci (edge).",
      what_line: "System pomiarowo-rozliczeniowy bilansu węglowego netto zarządzania energią przez AI.",
      u_risk: "Akt o AI: prawdopodobnie minimalne ryzyko — dokumentacja i przejrzystość.",
      impact_eyebrow: "Wpływ",
      impact_line: "System, który zamienia oszczędzanie energii przez AI w weryfikowalny bilans węglowy netto.",
      impact_next: "Następny krok: pilotaż z prawdziwym pomiarem na budynku lub sieci.",
      b_impact: "Dlaczego finansować? Bo bilans węglowy działa tylko wtedy, gdy bilans netto jest mierzalny.",
      glossTitle: "Słownik",
      gl_net: "Bilans węglowy netto", gl_net_d: "Uniknięte CO₂e minus własny ślad AI — wynik bilansu.",
      gl_co2: "CO₂e", gl_co2_d: "Ekwiwalent CO₂: łączy różne gazy cieplarniane w jedną jednostkę.",
      gl_ef: "Współczynnik emisji", gl_ef_d: "Gramy CO₂e na kWh — zamienia zużycie energii na emisje.",
      gl_save: "Stopa oszczędności", gl_save_d: "Część energii oszczędzana przez AI dzięki optymalizacji.",
      gl_be: "Próg opłacalności", gl_be_d: "Stopa oszczędności, od której bilans netto jest dodatni.",
      gl_train: "Trenowanie", gl_train_d: "Przetrenowanie modelu — energia GPU/serwera.",
      gl_infer: "Inferencja", gl_infer_d: "Ciągłe wykonywanie modelu (praca ciągła).",
      gl_data: "Transfer danych", gl_data_d: "Energia na przesył danych z czujników przez sieć.",
      gl_hw: "Sprzęt wbudowany", gl_hw_d: "CO₂ z produkcji czujników i bramek, rozłożone na okres życia.",
      gl_mc: "Symulacja Monte Carlo", gl_mc_d: "Wiele losowych przebiegów (2 000) do oszacowania niepewności bilansu.",
      gl_ci: "Przedział 90 %", gl_ci_d: "Zakres, w którym wynik leży z prawdopodobieństwem 90 %.",
      gl_p: "P(AI się opłaca)", gl_p_d: "Prawdopodobieństwo, że bilans netto jest większy od zera.",
      tour_help: "Pokaż samouczek",
      tour_next: "Dalej", tour_back: "Wstecz", tour_skip: "Pomiń", tour_done: "Gotowe",
      tour_1_t: "Companion", tour_1_d: "Dotknij awatara, aby przewijać wyniki. Reaguje emocjonalnie na bilans netto.",
      tour_2_t: "Wskaźnik opłacalności", tour_2_d: "Zawsze pokazuje, czy AI się opłaca — i na ile to pewne.",
      tour_3_t: "Widok danych", tour_3_d: "Tutaj pojawiają się szczegóły bieżącego tematu.",
      tour_4_t: "Tematy", tour_4_d: "Kropki pokazują tematy — kliknij, aby przeskoczyć.",
      tour_5_t: "Język", tour_5_d: "Wybierz jeden z sześciu języków.",
      tour_6_t: "Menu debug", tour_6_d: "Dostosuj parametry i scenariusze.",
      tour_7_t: "Słownik", tour_7_d: "Sprawdź pojęcia techniczne."
    },
    it: {
      brandSub: "Bilancio carbonio netto · BIP 2026 · E2", hintTap: "toccami", hintMore: "tocca di nuovo",
      topicsLabel: "Argomenti", companionAria: "Tocca il companion per mostrare la prossima informazione",
      debugCloseAria: "Chiudi", grpTitle: "Parametri", grpSave: "Risparmio", grpCost: "Impronta AI",
      l_baseline: "Energia gestita", l_savings: "Tasso di risparmio AI", l_grid: "Mix di rete (energia risparmiata)",
      l_sensors: "Sensori", l_data: "Trasferimento dati", l_train: "Addestramenti / anno", l_infer: "Inferenza (carico medio)", l_dc: "Alimentazione data center",
      gridRenew: "Rinnovabile (≈ 50 g/kWh)", gridEU: "Mix UE (≈ 400 g/kWh)", gridDE: "Mix DE (≈ 420 g/kWh)", gridCoal: "Carbone (≈ 900 g/kWh)",
      dcRenew: "DC rinnovabile (≈ 50 g/kWh)", dcMix: "Mix medio (≈ 350 g/kWh)", dcCoal: "Carbone (≈ 800 g/kWh)",
      p_buero: "Edificio uffici", p_cloud: "Cloud-heavy, piccolo", p_grid: "Smart grid", p_grau: "Verde risparmiato, grigio contato",
      note: "Esempio illustrativo — non misurazioni reali.",
      u_mwhYr: "MWh/anno", u_gbDay: "GB/giorno", u_timesYr: "×/anno",
      greeting: "Ciao! Sono il tuo <b>Carbon Companion</b>. Toccami — ti mostro il bilancio carbonio netto dell'AI.",
      introPrompt: "Tocca il companion per iniziare.",
      v_great: "Conviene molto", v_good: "Conviene", v_ok: "Incertamente", v_bad: "Non conviene", v_awful: "Decisamente negativo",
      worthQ: "L'AI conviene?", worthP: "P(conviene)", w_yes: "sì", w_mid: "al limite", w_no: "no",
      topic_result: "Il problema", topic_footprint: "Impronta", topic_uncertainty: "Validazione e incertezza", topic_breakeven: "Quando non conviene", topic_boundary: "Cosa costruiamo", topic_impact: "Impatto",
      b_result: "Netto {net} CO₂e all'anno — dopo aver sottratto l'impronta dell'AI.",
      b_footprint: "L'impronta ha quattro fonti — ecco quale domina.",
      b_uncertainty: "Ogni fattore ha una dispersione — eseguo 2.000 simulazioni.",
      b_breakeven: "Dal {be} di risparmio conviene — sotto, no.",
      b_boundary: "Bilancio l'intero sistema AI — non solo il server.",
      r_eyebrow: "Risultato", r_unit: "CO₂e / anno netti evitati", r_meta: "Mediana · intervallo 90 % {a} … {b}",
      f_eyebrow: "Da cosa è composta l'impronta?", f_sum: "Totale", f_meta: "È il {p} % delle emissioni evitate.",
      c_hw: "Hardware", c_data: "Trasferimento dati", c_train: "Addestramento", c_infer: "Inferenza",
      u_eyebrow: "Quanto è certo?", u_median: "Mediana", u_ci: "intervallo 90 %", u_p: "P(conviene)",
      u_meta: "Monte-Carlo su fattori di emissione, tasso di risparmio e bilancio dei dispositivi.",
      be_eyebrow: "Quando non conviene?", be_big: "dal {be} %", be_unit: "di risparmio il bilancio è positivo",
      be_title: "Non conviene quando si verifica una di queste condizioni:",
      be_savings: "Il tasso di risparmio ({s}) è sotto il pareggio ({be}).",
      be_green: "L'energia risparmiata è quasi a zero emissioni (rete ≈ {g} g/kWh).",
      be_coal: "Il data center usa energia a carbone ({g} g/kWh).",
      be_small: "Il sito è molto piccolo ({m} MWh/anno).",
      sy_eyebrow: "Cosa viene bilanciato?", sy_sensors: "Sensori e gateway (incorporati)", sy_data: "Trasferimento dati (rete / IoT)",
      sy_train: "Addestramento (potenza GPU)", sy_infer: "Inferenza (sempre attiva)", sy_meta: "Confine = intero sistema AI incl. hardware incorporato.",
      tag_meas: "misurato", tag_est: "fattore",
      r_source: "Basato su: perdite di rete ≈ 7 %, dati smart meter 96 valori/giorno, consumo kWh/m²/anno",
      what_hint: "L'addestramento avviene nel cloud, l'inferenza all'edge.",
      what_line: "Un sistema di misura e contabilizzazione del bilancio carbonio netto della gestione energetica AI.",
      u_risk: "AI Act: rischio probabilmente minimo — documentazione e trasparenza.",
      impact_eyebrow: "Impatto",
      impact_line: "Un sistema che trasforma il risparmio energetico dell'AI in un bilancio carbonio netto verificabile.",
      impact_next: "Prossimo passo: un pilota con metering reale su un edificio o una rete.",
      b_impact: "Perché finanziarlo? Perché la contabilità del carbonio funziona solo se il saldo netto è misurabile.",
      glossTitle: "Glossario",
      gl_net: "Bilancio carbonio netto", gl_net_d: "CO₂e evitata meno l'impronta dell'AI — il risultato del bilancio.",
      gl_co2: "CO₂e", gl_co2_d: "Equivalente CO₂: riunisce diversi gas serra in un'unica unità.",
      gl_ef: "Fattore di emissione", gl_ef_d: "Grammi di CO₂e per kWh — converte l'energia in emissioni.",
      gl_save: "Tasso di risparmio", gl_save_d: "Quota di energia risparmiata dall'AI grazie all'ottimizzazione.",
      gl_be: "Pareggio", gl_be_d: "Tasso di risparmio dal quale il saldo netto diventa positivo.",
      gl_train: "Addestramento", gl_train_d: "Riaddestramento del modello — energia GPU/server.",
      gl_infer: "Inferenza", gl_infer_d: "Esecuzione continua del modello (sempre attiva).",
      gl_data: "Trasferimento dati", gl_data_d: "Energia per trasmettere i dati dei sensori sulla rete.",
      gl_hw: "Hardware incorporato", gl_hw_d: "CO₂ dalla produzione di sensori e gateway, distribuito sulla vita utile.",
      gl_mc: "Simulazione Monte Carlo", gl_mc_d: "Molte esecuzioni casuali (2.000) per stimare l'incertezza del bilancio.",
      gl_ci: "Intervallo 90 %", gl_ci_d: "Intervallo in cui il risultato cade con probabilità del 90 %.",
      gl_p: "P(l'AI conviene)", gl_p_d: "Probabilità che il saldo netto sia maggiore di zero.",
      tour_help: "Mostra il tutorial",
      tour_next: "Avanti", tour_back: "Indietro", tour_skip: "Salta", tour_done: "Fatto",
      tour_1_t: "Il companion", tour_1_d: "Tocca l'avatar per scorrere i risultati. Reagisce emotivamente al saldo netto.",
      tour_2_t: "Indicatore di convenienza", tour_2_d: "Mostra sempre se l'AI conviene — e quanto è certo.",
      tour_3_t: "Vista dati", tour_3_d: "Qui compaiono i dettagli dell'argomento corrente.",
      tour_4_t: "Argomenti", tour_4_d: "I punti mostrano gli argomenti — clicca per saltare.",
      tour_5_t: "Lingua", tour_5_d: "Scegli tra sei lingue.",
      tour_6_t: "Menu debug", tour_6_d: "Regola parametri e scenari.",
      tour_7_t: "Glossario", tour_7_d: "Consulta i termini tecnici."
    },
    es: {
      brandSub: "Balance neto de carbono · BIP 2026 · E2", hintTap: "tócame", hintMore: "toca de nuevo",
      topicsLabel: "Temas", companionAria: "Toca el companion para mostrar la siguiente información",
      debugCloseAria: "Cerrar", grpTitle: "Parámetros", grpSave: "Ahorro", grpCost: "Huella de la IA",
      l_baseline: "Energía gestionada", l_savings: "Tasa de ahorro de la IA", l_grid: "Mix de red (energía ahorrada)",
      l_sensors: "Sensores", l_data: "Transferencia de datos", l_train: "Entrenamientos / año", l_infer: "Inferencia (carga media)", l_dc: "Energía del centro de datos",
      gridRenew: "Renovable (≈ 50 g/kWh)", gridEU: "Mix UE (≈ 400 g/kWh)", gridDE: "Mix DE (≈ 420 g/kWh)", gridCoal: "Carbón (≈ 900 g/kWh)",
      dcRenew: "DC renovable (≈ 50 g/kWh)", dcMix: "Mix medio (≈ 350 g/kWh)", dcCoal: "Carbón (≈ 800 g/kWh)",
      p_buero: "Edificio de oficinas", p_cloud: "Cloud-heavy, pequeño", p_grid: "Smart grid", p_grau: "Verde ahorrado, gris contado",
      note: "Ejemplo ilustrativo — no mediciones reales.",
      u_mwhYr: "MWh/año", u_gbDay: "GB/día", u_timesYr: "×/año",
      greeting: "¡Hola! Soy tu <b>Carbon Companion</b>. Tócame y te muestro el balance neto de carbono de la IA.",
      introPrompt: "Toca el companion para empezar.",
      v_great: "Merece mucho la pena", v_good: "Merece la pena", v_ok: "Incierto", v_bad: "No merece la pena", v_awful: "Claramente negativo",
      worthQ: "¿Merece la pena la IA?", worthP: "P(merece la pena)", w_yes: "sí", w_mid: "justo", w_no: "no",
      topic_result: "El problema", topic_footprint: "Huella", topic_uncertainty: "Validación e incertidumbre", topic_breakeven: "Cuándo no merece la pena", topic_boundary: "Qué construimos", topic_impact: "Impacto",
      b_result: "Neto {net} CO₂e al año — tras restar la propia huella de la IA.",
      b_footprint: "La huella tiene cuatro fuentes — mira cuál domina.",
      b_uncertainty: "Cada factor tiene dispersión — ejecuto 2.000 simulaciones.",
      b_breakeven: "Desde {be} de ahorro merece la pena — por debajo, no.",
      b_boundary: "Contabilizo todo el sistema de IA — no solo el servidor.",
      r_eyebrow: "Resultado", r_unit: "CO₂e / año netos evitados", r_meta: "Mediana · intervalo 90 % {a} … {b}",
      f_eyebrow: "¿De qué se compone la huella?", f_sum: "Total", f_meta: "Es el {p} % de las emisiones evitadas.",
      c_hw: "Hardware", c_data: "Transferencia de datos", c_train: "Entrenamiento", c_infer: "Inferencia",
      u_eyebrow: "¿Qué tan seguro es?", u_median: "Mediana", u_ci: "intervalo 90 %", u_p: "P(merece la pena)",
      u_meta: "Monte-Carlo sobre factores de emisión, tasa de ahorro y balance de dispositivos.",
      be_eyebrow: "¿Cuándo no merece la pena?", be_big: "desde {be} %", be_unit: "de ahorro el balance es positivo",
      be_title: "No merece la pena cuando se cumple una de estas:",
      be_savings: "La tasa de ahorro ({s}) está por debajo del equilibrio ({be}).",
      be_green: "La energía ahorrada es casi libre de carbono (red ≈ {g} g/kWh).",
      be_coal: "El centro de datos usa energía de carbón ({g} g/kWh).",
      be_small: "El sitio es muy pequeño ({m} MWh/año).",
      sy_eyebrow: "¿Qué se contabiliza?", sy_sensors: "Sensores y gateways (incorporados)", sy_data: "Transferencia de datos (red / IoT)",
      sy_train: "Entrenamiento (potencia GPU)", sy_infer: "Inferencia (siempre activa)", sy_meta: "Límite = todo el sistema de IA incl. hardware incorporado.",
      tag_meas: "medido", tag_est: "factor",
      r_source: "Basado en: pérdidas de red ≈ 7 %, datos de contadores 96 valores/día, consumo kWh/m²/año",
      what_hint: "El entrenamiento se ejecuta en la nube, la inferencia en el borde.",
      what_line: "Un sistema de medición y contabilidad del balance neto de carbono de la gestión energética con IA.",
      u_risk: "Ley de IA: riesgo probablemente mínimo — documentación y transparencia.",
      impact_eyebrow: "Impacto",
      impact_line: "Un sistema que convierte el ahorro energético de la IA en un balance neto de carbono verificable.",
      impact_next: "Siguiente paso: un piloto con medición real en un edificio o red.",
      b_impact: "¿Por qué financiarlo? Porque la contabilidad de carbono solo funciona si el balance neto es medible.",
      glossTitle: "Glosario",
      gl_net: "Balance neto de carbono", gl_net_d: "CO₂e evitado menos la propia huella de la IA — el resultado del balance.",
      gl_co2: "CO₂e", gl_co2_d: "Equivalente de CO₂: agrupa distintos gases de efecto invernadero en una unidad.",
      gl_ef: "Factor de emisión", gl_ef_d: "Gramos de CO₂e por kWh — convierte el consumo de energía en emisiones.",
      gl_save: "Tasa de ahorro", gl_save_d: "Parte de la energía que ahorra la IA mediante la optimización.",
      gl_be: "Punto de equilibrio", gl_be_d: "Tasa de ahorro a partir de la cual el balance neto es positivo.",
      gl_train: "Entrenamiento", gl_train_d: "Reentrenamiento del modelo — energía de GPU/servidor.",
      gl_infer: "Inferencia", gl_infer_d: "Ejecución continua del modelo (siempre activa).",
      gl_data: "Transferencia de datos", gl_data_d: "Energía para transmitir los datos de los sensores por la red.",
      gl_hw: "Hardware incorporado", gl_hw_d: "CO₂ de la fabricación de sensores y pasarelas, repartido en su vida útil.",
      gl_mc: "Simulación de Monte Carlo", gl_mc_d: "Muchas ejecuciones aleatorias (2.000) para estimar la incertidumbre del balance.",
      gl_ci: "Intervalo del 90 %", gl_ci_d: "Rango en el que cae el resultado con un 90 % de probabilidad.",
      gl_p: "P(la IA merece la pena)", gl_p_d: "Probabilidad de que el balance neto sea mayor que cero.",
      tour_help: "Mostrar tutorial",
      tour_next: "Siguiente", tour_back: "Atrás", tour_skip: "Saltar", tour_done: "Hecho",
      tour_1_t: "El compañero", tour_1_d: "Toca el avatar para recorrer los resultados. Reacciona emocionalmente al balance neto.",
      tour_2_t: "Indicador de rentabilidad", tour_2_d: "Muestra siempre si la IA merece la pena — y con qué certeza.",
      tour_3_t: "Vista de datos", tour_3_d: "Aquí aparecen los detalles del tema actual.",
      tour_4_t: "Temas", tour_4_d: "Los puntos muestran los temas — haz clic para saltar.",
      tour_5_t: "Idioma", tour_5_d: "Elige entre seis idiomas.",
      tour_6_t: "Menú de depuración", tour_6_d: "Ajusta parámetros y escenarios.",
      tour_7_t: "Glosario", tour_7_d: "Consulta términos técnicos."
    },
    fr: {
      brandSub: "Bilan carbone net · BIP 2026 · E2", hintTap: "touche-moi", hintMore: "touche à nouveau",
      topicsLabel: "Sujets", companionAria: "Touche le companion pour afficher l'information suivante",
      debugCloseAria: "Fermer", grpTitle: "Paramètres", grpSave: "Économie", grpCost: "Empreinte IA",
      l_baseline: "Énergie gérée", l_savings: "Taux d'économie de l'IA", l_grid: "Mix réseau (énergie économisée)",
      l_sensors: "Capteurs", l_data: "Transfert de données", l_train: "Entraînements / an", l_infer: "Inférence (charge moy.)", l_dc: "Alimentation data center",
      gridRenew: "Renouvelable (≈ 50 g/kWh)", gridEU: "Mix UE (≈ 400 g/kWh)", gridDE: "Mix DE (≈ 420 g/kWh)", gridCoal: "Charbon (≈ 900 g/kWh)",
      dcRenew: "DC renouvelable (≈ 50 g/kWh)", dcMix: "Mix moyen (≈ 350 g/kWh)", dcCoal: "Charbon (≈ 800 g/kWh)",
      p_buero: "Immeuble de bureaux", p_cloud: "Cloud-heavy, petit", p_grid: "Smart grid", p_grau: "Vert économisé, gris compté",
      note: "Exemple illustratif — pas de mesures réelles.",
      u_mwhYr: "MWh/an", u_gbDay: "GB/jour", u_timesYr: "×/an",
      greeting: "Salut ! Je suis ton <b>Carbon Companion</b>. Touche-moi — je te montre le bilan carbone net de l'IA.",
      introPrompt: "Touche le companion pour commencer.",
      v_great: "Très rentable", v_good: "Rentable", v_ok: "Incertain", v_bad: "Pas rentable", v_awful: "Clairement négatif",
      worthQ: "L'IA est-elle rentable ?", worthP: "P(rentable)", w_yes: "oui", w_mid: "limite", w_no: "non",
      topic_result: "Le problème", topic_footprint: "Empreinte", topic_uncertainty: "Validation et incertitude", topic_breakeven: "Quand ce n'est pas rentable", topic_boundary: "Ce que nous construisons", topic_impact: "Impact",
      b_result: "Net {net} CO₂e par an — après avoir soustrait l'empreinte de l'IA.",
      b_footprint: "L'empreinte a quatre sources — voici laquelle domine.",
      b_uncertainty: "Chaque facteur a une dispersion — je lance 2 000 simulations.",
      b_breakeven: "Dès {be} d'économie c'est rentable — en dessous, non.",
      b_boundary: "Je comptabilise tout le système d'IA — pas seulement le serveur.",
      r_eyebrow: "Résultat", r_unit: "CO₂e / an nets évités", r_meta: "Médiane · intervalle 90 % {a} … {b}",
      f_eyebrow: "De quoi se compose l'empreinte ?", f_sum: "Total", f_meta: "C'est {p} % des émissions évitées.",
      c_hw: "Matériel", c_data: "Transfert de données", c_train: "Entraînement", c_infer: "Inférence",
      u_eyebrow: "Quelle est la certitude ?", u_median: "Médiane", u_ci: "intervalle 90 %", u_p: "P(rentable)",
      u_meta: "Monte-Carlo sur les facteurs d'émission, le taux d'économie et le bilan des appareils.",
      be_eyebrow: "Quand n'est-ce pas rentable ?", be_big: "dès {be} %", be_unit: "d'économie le bilan est positif",
      be_title: "Pas rentable si l'une de ces conditions est remplie :",
      be_savings: "Le taux d'économie ({s}) est sous le seuil ({be}).",
      be_green: "L'énergie économisée est quasi neutre en carbone (réseau ≈ {g} g/kWh).",
      be_coal: "Le centre de données tourne au charbon ({g} g/kWh).",
      be_small: "Le site est très petit ({m} MWh/an).",
      sy_eyebrow: "Qu'est-ce qui est comptabilisé ?", sy_sensors: "Capteurs et passerelles (incorporés)", sy_data: "Transfert de données (réseau / IoT)",
      sy_train: "Entraînement (puissance GPU)", sy_infer: "Inférence (toujours active)", sy_meta: "Frontière = tout le système d'IA, matériel incorporé inclus.",
      tag_meas: "mesuré", tag_est: "facteur",
      r_source: "Basé sur : pertes réseau ≈ 7 %, données de compteurs 96 valeurs/jour, consommation kWh/m²/an",
      what_hint: "L'entraînement s'exécute dans le cloud, l'inférence en périphérie (edge).",
      what_line: "Un système de mesure et de comptabilisation du bilan carbone net de la gestion énergétique par IA.",
      u_risk: "Règlement IA : risque probablement minimal — documentation et transparence.",
      impact_eyebrow: "Impact",
      impact_line: "Un système qui transforme les économies d'énergie de l'IA en un bilan carbone net vérifiable.",
      impact_next: "Prochaine étape : un pilote avec un comptage réel sur un bâtiment ou un réseau.",
      b_impact: "Pourquoi financer ? Parce que la comptabilité carbone ne fonctionne que si le bilan net est mesurable.",
      glossTitle: "Glossaire",
      gl_net: "Bilan carbone net", gl_net_d: "CO₂e évité moins l'empreinte de l'IA — le résultat du bilan.",
      gl_co2: "CO₂e", gl_co2_d: "Équivalent CO₂ : regroupe différents gaz à effet de serre en une unité.",
      gl_ef: "Facteur d'émission", gl_ef_d: "Grammes de CO₂e par kWh — convertit l'énergie en émissions.",
      gl_save: "Taux d'économie", gl_save_d: "Part d'énergie économisée par l'IA grâce à l'optimisation.",
      gl_be: "Seuil de rentabilité", gl_be_d: "Taux d'économie à partir duquel le bilan net devient positif.",
      gl_train: "Entraînement", gl_train_d: "Réentraînement du modèle — énergie GPU/serveur.",
      gl_infer: "Inférence", gl_infer_d: "Exécution continue du modèle (toujours active).",
      gl_data: "Transfert de données", gl_data_d: "Énergie pour transmettre les données des capteurs sur le réseau.",
      gl_hw: "Matériel incorporé", gl_hw_d: "CO₂ de la fabrication des capteurs et passerelles, réparti sur leur durée de vie.",
      gl_mc: "Simulation de Monte-Carlo", gl_mc_d: "De nombreuses exécutions aléatoires (2 000) pour estimer l'incertitude du bilan.",
      gl_ci: "Intervalle à 90 %", gl_ci_d: "Plage dans laquelle le résultat tombe avec une probabilité de 90 %.",
      gl_p: "P(l'IA est rentable)", gl_p_d: "Probabilité que le bilan net soit supérieur à zéro.",
      tour_help: "Afficher le tutoriel",
      tour_next: "Suivant", tour_back: "Retour", tour_skip: "Passer", tour_done: "Terminé",
      tour_1_t: "Le compagnon", tour_1_d: "Touche l'avatar pour parcourir les résultats. Il réagit émotionnellement au bilan net.",
      tour_2_t: "Indicateur de rentabilité", tour_2_d: "Montre toujours si l'IA est rentable — et avec quelle certitude.",
      tour_3_t: "Vue des données", tour_3_d: "Les détails du sujet actuel apparaissent ici.",
      tour_4_t: "Sujets", tour_4_d: "Les points montrent les sujets — cliquez pour sauter.",
      tour_5_t: "Langue", tour_5_d: "Choisissez entre six langues.",
      tour_6_t: "Menu debug", tour_6_d: "Ajustez les paramètres et les scénarios.",
      tour_7_t: "Glossaire", tour_7_d: "Consultez les termes techniques."
    }
  };

  /* ============================================================
     State & Helfer
     ============================================================ */
  var params = Object.assign({}, PRESETS.buero);
  var topic = -1;
  var LANG = "en";
  try { var s = localStorage.getItem("cc-params"); if (s) params = Object.assign({}, PRESETS.buero, JSON.parse(s)); } catch (e) {}
  try { var lg = localStorage.getItem("cc-lang"); if (lg && I18N[lg]) LANG = lg; } catch (e) {}

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function t(key, vars) {
    var dict = I18N[LANG] || I18N.en;
    var s = (key in dict) ? dict[key] : (key in I18N.en ? I18N.en[key] : key);
    if (vars) for (var k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  function fmtNum(v, d) { return v.toLocaleString(LOCALES[LANG] || "en-US", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function fmtT(v) {
    var a = Math.abs(v);
    if (a < 1) return fmtNum(v * 1000, 0) + " kg";
    if (a < 100) return fmtNum(v, 1) + " t";
    return fmtNum(v, 0) + " t";
  }
  function fmtTsign(v) { return (v >= 0 ? "+" : "−") + fmtT(Math.abs(v)); }
  function fmtPct(v) { return fmtNum(v, 1).replace(/([.,])0$/, "") + " %"; }

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ============================================================
     Modell
     ============================================================ */
  function compute(p) {
    var savings_t = p.baselineMWh * 1000 * p.savingsPct / 100 * p.gridEF / 1e6;
    var hw_t = (p.numSensors * FIXED.sensorEmbodied + FIXED.gatewayEmbodied) / FIXED.lifetimeYr / 1000;
    var data_t = p.dataGBday * 365 * FIXED.networkKWhPerGB * p.gridEF / 1e6;
    var train_t = p.trainingsPerYear * FIXED.kWhPerTraining * p.dcEF / 1e6;
    var inf_t = p.inferenceW / 1000 * 8760 * p.dcEF / 1e6;
    var cost_t = hw_t + data_t + train_t + inf_t;
    var net_t = savings_t - cost_t;
    var bePct = cost_t / (p.baselineMWh * 1000 * p.gridEF / 1e6) * 100;
    return {
      savings_t: savings_t, cost_t: cost_t, net_t: net_t, bePct: bePct,
      components: [
        { lk: "c_hw", value: hw_t, color: "var(--series-2)" },
        { lk: "c_data", value: data_t, color: "var(--series-1)" },
        { lk: "c_train", value: train_t, color: "var(--series-3)" },
        { lk: "c_infer", value: inf_t, color: "var(--series-4)" }
      ]
    };
  }

  function montecarlo(p, N) {
    var rand = mulberry32(20261028), spare = null;
    function normal() {
      if (spare !== null) { var s = spare; spare = null; return s; }
      var u = 0, v = 0;
      while (u === 0) u = rand(); while (v === 0) v = rand();
      var m = Math.sqrt(-2 * Math.log(u));
      spare = m * Math.sin(2 * Math.PI * v);
      return m * Math.cos(2 * Math.PI * v);
    }
    var samples = new Float64Array(N);
    for (var i = 0; i < N; i++) {
      var gridEF = Math.max(5, p.gridEF * (1 + UNC.gridEF * normal()));
      var dcEF = Math.max(5, p.dcEF * (1 + UNC.dcEF * normal()));
      var sp = clamp(p.savingsPct * (1 + UNC.savingsPct * normal()), 0, 100);
      var se = Math.max(0.1, FIXED.sensorEmbodied * (1 + UNC.sensorEmbodied * normal()));
      var nk = Math.max(0.01, FIXED.networkKWhPerGB * (1 + UNC.networkKWhPerGB * normal()));
      var kt = Math.max(1, FIXED.kWhPerTraining * (1 + UNC.kWhPerTraining * normal()));
      var iw = Math.max(0, p.inferenceW * (1 + UNC.inferenceW * normal()));

      var sav = p.baselineMWh * 1000 * sp / 100 * gridEF / 1e6;
      var hw = (p.numSensors * se + FIXED.gatewayEmbodied) / FIXED.lifetimeYr / 1000;
      var data = p.dataGBday * 365 * nk * gridEF / 1e6;
      var train = p.trainingsPerYear * kt * dcEF / 1e6;
      var inf = iw / 1000 * 8760 * dcEF / 1e6;
      samples[i] = sav - (hw + data + train + inf);
    }
    var sorted = Array.prototype.slice.call(samples).sort(function (a, b) { return a - b; });
    function q(pp) { return sorted[clamp(Math.round((N - 1) * pp), 0, N - 1)]; }
    var pos = 0; for (var j = 0; j < N; j++) if (samples[j] > 0) pos++;
    return { samples: sorted, median: q(0.5), p5: q(0.05), p95: q(0.95), pPos: pos / N };
  }

  function moodOf(res, mc) {
    if (mc.p5 > 0) return res.cost_t < res.savings_t * 0.05 ? "great" : "good";
    if (mc.p95 < 0) return res.savings_t < res.cost_t * 0.3 ? "awful" : "bad";
    return "ok";
  }

  /* ============================================================
     Companion (emotional: 5 Stimmungen)
     ============================================================ */
  var MOODS = {
    great: { color: "#0ca30c", eyes: "happy", happyL: "M37 55 Q46 45 55 55", happyR: "M65 55 Q74 45 83 55" },
    good:  { color: "#0c7a63", eyes: "happy", happyL: "M39 56 Q46 48 53 56", happyR: "M67 56 Q74 48 81 56" },
    ok:    { color: "#fab219", eyes: "dot", eyeR: 4 },
    bad:   { color: "#ec835a", eyes: "dot", eyeR: 3 },
    awful: { color: "#d03b3b", eyes: "sad", sadL: "M39 61 Q46 71 53 61", sadR: "M67 61 Q74 71 81 61" }
  };

  function setMood(mood) {
    var cfg = MOODS[mood];
    $("av-body").style.stroke = cfg.color;
    $("av-tint").style.fill = cfg.color;
    function show(id, on) { $(id).setAttribute("opacity", on ? "1" : "0"); }
    show("av-eyes-dot", cfg.eyes === "dot");
    show("av-eyes-happy", cfg.eyes === "happy");
    show("av-eyes-sad", cfg.eyes === "sad");
    if (cfg.eyes === "happy") {
      $("av-happyL").setAttribute("d", cfg.happyL);
      $("av-happyR").setAttribute("d", cfg.happyR);
    }
    if (cfg.eyes === "sad") {
      $("av-sadL").setAttribute("d", cfg.sadL);
      $("av-sadR").setAttribute("d", cfg.sadR);
    }
    if (cfg.eyes === "dot") {
      $("av-eyeL").setAttribute("r", cfg.eyeR);
      $("av-eyeR").setAttribute("r", cfg.eyeR);
    }
  }

  /* ============================================================
     Themen
     ============================================================ */
  var TOPICS = [
    {
      label: "topic_boundary",
      bubble: function () { return t("b_boundary"); },
      card: function () {
        return '<div class="a-eyebrow">' + t("topic_boundary") + '</div>'
          + '<div class="a-unit">' + t("what_line") + '</div>'
          + '<div class="a-meta" style="margin-top:8px">' + t("what_hint") + '</div>'
          + '<ul class="list">'
          + '<li><span class="mark off"></span><span>' + t("sy_sensors") + '</span><span class="tag est">' + t("tag_est") + '</span></li>'
          + '<li><span class="mark off"></span><span>' + t("sy_data") + '</span><span class="tag est">' + t("tag_est") + '</span></li>'
          + '<li><span class="mark off"></span><span>' + t("sy_train") + '</span><span class="tag meas">' + t("tag_meas") + '</span></li>'
          + '<li><span class="mark off"></span><span>' + t("sy_infer") + '</span><span class="tag meas">' + t("tag_meas") + '</span></li>'
          + '</ul>'
          + '<div class="a-meta">' + t("sy_meta") + '</div>';
      }
    },
    {
      label: "topic_result",
      bubble: function (res) { return t("b_result", { net: fmtT(res.net_t) }); },
      card: function (res, mc, mood) {
        var color = (mood === "great" || mood === "good") ? "var(--good)" : mood === "ok" ? "var(--warn-txt)" : "var(--crit)";
        return '<div class="a-eyebrow">' + t("topic_result") + '</div>'
          + '<div class="a-big" style="color:' + color + '">' + fmtTsign(res.net_t) + '</div>'
          + '<div class="a-unit">' + t("r_unit") + '</div>'
          + '<div class="a-meta">' + t("r_meta", { a: fmtTsign(mc.p5), b: fmtTsign(mc.p95) }) + '</div>'
          + '<div class="verdict ' + mood + '"><span class="dot"></span>' + t("v_" + mood) + '</div>'
          + '<div class="a-meta">' + t("r_source") + '</div>';
      }
    },
    {
      label: "topic_footprint",
      bubble: function () { return t("b_footprint"); },
      card: function (res) {
        var comps = res.components.slice().sort(function (a, b) { return a.value - b.value; });
        var maxC = Math.max.apply(null, comps.map(function (c) { return c.value; })) || 1;
        var rows = comps.map(function (c) {
          var w = Math.max(1, c.value / maxC * 100);
          return '<div class="mbar"><span class="mbar-lbl">' + t(c.lk) + '</span>'
            + '<span class="mbar-track"><span class="mbar-fill" style="width:' + w.toFixed(1) + '%;background:' + c.color + '"></span></span>'
            + '<span class="mbar-val">' + fmtT(c.value) + '</span></div>';
        }).join("");
        var share = res.savings_t > 0 ? Math.round(res.cost_t / res.savings_t * 100) : 0;
        return '<div class="a-eyebrow">' + t("f_eyebrow") + '</div>'
          + '<div class="mini-rows">' + rows + '</div>'
          + '<div class="mbar-total"><span>' + t("f_sum") + '</span><span class="t-val">' + fmtT(res.cost_t) + '</span></div>'
          + '<div class="a-meta">' + t("f_meta", { p: share }) + '</div>';
      }
    },
    {
      label: "topic_uncertainty",
      bubble: function () { return t("b_uncertainty"); },
      card: function (res, mc) {
        var p = mc.pPos >= 0.995 ? "> 99 %" : fmtNum(mc.pPos * 100, 0) + " %";
        return '<div class="a-eyebrow">' + t("topic_uncertainty") + '</div>'
          + sparkSVG(mc)
          + '<div class="stats">'
          + '<div class="stat"><div class="s-l">' + t("u_median") + '</div><div class="s-v">' + fmtTsign(mc.median) + '</div></div>'
          + '<div class="stat"><div class="s-l">' + t("u_ci") + '</div><div class="s-v">' + fmtTsign(mc.p5) + ' … ' + fmtTsign(mc.p95) + '</div></div>'
          + '<div class="stat"><div class="s-l">' + t("u_p") + '</div><div class="s-v">' + p + '</div></div>'
          + '</div>'
          + '<div class="a-meta">' + t("u_meta") + '</div>'
          + '<div class="a-meta">' + t("u_risk") + '</div>';
      }
    },
    {
      label: "topic_breakeven",
      bubble: function (res) { return t("b_breakeven", { be: fmtNum(res.bePct, 1) + " %" }); },
      card: function (res, mc, mood, p) {
        var checks = [
          { on: p.savingsPct < res.bePct, text: t("be_savings", { s: fmtPct(p.savingsPct), be: fmtNum(res.bePct, 1) + " %" }) },
          { on: p.gridEF < 100, text: t("be_green", { g: fmtNum(p.gridEF, 0) }) },
          { on: p.dcEF >= 800, text: t("be_coal", { g: fmtNum(p.dcEF, 0) }) },
          { on: p.baselineMWh < 200, text: t("be_small", { m: fmtNum(p.baselineMWh, 0) }) }
        ];
        var items = checks.map(function (c) {
          return '<li><span class="mark ' + (c.on ? "on" : "off") + '"></span><span>' + c.text + '</span></li>';
        }).join("");
        return '<div class="a-eyebrow">' + t("be_eyebrow") + '</div>'
          + '<div class="a-big" style="color:var(--accent)">' + t("be_big", { be: fmtNum(res.bePct, 1) }) + '</div>'
          + '<div class="a-unit">' + t("be_unit") + '</div>'
          + '<div class="a-meta">' + t("be_title") + '</div>'
          + '<ul class="list">' + items + '</ul>';
      }
    },
    {
      label: "topic_impact",
      bubble: function () { return t("b_impact"); },
      card: function (res, mc, mood) {
        return '<div class="a-eyebrow">' + t("impact_eyebrow") + '</div>'
          + '<div class="a-unit" style="font-size:15px;line-height:1.55">' + t("impact_line") + '</div>'
          + '<div class="verdict ' + mood + '"><span class="dot"></span>' + t("v_" + mood) + '</div>'
          + '<div class="a-meta">' + t("impact_next") + '</div>';
      }
    }
  ];

  function sparkSVG(mc) {
    var W = 480, H = 96, padL = 6, padR = 6, padT = 8, padB = 6;
    var iw = W - padL - padR, ih = H - padT - padB;
    var samples = mc.samples, N = samples.length;
    var lo = samples[Math.floor(N * 0.002)], hi = samples[Math.ceil(N * 0.998) - 1];
    var span = Math.max(hi - lo, 1e-9);
    var bins = 40, counts = new Array(bins).fill(0);
    for (var i = 0; i < N; i++) { var idx = Math.floor((samples[i] - lo) / span * bins); if (idx >= bins) idx = bins - 1; if (idx < 0) idx = 0; counts[idx]++; }
    var maxC = Math.max.apply(null, counts) || 1;
    var x = function (v) { return padL + (v - lo) / span * iw; };
    var xs = function (i) { return padL + (i + 0.5) / bins * iw; };
    var ys = function (c) { return padT + ih - (c / maxC) * ih; };
    var line = "", area = "";
    for (var k = 0; k < bins; k++) { line += (k ? "L" : "M") + xs(k).toFixed(1) + "," + ys(counts[k]).toFixed(1) + " "; }
    area = line + "L" + xs(bins - 1).toFixed(1) + "," + (padT + ih) + " L" + xs(0).toFixed(1) + "," + (padT + ih) + " Z";
    var zx = clamp(x(0), padL, padL + iw);
    var midX = x(mc.median);
    var s = "";
    if (0 > lo) s += '<rect x="' + x(lo).toFixed(1) + '" y="' + padT + '" width="' + (zx - x(lo)).toFixed(1) + '" height="' + ih + '" class="zone-bad"/>';
    if (0 < hi) s += '<rect x="' + zx.toFixed(1) + '" y="' + padT + '" width="' + (x(hi) - zx).toFixed(1) + '" height="' + ih + '" class="zone-good"/>';
    s += '<line x1="' + padL + '" y1="' + (padT + ih) + '" x2="' + (padL + iw) + '" y2="' + (padT + ih) + '" class="axis-line"/>';
    s += '<line x1="' + zx.toFixed(1) + '" y1="' + padT + '" x2="' + zx.toFixed(1) + '" y2="' + (padT + ih) + '" class="zero-line"/>';
    s += '<path d="' + area + '" class="spark-area"/>';
    s += '<path d="' + line + '" class="spark-line"/>';
    s += '<circle cx="' + midX.toFixed(1) + '" cy="' + ys(counts[Math.floor((mc.median - lo) / span * bins)] || 0).toFixed(1) + '" r="4" class="dot-bk"/>';
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Distribution">' + s + '</svg>';
  }

  /* ============================================================
     Glossar
     ============================================================ */
  var GLOSSARY = [
    { t: "gl_net", d: "gl_net_d" },
    { t: "gl_co2", d: "gl_co2_d" },
    { t: "gl_ef", d: "gl_ef_d" },
    { t: "gl_save", d: "gl_save_d" },
    { t: "gl_be", d: "gl_be_d" },
    { t: "gl_train", d: "gl_train_d" },
    { t: "gl_infer", d: "gl_infer_d" },
    { t: "gl_data", d: "gl_data_d" },
    { t: "gl_hw", d: "gl_hw_d" },
    { t: "gl_mc", d: "gl_mc_d" },
    { t: "gl_ci", d: "gl_ci_d" },
    { t: "gl_p", d: "gl_p_d" }
  ];

  function renderGlossary() {
    var el = $("glossary");
    if (!el) return;
    el.innerHTML = GLOSSARY.map(function (g) {
      return '<div class="g-item"><dt>' + t(g.t) + '</dt><dd>' + t(g.d) + '</dd></div>';
    }).join("");
  }

  /* ============================================================
     Render
     ============================================================ */
  function render() {
    var res = compute(params);
    var mc = montecarlo(params, 2000);
    var mood = moodOf(res, mc);
    setMood(mood);

    var bubble = $("bubble"), answer = $("answer"), hint = $("hint");

    if (topic < 0) {
      bubble.innerHTML = t("greeting");
      answer.innerHTML = '<div class="a-meta" style="margin-top:0">' + t("introPrompt") + '</div>';
      hint.textContent = t("hintTap");
    } else {
      var tp = TOPICS[topic];
      bubble.innerHTML = tp.bubble(res);
      answer.innerHTML = tp.card(res, mc, mood, params);
      hint.textContent = (topic + 1) + " / " + TOPICS.length + " · " + t(tp.label) + " · " + t("hintMore");
    }
    answer.classList.remove("in"); void answer.offsetWidth; answer.classList.add("in");

    renderWorth(mc, mood);
    renderProgress();
  }

  function renderWorth(mc, mood) {
    var word = (mood === "great" || mood === "good") ? "yes" : mood === "ok" ? "mid" : "no";
    var wordKey = word === "yes" ? "w_yes" : word === "mid" ? "w_mid" : "w_no";
    var v = $("worthV");
    v.textContent = t(wordKey);
    v.className = "worth-v " + word;
    $("needle").style.left = (clamp(mc.pPos, 0.01, 0.99) * 100) + "%";
    $("worthMeta").innerHTML = t("worthP") + ": <b>" + fmtNum(mc.pPos * 100, 0) + " %</b>";
  }

  function renderProgress() {
    var prog = $("progress");
    if (topic < 0) { prog.innerHTML = ""; return; }
    var dots = "";
    for (var i = 0; i < TOPICS.length; i++) {
      dots += '<button class="pdot' + (i === topic ? " active" : "") + '" data-i="' + i + '" aria-label="' + t(TOPICS[i].label) + '"></button>';
    }
    prog.innerHTML = dots;
  }

  /* ============================================================
     Interaktion
     ============================================================ */
  $("companion").addEventListener("click", function () {
    topic = topic < 0 ? 0 : (topic + 1) % TOPICS.length;
    render();
  });
  $("progress").addEventListener("click", function (e) {
    var d = e.target.closest(".pdot"); if (!d) return;
    topic = parseInt(d.getAttribute("data-i"), 10);
    render();
  });

  var debug = $("debug"), gloss = $("gloss"), backdrop = $("backdrop"), toggle = $("debugToggle"), glossToggleBtn = $("glossToggle");
  function closeDebug() { debug.hidden = true; toggle.setAttribute("aria-expanded", "false"); if (gloss.hidden) backdrop.hidden = true; }
  function openDebug() { closeGloss(); debug.hidden = false; backdrop.hidden = false; toggle.setAttribute("aria-expanded", "true"); }
  function closeGloss() { gloss.hidden = true; glossToggleBtn.setAttribute("aria-expanded", "false"); if (debug.hidden) backdrop.hidden = true; }
  function openGloss() { closeDebug(); gloss.hidden = false; backdrop.hidden = false; glossToggleBtn.setAttribute("aria-expanded", "true"); }
  toggle.addEventListener("click", function () { debug.hidden ? openDebug() : closeDebug(); });
  glossToggleBtn.addEventListener("click", function () { gloss.hidden ? openGloss() : closeGloss(); });
  $("debugClose").addEventListener("click", closeDebug);
  $("glossClose").addEventListener("click", closeGloss);
  backdrop.addEventListener("click", function () { closeDebug(); closeGloss(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeDebug(); closeGloss(); } });

  /* ============================================================
     Tutorial-Intro
     ============================================================ */
  var TOUR = [
    { sel: "#companion", t: "tour_1_t", d: "tour_1_d" },
    { sel: ".worth", t: "tour_2_t", d: "tour_2_d" },
    { sel: "#answer", t: "tour_3_t", d: "tour_3_d" },
    { sel: "#progress", t: "tour_4_t", d: "tour_4_d" },
    { sel: ".lang-select-wrap", t: "tour_5_t", d: "tour_5_d" },
    { sel: "#debugToggle", t: "tour_6_t", d: "tour_6_d" },
    { sel: "#glossToggle", t: "tour_7_t", d: "tour_7_d" }
  ];
  var _tourIdx = 0, _tourActive = false;

  function _clearTourTarget() {
    var nodes = document.querySelectorAll(".tour-target");
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove("tour-target");
  }
  function _positionTourTip(el) {
    var tip = $("tourTip");
    var r = el.getBoundingClientRect();
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var cx = r.left + r.width / 2;
    var left = clamp(cx - tw / 2, 12, window.innerWidth - tw - 12);
    var top;
    if (r.bottom + 12 + th <= window.innerHeight) top = r.bottom + 12;
    else top = Math.max(12, r.top - th - 12);
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function showTourStep(i) {
    _tourIdx = i;
    var step = TOUR[i];
    var el = document.querySelector(step.sel);
    if (!el) { endTour(); return; }
    _clearTourTarget();
    el.classList.add("tour-target");
    $("tourTitle").textContent = t(step.t);
    $("tourDesc").textContent = t(step.d);
    $("tourCount").textContent = (i + 1) + " / " + TOUR.length;
    $("tourBack").hidden = (i === 0);
    $("tourNext").textContent = (i === TOUR.length - 1) ? t("tour_done") : t("tour_next");
    _positionTourTip(el);
  }
  function startTour() {
    _tourActive = true;
    $("tourTip").hidden = false;
    showTourStep(0);
  }
  function endTour() {
    _tourActive = false;
    $("tourTip").hidden = true;
    _clearTourTarget();
    try { localStorage.setItem("cc-tour", "done"); } catch (e) {}
  }

  $("tourNext").addEventListener("click", function () {
    if (_tourIdx >= TOUR.length - 1) endTour();
    else showTourStep(_tourIdx + 1);
  });
  $("tourBack").addEventListener("click", function () { if (_tourIdx > 0) showTourStep(_tourIdx - 1); });
  $("tourSkip").addEventListener("click", endTour);
  $("tourHelp").addEventListener("click", startTour);
  window.addEventListener("resize", function () {
    if (_tourActive && !$("tourTip").hidden) { var el = document.querySelector(TOUR[_tourIdx].sel); if (el) _positionTourTip(el); }
  });

  var _tourDone = false;
  try { _tourDone = localStorage.getItem("cc-tour") === "done"; } catch (e) {}

  function enterIntro() {
    var stageEl = document.querySelector(".stage");
    var compCol = document.querySelector(".companion-col");
    var sr = stageEl.getBoundingClientRect();
    var cr = compCol.getBoundingClientRect();
    var dx = (sr.left + sr.width / 2) - (cr.left + cr.width / 2);
    compCol.style.transform = "translateX(" + dx.toFixed(1) + "px)";
  }
  function endIntro() {
    var stageEl = document.querySelector(".stage");
    var compCol = document.querySelector(".companion-col");
    stageEl.classList.remove("intro");
    compCol.style.transform = "translateX(0)";
    if (!_tourDone) setTimeout(startTour, 900);
  }

  /* ============================================================
     Steuerung (Debug)
     ============================================================ */
  var sBase = $("s-baseline");
  var _scheduled = false;
  function schedule() { if (_scheduled) return; _scheduled = true; setTimeout(function () { _scheduled = false; persist(); render(); }, 30); }

  function bindRange(id, getLabel, set) {
    var el = $(id);
    el.addEventListener("input", function () { set(parseFloat(el.value)); el.previousElementSibling.querySelector(".val").textContent = getLabel(); schedule(); });
  }

  sBase.addEventListener("input", function () {
    params.baselineMWh = Math.round(Math.pow(10, parseFloat(sBase.value)));
    $("v-baseline").textContent = fmtNum(params.baselineMWh, 0) + " " + t("u_mwhYr");
    schedule();
  });
  bindRange("s-savings", function () { return fmtPct(params.savingsPct); }, function (v) { params.savingsPct = v; });
  bindRange("s-sensors", function () { return fmtNum(params.numSensors, 0); }, function (v) { params.numSensors = Math.round(v); });
  bindRange("s-data", function () { return fmtNum(params.dataGBday, 0) + " " + t("u_gbDay"); }, function (v) { params.dataGBday = v; });
  bindRange("s-train", function () { return fmtNum(params.trainingsPerYear, 0) + " " + t("u_timesYr"); }, function (v) { params.trainingsPerYear = Math.round(v); });
  bindRange("s-infer", function () { return fmtNum(params.inferenceW, 0) + " W"; }, function (v) { params.inferenceW = v; });

  function fillSelects() {
    fillSelect($("s-grid"), GRID, params.gridEF);
    fillSelect($("s-dc"), DC, params.dcEF);
  }
  function fillSelect(el, opts, selected) {
    el.innerHTML = opts.map(function (o) { return '<option value="' + o.v + '">' + t(o.k) + '</option>'; }).join("");
    el.value = String(selected);
  }
  $("s-grid").addEventListener("change", function () { params.gridEF = parseFloat(this.value); schedule(); });
  $("s-dc").addEventListener("change", function () { params.dcEF = parseFloat(this.value); schedule(); });

  function fillPresets() {
    var presetWrap = $("presets");
    presetWrap.innerHTML = Object.keys(PRESETS).map(function (k) { return '<button class="preset" data-k="' + k + '">' + t(PRESETS[k].k) + '</button>'; }).join("");
  }
  $("presets").addEventListener("click", function (e) {
    var b = e.target.closest(".preset"); if (!b) return;
    params = Object.assign({}, PRESETS[b.getAttribute("data-k")]);
    syncControls(); schedule();
  });

  function syncControls() {
    sBase.value = Math.log10(params.baselineMWh);
    $("s-savings").value = params.savingsPct;
    $("s-sensors").value = params.numSensors;
    $("s-data").value = params.dataGBday;
    $("s-train").value = params.trainingsPerYear;
    $("s-infer").value = params.inferenceW;
    fillSelects();
    updateLabels();
  }
  function updateLabels() {
    $("v-baseline").textContent = fmtNum(params.baselineMWh, 0) + " " + t("u_mwhYr");
    $("v-savings").textContent = fmtPct(params.savingsPct);
    $("v-sensors").textContent = fmtNum(params.numSensors, 0);
    $("v-data").textContent = fmtNum(params.dataGBday, 0) + " " + t("u_gbDay");
    $("v-train").textContent = fmtNum(params.trainingsPerYear, 0) + " " + t("u_timesYr");
    $("v-infer").textContent = fmtNum(params.inferenceW, 0) + " W";
  }

  function persist() { try { localStorage.setItem("cc-params", JSON.stringify(params)); } catch (e) {} }

  /* ============================================================
     Sprache
     ============================================================ */
  function buildLangSelect() {
    var sel = $("langSel");
    sel.innerHTML = LANGS.map(function (l) { return '<option value="' + l.code + '">' + l.name + '</option>'; }).join("");
  }
  function applyStatic() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute("data-i18n"));
    $("worthQ").textContent = t("worthQ");
    $("wNo").textContent = t("w_no");
    $("wMid").textContent = t("w_mid");
    $("wYes").textContent = t("w_yes");
    $("progress").setAttribute("aria-label", t("topicsLabel"));
    $("companion").setAttribute("aria-label", t("companionAria"));
    $("debugClose").setAttribute("aria-label", t("debugCloseAria"));
    $("glossClose").setAttribute("aria-label", t("debugCloseAria"));
    $("tourHelp").setAttribute("aria-label", t("tour_help"));
  }
  function setLang(code) {
    LANG = code;
    document.documentElement.lang = code;
    applyStatic();
    fillSelects();
    fillPresets();
    updateLabels();
    render();
    renderGlossary();
    try { localStorage.setItem("cc-lang", code); } catch (e) {}
  }
  $("langSel").addEventListener("change", function () { setLang(this.value); });

  /* ============================================================
     Avatar-Animation: Körper neigt sich, Augen folgen separat & stärker
     ============================================================ */
  var avatarEl = document.querySelector(".avatar");
  var eyesEl = $("av-eyes");
  var compBtn = $("companion");
  var _avTX = 0, _avTY = 0, _avCX = 0, _avCY = 0, _avSquash = 0;
  var _avEX = 0, _avEY = 0, _avBlink = 0;
  var _avReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (avatarEl && !_avReduced) {
    document.addEventListener("mousemove", function (e) {
      var r = compBtn.getBoundingClientRect();
      if (!r.width) return;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      _avTX = clamp((e.clientX - cx) / (r.width / 2), -1.5, 1.5);
      _avTY = clamp((e.clientY - cy) / (r.height / 2), -1.5, 1.5);
    });
    compBtn.addEventListener("click", function () { _avSquash = 1; });
    var _avT0 = (typeof performance !== "undefined") ? performance.now() : Date.now();
    function _avAnimate(now) {
      var t = now - _avT0;
      var bob = Math.sin(t / 1000) * 3.5;
      var wander = Math.sin(t / 1600) * 2.5;
      _avCX += (_avTX - _avCX) * 0.08;
      _avCY += (_avTY - _avCY) * 0.08;
      _avEX += (_avTX * 14 + wander - _avEX) * 0.14;
      _avEY += (_avTY * 10 - _avEY) * 0.14;
      _avSquash *= 0.88;
      _avBlink *= 0.85;
      var rot = _avCX * 7;
      var tx = _avCX * 5, ty = _avCY * 4 + bob;
      var s = 1 - _avSquash * 0.08;
      avatarEl.style.transform = "rotate(" + rot.toFixed(2) + "deg) translate(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px) scale(" + s.toFixed(3) + ")";
      eyesEl.setAttribute("transform", "translate(" + _avEX.toFixed(2) + " " + _avEY.toFixed(2) + ")");
      eyesEl.setAttribute("opacity", (1 - _avBlink * 0.85).toFixed(2));
      requestAnimationFrame(_avAnimate);
    }
    requestAnimationFrame(_avAnimate);
    function _doBlink() {
      _avBlink = 1;
      setTimeout(_doBlink, 2800 + Math.random() * 2500);
    }
    setTimeout(_doBlink, 2800);
  }

  /* ============================================================
     Init
     ============================================================ */
  buildLangSelect();
  $("langSel").value = LANG;
  document.documentElement.lang = LANG;
  applyStatic();
  fillSelects();
  fillPresets();
  syncControls();
  render();
  renderGlossary();
  enterIntro();
  setTimeout(endIntro, 700);
})();
