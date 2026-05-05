import React, { useState, useMemo } from 'react';
import type { SortOption } from '@/types';

// CONSTANTES PARA EL MODAL
const USA_STATES = [
  "WEST - Western USA", "EAST - Eastern USA", "CENTRAL - Central USA", "SOUTH - Southern USA", "NORTH - Northern USA",
  "AL - Alabama", "AK - Alaska", "AZ - Arizona", "AR - Arkansas", "CA - California", "CO - Colorado", "CT - Connecticut", "DE - Delaware", "FL - Florida", "GA - Georgia", "HI - Hawaii", "ID - Idaho", "IL - Illinois", "IN - Indiana", "IA - Iowa", "KS - Kansas", "KY - Kentucky", "LA - Louisiana", "ME - Maine", "MD - Maryland", "MA - Massachusetts", "MI - Michigan", "MN - Minnesota", "MS - Mississippi", "MO - Missouri", "MT - Montana", "NE - Nebraska", "NV - Nevada", "NH - New Hampshire", "NJ - New Jersey", "NM - New Mexico", "NY - New York", "NC - North Carolina", "ND - North Dakota", "OH - Ohio", "OK - Oklahoma", "OR - Oregon", "PA - Pennsylvania", "RI - Rhode Island", "SC - South Carolina", "SD - South Dakota", "TN - Tennessee", "TX - Texas", "UT - Utah", "VT - Vermont", "VA - Virginia", "WA - Washington", "WV - West Virginia", "WI - Wisconsin", "WY - Wyoming"
];
const CAN_PROVINCES = [
  "AB - Alberta", "BC - British Columbia", "MB - Manitoba", "NB - New Brunswick", "NL - Newfoundland and Labrador", "NS - Nova Scotia", "ON - Ontario", "PE - Prince Edward Island", "QC - Quebec", "SK - Saskatchewan"
];

const MultiSelectModal = ({ 
    isOpen, onClose, title, options, selected, onApply 
}: { 
    isOpen: boolean, onClose: () => void, title: string, options: string[], selected: string[], onApply: (arr: string[]) => void 
}) => {
    const [temp, setTemp] = useState<string[]>([]);
    
    React.useEffect(() => { 
        if (isOpen) setTemp(selected); 
    }, [isOpen, selected]);

    if (!isOpen) return null;

    return (
       <div 
         className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
         onClick={onClose} 
       >
         <div 
           className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh] animate-fade-in"
           onClick={(e) => e.stopPropagation()} 
         >
           <div className="p-4 border-b border-slate-100 flex justify-between items-center">
             <h4 className="font-black text-slate-800">{title}</h4>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
           </div>
           <div className="p-4 overflow-y-auto flex-1 space-y-2">
             {options.length === 0 && <p className="text-sm text-slate-500 italic text-center py-4">No hay opciones disponibles en esta búsqueda.</p>}
             {options.map(opt => (
               <label key={opt} className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-orange-100">
                 <input 
                    type="checkbox" 
                    checked={temp.includes(opt)} 
                    onChange={() => temp.includes(opt) ? setTemp(temp.filter(o => o !== opt)) : setTemp([...temp, opt])} 
                    className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-slate-300 cursor-pointer" 
                 />
                 <span className="text-sm font-semibold text-slate-700">{opt}</span>
               </label>
             ))}
           </div>
           <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
             <button onClick={() => { onApply(temp); onClose(); }} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-500/20">
               Aplicar Filtros ({temp.length})
             </button>
           </div>
         </div>
       </div>
    );
};

