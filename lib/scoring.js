/**
 * Shared W3 Scoring Logic
 */

export async function calculateW3Score(data) {
    let score = 0;
    const breakdown = {};

    // 1. Legal Form (20 pts)
    const legalForm = data.legal_form || '';
    if (['SAS', 'SASU', 'SOCIETE PAR ACTIONS SIMPLIFIEE'].some(f => legalForm.toUpperCase().includes(f))) {
        score += 20;
    } else if (['SARL', 'EURL'].some(f => legalForm.toUpperCase().includes(f))) {
        score += 10;
    }

    // 2. Capital Social (15 pts)
    const capital = parseFloat(data.capital) || 0;
    if (capital >= 10000) score += 15;
    else if (capital >= 1000) score += 5;

    // 3. Sector Priority (15 pts)
    const naf = data.naf_code || '';
    if (naf.startsWith('43')) score += 15;
    else if (naf.startsWith('62') || naf.startsWith('63') || naf === '7022Z') score += 15;

    // 4. Geographic Hub (10 pts)
    const pc = data.postal_code || '';
    const hubs = ['75', '92', '69', '33', '44', '13', '59', '31'];
    if (hubs.some(h => pc.startsWith(h))) score += 10;

    // 5. Associates (5 pts)
    if (data.associates_count > 1) score += 5;

    // 6. AI Intent (35 pts)
    const ai = await analyzeIntentWithAI(data);
    score += ai.points;

    return {
        score: Math.min(Math.round(score), 100),
        rationale: ai.rationale
    };
}

async function analyzeIntentWithAI(data) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return { points: 15, rationale: "Base complexity." };

    const prompt = `Analyze French company potential for accounting fees: ${data.company_name}, NAF ${data.naf_code}, Capital ${data.capital} EUR, Form ${data.legal_form}. Return JSON: {"points": 0-35, "rationale": "one sentence"}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });
        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);
        return { points: content.points, rationale: content.rationale };
    } catch (e) {
        return { points: 15, rationale: "Average market potential." };
    }
}
