import React from 'react';
import type { Machine } from '@/types';

interface Props {
  machine: Machine;
}

export default function MachineCard({ machine }: Props) {
  // Lógica para saber si muestra HORAS o MILLAS
  const isTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(machine.categoria_tarea);
  const usoLabel = isTruck ? 'MILLAS' : 'HORAS';
  const usoFormateado = machine.uso ? machine.uso.toLocaleString() : 'N/D';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      
      {/* IMAGEN Y ETIQUETA SUPERIOR */}
      <div className="relative h-48 bg-slate-100">
        {machine.imagenes && machine.imagenes.length > 0 ? (
          <img src={machine.imagenes[0]} alt={machine.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">Sin imagen</div>
        )}
        <div className={`absolute top-2 right-2 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm ${machine.pagina === 'Facebook Marketplace' ? 'bg-[#1877F2]' : 'bg-orange-500'}`}>
          {machine.pagina.toUpperCase()}
        </div>
      </div>

      {/* INFORMACIÓN PRINCIPAL */}
      <div className="p-4 flex flex-col grow">
        <span className="text-orange-500 text-[10px] font-bold tracking-wider uppercase mb-1">{machine.categoria_tarea}</span>
        <h3 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug" title={machine.titulo}>{machine.titulo}</h3>
        
        <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Precio Venta</p>
            <p className="text-xl font-black text-orange-600">${machine.precio.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Año</p>
            <p className="text-lg font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{machine.año || 'N/D'}</p>
          </div>
        </div>

        {/* GRID DE DATOS TÉCNICOS */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase">USO ({usoLabel})</p>
            <p className="text-xs font-bold text-slate-700">{usoFormateado}</p>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-100">
            <p className="text-[9px] text-slate-400 font-bold uppercase">Ubicación</p>
            <p className="text-xs font-bold text-slate-700 truncate" title={machine.ubicacion}>{machine.ubicacion}</p>
          </div>
          
          {/* Si el scraper logró extraer el Motor o la Transmisión, los mostramos aquí */}
          {(machine.motor || machine.transmision) && (
             <div className="bg-slate-50 p-2 rounded border border-slate-100 col-span-2 flex items-center justify-between">
               <div>
                 <p className="text-[9px] text-slate-400 font-bold uppercase">Motor</p>
                 <p className="text-xs font-bold text-slate-700 truncate">{machine.motor || 'N/D'}</p>
               </div>
               <div className="text-right">
                 <p className="text-[9px] text-slate-400 font-bold uppercase">Transmisión</p>
                 <p className="text-xs font-bold text-slate-700 truncate">{machine.transmision || 'N/D'}</p>
               </div>
             </div>
          )}
        </div>

        {/* BOTONES */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          <a href={machine.url} target="_blank" rel="noreferrer" className="text-center py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Abrir Link
          </a>
          <a href={`tel:${machine.telefono_vendedor}`} className="text-center py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#008f45] rounded-lg transition-colors flex items-center justify-center gap-1">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            Llamar
          </a>
        </div>
      </div>
      
    </div>
  );
}