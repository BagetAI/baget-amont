import { NextResponse } from 'next/server';

/**
 * AMONT Notification Handler
 * Handles real-time alerts for the W1 detection engine.
 * Supports 'Bascule Auto J+5' logic by logging future follow-up dates.
 */

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { type, firm_name, lead, bascule_date } = payload;

    if (!lead || !firm_name) {
      return NextResponse.json({ error: 'Missing lead or firm information' }, { status: 400 });
    }

    // Log the notification payload as requested
    console.log(`[NOTIFY_WORKER] Real-time alert triggered!`);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      type: type || 'NEW_SIGNAL_DETECTED',
      firm: firm_name,
      lead_name: lead.company_name,
      founder: lead.founder || lead.contact_cue,
      score: lead.score,
      bascule_logic: `Bascule Auto J+5 scheduled for ${bascule_date}`,
      status: 'SENT_TO_WHATSAPP_SIMULATED'
    }, null, 2));

    // Simulation of a WhatsApp API call (e.g., via Twilio or Meta API)
    // await sendWhatsAppAlert(firm_name, lead);

    return NextResponse.json({
      success: true,
      message: 'Notification payload logged and sent to simulation queue.',
      payload: {
        lead: lead.company_name,
        bascule_scheduled: bascule_date
      }
    });
  } catch (error) {
    console.error('[NOTIFY_ERROR] Failed to handle notification:', error);
    return NextResponse.json({ error: 'Internal notification error' }, { status: 500 });
  }
}
