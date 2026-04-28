import React from 'react';
import type { SortOption } from '@/types';

// NUEVO: Agregamos regiones directas para facilitar la búsqueda suelta
const USA_STATES = [
  { abbr: "WEST", name: "Western USA" }, { abbr: "EAST", name: "Eastern USA" }, 
  { abbr: "CENTRAL", name: "Central USA" }, { abbr: "SOUTH", name: "Southern USA" }, 
  { abbr: "NORTH", name: "Northern USA" },
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" }, { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" }, { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" }, { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" }, { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" }, { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" }, { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" }, { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" }, { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" }
];
const CAN_PROVINCES = [
  { abbr: "AB", name: "Alberta" }, { abbr: "BC", name: "British Columbia" }, { abbr: "MB", name: "Manitoba" }, { abbr: "NB", name: "New Brunswick" }, { abbr: "NL", name: "Newfoundland and Labrador" }, { abbr: "NS", name: "Nova Scotia" }, { abbr: "ON", name: "Ontario" }, { abbr: "PE", name: "Prince Edward Island" }, { abbr: "QC", name: "Quebec" }, { abbr: "SK", name: "Saskatchewan" }
];

const BRANDS_RETROS = ["CAT", "CASE", "JOHN DEERE", "JCB"];
const BRANDS_BOMBAS = ["PUTZMEISTER", "SCHWING", "ALLIANCE", "CONCORD"];
const BRANDS_TRUCKS = ["FREIGHTLINER", "INTERNATIONAL", "KENWORTH", "MACK", "PETERBILT", "VOLVO", "FORD", "STERLING", "WESTERN STAR"];

interface FiltersProps {
  categories: string[];
  searchValue: string; onSearchChange: (v: string) => void;
  categoryValue: string; onCategoryChange: (v: string) => void;
  selectedBrands: string[]; onSelectedBrandsChange: (v: string[]) => void;
  selectedTruckBrands: string[]; onSelectedTruckBrandsChange: (v: string[]) => void;
  minPriceValue: string; onMinPriceChange: (v: string) => void;
  maxPriceValue: string; onMaxPriceChange: (v: string) => void;
  showCallForPrice: boolean; onShowCallForPriceChange: (v: boolean) => void;
  minYearValue: string; onMinYearChange: (v: string) => void;
  maxYearValue: string; onMaxYearChange: (v: string) => void;
  hoursMaxValue: string; onHoursMaxChange: (v: string) => void;
  milesMaxValue: string; onMilesMaxChange: (v: string) => void;
  engineValue: string; onEngineChange: (v: string) => void;
  transmissionValue: string; onTransmissionChange: (v: string) => void;
  countryValue: string; onCountryChange: (v: string) => void;
  selectedStates: string[]; onSelectedStatesChange: (v: string[]) => void;
  minCapacityValue: string; onMinCapacityChange: (v: string) => void;
  maxCapacityValue: string; onMaxCapacityChange: (v: string) => void;
  boomBrandValue: string; onBoomBrandChange: (v: string) => void;
  craneMountStatus: string; onCraneMountStatusChange: (v: string) => void;
  boomTypeValue: string; onBoomTypeValueChange: (v: string) => void; 
  reqCabin: string; onReqCabinChange: (v: string) => void;
  reqHammer: string; onReqHammerChange: (v: string) => void;
  reqExtension: string; onReqExtensionChange: (v: string) => void;
  req4x4: string; onReq4x4Change: (v: string) => void;
  reqClam: string; onReqClamChange: (v: string) => void;
  sortValue: SortOption; onSortChange: (v: SortOption) => void;
  onRefresh: () => void; isRefreshing: boolean; lastUpdate: Date | null;
  onClearAll: () => void;
}

