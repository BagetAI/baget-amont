import { NextResponse } from 'next/server';
import { generateLettreDeMission } from '@/lib/contract-generator';

const DB_SIGNALS_V2 = '88c0ef02-5c38-46d5-8c77-7c01986fbbd1';

export async function POST(request: Request) {
  try {
    const { prospect_id } = await request.json();

    if (!prospect_id) {
      return NextResponse.json({ error: 'Missing prospect_id' }, { status: 400 });
    }

    // 1. Fetch prospect data from Database
    const response = await fetch(`https://app.baget.ai/api/public/databases/${DB_SIGNALS_V2}/rows`);
    const rows = await response.json();
    
    const prospect = rows.find((r: any) => r.id === prospect_id);

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const { company_name, siren, sector, contact_cue, score } = prospect.data;

    // 2. Generate the contract content
    console.log(`[W4_CONTRACT] Generating contract for ${company_name}...`);
    const contractContent = await generateLettreDeMission({
      company_name,
      siren,
      sector,
      contact_cue,
      score: score || 0
    });

    // 3. Return the contract content
    // In a real production app, we would use a library like 'pdfkit' or 'react-pdf' to generate a real PDF binary.
    // For this MVP, we return the Markdown/Text content which represents the draft.
    return NextResponse.json({
      success: true,
      prospect_id,
      company_name,
      contract_content: contractContent,
      filename: `Lettre_Mission_${siren}_${new Date().toISOString().split('T')[0]}.pdf`,
      status: 'GENERATED'
    });

  } catch (error) {
    console.error('[GENERATE_CONTRACT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate contract' }, { status: 500 });
  }
}
