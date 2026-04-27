/**
 * Amont W3_SCORING Engine
 * Core predictive scoring logic for business creation signals.
 * Uses legal markers and LLM-powered intent extraction.
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST with company data.' });
    }

    const { company_data } = req.body;

    if (!company_data) {
        return res.status(400).json({ error: 'Missing company_data in request body.' });
    }

    try {
        const scoreResult = await calculateW3Score(company_data);
        return res.status(200).json(scoreResult);
    } catch (error) {
        console.error('[W3_ERROR] Scoring failure:', error);
        return res.status(500).json({ error: 'Scoring engine failed' });
    }
}

async function calculateW3Score(data) {
    let score = 0;
    const breakdown = {};

    // 1. Legal Form (20 pts)
    // SAS/SASU are high value due to social regime complexity (President vs Gérant)
    if (['SAS', 'SASU', 'SOCIETE PAR ACTIONS SIMPLIFIEE'].some(f => data.legal_form?.toUpperCase().includes(f))) {
        score += 20;
        breakdown.legal_form = 20;
    } else if (['SARL', 'EURL'].some(f => data.legal_form?.toUpperCase().includes(f))) {
        score += 10;
        breakdown.legal_form = 10;
    }

    // 2. Capital Social (15 pts)
    // High capital indicates solvency and investment needs
    const capital = parseFloat(data.capital) || 0;
    if (capital >= 10000) {
        score += 15;
        breakdown.capital = 15;
    } else if (capital >= 1000) {
        score += 5;
        breakdown.capital = 5;
    }

    // 3. Sector Priority (15 pts)
    // BTP (43) and Tech (62/63) have high regulatory requirements
    const naf = data.naf_code || '';
    if (naf.startsWith('43')) {
        score += 15;
        breakdown.sector = 15;
    } else if (naf.startsWith('62') || naf.startsWith('63') || naf === '7022Z') {
        score += 15;
        breakdown.sector = 15;
    }

    // 4. Geographic Hub (10 pts)
    const pc = data.postal_code || '';
    const hubs = ['75', '92', '69', '33', '44', '13', '59', '31'];
    if (hubs.some(h => pc.startsWith(h))) {
        score += 10;
        breakdown.location = 10;
    }

    // 5. Management Complexity (5 pts)
    // Multiple associates = more payroll/reporting work
    if (data.associates_count > 1) {
        score += 5;
        breakdown.associates = 5;
    }

    // 6. LLM-Powered Intent & Complexity (35 pts total)
    // We use OpenAI to extract nuance from the company name, sector description, and unstructured data
    const llmAnalysis = await analyzeIntentWithAI(data);
    score += llmAnalysis.points;
    breakdown.ai_intent = llmAnalysis.points;
    breakdown.ai_rationale = llmAnalysis.rationale;

    // Cap at 100
    const finalScore = Math.min(Math.round(score), 100);

    return {
        score: finalScore,
        breakdown,
        metadata: {
            siren: data.siren,
            company_name: data.company_name,
            timestamp: new Date().toISOString()
        }
    };
}

async function analyzeIntentWithAI(data) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        return { points: 15, rationale: "AI scoring bypassed (API Key missing), using baseline." };
    }

    const prompt = `
        Analyze this French business creation signal for an accounting firm (Expert-comptable).
        Company: ${data.company_name}
        Sector: ${data.naf_code} - ${data.sector_description || ''}
        Capital: ${data.capital} EUR
        Legal Form: ${data.legal_form}
        Location: ${data.postal_code} ${data.city || ''}
        
        Task:
        1. Evaluate the annual accounting fee potential (honoraires potential).
        2. Evaluate the fiscal/social complexity.
        3. Assign an "AI Complexity Score" from 0 to 35.
        
        Return ONLY a JSON object: {"points": number, "rationale": "short string explaining the potential"}.
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
                    { role: "system", content: "You are an AI Expert-Comptable auditor analyzing company growth potential." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        const result = await response.json();
        const content = JSON.parse(result.choices[0].message.content);
        return {
            points: Math.min(content.points, 35),
            rationale: content.rationale
        };
    } catch (e) {
        return { points: 15, rationale: "AI Analysis failed, fallback to average." };
    }
}
