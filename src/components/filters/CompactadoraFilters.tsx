import React from 'react';

interface Props {
  reqSubtipoCompactadora: string;
  onReqSubtipoCompactadoraChange: (val: string) => void;
  reqMotor: string;
  onMotorChange: (val: string) => void;
}

export function CompactadoraFilters({ reqSubtipoCompactadora, onReqSubtipoCompactadoraChange, reqMotor, onMotorChange }: Props) {
  return (
    <div className="space-y-3 bg-amber-50 p-4 rounded-xl border border-amber-100 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-2">
        Especificaciones de Compactación
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <label htmlFor="filter-subtipo-compactadora" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Subtipo de Rodillo</label>
          <select
            id="filter-subtipo-compactadora"
            value={reqSubtipoCompactadora}
            onChange={e => onReqSubtipoCompactadoraChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none text-slate-700"
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
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none text-slate-700"
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
