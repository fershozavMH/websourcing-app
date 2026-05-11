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
    <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4 animate-fade-in">
      <p className="text-xs font-black text-orange-800 uppercase tracking-wider mb-2">Especificaciones de Grúa</p>
      {isArticulada && (
        <div className="space-y-2">
          <label htmlFor="filter-crane-mount" className="text-[10px] font-bold text-orange-700 uppercase">Tipo de Montaje</label>
          <select
            id="filter-crane-mount"
            value={craneMountStatus}
            onChange={e => onCraneMountStatusChange(e.target.value)}
            className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">Cualquiera</option>
            <option value="MONTADA">Montada en Camión</option>
            <option value="DESMONTADA">Desmontada (Solo Grúa)</option>
          </select>
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="filter-crane-boom-brand" className="text-[10px] font-bold text-orange-700 uppercase">Marca de Pluma (Grúa)</label>
        <input
          id="filter-crane-boom-brand"
          type="text"
          placeholder="Ej. National, Terex..."
          value={boomBrandValue}
          onChange={(e) => onBoomBrandChange(e.target.value)}
          className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
    </div>
  );
}
