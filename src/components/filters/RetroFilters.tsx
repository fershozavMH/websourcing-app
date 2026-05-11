import React from 'react';

interface Props {
  req4x4: string;        onReq4x4Change: (val: string) => void;
  reqCabin: string;      onReqCabinChange: (val: string) => void;
  reqExtension: string;  onReqExtensionChange: (val: string) => void;
  reqHammer: string;     onReqHammerChange: (val: string) => void;
  reqClam: string;       onReqClamChange: (val: string) => void;
}

export function RetroFilters({ req4x4, onReq4x4Change, reqCabin, onReqCabinChange, reqExtension, onReqExtensionChange, reqHammer, onReqHammerChange, reqClam, onReqClamChange }: Props) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Especificaciones Adicionales
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="filter-4x4" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tracción</label>
          <select id="filter-4x4" value={req4x4} onChange={e => onReq4x4Change(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
            <option value="ALL">Cualquiera</option><option value="4WD">4x4</option><option value="2WD">4x2</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filter-cabin" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cabina</label>
          <select id="filter-cabin" value={reqCabin} onChange={e => onReqCabinChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
            <option value="ALL">Cualquiera</option><option value="CERRADA">Cerrada</option><option value="ABIERTA">Abierta</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filter-extension" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Brazo Excavador</label>
          <select id="filter-extension" value={reqExtension} onChange={e => onReqExtensionChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
            <option value="ALL">Cualquier</option><option value="YES">Extensión</option><option value="NO">Estándar</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filter-hammer" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Kit de Martillo</label>
          <select id="filter-hammer" value={reqHammer} onChange={e => onReqHammerChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
            <option value="ALL">Cualquiera</option><option value="YES">Con Kit</option><option value="NO">Sin Kit</option>
          </select>
        </div>
        <div className="space-y-1 col-span-2">
          <label htmlFor="filter-clam" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cucharón Frontal</label>
          <select id="filter-clam" value={reqClam} onChange={e => onReqClamChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
            <option value="ALL">Cualquiera</option><option value="YES">Bote Almeja (4-en-1)</option><option value="NO">Normal</option>
          </select>
        </div>
      </div>
    </div>
  );
}
