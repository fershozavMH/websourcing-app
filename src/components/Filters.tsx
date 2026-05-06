import { useState, useMemo } from 'react';
import type { SortOption } from '@/types';
import { CAT, CRANE_CATEGORIES, CHASSIS_FILTER_CATEGORIES, normalizeCategory } from '@/constants/machineCategories';
import { USA_STATES, CAN_PROVINCES } from '@/constants/locations';
import { MultiSelectModal } from './filters/MultiSelectModal';
import { MultiSelectTrigger } from './filters/MultiSelectTrigger';
import { BombaFilters } from './filters/BombaFilters';
import { RetroFilters } from './filters/RetroFilters';
import { GruaFilters } from './filters/GruaFilters';
import { ElevadorFilters } from './filters/ElevadorFilters';

type ModalId = 'PAIS' | 'ESTADO' | 'MARCA' | 'MODELO' | 'MOTOR' | 'TRACCION' | 'EJES' | null;

export default function Filters(props: any) {
  const [activeModal, setActiveModal] = useState<ModalId>(null);
  const openModal = (id: NonNullable<ModalId>) => () => setActiveModal(id);
  const closeModal = () => setActiveModal(null);

  const normalizedCategory = normalizeCategory(props.categoryValue);
  const isBomba = normalizedCategory === CAT.BOMBAS;
  const isRetro = normalizedCategory === CAT.RETROEXCAVADORAS;
  const isGrua = CRANE_CATEGORIES.includes(normalizedCategory);
  const isArticulada = normalizedCategory === CAT.GRUAS_ARTICULADAS;
  const isPureTruck = ([CAT.CAMIONES_VOLTEO, CAT.CAMIONES_TROMPO, CAT.CAMIONES_PIPA, CAT.TRACTOCAMIONES] as string[]).includes(normalizedCategory);
  const showTruckFilters = props.categoryValue === CAT.ALL || isPureTruck || isGrua || isBomba;

  const availableStates = useMemo(() => {
    let states: string[] = [];
    if (props.selectedCountries.length === 0 || props.selectedCountries.includes('USA')) states = [...states, ...USA_STATES];
    if (props.selectedCountries.length === 0 || props.selectedCountries.includes('Canadá')) states = [...states, ...CAN_PROVINCES];
    return states;
  }, [props.selectedCountries]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (props.searchValue) count++;
    if (props.selectedCountries?.length > 0) count++;
    if (props.selectedStates?.length > 0) count++;
    if (props.selectedBrands?.length > 0) count++;
    if (props.selectedModels?.length > 0) count++;
    if (props.selectedEngines?.length > 0) count++;
    if (props.selectedTracciones?.length > 0) count++;
    if (props.selectedEjes?.length > 0) count++;
    if (props.minYearValue || props.maxYearValue) count++;
    if (props.minPriceValue || props.maxPriceValue) count++;
    if (props.minHoursValue || props.maxHoursValue) count++;
    if (props.minMilesValue || props.maxMilesValue) count++;
    if (props.minCapacityValue || props.maxCapacityValue) count++;
    if (props.minAlcanceValue || props.maxAlcanceValue) count++;
    if (props.boomTypeValue && props.boomTypeValue !== 'ALL') count++;
    if (props.boomBrandValue) count++;
    if (props.req4x4 && props.req4x4 !== 'ALL') count++;
    if (props.reqCabin && props.reqCabin !== 'ALL') count++;
    if (props.reqExtension && props.reqExtension !== 'ALL') count++;
    if (props.reqHammer && props.reqHammer !== 'ALL') count++;
    if (props.reqClam && props.reqClam !== 'ALL') count++;
    if (props.craneMountStatus && props.craneMountStatus !== 'ALL') count++;
    if (props.reqRipper && props.reqRipper !== 'ALL') count++;
    if (props.reqSubtipoElevador && props.reqSubtipoElevador !== 'ALL') count++;
    if (props.reqCombustible && props.reqCombustible !== 'ALL') count++;
    if (props.transmissionValue && props.transmissionValue !== 'ALL') count++;
    return count;
  }, [props]);

  return (
    <>
      <aside className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center leading-none">{activeFiltersCount}</span>
            )}
          </h3>
          <div className="flex items-center gap-3">
            <button onClick={props.onClearAll} className="text-[10px] font-bold text-slate-400 hover:text-orange-600 uppercase tracking-wider transition-colors underline decoration-dotted underline-offset-2">Limpiar Todo</button>
            <button onClick={props.onRefresh} disabled={props.isRefreshing} aria-label="Actualizar resultados" className="text-slate-400 hover:text-orange-500 transition-colors">
              <svg className={`w-5 h-5 ${props.isRefreshing ? 'animate-spin text-orange-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* Búsqueda, categoría y orden */}
        <div className="space-y-2">
          <label htmlFor="filter-keyword" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Palabra Clave</label>
          <input id="filter-keyword" type="text" placeholder="Ingresar texto..." value={props.searchValue} onChange={(e) => props.onSearchChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
        </div>

        <div className="space-y-2">
          <label htmlFor="filter-category" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
          <select id="filter-category" value={props.categoryValue} onChange={(e) => props.onCategoryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-medium">
            <option value="ALL">Todas las máquinas</option>
            {props.categories?.filter((cat: string) => cat !== CAT.ROUGH_TERRAIN_DB).map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="filter-sort" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ordenar Por</label>
          <select id="filter-sort" value={props.sortValue} onChange={(e) => props.onSortChange(e.target.value as SortOption)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
            <option value="recent">Más Recientes</option>
            <option value="price_asc">Precio: Menor a Mayor</option>
            <option value="price_desc">Precio: Mayor a Menor</option>
            <option value="year_desc">Año: Más Nuevos</option>
          </select>
        </div>

        <hr className="border-slate-100" />

        {/* Filtros de ubicación y catálogo */}
        <MultiSelectTrigger title="País de Ubicación" selected={props.selectedCountries} onOpen={openModal('PAIS')} onRemove={(val) => props.onSelectedCountriesChange(props.selectedCountries.filter((c: string) => c !== val))} />
        <MultiSelectTrigger title="Estados / Región" selected={props.selectedStates} onOpen={openModal('ESTADO')} onRemove={(val) => props.onSelectedStatesChange(props.selectedStates.filter((s: string) => s !== val))} />
        <MultiSelectTrigger title="Marca" selected={props.selectedBrands} onOpen={openModal('MARCA')} onRemove={(val) => props.onSelectedBrandsChange(props.selectedBrands.filter((b: string) => b !== val))} />
        <MultiSelectTrigger title="Modelo" selected={props.selectedModels} onOpen={openModal('MODELO')} onRemove={(val) => props.onSelectedModelsChange(props.selectedModels.filter((m: string) => m !== val))} />

        <hr className="border-slate-100" />

        {/* Rangos numéricos */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Año</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minYearValue} onChange={(e) => props.onMinYearChange(e.target.value)} aria-label="Año mínimo" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxYearValue} onChange={(e) => props.onMaxYearChange(e.target.value)} aria-label="Año máximo" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        {showTruckFilters && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capacidad (Toneladas/Yardas/Metros)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={props.minCapacityValue} onChange={(e) => props.onMinCapacityChange(e.target.value)} aria-label="Capacidad mínima" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              <input type="number" placeholder="Max" value={props.maxCapacityValue} onChange={(e) => props.onMaxCapacityChange(e.target.value)} aria-label="Capacidad máxima" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio (USD)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minPriceValue} onChange={(e) => props.onMinPriceChange(e.target.value)} aria-label="Precio mínimo" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxPriceValue} onChange={(e) => props.onMaxPriceChange(e.target.value)} aria-label="Precio máximo" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horas de Máquina</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={props.minHoursValue} onChange={(e) => props.onMinHoursChange(e.target.value)} aria-label="Horas mínimas" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            <input type="number" placeholder="Max" value={props.maxHoursValue} onChange={(e) => props.onMaxHoursChange(e.target.value)} aria-label="Horas máximas" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
          </div>
        </div>

        {showTruckFilters && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Millas</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={props.minMilesValue} onChange={(e) => props.onMinMilesChange(e.target.value)} aria-label="Millas mínimas" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              <input type="number" placeholder="Max" value={props.maxMilesValue} onChange={(e) => props.onMaxMilesChange(e.target.value)} aria-label="Millas máximas" className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
          </div>
        )}

        {showTruckFilters && (
          <>
            <hr className="border-slate-100" />
            <MultiSelectTrigger title="Motor" selected={props.selectedEngines} onOpen={openModal('MOTOR')} onRemove={(val) => props.onSelectedEnginesChange(props.selectedEngines.filter((e: string) => e !== val))} />
            <div className="space-y-2 animate-fade-in">
              <label htmlFor="filter-transmission" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transmisión</label>
              <select id="filter-transmission" value={props.transmissionValue} onChange={(e) => props.onTransmissionChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                <option value="ALL">Cualquiera</option>
                <option value="ESTANDAR">Estándar / Manual</option>
                <option value="AUTOMATICA">Automática / Allison</option>
              </select>
            </div>
          </>
        )}

        {/* Paneles específicos por categoría */}
        {isBomba && <BombaFilters boomTypeValue={props.boomTypeValue} onBoomTypeValueChange={props.onBoomTypeValueChange} boomBrandValue={props.boomBrandValue} onBoomBrandChange={props.onBoomBrandChange} />}

        {isRetro && <RetroFilters req4x4={props.req4x4} onReq4x4Change={props.onReq4x4Change} reqCabin={props.reqCabin} onReqCabinChange={props.onReqCabinChange} reqExtension={props.reqExtension} onReqExtensionChange={props.onReqExtensionChange} reqHammer={props.reqHammer} onReqHammerChange={props.onReqHammerChange} reqClam={props.reqClam} onReqClamChange={props.onReqClamChange} />}

        {isGrua && <GruaFilters isArticulada={isArticulada} craneMountStatus={props.craneMountStatus} onCraneMountStatusChange={props.onCraneMountStatusChange} boomBrandValue={props.boomBrandValue} onBoomBrandChange={props.onBoomBrandChange} />}

        {normalizedCategory === CAT.ROUGH_TERRAIN_DB && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in mt-4">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Especificaciones de Grúa Terreno</label>
            <div className="space-y-1 pt-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Largo de Pluma (Pies / FT)</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min FT" value={props.minAlcanceValue} onChange={(e) => props.onMinAlcanceChange(e.target.value)} aria-label="Alcance mínimo en pies" className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 outline-none" />
                <input type="number" placeholder="Max FT" value={props.maxAlcanceValue} onChange={(e) => props.onMaxAlcanceChange(e.target.value)} aria-label="Alcance máximo en pies" className="w-1/2 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 outline-none" />
              </div>
            </div>
          </div>
        )}

        {CHASSIS_FILTER_CATEGORIES.includes(normalizedCategory) && (
          <div className="space-y-3 bg-cyan-50 p-4 rounded-xl border border-cyan-100 animate-fade-in mt-4">
            <label className="text-[11px] font-black text-cyan-800 uppercase tracking-wider">Especificaciones de Chasis</label>
            <MultiSelectTrigger title="Tracción" selected={props.selectedTracciones} onOpen={openModal('TRACCION')} onRemove={(val) => props.onSelectedTraccionesChange(props.selectedTracciones.filter((t: string) => t !== val))} />
            <MultiSelectTrigger title="Ejes Traseros" selected={props.selectedEjes} onOpen={openModal('EJES')} onRemove={(val) => props.onSelectedEjesChange(props.selectedEjes.filter((e: string) => e !== val))} />
          </div>
        )}

        {normalizedCategory === CAT.MOTOCONFORMADORAS && (
          <>
            <hr className="border-slate-100" />
            <div className="space-y-2 animate-fade-in">
              <label htmlFor="filter-ripper" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ripper / Escarificador</label>
              <select id="filter-ripper" value={props.reqRipper} onChange={e => props.onReqRipperChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-700">
                <option value="ALL">Cualquiera</option>
                <option value="YES">Con Ripper</option>
                <option value="NO">Sin Ripper</option>
              </select>
            </div>
          </>
        )}

        {normalizedCategory === CAT.ELEVADORES && (
          <ElevadorFilters reqSubtipoElevador={props.reqSubtipoElevador} onReqSubtipoElevadorChange={props.onReqSubtipoElevadorChange} reqCombustible={props.reqCombustible} onReqCombustibleChange={props.onReqCombustibleChange} minAlcanceValue={props.minAlcanceValue} onMinAlcanceChange={props.onMinAlcanceChange} maxAlcanceValue={props.maxAlcanceValue} onMaxAlcanceChange={props.onMaxAlcanceChange} />
        )}

      </aside>

      {/* Modales */}
      <MultiSelectModal isOpen={activeModal === 'PAIS'}    onClose={closeModal} title="Seleccionar Países"        options={props.availableCountries} selected={props.selectedCountries}  onApply={props.onSelectedCountriesChange} />
      <MultiSelectModal isOpen={activeModal === 'ESTADO'}  onClose={closeModal} title="Seleccionar Estados"       options={availableStates}          selected={props.selectedStates}    onApply={props.onSelectedStatesChange} />
      <MultiSelectModal isOpen={activeModal === 'MARCA'}   onClose={closeModal} title="Seleccionar Marcas"        options={props.availableBrands}    selected={props.selectedBrands}    onApply={props.onSelectedBrandsChange} />
      <MultiSelectModal isOpen={activeModal === 'MODELO'}  onClose={closeModal} title="Seleccionar Modelos"       options={props.availableModels}    selected={props.selectedModels}    onApply={props.onSelectedModelsChange} />
      <MultiSelectModal isOpen={activeModal === 'MOTOR'}   onClose={closeModal} title="Seleccionar Motores"       options={props.availableEngines}   selected={props.selectedEngines}   onApply={props.onSelectedEnginesChange} />
      <MultiSelectModal isOpen={activeModal === 'TRACCION'} onClose={closeModal} title="Seleccionar Tracción"     options={props.availableTracciones} selected={props.selectedTracciones} onApply={props.onSelectedTraccionesChange} />
      <MultiSelectModal isOpen={activeModal === 'EJES'}    onClose={closeModal} title="Seleccionar Ejes Traseros" options={props.availableEjes}      selected={props.selectedEjes}      onApply={props.onSelectedEjesChange} />
    </>
  );
}
