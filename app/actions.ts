'use server'

export async function initiateW4Closing(leadId: string, companyName: string, contactCue: string) {
  console.log(`[W4_SERVER_ACTION] Triggered for ${companyName} (${leadId})`);
  
  try {
    // 1. Generate the Contract
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/generate-contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospect_id: leadId })
    });
    
    const data = await res.json();

    if (data.success) {
      return {
        success: true,
        message: `W4 Lancé. Contrat généré : ${data.filename}`,
        contract: data.contract_content
      };
    } else {
      throw new Error(data.error || 'Failed to generate contract');
    }
  } catch (error) {
    console.error('[W4_ACTION_ERROR]', error);
    return {
      success: false,
      message: "Erreur lors de la génération du contrat W4."
    };
  }
}
