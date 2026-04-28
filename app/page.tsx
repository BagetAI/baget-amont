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
      
      // Also lock the zone
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
    <div className={`min-h-screen bg-white text-slate-900 ${plusJakarta.className}`}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
            <span className="text-xl font-bold tracking-tight">Amont</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a href="#vision" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Vision</a>
            <a href="#fonctionnement" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Fonctionnement</a>
            <a href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Dashboard Pilote</a>
            <a href="#checker" className="px-6 py-3 bg-slate-900 text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
              Vérifier mon secteur
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 text-xs font-bold mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              J+3 Signal Advantage
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-8">
              Signez vos clients <span className="text-slate-400">avant</span> la concurrence.
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12 max-w-xl">
              Ne perdez plus 2 mois à attendre les alertes BODACC. Amont capture l'intention dès le dépôt des statuts. Un avantage temporel de 57 jours pour votre cabinet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#checker" className="px-10 py-5 bg-slate-900 text-white rounded-full text-lg font-bold hover:bg-slate-800 transition-all text-center shadow-2xl shadow-slate-300">
                Réserver ma zone exclusive
              </a>
              <div className="flex items-center gap-4 px-8 py-5 text-slate-400 font-semibold italic">
                Déjà 3 cabinets pilotes en IDF
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-100/50 rounded-[4rem] rotate-3 -z-10"></div>
            <img 
              src="images/a-professional-and-modern-hero-image-for.png" 
              alt="Professional Accounting Workspace" 
              className="rounded-[3rem] shadow-3xl object-cover aspect-[4/5] lg:aspect-auto"
            />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-slate-50 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-12 md:gap-24 grayscale opacity-40">
           <span className="text-2xl font-black italic tracking-tighter">CABINET_PILOTE_1</span>
           <span className="text-2xl font-black italic tracking-tighter">PARIS_8_ASSOCIÉS</span>
           <span className="text-2xl font-black italic tracking-tighter">BOULOGNE_GROWTH</span>
           <span className="text-2xl font-black italic tracking-tighter">IDF_ACCOUNTING</span>
        </div>
      </section>

      {/* Vision: The J+3 Gap */}
      <section id="vision" className="py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-black tracking-tight mb-6">Le gap temporel : votre levier de croissance</h2>
            <p className="text-slate-500 text-lg font-medium">À J+60, le fondateur a déjà choisi son expert-comptable. À J+3, il cherche encore son partenaire.</p>
          </div>

          <div className="space-y-12">
            <div className="relative p-10 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-slate-900"></div>
               <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex-1">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 block">Amont Signal</span>
                    <h3 className="text-3xl font-bold mb-4">Détection J+3 (Pré-Kbis)</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">Capture de l'intention dès le dépôt RNE. Vous contactez le client au moment de l'ouverture du compte bancaire.</p>
                  </div>
                  <div className="w-full md:w-64 bg-slate-50 h-4 rounded-full overflow-hidden">
                    <div className="w-1/12 h-full bg-slate-900"></div>
                  </div>
               </div>
            </div>

            <div className="relative p-10 bg-white border border-slate-100 rounded-3xl shadow-sm opacity-50 overflow-hidden">
               <div className="absolute top-0 left-0 w-2 h-full bg-slate-200"></div>
               <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex-1">
                    <span className="text-sm font-black text-slate-300 uppercase tracking-widest mb-4 block">Standard Marché</span>
                    <h3 className="text-3xl font-bold text-slate-300">Alerte BODACC J+60</h3>
                    <p className="text-slate-300 leading-relaxed font-medium">Publication légale tardive. Le dossier est déjà signé par un concurrent réactif.</p>
                  </div>
                  <div className="w-full md:w-64 bg-slate-50 h-4 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-slate-200"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Checker: Real-time Exclusivity */}
      <section id="checker" className="py-32 bg-slate-950 text-white rounded-[4rem] mx-4 my-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black tracking-tight mb-8">Vérifiez votre secteur.</h2>
          <p className="text-slate-400 text-lg font-medium mb-12 max-w-2xl mx-auto">
            Nous limitons l'accès à un seul cabinet par zone géographique pour garantir l'efficacité des leads. Ne laissez pas un concurrent verrouiller votre code postal.
          </p>

          <div className="bg-white/5 p-4 rounded-full flex flex-col md:flex-row gap-4 mb-12">
            <input 
              type="text" 
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Entrez votre code postal (ex: 75008)" 
              className="flex-1 bg-transparent border-none text-white text-xl font-bold px-8 py-4 focus:ring-0 placeholder:text-slate-600"
            />
            <button 
              onClick={checkExclusivity}
              className="px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all"
            >
              Vérifier la disponibilité
            </button>
          </div>

          {checkResult.message && (
            <div className={`mb-12 p-6 rounded-2xl font-bold text-center animate-in fade-in slide-in-from-top-4 ${checkResult.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {checkResult.message}
            </div>
          )}

          {showForm && !isSuccess && (
            <form onSubmit={handleWaitlistSubmit} className="bg-white p-10 rounded-[3rem] text-slate-900 text-left max-w-lg mx-auto shadow-2xl">
              <h3 className="text-2xl font-black mb-8 text-center">Verrouiller mon territoire</h3>
              <div className="space-y-4">
                <input name="name" placeholder="Votre nom complet" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-semibold" required />
                <input name="firm_name" placeholder="Nom de votre cabinet" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-semibold" required />
                <input name="email" type="email" placeholder="Email professionnel" className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-semibold" required />
                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 text-white rounded-xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-6"
                >
                  {isSubmitting ? 'Verrouillage en cours...' : 'Accéder au Pilotage J+21'}
                </button>
              </div>
            </form>
          )}

          {isSuccess && (
            <div className="p-12 bg-emerald-500 text-white rounded-[3rem] text-center max-w-lg mx-auto">
               <h3 className="text-3xl font-black mb-4">Secteur Verrouillé ✅</h3>
               <p className="text-emerald-100 font-medium mb-8">Félicitations. Le secteur {postalCode} vous est réservé en exclusivité. Daniel Lahyani vous contactera pour activer vos signaux.</p>
               <a href={`/dashboard?zip=${postalCode}`} className="inline-block px-10 py-5 bg-white text-slate-900 rounded-full font-black text-lg">Accéder au Dashboard</a>
            </div>
          )}
        </div>
      </section>

      {/* Functionality: One message per screen style logic */}
      <section id="fonctionnement" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { id: 'W1', title: 'Détection', desc: 'Surveillance temps réel du flux INPI/RNE.' },
              { id: 'W2', title: 'Enrichissement', desc: 'Collecte des signaux de CA et profils dirigeants.' },
              { id: 'W3', title: 'Scoring', desc: 'Algorithme prédictif de propension closing.' },
              { id: 'W4', title: 'Closing', desc: 'Génération automatisée des lettres de mission.' },
            ].map((worker) => (
              <div key={worker.id} className="p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:border-slate-900 transition-all group">
                <div className="text-5xl font-black text-slate-100 group-hover:text-slate-900 transition-colors mb-6">{worker.id}</div>
                <h3 className="text-xl font-black mb-4">{worker.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{worker.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 text-center">
        <h2 className="text-5xl font-black tracking-tight mb-8">Reprenez l'avantage.</h2>
        <p className="text-slate-500 text-lg font-medium mb-12">Le temps est votre actif le plus précieux. Ne le gaspillez plus.</p>
        <a href="#checker" className="px-12 py-6 bg-slate-900 text-white rounded-full text-xl font-black hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">
          Rejoindre le programme pilote
        </a>
      </section>

      <footer className="py-20 border-t border-slate-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
            <span className="text-xl font-bold tracking-tight">Amont</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">&copy; 2026 Amont. Signal Intelligence for Accountants.</p>
          <div className="flex gap-8">
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900">Mentions</a>
            <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
