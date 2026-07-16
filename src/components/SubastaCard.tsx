'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Subasta } from '@/types';
import { SUBASTAS_COLLECTION } from '@/constants/appConfig';

function formatFecha(timestamp: any): string {
  if (!timestamp) return '—';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '—';
  }
}

function EstadoBadge({ estado }: { estado?: string }) {
  if (!estado) return null;
  const map: Record<string, { label: string; cls: string }> = {
    proxima:  { label: 'Próxima',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    activa:   { label: 'Activa',   cls: 'bg-green-100 text-green-700 border-green-200' },
    cerrada:  { label: 'Cerrada',  cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  };
  const cfg = map[estado.toLowerCase()] ?? { label: estado, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function SubastaCard({
  subasta,
  onToggleCalendario,
}: {
  subasta: Subasta;
  onToggleCalendario: (id: string, actual: boolean) => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const [toggling, setToggling] = useState(false);

  const images = subasta.imagenes ?? [];
  const hasImages = images.length > 0;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i - 1 + images.length) % images.length);
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(i => (i + 1) % images.length);
  };

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      onToggleCalendario(subasta.id, !!subasta.en_calendario);
      await updateDoc(doc(db, SUBASTAS_COLLECTION, subasta.id), {
        en_calendario: !subasta.en_calendario,
      });
    } catch {
      // revert optimistic update on error
      onToggleCalendario(subasta.id, !subasta.en_calendario);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">

      {/* Imagen */}
      <div className="relative h-48 bg-slate-100 group">
        {hasImages ? (
          <>
            <img
              src={images[imgIndex]}
              alt={subasta.titulo}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Imagen anterior"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Imagen siguiente"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {imgIndex + 1}/{images.length}
                </span>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Estado badge sobre imagen */}
        <div className="absolute top-2 left-2">
          <EstadoBadge estado={subasta.estado} />
        </div>

        {/* Tipo subasta */}
        {subasta.tipo_subasta && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-600 text-white">
              {subasta.tipo_subasta}
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Título */}
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
            {[subasta.marca, subasta.modelo].filter(Boolean).join(' · ') || 'Sin marca'}
          </p>
          <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
            {subasta.titulo}
          </h3>
        </div>

        {/* Fecha */}
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <svg className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="leading-tight">{formatFecha(subasta.fecha_subasta)}</span>
        </div>

        {/* Grid de datos */}
        <div className="grid grid-cols-2 gap-2">
          {subasta.año ? (
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Año</p>
              <p className="text-sm font-bold text-slate-700">{subasta.año}</p>
            </div>
          ) : null}

          {subasta.lote ? (
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Lote</p>
              <p className="text-sm font-bold text-slate-700">#{subasta.lote}</p>
            </div>
          ) : null}

          {(subasta.puja_inicial ?? 0) > 0 ? (
            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Puja Inicial</p>
              <p className="text-sm font-bold text-slate-700">
                ${subasta.puja_inicial!.toLocaleString('en-US')}
              </p>
            </div>
          ) : null}

          {(subasta.puja_actual ?? 0) > 0 ? (
            <div className="bg-violet-50 rounded-lg p-2 border border-violet-100">
              <p className="text-[9px] text-violet-500 font-bold uppercase tracking-wider">Puja Actual</p>
              <p className="text-sm font-bold text-violet-700">
                ${subasta.puja_actual!.toLocaleString('en-US')}
              </p>
            </div>
          ) : null}
        </div>

        {/* Fuente + Ubicación */}
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          {subasta.fuente && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>{subasta.fuente}</span>
            </div>
          )}
          {subasta.ubicacion && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{subasta.ubicacion}</span>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-lg border transition-all ${
              subasta.en_calendario
                ? 'bg-violet-600 text-white border-violet-600 hover:bg-violet-700'
                : 'bg-white text-violet-600 border-violet-300 hover:bg-violet-50'
            } disabled:opacity-50`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {subasta.en_calendario ? 'En Calendario' : 'Al Calendario'}
          </button>

          {subasta.url && (
            <a
              href={subasta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs font-bold py-2 px-3 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              Ver
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
