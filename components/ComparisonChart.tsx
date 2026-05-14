'use client';

export default function ComparisonChart() {
  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-6">
      <div className="flex flex-col gap-16">
        {/* Amont J+3 */}
        <div className="relative group">
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-slate-900">Amont J+3</span>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Signal pré-Kbis</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
              <span className="text-sm font-bold text-emerald-500">Exclusivité totale</span>
            </div>
          </div>
          <div className="w-full bg-slate-50 h-8 rounded-full border border-slate-100 overflow-hidden relative">
            <div className="h-full bg-emerald-500 w-[5%] comparison-bar shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
            <div className="absolute top-0 left-0 h-full w-[5%] bg-white/20 animate-pulse"></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Détection INPI dès le dépôt des statuts.</span>
          </div>
        </div>

        {/* Traditional Market J+60 */}
        <div className="relative opacity-40 group grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-slate-400 group-hover:text-slate-900">Industrie J+60</span>
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Publication BODACC</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block mb-1">Status</span>
              <span className="text-sm font-bold text-slate-300 group-hover:text-slate-400">Saturation critique</span>
            </div>
          </div>
          <div className="w-full bg-slate-50 h-8 rounded-full border border-slate-100 overflow-hidden">
            <div className="h-full bg-slate-200 w-full comparison-bar"></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 group-hover:text-slate-400">Le fondateur est sollicité par 15+ cabinets simultanément.</span>
          </div>
        </div>
      </div>
      
      <div className="mt-20 p-8 bg-slate-900 rounded-[2.5rem] text-center shadow-premium">
        <p className="text-3xl md:text-5xl font-bold text-white tracking-tighter mb-4">57 Jours de "Temporal Gap"</p>
        <p className="text-slate-400 font-medium">Capturez l'intention avant qu'elle ne devienne un lead public.</p>
      </div>
    </div>
  );
}
