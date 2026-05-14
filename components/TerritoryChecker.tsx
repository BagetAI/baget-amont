'use client';

import { useState, useEffect } from 'react';

export default function TerritoryChecker() {
  const [zip, setZip] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'locked'>('idle');
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', firm: '' });

  const checkAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (zip.length < 2) return;
    
    setStatus('checking');
    try {
      const res = await fetch('https://app.baget.ai/api/public/databases/ef968f67-d829-4476-8897-766ebed7fd00/rows');
      const { rows } = await res.json();
      
      const isLocked = rows.some((r: any) => r.data.postal_code === zip);
      
      if (isLocked) {
        setStatus('locked');
        setMessage(`Le secteur ${zip} est déjà verrouillé par un cabinet partenaire.`);
      } else {
        setStatus('available');
        setMessage(`Le secteur ${zip} est disponible. Réservez votre exclusivité.`);
        setShowForm(true);
      }
    } catch (err) {
      console.error(err);
      setStatus('idle');
    }
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 1. Submit to Waitlist
      await fetch('https://app.baget.ai/api/public/databases/efee23c2-e790-4249-bd5c-b70ecdfae2c3/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            email: formData.email,
            name: formData.name,
            firm_name: formData.firm,
            zip_code: zip,
            timestamp: new Date().toISOString()
          }
        })
      });

      // 2. Mock lock in Reserved_Zones (In production, this would be server-validated)
      await fetch('https://app.baget.ai/api/public/databases/ef968f67-d829-4476-8897-766ebed7fd00/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            postal_code: zip,
            firm_name: formData.firm,
            locked_at: new Date().toISOString(),
            status: 'Pending Verification'
          }
        })
      });

      setStatus('locked');
      setMessage(`Félicitations. Votre demande de verrouillage pour le ${zip} est enregistrée.`);
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {!showForm ? (
        <form onSubmit={checkAvailability} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Code Postal (ex: 75008)"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="flex-1 px-8 py-5 bg-white border border-slate-200 rounded-full font-bold text-lg focus:outline-none focus:ring-4 focus:ring-slate-50 transition-all"
            required
          />
          <button
            type="submit"
            disabled={status === 'checking'}
            className="btn-primary min-w-[240px]"
          >
            {status === 'checking' ? 'Vérification...' : 'Vérifier ma zone'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReserve} className="animate-slide-up bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner space-y-4">
          <p className="text-emerald-600 font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {message}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nom"
              required
              className="px-6 py-4 bg-white border border-slate-100 rounded-2xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Cabinet"
              required
              className="px-6 py-4 bg-white border border-slate-100 rounded-2xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={formData.firm}
              onChange={e => setFormData({...formData, firm: e.target.value})}
            />
          </div>
          <input
            type="email"
            placeholder="Email professionnel"
            required
            className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            {isSubmitting ? 'Réservation...' : 'Verrouiller mon secteur'}
          </button>
        </form>
      )}
      
      {status === 'locked' && !showForm && (
        <div className="mt-6 p-6 bg-slate-900 text-white rounded-[2rem] animate-slide-up flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-xl">📍</span>
          </div>
          <p className="font-bold text-sm leading-relaxed">{message}</p>
        </div>
      )}
    </div>
  );
}
