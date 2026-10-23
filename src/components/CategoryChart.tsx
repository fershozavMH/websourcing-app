'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/lib/firebase';
import { CATEGORIAS_INICIO } from '@/constants/categories';

interface Stats {
  porCategoria: { categoria: string; total: number }[];
  otros: number | null;
  total: number | null;
  parcial: boolean;
}

interface Row {
  id: string | null; // null = "Otros" (no navegable)
  nombre: string;
  total: number;
}

interface Props {
  onSelectCategory?: (categoryId: string) => void;
}

export default function CategoryChart({ onSelectCategory }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch('/api/estadisticas', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { rows, max, suma } = useMemo(() => {
    if (!stats) return { rows: [] as Row[], max: 0, suma: 0 };
    const nombres = new Map(CATEGORIAS_INICIO.map(c => [c.id as string, c.nombre]));
    const rows: Row[] = stats.porCategoria.map(c => ({
      id: c.categoria,
      nombre: nombres.get(c.categoria) ?? c.categoria,
      total: c.total,
    }));
    if (stats.otros) rows.push({ id: null, nombre: 'Otros', total: stats.otros });
    const suma = rows.reduce((acc, r) => acc + r.total, 0);
    return { rows, max: Math.max(...rows.map(r => r.total), 1), suma };
  }, [stats]);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-14">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Maquinaria obtenida por categoría</h3>
          <p className="text-sm text-slate-500 mt-0.5">Equipos que los scrapers han recolectado · clic para ver el catálogo</p>
        </div>
        {stats?.total != null && (
          <div className="text-right">
            <p className="text-3xl font-black text-orange-500 leading-none">{stats.total.toLocaleString()}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">equipos en total</p>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-sm text-slate-500 py-8 text-center">No se pudo cargar la gráfica.</p>
      ) : !stats ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 bg-slate-100 rounded-full" />
          ))}
        </div>
      ) : (
        <>
          <ol className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-3.5 grid-flow-row">
            {rows.map((row, i) => {
              const pct = suma > 0 ? (row.total / suma) * 100 : 0;
              const clickable = row.id !== null && !!onSelectCategory;
              const Tag = clickable ? 'button' : 'div';
              return (
                <li key={row.nombre}>
                  <Tag
                    {...(clickable ? { type: 'button' as const, onClick: () => onSelectCategory!(row.id as string) } : {})}
                    className={`group w-full text-left ${clickable ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className={`text-sm font-semibold truncate transition-colors ${row.id === null ? 'text-slate-400' : 'text-slate-700'} ${clickable ? 'group-hover:text-orange-600' : ''}`}>
                        {row.nombre}
                      </span>
                      <span className="text-sm tabular-nums shrink-0">
                        <span className="font-bold text-slate-800">{row.total.toLocaleString()}</span>
                        <span className="text-slate-400 text-xs ml-1.5">{pct < 1 ? '<1' : Math.round(pct)}%</span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          row.id === null
                            ? 'bg-slate-300'
                            : i < 3
                              ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                              : 'bg-gradient-to-r from-orange-400/80 to-amber-300/80'
                        }`}
                        style={{ width: `${Math.max((row.total / max) * 100, 1.5)}%` }}
                      />
                    </div>
                  </Tag>
                </li>
              );
            })}
          </ol>
          {stats.parcial && (
            <p className="text-xs text-slate-400 mt-5">Algunas categorías no se pudieron contar.</p>
          )}
        </>
      )}
    </section>
  );
}
