'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';

interface Resultado {
  erpTotal: number;
  erpConSerie: number;
  revisados: number;
  yaMarcados: number;
  marcados: { id: string; serie: string; id_erp: string }[];
  huerfanos: { id: string; id_erp: string; serie: string }[];
}

// Compara el ERP con la base de Web Sourcing por número de serie y marca como
// "enviados al ERP" los equipos que ya existen allá. También corre solo, a diario.
export default function SincronizacionErpPanel() {
  const [running, setRunning] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [error, setError] = useState('');

  const sincronizar = async () => {
    setRunning(true);
    setError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/erp/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => null);
      if (data?.success) setResultado(data);
      else setError(data?.error ?? 'No se pudo sincronizar.');
    } catch {
      setError('Hubo un problema de conexión con el servidor.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Sincronización con el ERP</h3>
      <p className="text-xs text-slate-500 mb-4">
        Marca como enviados al ERP los equipos cuyo número de serie ya existe allá. Corre automáticamente cada día; aquí puedes lanzarla al momento.
      </p>

      <button
        onClick={sincronizar}
        disabled={running}
        className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50 mb-4"
      >
        {running ? 'Sincronizando…' : 'Sincronizar ahora'}
      </button>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {resultado && (
        <div className="text-sm text-slate-700 space-y-2">
          <p>
            ERP: {resultado.erpTotal} equipos ({resultado.erpConSerie} con serie) · Web Sourcing revisados: {resultado.revisados} ·
            ya marcados: {resultado.yaMarcados}
          </p>
          <p className="font-bold text-emerald-700">Marcados ahora: {resultado.marcados.length}</p>
          {resultado.marcados.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-0.5 max-h-40 overflow-auto">
              {resultado.marcados.map((m) => (
                <li key={m.id}>{m.id} · serie {m.serie} → {m.id_erp}</li>
              ))}
            </ul>
          )}
          <p className={`font-bold ${resultado.huerfanos.length ? 'text-amber-700' : 'text-slate-500'}`}>
            Marcados sin registro en el ERP (solo revisión): {resultado.huerfanos.length}
          </p>
          {resultado.huerfanos.length > 0 && (
            <ul className="text-xs text-slate-600 space-y-0.5 max-h-40 overflow-auto">
              {resultado.huerfanos.map((h) => (
                <li key={h.id}>{h.id} · {h.id_erp || 'sin id_erp'}{h.serie ? ` · serie ${h.serie}` : ''}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
