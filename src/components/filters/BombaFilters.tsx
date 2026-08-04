import React from 'react';

interface Props {
  boomTypeValue: string;
  onBoomTypeValueChange: (val: string) => void;
  boomBrandValue: string;
  onBoomBrandChange: (val: string) => void;
}

export function BombaFilters({ boomTypeValue, onBoomTypeValueChange, boomBrandValue, onBoomBrandChange }: Props) {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
        <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Configuración de Pluma
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <label htmlFor="filter-boom-type" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Doblez</label>
          <select
            id="filter-boom-type"
            value={boomTypeValue}
            onChange={e => onBoomTypeValueChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700"
          >
            <option value="ALL">Cualquiera</option>
            <option value="Z">Z</option>
            <option value="R/F">R&amp;F</option>
          </select>
        </div>
        <div className="space-y-1 col-span-2">
          <label htmlFor="filter-boom-brand" className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Marca de Pluma</label>
          <input
            id="filter-boom-brand"
            type="text"
            placeholder="Ej. Putzmeister, Schwing..."
            value={boomBrandValue}
            onChange={(e) => onBoomBrandChange(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
