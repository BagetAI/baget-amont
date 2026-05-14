'use client';

import { useState, useEffect } from 'react';

interface Signal {
  id: string;
  company_name: string;
  sector: string;
  score: number;
  rationale: string;
  contact_cue: string;
  location: string;
}

export default function SignalDemo() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch('https://app.baget.ai/api/public/databases/88c0ef02-5c38-46d5-8c77-7c01986fbbd1/rows');
        const data = await res.json();
        const rows = data.rows || [];
        setSignals(rows.map((r: any) => ({
          id: r.id,
          ...r.data
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
  }, []);

  return (
    <div className="w-full">
      <div className="grid lg:grid-cols-2 gap-8">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>
          ))
        ) : (
          signals.map((s, i) => (
            <div 
              key={s.id} 
              className="card-premium group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-950 transition-colors">{s.company_name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded uppercase tracking-tighter">J+3</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.sector}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900 leading-none mb-1">{s.score}</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score Amont</p>
                </div>
              </div>
              
              <div className="mb-6 p-5 bg-slate-50 rounded-2xl border-l-4 border-slate-900 text-xs font-medium text-slate-600 leading-relaxed italic">
                {s.rationale}
              </div>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dirigeant</span>
                  <span className="text-sm font-bold text-slate-900">{s.contact_cue}</span>
                </div>
                <div className="text-right flex flex-col">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Localisation</span>
                   <span className="text-sm font-bold text-slate-900">{s.location}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
