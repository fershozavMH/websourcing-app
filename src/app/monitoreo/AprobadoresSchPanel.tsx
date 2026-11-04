'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { SCH_APROBACION_DIAS } from '@/constants/monitoreo';

interface AprobadorEntry {
  email: string;
  addedBy: string;
}

// Quién puede aprobar equipos para que el agente SCH (GoHighLevel) los ofrezca a prospectos.
export default function AprobadoresSchPanel() {
  const [aprobadores, setAprobadores] = useState<AprobadorEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const request = async (method: 'GET' | 'POST' | 'DELETE', email?: string) => {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/sch/aprobadores', {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      ...(email ? { body: JSON.stringify({ email }) } : {}),
    });
    return res.json().catch(() => null);
  };

  const loadAprobadores = async () => {
    try {
      const data = await request('GET');
      if (data?.success) setAprobadores(data.aprobadores);
    } catch {
      // se deja la lista vacía; el mensaje del formulario cubre los errores de escritura
    }
  };

  useEffect(() => {
    loadAprobadores();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const data = await request('POST', newEmail);
      if (data?.success) {
        setNewEmail('');
        setMessage('Correo agregado como aprobador del agente SCH.');
        loadAprobadores();
      } else {
        setMessage(data?.error ?? 'Error al agregar el correo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (email: string) => {
    setSaving(true);
    setMessage('');
    try {
      const data = await request('DELETE', email);
      if (data?.success) {
        setMessage(`${email} ya no puede aprobar equipos.`);
        loadAprobadores();
      } else {
        setMessage(data?.error ?? 'Error al quitar el correo.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Aprobadores del agente SCH</h3>
      <p className="text-xs text-slate-500 mb-4">
        Pueden aprobar equipos para que el agente de GoHighLevel los ofrezca a prospectos. Cada aprobación vence a los {SCH_APROBACION_DIAS} días.
      </p>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="email"
          required
          placeholder="correo@machineryhunters.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Agregar aprobador'}
        </button>
      </form>

      {message && <p className="text-sm text-slate-600 mb-4">{message}</p>}

      {aprobadores.length === 0 ? (
        <p className="text-sm text-slate-400">Nadie puede aprobar equipos todavía.</p>
      ) : (
        <ul className="space-y-1">
          {aprobadores.map((a) => (
            <li key={a.email} className="text-sm text-slate-700 flex justify-between items-center gap-3 border-b border-slate-100 py-2">
              <span className="truncate">{a.email}</span>
              <span className="flex items-center gap-3 shrink-0">
                <span className="text-slate-400 text-xs hidden sm:inline">agregado por {a.addedBy}</span>
                <button
                  onClick={() => handleRemove(a.email)}
                  disabled={saving}
                  className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Quitar
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
