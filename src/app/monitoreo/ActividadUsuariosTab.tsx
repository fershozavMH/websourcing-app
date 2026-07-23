'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '@/lib/firebase';
import { PRESENCE_ACTIVE_WINDOW_MS } from '@/constants/monitoreo';

interface ActivityUser {
  uid: string;
  email: string | null;
  lastSignInTime: string | null;
  creationTime: string | null;
  lastSeenAt: string | null;
}

interface LoginActivityEntry {
  id: string;
  code: string;
  userEmail: string | null;
  timestamp: { _seconds: number; _nanoseconds: number } | null;
}

interface ErpSendEntry {
  usuario: string;
  total: number;
}

// "En línea" refleja presencia real (heartbeat mientras hay actividad en la
// app), no el último login — una sesión de Firebase puede seguir abierta en
// el navegador días después de iniciar sesión sin que el usuario la esté usando.
function isOnline(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() <= PRESENCE_ACTIVE_WINDOW_MS;
}

export default function ActividadUsuariosTab() {
  const [users, setUsers] = useState<ActivityUser[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivityEntry[]>([]);
  const [erpSends, setErpSends] = useState<ErpSendEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/monitoreo/activity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setUsers(data.users);
        setLoginActivity(data.loginActivity);
        setErpSends(data.erpSends);
        setErrors(data.errors ?? []);
      } else {
        setErrors([data?.error ?? 'No se pudo cargar la actividad.']);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivity();
  }, []);

  const loginsByDay = useMemo(() => {
    const buckets = new Map<string, number>();
    loginActivity
      .filter((entry) => entry.code === 'ACT_LOGIN')
      .forEach((entry) => {
        if (!entry.timestamp) return;
        const key = new Date(entry.timestamp._seconds * 1000).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
        buckets.set(key, (buckets.get(key) ?? 0) + 1);
      });
    return Array.from(buckets.entries()).map(([fecha, total]) => ({ fecha, total })).reverse();
  }, [loginActivity]);

  if (loading) {
    return <div className="text-center text-slate-500 py-12">Cargando…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">
          Los datos se cargan al abrir esta pestaña — usa &quot;Actualizar&quot; para reflejar accesos recientes.
        </p>
        <button
          onClick={loadActivity}
          className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg"
        >
          Actualizar
        </button>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm space-y-1">
          {errors.map((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Logins por día</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={loginsByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#ea580c" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Usuarios</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-2 px-3">Correo</th>
                <th className="py-2 px-3">Último login</th>
                <th className="py-2 px-3">Última actividad</th>
                <th className="py-2 px-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-800">{user.email ?? '—'}</td>
                  <td className="py-2 px-3 text-slate-500">
                    {user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString('es-MX') : 'Nunca'}
                  </td>
                  <td className="py-2 px-3 text-slate-500">
                    {user.lastSeenAt ? new Date(user.lastSeenAt).toLocaleString('es-MX') : '—'}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        isOnline(user.lastSeenAt) ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isOnline(user.lastSeenAt) ? 'En línea' : 'Desconectado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Máquinas enviadas al ERP por usuario</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                <th className="py-2 px-3">Usuario</th>
                <th className="py-2 px-3">Total enviadas</th>
              </tr>
            </thead>
            <tbody>
              {erpSends.map((entry) => (
                <tr key={entry.usuario} className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-800">{entry.usuario}</td>
                  <td className="py-2 px-3 text-slate-500">{entry.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
