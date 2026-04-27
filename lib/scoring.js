/**
 * Shared W3 Scoring Logic
 * Updated to use W2 Enriched Data
 */

export async function calculateW3Score(data, enriched = null) {
    let score = 0;
    const breakdown = {};

    // Use enriched data if available, fallback to basic signal
    const legalForm = (enriched?.legal_form || data.legal_form || '').toUpperCase();
    const capital = parseFloat(enriched?.capital || data.capital) || 0;
    const associates = parseInt(enriched?.associates_count || data.associates_count) || 1;
    const naf = data.naf_code || '';

    // 1. Legal Form (20 pts)
    if (['SAS', 'SASU', 'SOCIETE PAR ACTIONS SIMPLIFIEE'].some(f => legalForm.includes(f))) {
        score += 20;
    } else if (['SARL', 'EURL'].some(f => legalForm.includes(f))) {
        score += 10;
    }

    // 2. Capital Social (15 pts)
    if (capital >= 10000) score += 15;
    else if (capital >= 1000) score += 5;

    // 3. Sector Priority (15 pts)
    if (naf.startsWith('43')) score += 15;
    else if (naf.startsWith('62') || naf.startsWith('63') || naf === '7022Z') score += 15;

    // 4. Geographic Hub (10 pts)
    const pc = data.postal_code || '';
    const hubs = ['75', '92', '69', '33', '44', '13', '59', '31'];
    if (hubs.some(h => pc.startsWith(h))) score += 10;

    // 5. Associates (5 pts)
    if (associates > 1) score += 5;

    // 6. AI Intent & Enrichment Context (35 pts)
    const context = enriched ? {
        ...data,
        growth_signals: enriched.growth_signals,
        ca: enriched.ca
    } : data;

    const ai = await analyzeIntentWithAI(context);
    score += ai.points;

    return {
        score: Math.min(Math.round(score), 100),
        rationale: ai.rationale
    };
}

async function analyzeIntentWithAI(data) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return { points: 15, rationale: "Potentiel de croissance standard." };

    const prompt = `
        Analyze French company potential for accounting fees: 
        Name: ${data.company_name}
        Sector: ${data.naf_code}
        Capital: ${data.capital} EUR
        Form: ${data.legal_form}
        Signals: ${data.growth_signals?.join(', ') || 'N/A'}
        Revenue: ${data.ca || 'N/A'}
        
        Return JSON ONLY: {"points": 0-35, "rationale": "one concise sentence highlighting growth potential"}
    `;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: "Expert-comptable growth analyst." }, { role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });
        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);
        return { points: content.points, rationale: content.rationale };
    } catch (e) {
        return { points: 15, rationale: "Potentiel de croissance standard." };
    }
}
