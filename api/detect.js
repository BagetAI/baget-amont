/**
 * Amont Worker Engine
 * W1_DÉTECTION -> W2_ENRICHISSEMENT -> W3_SCORING
 */
import { calculateW3Score } from '../lib/scoring.js';
import { enrichSignal } from '../lib/enrichment';

export default async function handler(req, res) {
    const DB_ID = '88c0ef02-5c38-46d5-8c77-7c01986fbbd1'; 
    
    try {
        console.log('[AMONT_WORKER] Initiating W1 -> W2 -> W3 Pipeline...');

        // W1: DETECTION (Fetch raw signals)
        const rawSignals = await fetchRNEFlux();

        // Filter IDF & Target Sectors
        const targetSignals = rawSignals.filter(signal => {
            const idfPrefixes = ['75', '77', '78', '91', '92', '93', '94', '95'];
            const isIDF = idfPrefixes.some(prefix => signal.postal_code.startsWith(prefix));
            const isBTP = signal.naf_code.startsWith('43');
            const isTech = signal.naf_code.startsWith('62') || signal.naf_code.startsWith('63') || signal.naf_code === '7022Z';
            return isIDF && (isBTP || isTech);
        });

        const processedSignals = [];

        for (const s of targetSignals) {
            // W2: ENRICHISSEMENT
            const enriched = await enrichSignal(s.siren);
            
            // W3: SCORING
            const scoreData = await calculateW3Score(s, enriched);
            
            const founderName = enriched?.founder_name || `${s.dirigeant_prenom} ${s.dirigeant_nom}`;
            const linkedinSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(s.company_name + ' ' + founderName)}`;

            // Combine rationale with growth signals
            const fullRationale = `${scoreData.rationale} [Signaux: ${enriched?.growth_signals?.join(', ')}] [CA: ${enriched?.ca}]`;

            processedSignals.push({
                ...s,
                score: scoreData.score,
                rationale: fullRationale,
                sector_group: s.naf_code.startsWith('43') ? 'BTP' : 'TECH/STARTUP',
                contact_cue: founderName,
                linkedin_link: linkedinSearch
            });
        }

        // Persistence to Agent Database
        if (processedSignals.length > 0) {
            const rows = processedSignals.map(s => ({
                data: {
                    company_name: s.company_name,
                    siren: s.siren,
                    creation_date: s.creation_date,
                    sector: `${s.naf_code} - ${s.sector_group}`,
                    location: `${s.postal_code} ${s.city}`,
                    score: s.score,
                    rationale: s.rationale,
                    source: 'AMONT_J+3_ENRICHED_FLUX',
                    contact_cue: s.contact_cue,
                    linkedin_link: s.linkedin_link
                },
                externalKey: s.siren
            }));

            await fetch(`https://baget.ai/api/public/databases/${DB_ID}/rows`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows })
            });

            console.log(`[AMONT_WORKER_SUCCESS] ${processedSignals.length} leads enriched and scored.`);
        }

        return res.status(200).json({
            success: true,
            count: processedSignals.length,
            leads: processedSignals
        });

    } catch (error) {
        console.error('[AMONT_WORKER_ERROR] Pipeline failed:', error);
        return res.status(500).json({ error: 'Worker pipeline failed' });
    }
}

async function fetchRNEFlux() {
    // Simulated RNE Flux for the demo / current date
    // In production, this would call the INPI / data.gouv API
    return [
        { 
            company_name: "BATIPRO IDF SERVICES", 
            siren: "905144882", 
            creation_date: "2026-04-24", 
            naf_code: "4321A", 
            postal_code: "75011", 
            city: "Paris",
            legal_form: "SASU",
            capital: 5000,
            associates_count: 1,
            dirigeant_nom: "LEFEBVRE",
            dirigeant_prenom: "Thomas"
        },
        { 
            company_name: "CYBER-MIND AI", 
            siren: "906211334", 
            creation_date: "2026-04-25", 
            naf_code: "6201Z", 
            postal_code: "92100", 
            city: "Boulogne-Billancourt",
            legal_form: "SAS",
            capital: 15000,
            associates_count: 3,
            dirigeant_nom: "KHAN",
            dirigeant_prenom: "Sarah"
        },
        { 
            company_name: "STRUCTURE & BOIS", 
            siren: "909544667", 
            creation_date: "2026-04-24", 
            naf_code: "4332A", 
            postal_code: "94200", 
            city: "Ivry-sur-Seine",
            legal_form: "SARL",
            capital: 1000,
            associates_count: 1,
            dirigeant_nom: "MOREL",
            dirigeant_prenom: "Alice"
        }
    ];
}
