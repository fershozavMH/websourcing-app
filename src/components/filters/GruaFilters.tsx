import React from 'react';

interface Props {
  isArticulada: boolean;
  craneMountStatus: string;
  onCraneMountStatusChange: (val: string) => void;
  boomBrandValue: string;
  onBoomBrandChange: (val: string) => void;
}

export function GruaFilters({ isArticulada, craneMountStatus, onCraneMountStatusChange, boomBrandValue, onBoomBrandChange }: Props) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Especificaciones de Grúa
      </label>
      <div className="grid grid-cols-2 gap-3">
        {isArticulada && (
          <div className="space-y-1 col-span-2">
            <label htmlFor="filter-crane-mount" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Montaje</label>
            <select
              id="filter-crane-mount"
              value={craneMountStatus}
              onChange={e => onCraneMountStatusChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700"
            >
              <option value="ALL">Cualquiera</option>
              <option value="MONTADA">Montada en Camión</option>
              <option value="DESMONTADA">Desmontada (Solo Grúa)</option>
            </select>
          </div>
        )}
        <div className="space-y-1 col-span-2">
          <label htmlFor="filter-crane-boom-brand" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Marca de Pluma (Grúa)</label>
          <input
            id="filter-crane-boom-brand"
            type="text"
            placeholder="Ej. National, Terex..."
            value={boomBrandValue}
            onChange={(e) => onBoomBrandChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
