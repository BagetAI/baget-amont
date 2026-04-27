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
  const [closingStatus, setClosingStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
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

  const handleClosing = async (lead: Lead) => {
    setClosingStatus(prev => ({ ...prev, [lead.id]: 'Initialisation...' }));
    
    try {
      const result = await initiateW4Closing(lead.id, lead.company_name, lead.contact_cue);
      if (result.success) {
        setClosingStatus(prev => ({ ...prev, [lead.id]: 'W4 Lancé ✅' }));
        alert(result.message);
      }
    } catch (e) {
      setClosingStatus(prev => ({ ...prev, [lead.id]: 'Échec' }));
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-72 border-r border-slate-200 p-10 flex flex-col gap-12 sticky top-0 h-screen hidden lg:flex">
        <div className="text-2xl font-bold tracking-tight text-slate-900">Amont</div>
        <nav className="flex flex-col gap-3">
          <a href="#" className="p-3 bg-slate-900 text-white rounded-lg font-semibold text-sm">Signaux IDF ({zip})</a>
          <a href="#" className="p-3 text-slate-500 hover:bg-slate-50 rounded-lg font-semibold text-sm transition-colors">Mes Prospects</a>
          <a href="#" className="p-3 text-slate-500 hover:bg-slate-50 rounded-lg font-semibold text-sm transition-colors">Configuration W4</a>
        </nav>
      </aside>

      <main className="flex-1 p-10 lg:p-16 max-w-5xl">
        <header className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Flux J+3 : Territoire {zip}</h1>
            <div className="advantage-pill">IA Scoring Actif</div>
          </div>
          <p className="text-slate-500 font-medium">Capture en temps réel des créations d'entreprises sur votre zone exclusive.</p>
        </header>

        {loading ? (
          <div className="text-slate-400 font-medium animate-pulse">Synchronisation avec le flux RNE...</div>
        ) : (
          <div className="flex flex-col gap-10">
            {leads.length === 0 ? (
              <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-medium">
                Aucun signal détecté sur {zip} ce jour.
              </div>
            ) : (
              leads.map(lead => (
                <article key={lead.id} className="bg-white border border-slate-200 rounded-2xl p-8 hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-100 transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">{lead.company_name}</h2>
                      <p className="text-xs text-slate-500 font-bold uppercase mt-1">SIREN {lead.siren} • Création le {lead.creation_date}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest text-white uppercase ${lead.score > 80 ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                      Score {lead.score}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Verticale</p>
                      <p className="text-sm font-bold text-slate-800">{lead.sector}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Zone</p>
                      <p className="text-sm font-bold text-slate-800">{lead.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Contact</p>
                      <p className="text-sm font-bold text-slate-900">{lead.contact_cue}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Propension</p>
                      <p className="text-sm font-bold text-emerald-600">{lead.score}%</p>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-50 border-l-4 border-slate-200 text-sm text-slate-600 italic leading-relaxed mb-10">
                    <span className="font-bold text-slate-900 mr-2">W3 Rationale:</span> {lead.rationale}
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => handleClosing(lead)}
                      disabled={!!closingStatus[lead.id]}
                      className="flex-1 lg:flex-none px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-[0.98] disabled:bg-slate-200 transition-all"
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

      <div className="fixed bottom-10 right-10 bg-slate-950 text-white p-8 rounded-3xl w-80 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-800 z-50">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Workers</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-500">Live</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4 group">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">W1_DÉTECTION : ACTIF</span>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">W3_SCORING : LLM INTENT</span>
          </div>
          <div className="flex items-center gap-4 group opacity-50">
            <div className="w-1.5 h-1.5 bg-slate-600 rounded-full"></div>
            <span className="text-xs font-bold text-slate-500">W4_CLOSING : IDLE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-20 text-slate-400 font-bold">Chargement du dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
