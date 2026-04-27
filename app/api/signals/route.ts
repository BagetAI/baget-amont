import { NextResponse } from 'next/server';

const DB_SIGNALS_V2 = '88c0ef02-5c38-46d5-8c77-7c01986fbbd1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');

  try {
    const response = await fetch(`https://baget.ai/api/public/databases/${DB_SIGNALS_V2}/rows`, {
      cache: 'no-store'
    });
    const rows = await response.json();

    if (!rows) return NextResponse.json([]);

    // Filter by ZIP if provided
    let filteredData = rows.map((r: any) => ({
      id: r.id,
      ...r.data
    }));

    if (zip) {
      filteredData = filteredData.filter((lead: any) => 
        lead.location?.includes(zip)
      );
    }

    // Sort by score descending
    filteredData.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Signals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}
