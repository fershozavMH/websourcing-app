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
    <div className="space-y-3 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-purple-800 uppercase tracking-wider flex items-center gap-2">
        Especificaciones de Elevación
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="filter-subtipo-elevador" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Equipo</label>
          <select
            id="filter-subtipo-elevador"
            value={reqSubtipoElevador}
            onChange={e => onReqSubtipoElevadorChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-700"
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
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-700"
          >
            <option value="ALL">Cualquiera</option>
            <option value="DIÉSEL">Diésel</option>
            <option value="ELÉCTRICO">Eléctrico</option>
            <option value="DUAL">Dual / Híbrido</option>
            <option value="GAS">Gas / Propano</option>
          </select>
        </div>
      </div>
      <div className="space-y-1 pt-2">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Alcance (Pies / FT)</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min FT" value={minAlcanceValue} onChange={(e) => onMinAlcanceChange(e.target.value)} aria-label="Alcance mínimo en pies" className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none" />
          <input type="number" placeholder="Max FT" value={maxAlcanceValue} onChange={(e) => onMaxAlcanceChange(e.target.value)} aria-label="Alcance máximo en pies" className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none" />
        </div>
      </div>
    </div>
  );
}
