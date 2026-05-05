'use client';

import React, { useState } from 'react';
import type { Machine } from '@/types';

export default function MachineCard({ machine }: { machine: Machine }) {
  const [imgIndex, setImgIndex] = useState(0);

  // --- LÓGICA DE CATEGORÍAS ---
  const isYellow = ['Retroexcavadoras', 'Excavadoras', 'Topadores', 'Motoconformadoras', 'Cargadores', 'Elevadores'].includes(machine.categoria_tarea);
  const isTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(machine.categoria_tarea);

  const formatPrice = (price: number | string) => {
    if (!price || price === 0) return 'Call For Price';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(price));
  };

  const renderUso = () => {
    // Leemos TODAS las variables para que sea compatible con lo viejo y lo nuevo
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
    if (millas > 0) {
      return <span className="font-black text-slate-800">{millas.toLocaleString()} mi</span>;
    }
    if (horas > 0) {
      return <span className="font-black text-slate-800">{horas.toLocaleString()} hrs</span>;
    }
    return <span className="font-black text-slate-800">N/D</span>;
  };

  const phoneClean = machine.telefono_vendedor ? machine.telefono_vendedor.replace(/[^\d+]/g, '') : '';
  const phoneLink = phoneClean.startsWith('+') ? phoneClean : `+${phoneClean}`;

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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 flex flex-col overflow-hidden group h-full">
      
      {/* SECCIÓN SUPERIOR: Carrusel de Imágenes */}
      <div className="relative w-full h-52 bg-slate-100 shrink-0 overflow-hidden">
        {machine.imagenes && machine.imagenes.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={machine.imagenes[imgIndex]} 
              alt={machine.titulo} 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy" 
            />
            
            {machine.imagenes.length > 1 && (
              <>
                <button onClick={handlePrevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleNextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
                
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md z-10">
                  {imgIndex + 1} / {machine.imagenes.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm">Sin foto</div>
        )}
        
        {/* Badge de Origen */}
        <div className="absolute top-2 left-2 bg-[#1b2b4d] text-white text-[9px] font-black px-2.5 py-1 rounded shadow uppercase tracking-widest z-10">
          {machine.pagina}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Datos del Equipo */}
      <div className="p-4 flex flex-col grow">
        
        <div className="flex justify-between items-start mb-1 gap-2">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest truncate">{machine.categoria_tarea}</p>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
            ID: {machine.id.substring(0,6)}
          </span>
        </div>
        
        <h4 className="font-bold text-slate-800 text-base leading-snug mb-3 line-clamp-2" title={machine.titulo}>
          {machine.titulo}
        </h4>

        {/* ETIQUETAS DINÁMICAS */}
        {machine.categoria_tarea === 'Retroexcavadoras' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {machine.es_4x4 && <span className="bg-orange-50 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-orange-200">4x4</span>}
            {machine.tiene_cabina && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Cabina</span>}
            {machine.tiene_extension && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Ext</span>}
            {machine.tiene_martillo && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">Tubería</span>}
            {machine.tiene_almeja && <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">4-en-1</span>}
          </div>
        )}
        {machine.categoria_tarea === 'Bombas' && machine.tipo_pluma && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-blue-200">
              {machine.tipo_pluma}
            </span>
          </div>
        )}

        {machine.categoria_tarea === 'Elevadores' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {machine.subtipo_elevador && (
              <span className="bg-purple-50 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-purple-200">
                {machine.subtipo_elevador}
              </span>
            )}
            {machine.combustible && (
              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-emerald-200">
                {machine.combustible}
              </span>
            )}
            {machine.alcance && machine.alcance > 0 ? (
              <span className="bg-sky-50 text-sky-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-sky-200">
                {machine.alcance} FT
              </span>
            ) : null}
          </div>
        )}

        {machine.categoria_tarea === 'rough_terrain' && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {machine.subtipo_grua_terreno && (
              <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase shadow-sm">
                {machine.subtipo_grua_terreno}
              </span>
            )}
            {machine.capacidad && (
              <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-emerald-200">
                {machine.capacidad}
              </span>
            )}
            {machine.alcance && machine.alcance > 0 ? (
              <span className="bg-sky-50 text-sky-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-sky-200">
                {machine.alcance} FT
              </span>
            ) : null}
            {machine.es_4x4 && (
              <span className="bg-orange-50 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-orange-200">
                4X4 / AWD
              </span>
            )}
          </div>
        )}
        
        {/* NUEVAS ETIQUETAS PARA VOLTEOS Y MOTOCONFORMADORAS */}
        {machine.categoria_tarea === 'Camiones Volteo' && machine.traccion_camion && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="bg-orange-50 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-orange-200">
              {machine.traccion_camion}
            </span>
          </div>
        )}
        
        {machine.categoria_tarea === 'Motoconformadoras' && machine.tiene_ripper && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-slate-200">
              Con Ripper
            </span>
          </div>
        )}

        {/* DATOS PRINCIPALES: Grid 2x2 */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Venta</p>
            <p className="text-lg font-black text-emerald-600 truncate">{formatPrice(machine.precio)}</p>
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

        {/* CAJITA TÉCNICA (Oculta para Maquinaria Amarilla) */}
        {!isYellow && (
          <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2 mb-4 mt-auto shrink-0">
            <div className="overflow-hidden">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Motor</p>
              <p className="text-[10px] font-bold text-slate-700 truncate" title={machine.motor}>{machine.motor || 'N/D'}</p>
            </div>
            {/* Lógica inteligente para mostrar Ejes en Volteos y Capacidad en los demás */}
            <div className="overflow-hidden border-l border-r border-slate-200 px-2">
              <p className="text-[8px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">
                {machine.categoria_tarea === 'Camiones Volteo' ? 'Ejes' : 'Capacidad'}
              </p>
              <p className="text-[10px] font-black text-slate-800 truncate" title={machine.categoria_tarea === 'Camiones Volteo' ? machine.ejes_traseros : machine.capacidad}>
                {machine.categoria_tarea === 'Camiones Volteo' ? (machine.ejes_traseros || 'N/D') : (machine.capacidad || 'N/D')}
              </p>
            </div>
            <div className="overflow-hidden pl-1">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Transm.</p>
              <p className="text-[10px] font-bold text-slate-700 truncate" title={machine.transmision}>{machine.transmision || 'N/D'}</p>
            </div>
          </div>
        )}

        {/* FOOTER: Teléfono y Botón */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          
          <a href={`tel:${phoneLink}`} className="flex items-center gap-1.5 group cursor-pointer hover:bg-orange-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-orange-100 overflow-hidden max-w-[50%]">
            <div className="bg-orange-100 p-1.5 rounded-md group-hover:bg-orange-500 transition-colors shrink-0">
              <svg className="w-2.5 h-2.5 text-orange-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-orange-600 transition-colors truncate">
              {machine.telefono_vendedor && machine.telefono_vendedor !== 'N/D' ? machine.telefono_vendedor : 'Llamar'}
            </span>
          </a>

          <a href={machine.url} target="_blank" rel="noopener noreferrer" className="shrink-0 bg-slate-900 text-white font-bold py-2 px-3 rounded-lg text-[10px] hover:bg-orange-500 transition-colors shadow-sm ml-auto text-center">
            Ver Detalles
          </a>
        </div>

      </div>
    </div>
  );
}