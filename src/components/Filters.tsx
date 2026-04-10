'use client';

import { SortOption } from '@/types';

interface FiltersProps {
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onRefresh: () => void;
  searchValue: string;
  categoryValue: string;
  priceValue: string;
  sortValue: SortOption;
  isRefreshing: boolean;
  lastUpdate: Date | null;
}

export default function Filters({
  categories,
  onSearchChange,
  onCategoryChange,
  onPriceChange,
  onSortChange,
  onRefresh,
  searchValue,
  categoryValue,
  priceValue,
  sortValue,
  isRefreshing,
  lastUpdate,
}: FiltersProps) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-4 mt-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col lg:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Buscar Equipo</label>
          <div className="relative w-full">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ej. Caterpillar 320, Terex..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow pr-10"
            />
            <svg 
              className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categoría */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
          <select
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="ALL">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Precio Máximo */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Precio Máximo ($ USD)</label>
          <input
            type="number"
            value={priceValue}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="Sin límite"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
          />
        </div>

        {/* Ordenar por */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Ordenar por</label>
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
          >
            <option value="recent">Más Recientes (Default)</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="year_desc">Año: Más Nuevos</option>
          </select>
        </div>

        {/* Botón de Actualizar */}
        <div className="flex flex-col justify-end lg:col-span-5 mt-2">
          <div className="flex items-center">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`flex items-center justify-center gap-2 border py-2 px-6 rounded-lg font-bold transition-colors w-full md:w-auto shadow-sm ${
                isRefreshing 
                  ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed' 
                  : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
              }`}
            >
              <svg 
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'Actualizando catálogo...' : 'Refrescar Catálogo'}
            </button>
            
            {lastUpdate && (
              <span className="ml-4 text-xs font-medium text-slate-400 hidden md:block">
                Última sincronización: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}