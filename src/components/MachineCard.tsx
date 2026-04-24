'use client';

import React, { useState } from 'react';
import type { Machine } from '@/types';

export default function MachineCard({ machine }: { machine: Machine }) {
  // Estado para el carrusel de imágenes
  const [imgIndex, setImgIndex] = useState(0);

  const formatPrice = (price: number | string) => {
    if (!price || price === 0) return 'Call For Price';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price));
  };

  const renderUso = () => {
    if (machine.uso_motor && machine.uso_bomba && machine.uso_motor > 0 && machine.uso_bomba > 0) {
      return (
        <div className="flex flex-col leading-tight">
          <span className="font-black text-slate-800">{machine.uso_motor.toLocaleString()} mi</span>
          <span className="text-[10px] text-slate-500 font-bold">{machine.uso_bomba.toLocaleString()} hrs (PTO)</span>
        </div>
      );
    }
    if (machine.uso_motor && machine.uso_motor > 0) {
      return <span className="font-black text-slate-800">{machine.uso_motor.toLocaleString()} mi</span>;
    }
    if (machine.uso_bomba && machine.uso_bomba > 0) {
      return <span className="font-black text-slate-800">{machine.uso_bomba.toLocaleString()} hrs</span>;
    }
    const isTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(machine.categoria_tarea);
    return <span className="font-black text-slate-800">{(machine.uso || 0).toLocaleString()} {isTruck ? 'mi' : 'hrs'}</span>;
  };

  // Controles del Carrusel
  const handleNextImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (machine.imagenes && machine.imagenes.length > 0) {
      setImgIndex((prev) => (prev === machine.imagenes.length - 1 ? 0 : prev + 1));
    }
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (machine.imagenes && machine.imagenes.length > 0) {
      setImgIndex((prev) => (prev === 0 ? machine.imagenes.length - 1 : prev - 1));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-slate-200 flex flex-col h-full overflow-hidden">
      
      {/* HEADER: Carrusel de Imágenes */}
      <div className="relative h-52 w-full bg-slate-100 group">
        {machine.imagenes && machine.imagenes.length > 0 ? (
          <>
            <img 
              src={machine.imagenes[imgIndex]} 
              alt={machine.titulo} 
              className="w-full h-full object-cover"
              loading="lazy" 
            />
            
            {/* Flechas del Carrusel (Aparecen en Hover) */}
            {machine.imagenes.length > 1 && (
              <>
                <button onClick={handlePrevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleNextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
                
                {/* Contador 1/5 */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                  {imgIndex + 1} / {machine.imagenes.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium text-sm">Sin foto</div>
        )}
        
        {/* Origen de la Publicación */}
        <div className="absolute top-2 left-2 bg-[#1b2b4d] text-white text-[9px] font-black px-2.5 py-1 rounded shadow uppercase tracking-widest">
          {machine.pagina}
        </div>
      </div>

      {/* BODY: Datos Limpios */}
      <div className="p-4 flex flex-col grow">
        
        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">{machine.categoria_tarea}</p>
        
        <h4 className="font-bold text-slate-800 text-sm line-clamp-2 min-h-10 leading-snug mb-4" title={machine.titulo}>
          {machine.titulo}
        </h4>

        {/* Badges de Retroexcavadoras (Ocultos si no hay) */}
        {machine.categoria_tarea === 'Retroexcavadoras' && (
          <div className="flex flex-wrap gap-1 mb-4">
            {machine.es_4x4 && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">4x4</span>}
            {machine.tiene_cabina && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Cabina</span>}
            {machine.tiene_extension && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Ext</span>}
            {machine.tiene_martillo && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Tubería</span>}
            {machine.tiene_almeja && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">4-en-1</span>}
          </div>
        )}

        {/* Cuadrícula Principal (Precio, Año, Uso, Ubicación) */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Venta</p>
            <p className="text-lg font-black text-emerald-600">{formatPrice(machine.precio)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Año</p>
            <p className="text-lg font-black text-slate-800">{machine.año > 0 ? machine.año : 'N/D'}</p>
          </div>
          
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Uso</p>
            <div className="text-sm">{renderUso()}</div>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Ubicación</p>
            <p className="text-sm font-bold text-slate-700 truncate" title={machine.ubicacion}>{machine.ubicacion || 'N/D'}</p>
          </div>
        </div>

        {/* Cajita Técnica Suave (Oculta en Retroexcavadoras) */}
        {machine.categoria_tarea !== 'Retroexcavadoras' && (
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2 mt-auto">
            <div className="text-center overflow-hidden">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Motor</p>
              <p className="text-[11px] font-bold text-slate-700 truncate" title={machine.motor}>{machine.motor || 'N/D'}</p>
            </div>
            <div className="text-center overflow-hidden border-l border-r border-slate-200 px-1">
              <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider">Capacidad</p>
              <p className="text-[11px] font-black text-slate-800 truncate" title={machine.capacidad}>{machine.capacidad || 'N/D'}</p>
            </div>
            <div className="text-center overflow-hidden">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Transmisión</p>
              <p className="text-[11px] font-bold text-slate-700 truncate" title={machine.transmision}>{machine.transmision || 'N/D'}</p>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER: Contacto y Botón */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto bg-white">
        <div className="flex items-center gap-2 overflow-hidden text-slate-600">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
          <span className="text-sm font-bold truncate select-all">
            {machine.telefono_vendedor && machine.telefono_vendedor !== 'N/D' ? machine.telefono_vendedor : 'Sin contacto'}
          </span>
        </div>

        <a href={machine.url} target="_blank" rel="noopener noreferrer" className="shrink-0 bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-xs hover:bg-orange-500 transition-colors shadow-sm">
          Abrir Link
        </a>
      </div>

    </div>
  );
}