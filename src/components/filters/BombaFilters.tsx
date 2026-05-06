import React from 'react';

interface Props {
  boomTypeValue: string;
  onBoomTypeValueChange: (val: string) => void;
  boomBrandValue: string;
  onBoomBrandChange: (val: string) => void;
}

export function BombaFilters({ boomTypeValue, onBoomTypeValueChange, boomBrandValue, onBoomBrandChange }: Props) {
  return (
    <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in mt-4">
      <label className="text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Configuración de Pluma
      </label>
      <div className="space-y-2">
        <label htmlFor="filter-boom-type" className="text-[9px] font-bold text-blue-700 uppercase">Tipo de Doblez</label>
        <select
          id="filter-boom-type"
          value={boomTypeValue}
          onChange={e => onBoomTypeValueChange(e.target.value)}
          className="w-full bg-white border border-blue-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-700"
        >
          <option value="ALL">Cualquiera</option>
          <option value="Z">Z</option>
          <option value="R/F">R&amp;F</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="filter-boom-brand" className="text-[9px] font-bold text-blue-700 uppercase">Marca de Pluma</label>
        <input
          id="filter-boom-brand"
          type="text"
          placeholder="Ej. Putzmeister, Schwing..."
          value={boomBrandValue}
          onChange={(e) => onBoomBrandChange(e.target.value)}
          className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
