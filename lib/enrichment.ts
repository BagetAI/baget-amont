/**
 * Amont W2_ENRICHISSEMENT Logic
 * Enriches W1 signals with Pappers data (CA, Founder, Growth Signals).
 */
import { fetchPappersCompanyData } from './pappers';

export interface EnrichedData {
  ca: number | string;
  founder_name: string;
  growth_signals: string[];
  legal_form: string;
  capital: number;
  associates_count: number;
}

export async function enrichSignal(siren: string): Promise<EnrichedData | null> {
  console.log(`[W2_ENRICH] Enriching SIREN: ${siren}`);
  
  const pappersData = await fetchPappersCompanyData(siren);
  
  if (!pappersData) {
    return {
      ca: "N/A (J+3)",
      founder_name: "Fondateur via RNE",
      growth_signals: ["Signal de création récent détecté à J+3"],
      legal_form: "Inconnue",
      capital: 0,
      associates_count: 1
    };
  }

  // Extract primary founder (President or Gérant)
  const mainDirigeant = pappersData.dirigeants?.[0];
  const founderName = mainDirigeant ? `${mainDirigeant.prenom || ''} ${mainDirigeant.nom || ''}`.trim() : "Fondateur via RNE";
  
  // Growth signals based on metadata
  const signals = [];
  const capital = pappersData.capital || 0;
  const associates = pappersData.dirigeants?.length || 1;
  const naf = pappersData.code_naf || '';

  if (capital >= 10000) signals.push("Capital social élevé : profil solvable");
  if (associates > 2) signals.push("Structure multi-associés : besoin d'expertise pacte d'associés");
  if (naf.startsWith('43') && capital > 5000) signals.push("BTP Haute Capacité : besoin gestion décennale et flotte");
  if ((naf.startsWith('62') || naf.startsWith('63')) && associates >= 2) signals.push("Startup à fort potentiel de scalabilité (JEI/CIR)");

  return {
    ca: pappersData.chiffre_affaires || "0 (Phase de lancement)",
    founder_name: founderName,
    growth_signals: signals.length > 0 ? signals : ["Lancement d'activité standard"],
    legal_form: pappersData.forme_juridique || "N/A",
    capital: capital,
    associates_count: associates
  };
}
