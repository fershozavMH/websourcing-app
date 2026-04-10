'use client';

import { useEffect, useRef } from 'react';
import { Swiper } from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import type { Machine } from '@/types';


const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface MachineCardProps {
  machine: Machine;
}

export default function MachineCard({ machine }: MachineCardProps) {
  const swiperRef = useRef<HTMLDivElement>(null);
  const swiperInstance = useRef<Swiper | null>(null);

  const hasImages = machine.imagenes && machine.imagenes.length > 0;
  // 1. VARIABLE CLAVE: Verificamos si hay más de 1 imagen
  const hasMultipleImages = machine.imagenes && machine.imagenes.length > 1;
  const isBomba = 'uso_bomba' in machine && 'uso_motor' in machine;

  useEffect(() => {
    if (swiperRef.current && !swiperInstance.current) {
      swiperInstance.current = new Swiper(swiperRef.current, {
        modules: [Navigation, Pagination],
        // 2. Apagamos navegación y loop si solo hay 1 foto
        navigation: hasMultipleImages ? {
          nextEl: `.swiper-button-next-${machine.id}`,
          prevEl: `.swiper-button-prev-${machine.id}`,
        } : false,
        pagination: hasMultipleImages ? {
          el: `.swiper-pagination-${machine.id}`,
          dynamicBullets: true,
        } : false,
        loop: hasMultipleImages, 
        observer: true,
        observeParents: true,
      });
    }

    return () => {
      if (swiperInstance.current) {
        swiperInstance.current.destroy(true, true);
        swiperInstance.current = null;
      }
    };
  }, [machine.id, hasMultipleImages]);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col group">
      <div className={`swiper-${machine.id} relative bg-slate-900 border-b border-slate-200`} ref={swiperRef}>
        <div className="swiper-wrapper">
          {hasImages ? (
            machine.imagenes.map((img, idx) => (
              <div key={idx} className="swiper-slide">
                <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-65 object-cover" loading="lazy" />
              </div>
            ))
          ) : (
            <div className="swiper-slide">
              <div className="flex items-center justify-center bg-slate-800 h-65 w-full text-slate-500 font-medium">
                Sin imagen
              </div>
            </div>
          )}
        </div>
        
        {/* 3. Solo renderizamos los controles en el DOM si hay múltiples fotos */}
        {hasMultipleImages && (
          <>
            <div className={`swiper-button-next swiper-button-next-${machine.id} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className={`swiper-button-prev swiper-button-prev-${machine.id} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className={`swiper-pagination swiper-pagination-${machine.id}`} />
          </>
        )}
        
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <div className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-sm shadow-sm flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {hasImages ? machine.imagenes.length : 0}
          </div>
        </div>
        
        <div className="absolute top-3 right-3 z-10 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm shadow-sm uppercase tracking-wider">
          {machine.pagina || 'Web'}
        </div>
      </div>
      
      <div className="p-5 flex flex-col grow">
        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded uppercase tracking-wider self-start mb-2">
          {machine.categoria_tarea || 'General'}
        </span>
        
        <h3 className="text-lg font-black text-slate-800 leading-tight mb-4 line-clamp-2" title={machine.titulo}>
          {machine.titulo}
        </h3>
        
        <div className="flex justify-between items-end border-b border-slate-100 pb-3 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precio Venta</span>
            <span className="text-2xl font-black text-orange-600">{formatter.format(machine.precio)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Año</span>
            <span className="text-xl font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {machine.año}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-5 grow">
          {isBomba ? (
            <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Horas (Bomba / Camión)</span>
              <span className="font-bold text-slate-700 flex items-center gap-1 text-sm mt-0.5"> 
                <span className="text-orange-600">B:</span> {(machine.uso_bomba || 0).toLocaleString()} 
                <span className="text-slate-300 mx-1">|</span> 
                <span className="text-orange-600">C:</span> {(machine.uso_motor || 0).toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Uso (Hrs/Millas)</span>
              <span className="font-bold text-slate-700 text-sm mt-0.5">{(machine.uso || 0).toLocaleString()}</span>
            </div>
          )}
          <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100 truncate" title={machine.ubicacion}>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ubicación</span>
            <span className="font-bold text-slate-700 text-sm mt-0.5 truncate">{machine.ubicacion.split(',')[0]}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <a 
            href={machine.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-bold transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Abrir Anuncio
          </a>
          <a 
            href={`tel:${machine.telefono_vendedor}`} 
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold transition-colors shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Llamar
          </a>
        </div>
      </div>
    </div>
  );
}