export default function Filters(props: FiltersProps) {
  const isGrua = props.categoryValue === 'Gruas Titanes' || props.categoryValue === 'Gruas Articuladas';
  const isRetro = props.categoryValue === 'Retroexcavadoras';
  const isBomba = props.categoryValue === 'Bombas';
  const isTrompo = props.categoryValue === 'Camiones Trompo';
  
  const isTitan = props.categoryValue === 'Gruas Titanes';
  const isArticulada = props.categoryValue === 'Gruas Articuladas';
  const isPureTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones'].includes(props.categoryValue);

  const showHours = props.categoryValue === 'ALL' || !isPureTruck; 
  const showMiles = props.categoryValue === 'ALL' || isPureTruck || isTitan || isBomba || (isArticulada && props.craneMountStatus !== 'DESMONTADA');
  const requireTruckBrand = isTrompo || isTitan || isPureTruck || isBomba;

  const activeStateList = props.countryValue === 'USA' ? USA_STATES : props.countryValue === 'Canadá' ? CAN_PROVINCES : [];
  const currentBrandList = isBomba ? BRANDS_BOMBAS : isRetro ? BRANDS_RETROS : [];

  const handleAddState = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !props.selectedStates.includes(val)) props.onSelectedStatesChange([...props.selectedStates, val]);
    e.target.value = ""; 
  };
  const removeState = (stateToRemove: string) => props.onSelectedStatesChange(props.selectedStates.filter(s => s !== stateToRemove));

  const handleAddBrand = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !props.selectedBrands.includes(val)) props.onSelectedBrandsChange([...props.selectedBrands, val]);
    e.target.value = ""; 
  };
  const removeBrand = (brandToRemove: string) => props.onSelectedBrandsChange(props.selectedBrands.filter(b => b !== brandToRemove));

  const handleAddTruckBrand = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !props.selectedTruckBrands.includes(val)) props.onSelectedTruckBrandsChange([...props.selectedTruckBrands, val]);
    e.target.value = ""; 
  };
  const removeTruckBrand = (brandToRemove: string) => props.onSelectedTruckBrandsChange(props.selectedTruckBrands.filter(b => b !== brandToRemove));

  return (
    <aside className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
      
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          Filtros
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={props.onClearAll} className="text-[10px] font-bold text-slate-400 hover:text-orange-600 uppercase tracking-wider transition-colors underline decoration-dotted underline-offset-2">Limpiar</button>
          <button onClick={props.onRefresh} disabled={props.isRefreshing} className="text-slate-400 hover:text-orange-500 transition-colors">
             <svg className={`w-5 h-5 ${props.isRefreshing ? 'animate-spin text-orange-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Palabra Clave</label>
        <input type="text" placeholder={isBomba ? "Ej. 32Z, Mack..." : "Ej. 320, 580SN..."} value={props.searchValue} onChange={(e) => props.onSearchChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
          <select value={props.categoryValue} onChange={(e) => props.onCategoryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-medium">
            <option value="ALL">Todas las categorías</option>
            {props.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        
        {/* MARCAS EQUIPO */}
        {(isRetro || isBomba) && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marcas de Equipo</label>
            <select onChange={handleAddBrand} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
              <option value="">+ Añadir Marca...</option>
              {currentBrandList.map(b => {
                if (props.selectedBrands.includes(b)) return null; 
                return <option key={b} value={b}>{b === 'CAT' ? 'Caterpillar (CAT)' : b}</option>;
              })}
            </select>

            {props.selectedBrands.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
                {props.selectedBrands.map(brand => (
                  <span key={brand} className="bg-slate-100 text-slate-700 text-[10px] pl-2 pr-1 py-1 rounded-md flex items-center gap-1 font-bold border border-slate-300">
                    {brand === 'CAT' ? 'Caterpillar' : brand}
                    <button onClick={() => removeBrand(brand)} className="hover:bg-slate-200 rounded-full p-0.5 transition-colors text-slate-500 hover:text-orange-600">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

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

      {/* UBICACIÓN MULTI-SELECT */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">País de Ubicación</label>
          <select value={props.countryValue} onChange={(e) => { props.onCountryChange(e.target.value); props.onSelectedStatesChange([]); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
            <option value="">Cualquier País</option>
            <option value="USA">Estados Unidos</option>
            <option value="Canadá">Canadá</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estados / Región (Múltiple)</label>
          <select onChange={handleAddState} disabled={!props.countryValue} className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none ${!props.countryValue ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-orange-400'}`}>
            <option value="">{props.countryValue ? '+ Añadir Ubicación...' : 'Selecciona un País primero'}</option>
            {activeStateList.map(s => {
              const val = `${s.abbr}|${s.name}`;
              if (props.selectedStates.includes(val)) return null; 
              return <option key={s.abbr} value={val}>{s.abbr} - {s.name}</option>;
            })}
          </select>

          {props.selectedStates.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
              {props.selectedStates.map(state => {
                const abbr = state.split('|')[0];
                return (
                  <span key={state} className="bg-orange-100 text-orange-800 text-[10px] pl-2 pr-1 py-1 rounded-md flex items-center gap-1 font-bold border border-orange-200">
                    {abbr}
                    <button onClick={() => removeState(state)} className="hover:bg-orange-200 rounded-full p-0.5 transition-colors text-orange-600"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* MÓDULO EXCLUSIVO PARA BOMBAS */}
      {isBomba && (
        <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
           <label className="text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              Configuración de Pluma
           </label>
           
           <div className="space-y-2">
             <label className="text-[9px] font-bold text-blue-700 uppercase">Tipo de Doblez</label>
             <select value={props.boomTypeValue} onChange={e => props.onBoomTypeValueChange(e.target.value)} className="w-full bg-white border border-blue-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-700">
               <option value="ALL">Cualquier Doblez</option>
               <option value="Z">Z-Boom</option>
               <option value="R/F">Roll & Fold (R/F)</option>
             </select>
           </div>
        </div>
      )}

      {/* MÓDULO OPCIONES TÉCNICAS RETROS */}
      {isRetro && (
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in">
           <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
              Especificaciones Adicionales
           </label>
           
           <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tracción</label>
               <select value={props.req4x4} onChange={e => props.onReq4x4Change(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                 <option value="ALL">Cualquiera</option>
                 <option value="4WD">4x4 (Doble Tracción)</option>
                 <option value="2WD">4x2 (Sencilla)</option>
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cabina</label>
               <select value={props.reqCabin} onChange={e => props.onReqCabinChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                 <option value="ALL">Cualquiera</option>
                 <option value="CERRADA">Cerrada (Con A/C)</option>
                 <option value="ABIERTA">Abierta (OROPS)</option>
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Brazo Excavador</label>
               <select value={props.reqExtension} onChange={e => props.onReqExtensionChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                 <option value="ALL">Cualquier Brazo</option>
                 <option value="YES">Brazo Extensible</option>
                 <option value="NO">Brazo Estándar</option>
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Kit de Martillo</label>
               <select value={props.reqHammer} onChange={e => props.onReqHammerChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                 <option value="ALL">Cualquiera</option>
                 <option value="YES">Con Kit/Tubería</option>
                 <option value="NO">Sin Kit Auxiliar</option>
               </select>
             </div>
             <div className="space-y-1 col-span-2">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cucharón Frontal</label>
               <select value={props.reqClam} onChange={e => props.onReqClamChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                 <option value="ALL">Cualquier Cucharón</option>
                 <option value="YES">Bote Almeja (4-en-1)</option>
                 <option value="NO">Bote Uso General</option>
               </select>
             </div>
           </div>
        </div>
      )}

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

      {/* ETIQUETA DINÁMICA: Metros para Bombas, Yardas para Trompos, Toneladas para el resto */}
      {!isRetro && (
        <div className="space-y-2 animate-fade-in">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isBomba ? 'Alcance de Pluma (Metros)' : isTrompo ? 'Capacidad (Yardas Cúbicas)' : 'Capacidad (Toneladas)'}
          </label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minCapacityValue} onChange={(e) => props.onMinCapacityChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxCapacityValue} onChange={(e) => props.onMaxCapacityChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>
      )}

      <hr className="border-slate-100" />

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Año</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Desde" value={props.minYearValue} onChange={(e) => props.onMinYearChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          <input type="number" placeholder="Hasta" value={props.maxYearValue} onChange={(e) => props.onMaxYearChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
        </div>
      </div>

      <div className="space-y-4">
        {showHours && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isBomba ? 'Horas de Bomba (Máx)' : 'Horas de Máquina (Máx)'}</label>
            <input type="number" placeholder="Ej. 8000" value={props.hoursMaxValue} onChange={(e) => props.onHoursMaxChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        )}
        
        {showMiles && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{isBomba || isTrompo ? 'Millas / Hrs de Camión (Máx)' : 'Millas Máximas'}</label>
            <input type="number" placeholder="Ej. 300000" value={props.milesMaxValue} onChange={(e) => props.onMilesMaxChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* MOTOR, TRANSMISIÓN Y MARCAS DE CAMIÓN (Activos para Trompos, Volteos, Grúas) */}
      {!isRetro && !isBomba && (
        <div className="space-y-4 animate-fade-in">
          
          {requireTruckBrand && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marcas de Camión</label>
              <select onChange={handleAddTruckBrand} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer">
                <option value="">+ Añadir Marca...</option>
                {BRANDS_TRUCKS.map(b => {
                  if (props.selectedTruckBrands.includes(b)) return null; 
                  return <option key={b} value={b}>{b}</option>;
                })}
              </select>
              {props.selectedTruckBrands.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
                  {props.selectedTruckBrands.map(brand => (
                    <span key={brand} className="bg-slate-100 text-slate-700 text-[10px] pl-2 pr-1 py-1 rounded-md flex items-center gap-1 font-bold border border-slate-300">
                      {brand}
                      <button onClick={() => removeTruckBrand(brand)} className="hover:bg-slate-200 rounded-full p-0.5 transition-colors text-slate-500 hover:text-orange-600">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motor</label>
            <input type="text" placeholder="Ej. Cummins, CAT..." value={props.engineValue} onChange={(e) => props.onEngineChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transmisión</label>
            <select value={props.transmissionValue} onChange={(e) => props.onTransmissionChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
              <option value="">Cualquiera</option><option value="manual">Manual</option><option value="auto">Automática / Allison</option>
            </select>
          </div>
        </div>
      )}

      {isGrua && (
        <div className="space-y-4 bg-orange-50 p-4 rounded-lg border border-orange-200 mt-4 animate-fade-in">
           <p className="text-xs font-black text-orange-800 uppercase tracking-wider mb-2">Especificaciones de Grúa</p>
           {isArticulada && (
             <div className="space-y-2">
               <label className="text-[10px] font-bold text-orange-700 uppercase">Tipo de Montaje</label>
               <select value={props.craneMountStatus} onChange={e => props.onCraneMountStatusChange(e.target.value)} className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500">
                 <option value="ALL">Cualquiera</option><option value="MONTADA">Montada en Camión</option><option value="DESMONTADA">Desmontada (Solo Grúa)</option>
               </select>
             </div>
           )}
           <div className="space-y-2">
             <label className="text-[10px] font-bold text-orange-700 uppercase">Marca de Pluma</label>
             <input type="text" placeholder="Ej. National, Terex..." value={props.boomBrandValue} onChange={(e) => props.onBoomBrandChange(e.target.value)} className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
           </div>
        </div>
      )}
      
      {props.lastUpdate && (
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center font-medium flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Actualizado: {props.lastUpdate.toLocaleTimeString()}
          </p>
        </div>
      )}
    </aside>
  );
}