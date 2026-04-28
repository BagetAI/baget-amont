/**
 * Amont W4_CLOSING: Contract Generation Library
 * Uses lead data and AI to generate a professional 'Lettre de Mission'.
 */

export interface ContractData {
  company_name: string;
  siren: string;
  sector: string;
  contact_cue: string;
  score: number;
}

export async function generateLettreDeMission(data: ContractData) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    return generateFallbackTemplate(data);
  }

  const prompt = `
    Générez une "Lettre de Mission" professionnelle pour un cabinet d'expertise comptable (Amont Partner).
    Le client est une nouvelle entreprise détectée à J+3.
    
    Informations Client:
    Nom: ${data.company_name}
    SIREN: ${data.siren}
    Secteur: ${data.sector}
    Dirigeant: ${data.contact_cue}
    Priorité Score: ${data.score}/100
    
    La lettre doit inclure:
    1. Objet: Mission de présentation des comptes et accompagnement à la création.
    2. Description des travaux: Tenue comptable, déclarations fiscales, social (si nécessaire pour le secteur), et conseils stratégiques J+3.
    3. Honoraires: Basés sur un forfait mensuel (à laisser en blanc [___] € HT).
    4. Clause d'exclusivité J+3 Amont.
    
    Utilisez un ton professionnel, formel et juridique. Langue: Français.
    Formatage: Markdown propre.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Vous êtes un expert juridique spécialisé dans la rédaction de lettres de mission pour experts-comptables français." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (e) {
    console.error('[CONTRACT_GEN_ERROR] AI failure:', e);
    return generateFallbackTemplate(data);
  }
}

function generateFallbackTemplate(data: ContractData) {
  return `
# LETTRE DE MISSION - PROGRAMME J+3 AMONT

**Entre les soussignés :**
**Amont Partner**, (ci-après "le Cabinet")
**${data.company_name}**, SIREN ${data.siren}, représenté par ${data.contact_cue} (ci-après "le Client")

## 1. Objet de la mission
Le Client confie au Cabinet une mission d'expertise comptable liée à la création de son activité dans le secteur ${data.sector}.

## 2. Description des prestations
- Surveillance des flux RNE/INPI et intégration des données J+3.
- Tenue de la comptabilité générale.
- Déclarations fiscales et sociales périodiques.
- Accompagnement stratégique post-immatriculation.

## 3. Honoraires
Les honoraires pour cette mission sont fixés à un montant forfaitaire mensuel de [___] € HT.

## 4. Conditions Générales
La présente mission est régie par les conditions générales de l'Ordre des Experts-Comptables.

Fait à Paris, le ${new Date().toLocaleDateString('fr-FR')}
  `;
}
