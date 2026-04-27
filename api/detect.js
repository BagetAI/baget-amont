/**
 * Amont W1_DÉTECTION Engine + W3_SCORING Integration
 */
import { calculateW3Score } from '../lib/scoring.js';

export default async function handler(req, res) {
    const DB_ID = '88c0ef02-5c38-46d5-8c77-7c01986fbbd1'; // v2 with score column
    
    try {
        console.log('[W1_W3] Initiating synchronized RNE flux crawl and scoring...');

        const rawSignals = await fetchRNEFlux();

        // 1. Filter IDF & Sectors
        const targetSignals = rawSignals.filter(signal => {
            const idfPrefixes = ['75', '77', '78', '91', '92', '93', '94', '95'];
            const isIDF = idfPrefixes.some(prefix => signal.postal_code.startsWith(prefix));
            const isBTP = signal.naf_code.startsWith('43');
            const isTech = signal.naf_code.startsWith('62') || signal.naf_code.startsWith('63') || signal.naf_code === '7022Z';
            return isIDF && (isBTP || isTech);
        });

        // 2. Score each signal
        const processedSignals = [];
        for (const s of targetSignals) {
            const scoreData = await calculateW3Score(s);
            
            const founderCue = s.dirigeant_nom ? `${s.dirigeant_prenom} ${s.dirigeant_nom}` : "Fondateur via RNE";
            const linkedinSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(s.company_name + ' ' + founderCue)}`;

            processedSignals.push({
                ...s,
                score: scoreData.score,
                rationale: scoreData.rationale,
                sector_group: s.naf_code.startsWith('43') ? 'BTP' : 'TECH/STARTUP',
                contact_cue: founderCue,
                linkedin_link: linkedinSearch
            });
        }

        // 3. Persistence
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
                    source: 'RNE_PRE_REGISTRY_FLUX',
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

            console.log(`[W1_W3_SUCCESS] ${processedSignals.length} scored signals synced.`);
        }

        return res.status(200).json(processedSignals);

    } catch (error) {
        console.error('[W1_W3_ERROR] Engine failure:', error);
        return res.status(500).json({ error: 'Worker synchronization failed' });
    }
}

async function fetchRNEFlux() {
    // Enriched mock data for April 27, 2026
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
            company_name: "DATA-CORE SYSTEMS", 
            siren: "908433556", 
            creation_date: "2026-04-26", 
            naf_code: "6311Z", 
            postal_code: "75008", 
            city: "Paris",
            legal_form: "SAS",
            capital: 2000,
            associates_count: 2,
            dirigeant_nom: "CHEN",
            dirigeant_prenom: "David"
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