export default function Filters(props: any) {
  const [activeModal, setActiveModal] = useState<'PAIS' | 'ESTADO' | 'MARCA' | 'MODELO' | 'MOTOR' | 'TRACCION' | 'EJES' | null>(null);

  const normalizedCategory = ['Rough Terrain', 'All Terrain'].includes(props.categoryValue) ? 'rough_terrain' : props.categoryValue;

  const isBomba = normalizedCategory === 'Bombas';
  const isRetro = normalizedCategory === 'Retroexcavadoras';
  const isGrua = ['Gruas Titanes', 'Gruas Articuladas', 'rough_terrain'].includes(normalizedCategory);
  const isArticulada = normalizedCategory === 'Gruas Articuladas';
  const isPureTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones'].includes(normalizedCategory);
  
  const showTruckFilters = props.categoryValue === 'ALL' || isPureTruck || isGrua || isBomba;

  const availableStates = useMemo(() => {
    let states: string[] = [];
    if (props.selectedCountries.length === 0 || props.selectedCountries.includes('USA')) {
      states = [...states, ...USA_STATES];
    }
    if (props.selectedCountries.length === 0 || props.selectedCountries.includes('Canadá')) {
      states = [...states, ...CAN_PROVINCES];
    }
    return states;
  }, [props.selectedCountries]);

  const renderMultiSelectTrigger = (title: string, modalId: any, selectedArr: string[], onRemove: (val: string) => void) => (
    <div className="space-y-2 animate-fade-in">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</label>
      <button 
        onClick={() => setActiveModal(modalId)}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-left hover:border-orange-400 focus:ring-2 focus:ring-orange-500 outline-none transition-all flex justify-between items-center shadow-sm"
      >
        <span className="text-slate-600 font-medium">Seleccionar opciones...</span>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      
      {selectedArr.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
          {selectedArr.map(item => (
            <span key={item} className="bg-orange-100 text-orange-800 text-[11px] pl-2.5 pr-1 py-1 rounded-md flex items-center gap-1.5 font-bold border border-orange-200">
              {item.split(' - ')[0]} 
              <button onClick={() => onRemove(item)} className="hover:bg-orange-200 rounded-full p-1 transition-colors text-orange-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">
        
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            Filtros
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={props.onClearAll} className="text-[10px] font-bold text-slate-400 hover:text-orange-600 uppercase tracking-wider transition-colors underline decoration-dotted underline-offset-2">Limpiar Todo</button>
            <button onClick={props.onRefresh} disabled={props.isRefreshing} className="text-slate-400 hover:text-orange-500 transition-colors">
               <svg className={`w-5 h-5 ${props.isRefreshing ? 'animate-spin text-orange-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Palabra Clave</label>
          <input type="text" placeholder="Ingresar texto..." value={props.searchValue} onChange={(e) => props.onSearchChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
          <select value={props.categoryValue} onChange={(e) => props.onCategoryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-medium">
            <option value="ALL">Todas las máquinas</option>
            {/* MAGIA AQUÍ: Ocultamos rough_terrain del dropdown */}
            {props.categories?.filter((cat: string) => cat !== 'rough_terrain').map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordenar Por</label>
          <select value={props.sortValue} onChange={(e) => props.onSortChange(e.target.value as SortOption)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
            <option value="recent">Más Recientes</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="year_desc">Año: Más Nuevos</option>
          </select>
        </div>

        <hr className="border-slate-100" />

        {renderMultiSelectTrigger("País de Ubicación", "PAIS", props.selectedCountries, (val) => props.onSelectedCountriesChange(props.selectedCountries.filter((c: string) => c !== val)))}
        {renderMultiSelectTrigger("Estados / Región", "ESTADO", props.selectedStates, (val) => props.onSelectedStatesChange(props.selectedStates.filter((s: string) => s !== val)))}
        
        {renderMultiSelectTrigger("Marca", "MARCA", props.selectedBrands, (val) => props.onSelectedBrandsChange(props.selectedBrands.filter((b: string) => b !== val)))}
        {renderMultiSelectTrigger("Modelo", "MODELO", props.selectedModels, (val) => props.onSelectedModelsChange(props.selectedModels.filter((m: string) => m !== val)))}

        <hr className="border-slate-100" />

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Año</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minYearValue} onChange={(e) => props.onMinYearChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxYearValue} onChange={(e) => props.onMaxYearChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        {showTruckFilters && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacidad (Toneladas/Yardas/Metros)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={props.minCapacityValue} onChange={(e) => props.onMinCapacityChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              <input type="number" placeholder="Max" value={props.maxCapacityValue} onChange={(e) => props.onMaxCapacityChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio (USD)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minPriceValue} onChange={(e) => props.onMinPriceChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxPriceValue} onChange={(e) => props.onMaxPriceChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horas de Máquina</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minHoursValue} onChange={(e) => props.onMinHoursChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxHoursValue} onChange={(e) => props.onMaxHoursChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        {showTruckFilters && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Millas</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={props.minMilesValue} onChange={(e) => props.onMinMilesChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              <input type="number" placeholder="Max" value={props.maxMilesValue} onChange={(e) => props.onMaxMilesChange(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          </div>
        )}

        {showTruckFilters && (
          <>
            <hr className="border-slate-100" />
            {renderMultiSelectTrigger("Motor", "MOTOR", props.selectedEngines, (val) => props.onSelectedEnginesChange(props.selectedEngines.filter((e: string) => e !== val)))}

            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transmisión</label>
              <select value={props.transmissionValue} onChange={(e) => props.onTransmissionChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                <option value="ALL">Cualquiera</option>
                <option value="ESTANDAR">Estándar / Manual</option>
                <option value="AUTOMATICA">Automática / Allison</option>
              </select>
            </div>
          </>
        )}

        {isBomba && (
          <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in mt-4">
            <label className="text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                Configuración de Pluma
            </label>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-blue-700 uppercase">Tipo de Doblez</label>
              <select value={props.boomTypeValue} onChange={e => props.onBoomTypeValueChange(e.target.value)} className="w-full bg-white border border-blue-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-700">
                <option value="ALL">Cualquiera</option>
                <option value="Z">Z</option>
                <option value="R/F">R&F</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-blue-700 uppercase">Marca de Pluma</label>
              <input type="text" placeholder="Ej. Putzmeister, Schwing..." value={props.boomBrandValue} onChange={(e) => props.onBoomBrandChange(e.target.value)} className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        )}

        {isRetro && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                Especificaciones Adicionales
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tracción</label>
                <select value={props.req4x4} onChange={e => props.onReq4x4Change(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                  <option value="ALL">Cualquiera</option><option value="4WD">4x4</option><option value="2WD">4x2</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cabina</label>
                <select value={props.reqCabin} onChange={e => props.onReqCabinChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                  <option value="ALL">Cualquiera</option><option value="CERRADA">Cerrada</option><option value="ABIERTA">Abierta</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Brazo Excavador</label>
                <select value={props.reqExtension} onChange={e => props.onReqExtensionChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                  <option value="ALL">Cualquier</option><option value="YES">Extensión</option><option value="NO">Estándar</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Kit de Martillo</label>
                <select value={props.reqHammer} onChange={e => props.onReqHammerChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                  <option value="ALL">Cualquiera</option><option value="YES">Con Kit</option><option value="NO">Sin Kit</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Cucharón Frontal</label>
                <select value={props.reqClam} onChange={e => props.onReqClamChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-orange-500 outline-none text-slate-700">
                  <option value="ALL">Cualquiera</option><option value="YES">Bote Almeja (4-en-1)</option><option value="NO">Normal</option>
                </select>
              </div>
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
              <label className="text-[10px] font-bold text-orange-700 uppercase">Marca de Pluma (Grúa)</label>
              <input type="text" placeholder="Ej. National, Terex..." value={props.boomBrandValue} onChange={(e) => props.onBoomBrandChange(e.target.value)} className="w-full border border-orange-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        )}

        {/* MÓDULO EXCLUSIVO PARA ROUGH & ALL TERRAIN (SOLO PLUMA) */}
        {normalizedCategory === 'rough_terrain' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
             <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                Especificaciones de Grúa Terreno
             </label>
             <div className="space-y-1 pt-2">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Largo de Pluma (Pies / FT)</label>
               <div className="flex gap-2">
                 <input type="number" placeholder="Min FT" value={props.minAlcanceValue} onChange={(e) => props.onMinAlcanceChange(e.target.value)} className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 outline-none" />
                 <input type="number" placeholder="Max FT" value={props.maxAlcanceValue} onChange={(e) => props.onMaxAlcanceChange(e.target.value)} className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 outline-none" />
               </div>
             </div>
          </div>
        )}

        {/* MÓDULO EXCLUSIVO PARA PIPAS Y VOLTEOS */}
        {(normalizedCategory === 'Camiones Pipa' || normalizedCategory === 'Camiones Volteo') && (
          <div className="space-y-3 bg-cyan-50 p-4 rounded-xl border border-cyan-100 animate-fade-in mt-4">
             <label className="text-[11px] font-black text-cyan-800 uppercase tracking-wider flex items-center gap-2">
                Especificaciones de Chasis
             </label>
             {renderMultiSelectTrigger("Tracción", "TRACCION", props.selectedTracciones, (val) => props.onSelectedTraccionesChange(props.selectedTracciones.filter((t: string) => t !== val)))}
             {renderMultiSelectTrigger("Ejes Traseros", "EJES", props.selectedEjes, (val) => props.onSelectedEjesChange(props.selectedEjes.filter((e: string) => e !== val)))}
          </div>
        )}

        {/* MÓDULO EXCLUSIVO PARA MOTONIVELADORAS */}
        {normalizedCategory === 'Motoconformadoras' && (
          <>
            <hr className="border-slate-100" />
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ripper / Escarificador</label>
              <select value={props.reqRipper} onChange={e => props.onReqRipperChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-700">
                <option value="ALL">Cualquiera</option>
                <option value="YES">Con Ripper</option>
                <option value="NO">Sin Ripper</option>
              </select>
            </div>
          </>
        )}

        {/* MÓDULO EXCLUSIVO PARA ELEVADORES */}
        {normalizedCategory === 'Elevadores' && (
          <div className="space-y-3 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fade-in mt-4">
             <label className="text-[11px] font-black text-purple-800 uppercase tracking-wider flex items-center gap-2">
                Especificaciones de Elevación
             </label>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Equipo</label>
                 <select value={props.reqSubtipoElevador} onChange={e => props.onReqSubtipoElevadorChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-700">
                   <option value="ALL">Todos</option>
                   <option value="ARTICULADO">Articulado (Boom)</option>
                   <option value="TELESCOPICO">Telescópico (Straight)</option>
                   <option value="TIJERA">Tijera (Scissor)</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Combustible</label>
                 <select value={props.reqCombustible} onChange={e => props.onReqCombustibleChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none text-slate-700">
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
                 <input type="number" placeholder="Min FT" value={props.minAlcanceValue} onChange={(e) => props.onMinAlcanceChange(e.target.value)} className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none" />
                 <input type="number" placeholder="Max FT" value={props.maxAlcanceValue} onChange={(e) => props.onMaxAlcanceChange(e.target.value)} className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-purple-500 outline-none" />
               </div>
             </div>
          </div>
        )}

      </aside>

      {/* RENDERIZADO DE MODALES GLOBALES */}
      <MultiSelectModal 
          isOpen={activeModal === 'PAIS'} onClose={() => setActiveModal(null)} 
          title="Seleccionar Países" options={props.availableCountries} selected={props.selectedCountries} onApply={props.onSelectedCountriesChange} 
      />
      <MultiSelectModal 
          isOpen={activeModal === 'ESTADO'} onClose={() => setActiveModal(null)} 
          title="Seleccionar Estados" options={availableStates} selected={props.selectedStates} onApply={props.onSelectedStatesChange} 
      />
      <MultiSelectModal 
          isOpen={activeModal === 'MARCA'} onClose={() => setActiveModal(null)} 
          title="Seleccionar Marcas" options={props.availableBrands} selected={props.selectedBrands} onApply={props.onSelectedBrandsChange} 
      />
      <MultiSelectModal 
          isOpen={activeModal === 'MODELO'} onClose={() => setActiveModal(null)} 
          title="Seleccionar Modelos" options={props.availableModels} selected={props.selectedModels} onApply={props.onSelectedModelsChange} 
      />
      <MultiSelectModal 
          isOpen={activeModal === 'MOTOR'} onClose={() => setActiveModal(null)} 
          title="Seleccionar Motores" options={props.availableEngines} selected={props.selectedEngines} onApply={props.onSelectedEnginesChange} 
      />
      <MultiSelectModal 
          isOpen={activeModal === 'TRACCION'} onClose={() => setActiveModal(null)} 
          title="Seleccionar Tracción" options={props.availableTracciones} selected={props.selectedTracciones} onApply={props.onSelectedTraccionesChange} 
      />
      <MultiSelectModal 
          isOpen={activeModal === 'EJES'} onClose={() => setActiveModal(null)} 
          title="Seleccionar Ejes Traseros" options={props.availableEjes} selected={props.selectedEjes} onApply={props.onSelectedEjesChange} 
      />
    </>
  );
}