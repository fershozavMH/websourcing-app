import React from 'react';

interface Props {
  reqSubtipoCompactadora: string;
  onReqSubtipoCompactadoraChange: (val: string) => void;
  reqMotor: string;
  onMotorChange: (val: string) => void;
}

export function CompactadoraFilters({ reqSubtipoCompactadora, onReqSubtipoCompactadoraChange, reqMotor, onMotorChange }: Props) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Especificaciones de Compactación
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <label htmlFor="filter-subtipo-compactadora" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Subtipo de Rodillo</label>
          <select
            id="filter-subtipo-compactadora"
            value={reqSubtipoCompactadora}
            onChange={e => onReqSubtipoCompactadoraChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700"
          >
            <option value="ALL">Todos</option>
            <option value="Vibratoria">Vibratoria</option>
            <option value="Pata de Cabra">Pata de Cabra</option>
            <option value="Neumática">Neumática</option>
            <option value="Placa Vibradora">Placa Vibradora</option>
          </select>
        </div>
        <div className="space-y-1 col-span-2">
          <label htmlFor="filter-motor-compactadora" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Motor</label>
          <select
            id="filter-motor-compactadora"
            value={reqMotor}
            onChange={e => onMotorChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700"
          >
            <option value="ALL">Cualquiera</option>
            <option value="CATERPILLAR">Caterpillar</option>
            <option value="CUMMINS">Cummins</option>
            <option value="DEUTZ">Deutz</option>
          </select>
        </div>
      </div>
    </div>
  );
}
