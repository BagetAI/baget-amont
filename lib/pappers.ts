/**
 * Pappers API Client
 * Used for W2_ENRICHISSEMENT to fetch real company data.
 */

export async function fetchPappersCompanyData(siren: string) {
  const PAPPERS_API_KEY = process.env.PAPPERS_API_KEY;
  
  if (!PAPPERS_API_KEY) {
    console.warn('[W2_PAPPERS] No API key found. Returning mock enrichment data.');
    return null;
  }

  try {
    const response = await fetch(`https://api.pappers.fr/v2/entreprise?siren=${siren}&api_token=${PAPPERS_API_KEY}`);
    
    if (!response.ok) {
      console.error(`[W2_PAPPERS] API error for SIREN ${siren}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[W2_PAPPERS] Fetch failed:', error);
    return null;
  }
}
