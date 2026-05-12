import React from 'react';

interface Props {
  reqSubtipoElevador: string;
  onReqSubtipoElevadorChange: (val: string) => void;
  reqCombustible: string;
  onReqCombustibleChange: (val: string) => void;
  minAlcanceValue: string;
  onMinAlcanceChange: (val: string) => void;
  maxAlcanceValue: string;
  onMaxAlcanceChange: (val: string) => void;
}

export function ElevadorFilters({
  reqSubtipoElevador, onReqSubtipoElevadorChange,
  reqCombustible, onReqCombustibleChange,
  minAlcanceValue, onMinAlcanceChange,
  maxAlcanceValue, onMaxAlcanceChange,
}: Props) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Especificaciones de Elevación
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="filter-subtipo-elevador" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Equipo</label>
          <select
            id="filter-subtipo-elevador"
            value={reqSubtipoElevador}
            onChange={e => onReqSubtipoElevadorChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700"
          >
            <option value="ALL">Todos</option>
            <option value="ARTICULADO">Articulado (Boom)</option>
            <option value="TELESCOPICO">Telescópico (Straight)</option>
            <option value="TIJERA">Tijera (Scissor)</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="filter-combustible" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Combustible</label>
          <select
            id="filter-combustible"
            value={reqCombustible}
            onChange={e => onReqCombustibleChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700"
          >
            <option value="ALL">Cualquiera</option>
            <option value="DIÉSEL">Diésel</option>
            <option value="ELÉCTRICO">Eléctrico</option>
            <option value="DUAL">Dual / Híbrido</option>
            <option value="GAS">Gas / Propano</option>
          </select>
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alcance (Pies / FT)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min FT" value={minAlcanceValue} onChange={(e) => onMinAlcanceChange(e.target.value)} aria-label="Alcance mínimo en pies" className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max FT" value={maxAlcanceValue} onChange={(e) => onMaxAlcanceChange(e.target.value)} aria-label="Alcance máximo en pies" className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
