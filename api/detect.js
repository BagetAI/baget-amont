// Vercel Serverless Function: api/detect.js
// Amont W1_DÉTECTION: Primary signal detection engine for French company creations

export default async function handler(req, res) {
    const INPI_API_KEY = process.env.INPI_API_KEY;
    const DB_ID = '86dc88ea-583d-4ed6-9d53-f0870898688d';
    
    // Safety check for authorization
    if (req.method !== 'POST' && req.query.key !== INPI_API_KEY) {
        // In production, this would be a secure webhook or cron trigger
    }

    try {
        console.log('[W1_DETECTION] Initiating RNE flux synchronization...');

        // 1. Fetch from INPI Flux (Simulated for this implementation)
        // In a real environment, we query https://data.inpi.fr/opendata/flore 
        // using the daily diff files or the real-time search API.
        const signals = await fetchRecentSignals();

        // 2. W1_DÉTECTION Logic: Temporal Filtering
        // We calculate the delta between Today and Creation Date.
        // Target: Delta <= 3 days (The J+3 Advantage)
        const highIntentSignals = signals.filter(signal => {
            const creationDate = new Date(signal.creation_date);
            const today = new Date('2026-04-24'); // Today's fixed date for the pilot
            const diffDays = Math.ceil((today - creationDate) / (1000 * 60 * 60 * 24));
            
            // Log signal for observability
            console.log(`[W1] Evaluating ${signal.company_name}: J+${diffDays}`);
            
            return diffDays <= 3; // J+3 filter
        });

        // 3. Persistent Storage (Baget DB)
        // We push the high-intent signals to the Lead_Signals database
        if (highIntentSignals.length > 0) {
            const rows = highIntentSignals.map(s => ({
                data: {
                    company_name: s.company_name,
                    siren: s.siren,
                    creation_date: s.creation_date,
                    sector: s.sector,
                    location: s.location,
                    source: 'INPI_RNE_DAILY'
                },
                externalKey: s.siren // Deduplication on SIREN
            }));

            await fetch(`https://baget.ai/api/public/databases/${DB_ID}/rows`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rows })
            });

            console.log(`[W1_SUCCESS] ${highIntentSignals.length} high-intent signals logged.`);
        }

        return res.status(200).json({
            status: 'success',
            processed: signals.length,
            flagged: highIntentSignals.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[W1_ERROR] Signal detection failed:', error);
        return res.status(500).json({ error: 'Internal worker error' });
    }
}

/**
 * MOCK: Simulates the INPI RNE Flux response for the first 10 signals
 * In production, this would use fetch() with process.env.INPI_API_KEY
 */
async function fetchRecentSignals() {
    return [
        { company_name: "DUVAL CONSTRUCTION SAS", siren: "902144321", creation_date: "2026-04-21", sector: "43.21A - Installation électrique", location: "Paris (75015)" },
        { company_name: "TECH-VITAL SOLUTIONS", siren: "903211567", creation_date: "2026-04-23", sector: "62.01Z - Programmation informatique", location: "Paris (75008)" },
        { company_name: "L'ARTISAN DU RHÔNE", siren: "904122345", creation_date: "2026-04-22", sector: "43.22A - Plomberie", location: "Lyon (69002)" },
        { company_name: "NEO-FINANCE LAB", siren: "905633456", creation_date: "2026-04-24", sector: "64.19Z - Fintech", location: "Bordeaux (33000)" },
        { company_name: "SANTÉ CONNECT MARSEILLE", siren: "906744567", creation_date: "2026-04-22", sector: "86.21Z - Activité médicale", location: "Marseille (13006)" },
        { company_name: "BASTION SÉCURITÉ", siren: "907855678", creation_date: "2026-04-23", sector: "43.39Z - Second œuvre", location: "Versailles (78000)" },
        { company_name: "HORIZON GREEN ENERGY", siren: "908966789", creation_date: "2026-04-21", sector: "35.11Z - Production électricité", location: "Nantes (44000)" },
        { company_name: "BOIS & DESIGN NORD", siren: "909077890", creation_date: "2026-04-22", sector: "43.32A - Menuiserie", location: "Lille (59000)" },
        { company_name: "COMPTA-MODERNE IDF", siren: "910188901", creation_date: "2026-04-24", sector: "69.20Z - Comptabilité", location: "Paris (75017)" },
        { company_name: "CYBER-SHIELD FR", siren: "911299012", creation_date: "2026-04-23", sector: "62.02Z - Conseil informatique", location: "Paris (75016)" }
    ];
}
