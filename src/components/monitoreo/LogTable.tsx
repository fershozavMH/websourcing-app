'use client';

import { Fragment, useState } from 'react';

export interface LogEntry {
  id: string;
  level: string;
  category: string;
  code: string;
  message: string;
  stack?: string | null;
  userEmail?: string | null;
  route?: string | null;
  timestamp?: { _seconds: number; _nanoseconds: number } | string | null;
}

function formatTimestamp(timestamp: LogEntry['timestamp']): string {
  if (!timestamp) return '—';
  if (typeof timestamp === 'string') return new Date(timestamp).toLocaleString('es-MX');
  return new Date(timestamp._seconds * 1000).toLocaleString('es-MX');
}

const LEVEL_STYLES: Record<string, string> = {
  error: 'bg-red-100 text-red-700',
  security: 'bg-orange-100 text-orange-700',
  info: 'bg-slate-100 text-slate-700',
};

export default function LogTable({ logs }: { logs: LogEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (logs.length === 0) {
    return <p className="text-slate-500 text-sm p-6 text-center">No hay registros para los filtros seleccionados.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
            <th className="py-2 px-3">Fecha</th>
            <th className="py-2 px-3">Nivel</th>
            <th className="py-2 px-3">Código</th>
            <th className="py-2 px-3">Mensaje</th>
            <th className="py-2 px-3">Usuario</th>
            <th className="py-2 px-3">Ruta</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <Fragment key={log.id}>
              <tr
                className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
              >
                <td className="py-2 px-3 whitespace-nowrap text-slate-500">{formatTimestamp(log.timestamp)}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${LEVEL_STYLES[log.level] ?? 'bg-slate-100 text-slate-700'}`}>
                    {log.level}
                  </span>
                </td>
                <td className="py-2 px-3 font-mono text-xs text-slate-700">{log.code}</td>
                <td className="py-2 px-3 text-slate-800">{log.message}</td>
                <td className="py-2 px-3 text-slate-500">{log.userEmail ?? '—'}</td>
                <td className="py-2 px-3 text-slate-500">{log.route ?? '—'}</td>
              </tr>
              {expandedId === log.id && log.stack && (
                <tr className="bg-slate-50">
                  <td colSpan={6} className="p-3">
                    <pre className="text-xs text-slate-600 whitespace-pre-wrap">{log.stack}</pre>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
