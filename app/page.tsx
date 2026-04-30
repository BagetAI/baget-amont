'use client';

import { useState, useEffect } from 'react';
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function LandingPage() {
  const [postalCode, setPostalCode] = useState('');
  const [checkResult, setCheckResult] = useState<{ status: 'available' | 'locked' | 'idle', message: string }>({ status: 'idle', message: '' });
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const checkExclusivity = async () => {
    if (postalCode.length !== 5) {
      setCheckResult({ status: 'idle', message: 'Veuillez entrer un code postal à 5 chiffres.' });
      return;
    }

    setCheckResult({ status: 'idle', message: 'Vérification...' });

    try {
      const response = await fetch(`https://app.baget.ai/api/public/databases/ef968f67-d829-4476-8897-766ebed7fd00/rows`);
      const rows = await response.json();
      const isLocked = rows.some((r: any) => r.data.postal_code === postalCode);

      if (isLocked) {
        setCheckResult({ status: 'locked', message: `Le secteur ${postalCode} est déjà réservé par un cabinet partenaire.` });
        setShowForm(false);
      } else {
        setCheckResult({ status: 'available', message: `Le secteur ${postalCode} est disponible.` });
        setShowForm(true);
      }
    } catch (e) {
      setCheckResult({ status: 'available', message: `Zone disponible. Verrouillez-la maintenant.` });
      setShowForm(true);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email'),
      name: formData.get('name'),
      firm_name: formData.get('firm_name'),
      postal_code: postalCode,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch('https://app.baget.ai/api/public/databases/efee23c2-e790-4249-bd5c-b70ecdfae2c3/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      
      await fetch('https://app.baget.ai/api/public/databases/ef968f67-d829-4476-8897-766ebed7fd00/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            postal_code: postalCode, 
            firm_name: data.firm_name, 
            locked_at: new Date().toISOString(),
            status: 'Pilot_Active'
          } 
        })
      });

      setIsSuccess(true);
    } catch (error) {
      console.error('Submission error', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900 ${plusJakarta.className} selection:bg-slate-900 selection:text-white`}>
      {/* Navigation: Clementine Style - High White, Floating */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
        <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-[10px]">A</div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Amont</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#vision" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Le Gap J+3</a>
            <a href="#fonctionnement" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Workers</a>
            <a href="/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">Dashboard</a>
          </div>
          <a href="#checker" className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-200">
            Vérifier ma zone
          </a>
        </div>
      </nav>

      {/* Hero: Inspiration Clementine.fr - Airy, Premium visual */}
      <section className="relative pt-44 pb-32">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-100 rounded-full text-slate-900 text-[10px] font-black uppercase tracking-widest mb-10 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Exclusivité J+3 Active
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 leading-[0.95] mb-10">
              Devancez <br/><span className="text-slate-300">le marché.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-14 max-w-lg">
              Amont capture les signaux de création 57 jours avant vos concurrents. Un collaborateur IA pour verrouiller vos mandats au moment le plus critique.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <a href="#checker" className="px-12 py-6 bg-slate-900 text-white rounded-full text-lg font-bold hover:bg-slate-800 transition-all text-center shadow-[0_20px_40px_rgba(15,23,42,0.2)]">
                Vérifier ma disponibilité
              </a>
              <div className="flex items-center gap-4 px-6 py-5 text-slate-400 font-bold text-sm tracking-tight italic">
                Déjà 3 pilotes en production.
              </div>
            </div>
          </div>
          <div className="relative lg:h-[700px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white rounded-full blur-[120px] -z-10 opacity-60"></div>
            <img 
              src="images/high-end-minimalist-website-hero-section.png" 
              alt="Amont Intelligence Hub" 
              className="w-full h-full object-cover rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border-4 border-white"
            />
          </div>
        </div>
      </section>

      {/* Stats: Clementine Style Trust Bar */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-10">
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">J+3</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vitesse Détection</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">57j</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avance Concurrentielle</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">100%</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exclusivité Géo</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-black text-slate-900 tracking-tighter">897€</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur Mensuelle</span>
          </div>
        </div>
      </section>

      {/* Vision & Logic: High Spacing, Clean Typography */}
      <section id="vision" className="py-44 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-32">
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 block">Le Moment de Vérité</span>
            <h2 className="text-5xl font-black tracking-tight mb-8">Pourquoi attendre J+60 ?</h2>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              Le fondateur choisit son expert-comptable dans les 7 jours suivant le dépôt de ses statuts. Amont vous place dans cette fenêtre critique, pendant que les autres attendent le Kbis.
            </p>
          </div>

          <div className="grid gap-12">
            <div className="p-12 bg-[#F8FAFC] rounded-[3rem] border border-slate-50 flex flex-col md:flex-row items-center gap-12 group transition-all hover:scale-[1.02]">
              <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-slate-200">A</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Signaux Amont (J+3)</h3>
                <p className="text-slate-500 font-medium">Détection dès le dépôt RNE. Profilage immédiat. Prise de contact avant toute sollicitation externe.</p>
              </div>
            </div>
            
            <div className="p-12 bg-white rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-center gap-12 opacity-50">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 text-3xl font-black">B</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 text-slate-300">Alerte Marché (J+60)</h3>
                <p className="text-slate-300 font-medium">Publication BODACC. Le fondateur est déjà accompagné ou saturé de spam publicitaire.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Checker: Interactive, High Stakes */}
      <section id="checker" className="py-44">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[4rem] p-16 lg:p-24 text-center text-white shadow-[0_50px_100px_rgba(15,23,42,0.3)]">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tight mb-12">Verrouillez votre zone.</h2>
            <p className="text-xl text-slate-400 font-medium mb-16 max-w-2xl mx-auto">
              Un seul cabinet par secteur. Vérifiez si votre code postal est disponible et protégez votre territoire de croissance.
            </p>

            <div className="bg-white/10 p-3 rounded-full flex flex-col sm:flex-row gap-3 mb-12 max-w-2xl mx-auto backdrop-blur-md">
              <input 
                type="text" 
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Code postal (ex: 69002)" 
                className="flex-1 bg-transparent border-none text-white text-2xl font-bold px-8 py-5 focus:ring-0 placeholder:text-slate-600"
              />
              <button 
                onClick={checkExclusivity}
                className="px-12 py-5 bg-white text-slate-900 rounded-full font-bold text-xl hover:bg-slate-100 transition-all hover:scale-105"
              >
                Vérifier
              </button>
            </div>

            {checkResult.message && (
              <div className={`mb-16 p-8 rounded-3xl font-black text-lg animate-in fade-in slide-in-from-top-4 ${checkResult.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {checkResult.message}
              </div>
            )}

            {showForm && !isSuccess && (
              <form onSubmit={handleWaitlistSubmit} className="bg-white p-12 lg:p-16 rounded-[4rem] text-slate-900 text-left max-w-xl mx-auto shadow-2xl animate-in fade-in">
                <h3 className="text-3xl font-black mb-10 text-center">Formulaire de Réservation</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Informations Associé</label>
                    <input name="name" placeholder="Nom Prénom" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold placeholder:text-slate-300" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Le Cabinet</label>
                    <input name="firm_name" placeholder="Dénomination du Cabinet" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold placeholder:text-slate-300" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Contact Direct</label>
                    <input name="email" type="email" placeholder="Email professionnel" className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold placeholder:text-slate-300" required />
                  </div>
                  <button 
                    disabled={isSubmitting}
                    className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-10 hover:scale-[1.02]"
                  >
                    {isSubmitting ? 'Verrouillage...' : 'Activer mon exclusivité'}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">Accès Pilote J+21 Sans Engagement</p>
                </div>
              </form>
            )}

            {isSuccess && (
              <div className="p-16 bg-emerald-600 text-white rounded-[4rem] text-center max-w-xl mx-auto shadow-2xl">
                 <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">✅</div>
                 <h3 className="text-4xl font-black mb-6">Territoire Verrouillé</h3>
                 <p className="text-emerald-100 text-lg font-medium mb-12">Le secteur {postalCode} est désormais sous votre contrôle exclusif. Vos premiers signaux arrivent dans quelques minutes.</p>
                 <a href={`/dashboard?zip=${postalCode}`} className="inline-block px-12 py-6 bg-white text-slate-900 rounded-full font-black text-xl hover:scale-105 transition-all">Accéder à mon Dashboard</a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Workers: Functional Authority */}
      <section id="fonctionnement" className="py-44 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            {[
              { id: 'W1', title: 'Détection RNE', desc: 'Capture quotidienne du flux Guichet Unique.' },
              { id: 'W2', title: 'Intelligence', desc: 'Enrichissement Pappers et signaux de croissance.' },
              { id: 'W3', title: 'Priorisation', desc: 'Score IA de propension closing 0-100.' },
              { id: 'W4', title: 'Action W4', desc: 'Génération automatique de la lettre de mission.' },
            ].map((worker) => (
              <div key={worker.id} className="p-12 bg-white rounded-[3rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className="text-6xl font-black text-slate-900 mb-8">{worker.id}</div>
                <h3 className="text-xl font-black mb-4">{worker.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{worker.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-32 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-20">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
              <span className="text-xl font-bold tracking-tight">Amont</span>
            </div>
            <p className="text-slate-400 font-medium leading-relaxed">Intelligence temps réel pour cabinets d'expertise comptable tournés vers la croissance.</p>
          </div>
          <div className="flex flex-col gap-6">
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Plateforme</span>
            <div className="flex flex-col gap-3">
              <a href="/dashboard" className="text-slate-500 font-medium hover:text-slate-900">Dashboard Pilote</a>
              <a href="#checker" className="text-slate-500 font-medium hover:text-slate-900">Vérificateur Exclusivité</a>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <span className="text-xs font-black uppercase tracking-widest text-slate-900">Légal</span>
            <div className="flex flex-col gap-3">
              <span className="text-slate-500 font-medium">&copy; 2026 Amont. Tous droits réservés.</span>
              <a href="#" className="text-slate-500 font-medium hover:text-slate-900">RGPD & Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
