'use client';

import React, { useState } from 'react';
import type { Machine } from '@/types';
import { CAT, YELLOW_CATEGORIES, TRUCK_CATEGORIES } from '@/constants/machineCategories';
import { CURRENCY_LOCALE, CURRENCY, BADGE_COLOR } from '@/constants/appConfig';

export default function MachineCard({ machine }: { machine: Machine }) {
  const [imgIndex, setImgIndex] = useState(0);

  const isYellow = YELLOW_CATEGORIES.includes(machine.categoria_tarea);
  const isTruck = TRUCK_CATEGORIES.includes(machine.categoria_tarea);
  void isTruck;

  const formatPrice = (price: number | string) => {
    if (!price || price === 0) return null;
    return new Intl.NumberFormat(CURRENCY_LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(Number(price));
  };

  const renderUso = () => {
    const millas = machine.uso_millas || machine.uso_motor || 0;
    const horas = machine.uso_horas || machine.uso_bomba || machine.uso || 0;

    if (millas > 0 && horas > 0) {
      return (
        <div className="flex flex-col leading-tight mt-0.5">
          <span className="font-black text-slate-800">{millas.toLocaleString()} mi</span>
          <span className="text-[10px] text-slate-500 font-bold">{horas.toLocaleString()} hrs</span>
        </div>
      );
    }
    if (millas > 0) return <span className="font-black text-slate-800">{millas.toLocaleString()} mi</span>;
    if (horas > 0) return <span className="font-black text-slate-800">{horas.toLocaleString()} hrs</span>;
    return <span className="font-black text-slate-800">N/D</span>;
  };

  const phoneClean = machine.telefono_vendedor ? machine.telefono_vendedor.replace(/[^\d+]/g, '') : '';
  const phoneLink = phoneClean.startsWith('+') ? phoneClean : `+${phoneClean}`;

  const hasImages = machine.imagenes && machine.imagenes.length > 0;
  const imageCount = hasImages ? machine.imagenes.length : 0;

  const handleNextImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (hasImages) setImgIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (hasImages) setImgIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };

  const formattedPrice = formatPrice(machine.precio);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 flex flex-col overflow-hidden group h-full">

      {/* Carrusel de imágenes */}
      <div className="relative w-full h-52 bg-slate-100 shrink-0 overflow-hidden">
        {hasImages ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={machine.imagenes[imgIndex]}
              alt={`${machine.titulo} - imagen ${imgIndex + 1} de ${imageCount}`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />

            {imageCount > 1 && (
              <>
                <button
                  onClick={handlePrevImg}
                  aria-label="Imagen anterior"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  onClick={handleNextImg}
                  aria-label="Imagen siguiente"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>

                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md z-10" aria-live="polite">
                  {imgIndex + 1} / {imageCount}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-slate-400">Sin imágenes</span>
          </div>
        )}

        {/* Badge de origen */}
        <div className="absolute top-2 left-2 text-white text-[9px] font-black px-2.5 py-1 rounded shadow uppercase tracking-widest z-10" style={{ backgroundColor: BADGE_COLOR }}>
          {machine.pagina}
        </div>
      </div>

      {/* Datos del equipo */}
      <div className="p-4 flex flex-col grow">

        <div className="flex justify-between items-start mb-1 gap-2">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest truncate">{machine.categoria_tarea}</p>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
            ID: {machine.id.substring(0, 6)}
          </span>
        </div>

        <h4 className="font-bold text-slate-800 text-base leading-snug mb-3 line-clamp-2" title={machine.titulo}>
          {machine.titulo}
        </h4>

        {/* Etiquetas dinámicas por categoría */}
        {machine.categoria_tarea === CAT.RETROEXCAVADORAS && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {machine.es_4x4 && <span className="bg-orange-50 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-orange-200">4x4</span>}
            {machine.tiene_cabina && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Cabina</span>}
            {machine.tiene_extension && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Ext</span>}
            {machine.tiene_martillo && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Tubería</span>}
            {machine.tiene_almeja && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">4-en-1</span>}
          </div>
        )}
        {machine.categoria_tarea === CAT.BOMBAS && machine.tipo_pluma && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-blue-200">{machine.tipo_pluma}</span>
          </div>
        )}
        {machine.categoria_tarea === CAT.ELEVADORES && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {machine.subtipo_elevador && <span className="bg-purple-50 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-purple-200">{machine.subtipo_elevador}</span>}
            {machine.combustible && <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-emerald-200">{machine.combustible}</span>}
            {machine.alcance && machine.alcance > 0 && <span className="bg-sky-50 text-sky-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-sky-200">{machine.alcance} FT</span>}
          </div>
        )}
        {machine.categoria_tarea === CAT.ROUGH_TERRAIN_DB && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {machine.subtipo_grua_terreno && <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase shadow-sm">{machine.subtipo_grua_terreno}</span>}
            {machine.capacidad && <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-emerald-200">{machine.capacidad}</span>}
            {machine.alcance && machine.alcance > 0 && <span className="bg-sky-50 text-sky-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-sky-200">{machine.alcance} FT</span>}
            {machine.es_4x4 && <span className="bg-orange-50 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-orange-200">4X4 / AWD</span>}
          </div>
        )}
        {machine.categoria_tarea === CAT.CAMIONES_VOLTEO && machine.traccion_camion && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="bg-orange-50 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-orange-200">{machine.traccion_camion}</span>
          </div>
        )}
        {machine.categoria_tarea === CAT.MOTOCONFORMADORAS && machine.tiene_ripper && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Con Ripper</span>
          </div>
        )}

        {/* Grid de datos principales */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Venta</p>
            {formattedPrice
              ? <p className="text-lg font-black text-emerald-600 truncate">{formattedPrice}</p>
              : <p className="text-sm font-black text-slate-400 truncate">Consultar precio</p>
            }
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Año</p>
            <p className="text-lg font-black text-slate-800">{machine.año > 0 ? machine.año : 'N/D'}</p>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Uso</p>
            <div className="text-sm truncate">{renderUso()}</div>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Ubicación</p>
            <p className="text-sm font-bold text-slate-700 truncate" title={machine.ubicacion}>{machine.ubicacion || 'N/D'}</p>
          </div>
        </div>

        {/* Cajita técnica (oculta para maquinaria amarilla) */}
        {!isYellow && (
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2 mb-4 mt-auto shrink-0">
            <div className="overflow-hidden">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Motor</p>
              <p className="text-[10px] font-bold text-slate-700 truncate" title={machine.motor}>{machine.motor || 'N/D'}</p>
            </div>
            <div className="overflow-hidden border-l border-r border-slate-200 px-2">
              <p className="text-[8px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">
                {machine.categoria_tarea === CAT.CAMIONES_VOLTEO ? 'Ejes' : 'Capacidad'}
              </p>
              <p className="text-[10px] font-black text-slate-800 truncate" title={machine.categoria_tarea === CAT.CAMIONES_VOLTEO ? machine.ejes_traseros : machine.capacidad}>
                {machine.categoria_tarea === CAT.CAMIONES_VOLTEO ? (machine.ejes_traseros || 'N/D') : (machine.capacidad || 'N/D')}
              </p>
            </div>
            <div className="overflow-hidden pl-1">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Transm.</p>
              <p className="text-[10px] font-bold text-slate-700 truncate" title={machine.transmision}>{machine.transmision || 'N/D'}</p>
            </div>
          </div>
        )}

        {/* Footer: teléfono y botón */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <a
            href={`tel:${phoneLink}`}
            className="flex items-center gap-1.5 group cursor-pointer hover:bg-orange-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-orange-100 overflow-hidden max-w-[50%]"
            aria-label={`Llamar a ${machine.telefono_vendedor || 'vendedor'}`}
          >
            <div className="bg-orange-100 p-1.5 rounded-md group-hover:bg-orange-500 transition-colors shrink-0">
              <svg className="w-2.5 h-2.5 text-orange-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-orange-600 transition-colors truncate">
              {machine.telefono_vendedor && machine.telefono_vendedor !== 'N/D' ? machine.telefono_vendedor : 'Llamar'}
            </span>
          </a>

          <a
            href={machine.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-slate-900 text-white font-bold py-2 px-3 rounded-lg text-[10px] hover:bg-orange-500 transition-colors shadow-sm ml-auto text-center"
          >
            Ver Detalles
          </a>
        </div>

      </div>
    </div>
  );
}
