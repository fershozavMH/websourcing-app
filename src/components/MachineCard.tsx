import React, { useState } from 'react';
import type { Machine } from '@/types';

interface Props {
  machine: Machine;
}

export default function MachineCard({ machine }: Props) {
  // --- ESTADO DEL CARRUSEL ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasImages = machine.imagenes && machine.imagenes.length > 0;
  const totalImages = hasImages ? machine.imagenes.length : 0;

  // Lógica para saber si muestra HORAS o MILLAS
  const isTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(machine.categoria_tarea);
  const usoLabel = isTruck ? 'MILLAS' : 'HORAS';
  const usoFormateado = machine.uso ? machine.uso.toLocaleString() : 'N/D';

  // --- FUNCIONES DEL CARRUSEL ---
  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault(); // Evita que se abra el link de la tarjeta al hacer clic en la flecha
    setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group">
      
      {/* IMAGEN CON CARRUSEL */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        {hasImages ? (
          <>
            {/* Contenedor de las imágenes (Se deslizan horizontalmente) */}
            <div 
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {machine.imagenes.map((imgUrl, index) => (
                <img 
                  key={index} 
                  src={imgUrl} 
                  alt={`${machine.titulo} - Foto ${index + 1}`} 
                  className="w-full h-full object-cover shrink-0" 
                />
              ))}
            </div>

            {/* Flechas de Navegación (Solo aparecen si hay más de 1 foto) */}
            {totalImages > 1 && (
              <>
                <button 
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Foto anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button 
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Siguiente foto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
                
                {/* Indicador de Fotos (Ej. 1/5) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10">
                  {currentImageIndex + 1} / {totalImages}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <svg className="w-8 h-8 mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            <span className="text-[10px] font-medium uppercase tracking-wider">Sin foto disponible</span>
          </div>
        )}
        
        {/* Etiqueta de Origen */}
        <div className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-20 ${machine.pagina === 'Facebook Marketplace' ? 'bg-[#1877F2]' : 'bg-slate-800'}`}>
          {machine.pagina.toUpperCase()}
        </div>
      </div>

      {/* INFORMACIÓN PRINCIPAL */}
      <div className="p-4 flex flex-col grow">
        <span className="text-orange-500 text-[10px] font-black tracking-wider uppercase mb-1">{machine.categoria_tarea}</span>
        <h3 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug" title={machine.titulo}>{machine.titulo}</h3>
        
        <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Venta</p>
            {machine.precio > 0 ? (
               <p className="text-xl font-black text-emerald-600">${machine.precio.toLocaleString()}</p>
            ) : (
               <p className="text-sm font-black text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase tracking-wide border border-slate-200">Call for Price</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Año</p>
            <p className="text-lg font-black text-slate-700">{machine.año || 'N/D'}</p>
          </div>
        </div>

        {/* GRID DE DATOS TÉCNICOS */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">USO ({usoLabel})</p>
            <p className="text-xs font-bold text-slate-700">{usoFormateado}</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex flex-col justify-center">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Ubicación</p>
            <p className="text-xs font-bold text-slate-700 truncate" title={machine.ubicacion}>{machine.ubicacion}</p>
          </div>
          
          {/* Fila inferior de especificaciones (Si las hay) */}
          {(machine.motor || machine.transmision || machine.capacidad) && (
             <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-2 flex items-center justify-between">
               {machine.motor && (
                 <div className="flex-1">
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Motor</p>
                   <p className="text-xs font-bold text-slate-700 truncate">{machine.motor}</p>
                 </div>
               )}
               {machine.capacidad && (
                 <div className="flex-1 text-center border-l border-r border-slate-200 px-2 mx-2">
                   <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mb-0.5">Capacidad</p>
                   <p className="text-xs font-black text-orange-700 truncate">{machine.capacidad}</p>
                 </div>
               )}
               {machine.transmision && (
                 <div className="flex-1 text-right">
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Transmisión</p>
                   <p className="text-xs font-bold text-slate-700 truncate">{machine.transmision}</p>
                 </div>
               )}
             </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <a href={machine.url} target="_blank" rel="noreferrer" className="text-center py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Abrir Link
          </a>
          <a href={`tel:${machine.telefono_vendedor}`} className="text-center py-2.5 text-xs font-bold text-white bg-[#00a650] hover:bg-[#008f45] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Llamar
          </a>
        </div>
      </div>
      
    </div>
  );
}