'use client';

import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { auth } from '@/lib/firebase';
import StatCard from '@/components/monitoreo/StatCard';
import LogTable, { type LogEntry } from '@/components/monitoreo/LogTable';

async function fetchLogs(category?: string): Promise<LogEntry[]> {
  try {
    const token = await auth.currentUser?.getIdToken();
    const params = new URLSearchParams({ pageSize: '100' });
    if (category) params.set('category', category);
    const res = await fetch(`/api/monitoreo/logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);
    return data?.success ? data.logs : [];
  } catch {
    return [];
  }
}

function within24h(log: LogEntry): boolean {
  if (!log.timestamp) return false;
  const ms = typeof log.timestamp === 'string'
    ? new Date(log.timestamp).getTime()
    : log.timestamp._seconds * 1000;
  return Date.now() - ms < 24 * 60 * 60 * 1000;
}

export default function ErroresSeguridadTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'error' | 'security'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const errorsLast24h = useMemo(() => logs.filter((l) => l.category === 'error' && within24h(l)).length, [logs]);
  const securityLast24h = useMemo(() => logs.filter((l) => l.category === 'security' && within24h(l)).length, [logs]);
  const unauthorizedLast24h = useMemo(
    () => logs.filter((l) => l.code === 'SEC_UNAUTHORIZED_ACCESS' && within24h(l)).length,
    [logs],
  );

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (filter !== 'all') result = result.filter((l) => l.category === filter);
    if (search) result = result.filter((l) => l.message.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [logs, filter, search]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    logs.forEach((log) => {
      if (!log.timestamp) return;
      const ms = typeof log.timestamp === 'string' ? new Date(log.timestamp).getTime() : log.timestamp._seconds * 1000;
      const key = new Date(ms).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([fecha, total]) => ({ fecha, total })).reverse();
  }, [logs]);

  if (loading) {
    return <div className="text-center text-slate-500 py-12">Cargando…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Errores (24h)" value={errorsLast24h} accent="red" />
        <StatCard label="Eventos de seguridad (24h)" value={securityLast24h} accent="orange" />
        <StatCard label="Accesos no autorizados (24h)" value={unauthorizedLast24h} accent="orange" />
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Errores y eventos por día</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'error' | 'security')}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todas las categorías</option>
            <option value="error">Errores</option>
            <option value="security">Seguridad</option>
          </select>
          <input
            type="text"
            placeholder="Buscar en mensaje…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <LogTable logs={filteredLogs} />
      </div>
    </div>
  );
}
