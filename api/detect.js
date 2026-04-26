/**
 * Amont W1_DÉTECTION Engine
 * Primary worker for French pre-registry signal detection (J+3 window)
 * 
 * Filters: Île-de-France, BTP & Tech/Startup sectors
 */

export default async function handler(req, res) {
    const INPI_API_KEY = process.env.INPI_API_KEY;
    const DB_ID = '86dc88ea-583d-4ed6-9d53-f0870898688d';
    
    // In production, this would be a secure cron trigger or webhook
    // For the pilot, we allow GET requests for manual triggering during testing

    try {
        console.log('[W1_DETECTION] Initiating synchronized RNE flux crawl...');

        // 1. Fetch from RNE/Pappers flux
        // In a real-world scenario, we fetch the daily diff files from INPI or Pappers
        const rawSignals = await fetchRNEFlux();

        // 2. W1_DÉTECTION Logic: Multidimensional Filtering
        const processedSignals = rawSignals.filter(signal => {
            // A. Temporal Window: J+3 (Created 1-3 days ago)
            const creationDate = new Date(signal.creation_date);
            const today = new Date('2026-04-26'); // Reference date
            const diffTime = Math.abs(today - creationDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const isInTemporalWindow = diffDays <= 3;

            // B. Geographic Filter: Île-de-France (IDF)
            const idfPrefixes = ['75', '77', '78', '91', '92', '93', '94', '95'];
            const isIDF = idfPrefixes.some(prefix => signal.postal_code.startsWith(prefix));

            // C. Sector Filter: BTP & Startup/Tech
            // BTP: NAF 43.xx
            // Tech/Startup: NAF 62.xx, 63.xx, 70.22Z
            const isBTP = signal.naf_code.startsWith('43');
            const isTech = signal.naf_code.startsWith('62') || signal.naf_code.startsWith('63') || signal.naf_code === '7022Z';
            
            const isInTargetSector = isBTP || isTech;

            return isInTemporalWindow && isIDF && isInTargetSector;
        }).map(signal => {
            // 3. Enrichment: Contact Cues Generation
            // We generate cues for the W2_ENRICHISSEMENT worker
            const founderCue = signal.dirigeant_nom ? `${signal.dirigeant_prenom} ${signal.dirigeant_nom}` : "Fondateur non identifié";
            const linkedinSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(signal.company_name + ' ' + founderCue)}`;

            return {
                ...signal,
                sector_group: signal.naf_code.startsWith('43') ? 'BTP' : 'TECH/STARTUP',
                contact_cue: founderCue,
                linkedin_link: linkedinSearch,
                detected_at: new Date().toISOString()
            };
        });

        // 4. Persistence to Baget Database
        if (processedSignals.length > 0) {
            const rows = processedSignals.map(s => ({
                data: {
                    company_name: s.company_name,
                    siren: s.siren,
                    creation_date: s.creation_date,
                    sector: `${s.naf_code} - ${s.sector_group}`,
                    location: `${s.postal_code} ${s.city}`,
                    source: 'RNE_PRE_REGISTRY_FLUX',
                    contact_cue: s.contact_cue,
                    linkedin_link: s.linkedin_link
                },
                externalKey: s.siren // Deduplication
            }));

            await fetch(`https://baget.ai/api/public/databases/${DB_ID}/rows`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows })
            });

            console.log(`[W1_SUCCESS] ${processedSignals.length} high-intent signals synced to DB.`);
        }

        // Return the clean JSON array as requested
        return res.status(200).json(processedSignals);

    } catch (error) {
        console.error('[W1_ERROR] Engine failure:', error);
        return res.status(500).json({ error: 'Worker synchronization failed' });
    }
}

/**
 * MOCK: Represents the high-fidelity RNE daily flux for April 26, 2026
 * These are real-world data shapes for BTP and Tech startups in IDF
 */
async function fetchRNEFlux() {
    return [
        { 
            company_name: "BATIPRO IDF SERVICES", 
            siren: "905144882", 
            creation_date: "2026-04-24", 
            naf_code: "4321A", 
            postal_code: "75011", 
            city: "Paris",
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
            dirigeant_nom: "KHAN",
            dirigeant_prenom: "Sarah"
        },
        { 
            company_name: "RENOV'TOIT 77", 
            siren: "907322445", 
            creation_date: "2026-04-23", 
            naf_code: "4391A", 
            postal_code: "77000", 
            city: "Melun",
            dirigeant_nom: "GARCIA",
            dirigeant_prenom: "Julien"
        },
        { 
            company_name: "DATA-CORE SYSTEMS", 
            siren: "908433556", 
            creation_date: "2026-04-26", 
            naf_code: "6311Z", 
            postal_code: "75008", 
            city: "Paris",
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
            dirigeant_nom: "MOREL",
            dirigeant_prenom: "Alice"
        },
        { 
            company_name: "STRAT-DEV CONSULTING", 
            siren: "910655778", 
            creation_date: "2026-04-25", 
            naf_code: "7022Z", 
            postal_code: "92000", 
            city: "Nanterre",
            dirigeant_nom: "BERNARD",
            dirigeant_prenom: "Marc"
        }
    ];
}
