import React from 'react';
import type { SortOption } from '@/types';

// --- LISTAS DE ESTADOS Y PROVINCIAS ---
const USA_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" }, { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" }, { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" }, { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" }, { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" }, { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" }, { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" }, { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" }, { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" }
];

const CAN_PROVINCES = [
  { abbr: "AB", name: "Alberta" }, { abbr: "BC", name: "British Columbia" }, { abbr: "MB", name: "Manitoba" }, { abbr: "NB", name: "New Brunswick" }, { abbr: "NL", name: "Newfoundland and Labrador" }, { abbr: "NS", name: "Nova Scotia" }, { abbr: "ON", name: "Ontario" }, { abbr: "PE", name: "Prince Edward Island" }, { abbr: "QC", name: "Quebec" }, { abbr: "SK", name: "Saskatchewan" }
];

interface FiltersProps {
  categories: string[];
  searchValue: string;
  onSearchChange: (v: string) => void;
  categoryValue: string;
  onCategoryChange: (v: string) => void;
  
  minPriceValue: string;
  onMinPriceChange: (v: string) => void;
  maxPriceValue: string;
  onMaxPriceChange: (v: string) => void;
  showCallForPrice: boolean;
  onShowCallForPriceChange: (v: boolean) => void;
  
  minYearValue: string;
  onMinYearChange: (v: string) => void;
  maxYearValue: string;
  onMaxYearChange: (v: string) => void;
  hoursMaxValue: string;
  onHoursMaxChange: (v: string) => void;
  milesMaxValue: string;
  onMilesMaxChange: (v: string) => void;

  engineValue: string;
  onEngineChange: (v: string) => void;
  transmissionValue: string;
  onTransmissionChange: (v: string) => void;
  
  // --- NUEVOS FILTROS DE UBICACIÓN ---
  countryValue: string;
  onCountryChange: (v: string) => void;
  stateValue: string;
  onStateChange: (v: string) => void;

  minCapacityValue: string;
  onMinCapacityChange: (v: string) => void;
  maxCapacityValue: string;
  onMaxCapacityChange: (v: string) => void;
  boomBrandValue: string;
  onBoomBrandChange: (v: string) => void;
  truckBrandValue: string;
  onTruckBrandChange: (v: string) => void;

  sortValue: SortOption;
  onSortChange: (v: SortOption) => void;
  
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdate: Date | null;
}

export default function Filters(props: FiltersProps) {
  const isTruckCategory = props.categoryValue === 'ALL' ? null : ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(props.categoryValue);
  const isGrua = props.categoryValue === 'Gruas Titanes' || props.categoryValue === 'Gruas Articuladas';

  // Selección dinámica de la lista de estados
  const activeStateList = props.countryValue === 'USA' ? USA_STATES : props.countryValue === 'Canadá' ? CAN_PROVINCES : [];

  return (
    <aside className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
      
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          Filtros
        </h3>
        <button onClick={props.onRefresh} disabled={props.isRefreshing} className="text-slate-400 hover:text-orange-500 transition-colors" title="Refrescar datos">
           <svg className={`w-5 h-5 ${props.isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Palabra Clave</label>
        <input type="text" placeholder="Ej. CAT 320, Terex..." value={props.searchValue} onChange={(e) => props.onSearchChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
          <select value={props.categoryValue} onChange={(e) => props.onCategoryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-medium">
            <option value="ALL">Todas las categorías</option>
            {props.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordenar Por</label>
          <select value={props.sortValue} onChange={(e) => props.onSortChange(e.target.value as SortOption)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
            <option value="recent">Más Recientes</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="year_desc">Año: Más Nuevos</option>
          </select>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio (USD)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minPriceValue} onChange={(e) => props.onMinPriceChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxPriceValue} onChange={(e) => props.onMaxPriceChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>
        
        <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 p-2 rounded-lg border border-slate-200">
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={props.showCallForPrice} onChange={(e) => props.onShowCallForPriceChange(e.target.checked)} />
            <div className={`block w-10 h-6 rounded-full transition-colors ${props.showCallForPrice ? 'bg-orange-500' : 'bg-slate-300'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${props.showCallForPrice ? 'transform translate-x-4' : ''}`}></div>
          </div>
          <div className="text-xs font-bold text-slate-600 group-hover:text-slate-800">
            Mostrar "Call For Price" ($0)
          </div>
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacidad (Toneladas)</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min Tons" value={props.minCapacityValue} onChange={(e) => props.onMinCapacityChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          <input type="number" placeholder="Max Tons" value={props.maxCapacityValue} onChange={(e) => props.onMaxCapacityChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* --- NUEVA SECCIÓN DE UBICACIÓN --- */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">País de Ubicación</label>
          <select 
            value={props.countryValue} 
            onChange={(e) => {
              props.onCountryChange(e.target.value);
              props.onStateChange(''); // Resetea el estado si cambian de país
            }} 
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
          >
            <option value="">Cualquier País</option>
            <option value="USA">Estados Unidos</option>
            <option value="Canadá">Canadá</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado / Provincia</label>
          <select 
            value={props.stateValue} 
            onChange={(e) => props.onStateChange(e.target.value)} 
            disabled={!props.countryValue}
            className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none ${!props.countryValue ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <option value="">{props.countryValue ? 'Cualquier Estado' : 'Selecciona un País primero'}</option>
            {activeStateList.map(s => (
              <option key={s.abbr} value={`${s.abbr}|${s.name}`}>{s.abbr} - {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Año</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Desde" value={props.minYearValue} onChange={(e) => props.onMinYearChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          <input type="number" placeholder="Hasta" value={props.maxYearValue} onChange={(e) => props.onMaxYearChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
      </div>

      <div className="space-y-4">
        {(isTruckCategory === false || isTruckCategory === null) && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horas Máximas</label>
            <input type="number" placeholder="Ej. 5000" value={props.hoursMaxValue} onChange={(e) => props.onHoursMaxChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        )}
        
        {(isTruckCategory === true || isTruckCategory === null) && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Millas Máximas</label>
            <input type="number" placeholder="Ej. 300000" value={props.milesMaxValue} onChange={(e) => props.onMilesMaxChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motor</label>
          <input type="text" placeholder="Ej. Cummins, CAT..." value={props.engineValue} onChange={(e) => props.onEngineChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transmisión</label>
          <select value={props.transmissionValue} onChange={(e) => props.onTransmissionChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
            <option value="">Cualquiera</option>
            <option value="manual">Manual</option>
            <option value="auto">Automática / Allison</option>
          </select>
        </div>
      </div>
    </aside>
  );
}