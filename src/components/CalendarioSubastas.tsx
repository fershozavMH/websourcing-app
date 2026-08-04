'use client';

import { useState } from 'react';
import type { Subasta } from '@/types';

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toDate(ts: any): Date | null {
  if (!ts) return null;
  try { return ts.toDate ? ts.toDate() : new Date(ts); } catch { return null; }
}

export default function CalendarioSubastas({ subastas }: { subastas: Subasta[] }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0=Dom … 6=Sab → convertir a Lu=0 … Do=6
  const rawOffset = new Date(year, month, 1).getDay();
  const offset = rawOffset === 0 ? 6 : rawOffset - 1;

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));
  const goToday   = () => setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));

  const subsByDay = new Map<number, Subasta[]>();
  for (const s of subastas) {
    const d = toDate(s.fecha_subasta);
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
    const day = d.getDate();
    if (!subsByDay.has(day)) subsByDay.set(day, []);
    subsByDay.get(day)!.push(s);
  }

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header del calendario */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Mes anterior"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-slate-800">
            {MESES[month]} <span className="text-violet-600">{year}</span>
          </h2>
          <button
            onClick={goToday}
            className="text-[10px] font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-full border border-violet-200 transition-colors uppercase tracking-wider"
          >
            Hoy
          </button>
        </div>

        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Mes siguiente"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Encabezado días de la semana */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {DIAS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-black text-slate-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const subs = day ? (subsByDay.get(day) ?? []) : [];
          return (
            <div
              key={idx}
              className={`min-h-24 border-r border-b border-slate-100 p-1.5 flex flex-col gap-1 last:border-r-0 ${
                !day ? 'bg-slate-50/50' : ''
              } ${day && isToday(day) ? 'ring-2 ring-inset ring-violet-400' : ''}`}
            >
              {day && (
                <span className={`text-xs font-bold self-start leading-none mb-0.5 ${
                  isToday(day)
                    ? 'bg-violet-600 text-white rounded-full w-5 h-5 flex items-center justify-center'
                    : 'text-slate-500'
                }`}>
                  {day}
                </span>
              )}

              {subs.map(s => (
                <a
                  key={s.id}
                  href={s.url ?? '#'}
                  target={s.url ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  title={s.titulo}
                  className="group block bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-md overflow-hidden transition-colors cursor-pointer"
                >
                  {s.imagenes?.[0] && (
                    <img
                      src={s.imagenes[0]}
                      alt={s.titulo}
                      className="w-full h-10 object-cover"
                      loading="lazy"
                    />
                  )}
                  <p className="text-[9px] font-bold text-violet-800 px-1 py-0.5 line-clamp-2 leading-tight">
                    {s.titulo}
                  </p>
                  {s.fuente && (
                    <p className="text-[8px] text-violet-500 px-1 pb-0.5 truncate">{s.fuente}</p>
                  )}
                </a>
              ))}
            </div>
          );
        })}
      </div>

      {/* Footer con conteo */}
      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          <span className="font-bold text-violet-600">{subastas.length}</span> subasta{subastas.length !== 1 ? 's' : ''} en calendario
        </p>
        <p className="text-[10px] text-slate-400">
          {Array.from(subsByDay.values()).reduce((a, b) => a + b.length, 0)} en este mes
        </p>
      </div>
    </div>
  );
}
