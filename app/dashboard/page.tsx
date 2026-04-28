'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { initiateW4Closing } from '../actions';

interface Lead {
  id: string;
  company_name: string;
  siren: string;
  creation_date: string;
  sector: string;
  location: string;
  score: number;
  rationale: string;
  contact_cue: string;
  linkedin_link: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const zip = searchParams.get('zip') || '75015'; 
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [outreaching, setOutreaching] = useState(false);
  const [closingStatus, setClosingStatus] = useState<Record<string, string>>({});
  const [generatedContracts, setGeneratedContracts] = useState<Record<string, string>>({});
  const [billingStatus] = useState({
    plan: 'Programme Pilote J+21',
    status: 'Actif',
    trialEnd: '18 Mai 2026',
    price: '897€ HT / mois'
  });

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000);
    return () => clearInterval(interval);
  }, [zip]);

  const fetchSignals = async () => {
    try {
      const res = await fetch(`/api/signals?zip=${zip}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (e) {
      console.error('Fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const triggerDetection = async () => {
    setDetecting(true);
    try {
      const res = await fetch('/api/detect');
      const data = await res.json();
      console.log('Detection complete', data);
      await fetchSignals();
    } catch (e) {
      console.error('Detection failed', e);
    } finally {
      setDetecting(false);
    }
  };

  const startOutreach = async () => {
    setOutreaching(true);
    try {
      const res = await fetch('/api/prospect-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: 'STARTUP_GAP_V1', leadsCount: 137 })
      });
      const data = await res.json();
      alert(data.campaign.message);
    } catch (e) {
      console.error('Outreach failed', e);
    } finally {
      setOutreaching(false);
    }
  };

  const handleClosing = async (lead: Lead) => {
    setClosingStatus(prev => ({ ...prev, [lead.id]: 'Génération Contrat...' }));
    
    try {
      const result = await initiateW4Closing(lead.id, lead.company_name, lead.contact_cue);
      if (result.success) {
        setClosingStatus(prev => ({ ...prev, [lead.id]: 'Prêt pour Signature ✅' }));
        if (result.contract) {
          setGeneratedContracts(prev => ({ ...prev, [lead.id]: result.contract }));
        }
      } else {
        setClosingStatus(prev => ({ ...prev, [lead.id]: 'Échec' }));
      }
    } catch (e) {
      setClosingStatus(prev => ({ ...prev, [lead.id]: 'Échec' }));
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 p-10 flex flex-col gap-12 sticky top-0 h-screen hidden lg:flex">
        <div className="text-2xl font-bold tracking-tight text-slate-900">Amont</div>
        <nav className="flex flex-col gap-3">
          <a href="#" className="p-3 bg-slate-900 text-white rounded-lg font-semibold text-sm">Signaux IDF ({zip})</a>
          <button onClick={startOutreach} disabled={outreaching} className="p-3 text-left text-slate-500 hover:bg-slate-50 rounded-lg font-semibold text-sm transition-colors">
            {outreaching ? 'Outreach...' : 'Confronter le Marché (137)'}
          </button>
          <a href="#" className="p-3 text-slate-500 hover:bg-slate-50 rounded-lg font-semibold text-sm transition-colors">Configuration W4</a>
          
          <div className="mt-auto pt-10 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Abonnement</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-900 mb-1">{billingStatus.plan}</p>
              <p className="text-[10px] text-slate-500 mb-3">Fin du pilote : {billingStatus.trialEnd}</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">{billingStatus.status}</span>
              </div>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-10 lg:p-16 max-w-5xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-slate-900">Territoire {zip}</h1>
              <div className="advantage-pill">W1-W4 Intelligence Active</div>
            </div>
            <p className="text-slate-500 font-medium">Capture J+3 : Détection RNE + Enrichissement Pappers + Scoring IA + Closing W4.</p>
          </div>
          <button 
            onClick={triggerDetection}
            disabled={detecting}
            className="px-6 py-3 border-2 border-slate-200 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            {detecting ? 'Détection en cours...' : 'Forcer Sync RNE/W2'}
          </button>
        </header>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-medium animate-pulse">Initialisation du flux...</div>
        ) : (
          <div className="flex flex-col gap-10">
            {leads.length === 0 ? (
              <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-medium">
                Aucun signal détecté sur {zip} pour le moment.
              </div>
            ) : (
              leads.map(lead => (
                <article key={lead.id} className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-900 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-slate-950">{lead.company_name}</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase mt-1">SIREN {lead.siren} • J+3 Advantage</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-white uppercase ${lead.score > 80 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-900'}`}>
                      Score {lead.score}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8 border-y border-slate-50 py-6">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Verticale</p>
                      <p className="text-sm font-bold text-slate-800">{lead.sector}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Zone</p>
                      <p className="text-sm font-bold text-slate-800">{lead.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Fondateur</p>
                      <p className="text-sm font-bold text-slate-900">{lead.contact_cue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Propension</p>
                      <p className="text-sm font-bold text-emerald-600">{lead.score}%</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Enrichissement W2 & Scoring W3</p>
                    <div className="p-6 bg-slate-50 rounded-xl text-sm text-slate-700 border-l-4 border-slate-900">
                      <p className="leading-relaxed whitespace-pre-line">{lead.rationale}</p>
                    </div>
                  </div>

                  {generatedContracts[lead.id] && (
                    <div className="mb-10">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3 text-emerald-600">Projet de Lettre de Mission (Généré par W4)</p>
                      <div className="p-8 bg-emerald-50 rounded-xl text-xs text-slate-800 border-2 border-emerald-100 font-serif overflow-auto max-h-96 leading-relaxed shadow-inner">
                        <div className="whitespace-pre-line">{generatedContracts[lead.id]}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => handleClosing(lead)}
                      disabled={!!closingStatus[lead.id] && closingStatus[lead.id].includes('✅')}
                      className={`flex-1 lg:flex-none px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-slate-100 ${closingStatus[lead.id]?.includes('✅') ? 'bg-emerald-600 text-white cursor-default' : 'bg-slate-900 text-white hover:translate-y-[-2px] active:translate-y-0'}`}
                    >
                      {closingStatus[lead.id] || 'Lancer Closing W4'}
                    </button>
                    <a 
                      href={lead.linkedin_link} 
                      target="_blank" 
                      className="flex-1 lg:flex-none px-8 py-4 border-2 border-slate-100 text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-50 text-center transition-all"
                    >
                      Profil LinkedIn
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating System Status */}
      <div className="fixed bottom-10 right-10 bg-slate-950 text-white p-8 rounded-3xl w-80 shadow-2xl border border-slate-800 z-50">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Amont System</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-500">Online</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-300 uppercase">W1_DÉTECTION : OK</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-300 uppercase">W2_ENRICH : PAPPERS LIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-300 uppercase">W3_SCORING : LLM ACTIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <span className="text-xs font-bold text-slate-300 uppercase">W4_CLOSING : CONTRACT GEN</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-20 text-slate-400 font-bold">Initialisation de l'IA...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
