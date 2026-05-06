import { useState, useMemo } from 'react';
import type { Machine, SortOption } from '@/types';
import { CAT, TRUCK_CATEGORIES, CHASSIS_FILTER_CATEGORIES, normalizeCategory } from '@/constants/machineCategories';
import { AVAILABLE_COUNTRIES } from '@/constants/locations';
import { TRACCIONES, EJES_TRASEROS } from '@/constants/vehicleSpecs';

const getMachineBrand = (m: Machine): string => {
  if (m.marca_camion) return m.marca_camion.toUpperCase();
  if (m.marca_pluma) return m.marca_pluma.toUpperCase();
  const t = m.titulo.toUpperCase();
  if (t.includes('CAT ') || t.includes('CATERPILLAR')) return 'CATERPILLAR';
  if (t.includes('CASE')) return 'CASE';
  if (t.includes('DEERE')) return 'JOHN DEERE';
  if (t.includes('JCB')) return 'JCB';
  if (t.includes('KOMATSU')) return 'KOMATSU';
  if (t.includes('PUTZMEISTER')) return 'PUTZMEISTER';
  if (t.includes('SCHWING')) return 'SCHWING';
  if (t.includes('ALLIANCE')) return 'ALLIANCE';
  if (t.includes('CONCORD')) return 'CONCORD';
  if (t.includes('FREIGHTLINER')) return 'FREIGHTLINER';
  if (t.includes('INTERNATIONAL')) return 'INTERNATIONAL';
  if (t.includes('KENWORTH')) return 'KENWORTH';
  if (t.includes('MACK')) return 'MACK';
  if (t.includes('PETERBILT')) return 'PETERBILT';
  if (t.includes('VOLVO')) return 'VOLVO';
  return 'OTRA';
};

const getMachineModel = (m: Machine): string | null => {
  if ((m as any).modelo) return (m as any).modelo.toUpperCase();
  const regex = /\b([A-Z]*\d+[A-Z\d]*)\b/gi;
  let match;
  while ((match = regex.exec(m.titulo)) !== null) {
    const str = match[1].toUpperCase();
    const num = parseInt(str);
    if (!isNaN(num) && num >= 1980 && num <= 2030 && str.length === 4) continue;
    return str;
  }
  return null;
};

export const useMachineFilters = (machines: Machine[]) => {
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('ALL');
  const [sortValue, setSortValue] = useState<SortOption>('recent');

  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedEngines, setSelectedEngines] = useState<string[]>([]);

  const [minYearValue, setMinYearValue] = useState('');
  const [maxYearValue, setMaxYearValue] = useState('');
  const [minCapacityValue, setMinCapacityValue] = useState('');
  const [maxCapacityValue, setMaxCapacityValue] = useState('');
  const [minPriceValue, setMinPriceValue] = useState('');
  const [maxPriceValue, setMaxPriceValue] = useState('');
  const [minHoursValue, setMinHoursValue] = useState('');
  const [maxHoursValue, setMaxHoursValue] = useState('');
  const [minMilesValue, setMinMilesValue] = useState('');
  const [maxMilesValue, setMaxMilesValue] = useState('');
  const [transmissionValue, setTransmissionValue] = useState('ALL');

  const [boomBrandValue, setBoomBrandValue] = useState('');
  const [craneMountStatus, setCraneMountStatus] = useState('ALL');
  const [boomTypeValue, setBoomTypeValue] = useState('ALL');
  const [reqCabin, setReqCabin] = useState('ALL');
  const [reqHammer, setReqHammer] = useState('ALL');
  const [reqExtension, setReqExtension] = useState('ALL');
  const [req4x4, setReq4x4] = useState('ALL');
  const [reqClam, setReqClam] = useState('ALL');
  const [reqRipper, setReqRipper] = useState('ALL');

  const [selectedTracciones, setSelectedTracciones] = useState<string[]>([]);
  const [selectedEjes, setSelectedEjes] = useState<string[]>([]);

  const [reqSubtipoElevador, setReqSubtipoElevador] = useState('ALL');
  const [reqCombustible, setReqCombustible] = useState('ALL');
  const [minAlcanceValue, setMinAlcanceValue] = useState('');
  const [maxAlcanceValue, setMaxAlcanceValue] = useState('');

  const availableTracciones = useMemo(() => [...TRACCIONES], []);
  const availableEjes = useMemo(() => [...EJES_TRASEROS], []);
  const availableCountries = useMemo(() => [...AVAILABLE_COUNTRIES], []);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    machines.forEach(m => {
      if (categoryValue !== CAT.ALL && m.categoria_tarea !== categoryValue && m.categoria_tarea !== CAT.ROUGH_TERRAIN_DB) return;
      const brand = getMachineBrand(m);
      if (brand !== 'OTRA') brands.add(brand);
    });
    return Array.from(brands).sort();
  }, [machines, categoryValue]);

  const availableModels = useMemo(() => {
    const models = new Set<string>();
    machines.forEach(m => {
      if (categoryValue !== CAT.ALL && m.categoria_tarea !== categoryValue && m.categoria_tarea !== CAT.ROUGH_TERRAIN_DB) return;
      const mBrand = getMachineBrand(m);
      if (selectedBrands.length > 0 && !selectedBrands.includes(mBrand)) return;
      const model = getMachineModel(m);
      if (model) models.add(model);
    });
    return Array.from(models).sort();
  }, [machines, categoryValue, selectedBrands]);

  const availableEngines = useMemo(() => {
    const engines = new Set<string>();
    machines.forEach(m => {
      if (categoryValue !== CAT.ALL && m.categoria_tarea !== categoryValue && m.categoria_tarea !== CAT.ROUGH_TERRAIN_DB) return;
      if (m.motor) engines.add(m.motor.toUpperCase());
    });
    return Array.from(engines).sort();
  }, [machines, categoryValue]);

  const resetAllFilters = () => {
    setSearchValue(''); setCategoryValue(CAT.ALL); setSortValue('recent');
    setSelectedCountries([]); setSelectedStates([]); setSelectedBrands([]); setSelectedModels([]); setSelectedEngines([]);
    setMinYearValue(''); setMaxYearValue(''); setMinCapacityValue(''); setMaxCapacityValue('');
    setMinPriceValue(''); setMaxPriceValue(''); setMinHoursValue(''); setMaxHoursValue('');
    setMinMilesValue(''); setMaxMilesValue(''); setTransmissionValue('ALL');
    setBoomBrandValue(''); setCraneMountStatus('ALL'); setBoomTypeValue('ALL');
    setReqCabin('ALL'); setReqHammer('ALL'); setReqExtension('ALL'); setReq4x4('ALL'); setReqClam('ALL');
    setReqRipper('ALL'); setSelectedTracciones([]); setSelectedEjes([]);
    setReqSubtipoElevador('ALL'); setReqCombustible('ALL'); setMinAlcanceValue(''); setMaxAlcanceValue('');
  };

  const filteredMachines = useMemo(() => {
    const term = searchValue.toLowerCase().trim();
    const minP = minPriceValue ? parseFloat(minPriceValue) : 0;
    const maxP = maxPriceValue ? parseFloat(maxPriceValue) : Infinity;
    const minY = minYearValue ? parseInt(minYearValue) : 0;
    const maxY = maxYearValue ? parseInt(maxYearValue) : 9999;
    const minHrs = minHoursValue ? parseInt(minHoursValue) : 0;
    const maxHrs = maxHoursValue ? parseInt(maxHoursValue) : Infinity;
    const minMls = minMilesValue ? parseInt(minMilesValue) : 0;
    const maxMls = maxMilesValue ? parseInt(maxMilesValue) : Infinity;
    const minCap = minCapacityValue ? parseFloat(minCapacityValue) : 0;
    const maxCap = maxCapacityValue ? parseFloat(maxCapacityValue) : Infinity;

    return machines.filter(m => {
      if (term) {
        const generalText = `${m.titulo} ${m.origen_tarea} ${m.marca_pluma || ''} ${m.marca_camion || ''}`.toLowerCase();
        if (!generalText.includes(term)) return false;
      }

      const normalizedCategory = normalizeCategory(categoryValue);

      if (normalizedCategory !== CAT.ALL && m.categoria_tarea !== normalizedCategory) return false;

      const loc = (m.ubicacion || '').toLowerCase();

      if (selectedCountries.length > 0) {
        const isCanada = /\b(ab|bc|mb|nb|nl|ns|on|pe|qc|sk)\b|canada/i.test(loc);
        const isMexico = /mexico|méxico|mx/i.test(loc);
        const isUSA = !isCanada && !isMexico;
        let matchesCountry = false;
        if (selectedCountries.includes('USA') && isUSA) matchesCountry = true;
        if (selectedCountries.includes('Canadá') && isCanada) matchesCountry = true;
        if (selectedCountries.includes('México') && isMexico) matchesCountry = true;
        if (!matchesCountry) return false;
      }

      if (selectedStates.length > 0) {
        const matchesAnyState = selectedStates.some(st => {
          const parts = st.split(' - ');
          const abbr = parts[0].toLowerCase();
          const fullName = parts[1] ? parts[1].toLowerCase() : '';
          return new RegExp(`\\b${abbr}\\b`, 'i').test(loc) || (fullName && loc.includes(fullName));
        });
        if (!matchesAnyState) return false;
      }

      if (selectedBrands.length > 0) {
        const mBrand = getMachineBrand(m);
        if (!selectedBrands.includes(mBrand)) return false;
      }
      if (selectedModels.length > 0) {
        const mModel = getMachineModel(m);
        const matchesModel = selectedModels.some(modelOpt => (mModel && mModel === modelOpt) || m.titulo.toUpperCase().includes(modelOpt));
        if (!matchesModel) return false;
      }
      if (m.año > 0 && (m.año < minY || m.año > maxY)) return false;

      if (minCapacityValue || maxCapacityValue) {
        let valCap = 0;
        const matchCap = (m.capacidad || '').match(/([\d\.]+)/);
        if (matchCap) valCap = parseFloat(matchCap[1]);
        if (valCap === 0 && m.categoria_tarea === CAT.BOMBAS) {
          const matchM = m.titulo.match(/(\d{2})(?:z|m|x|\-|\s)/i);
          if (matchM) valCap = parseFloat(matchM[1]);
        }
        if (valCap === 0 && m.categoria_tarea === CAT.CAMIONES_TROMPO) {
          const matchYd = (m.titulo + ' ' + (m.capacidad || '')).match(/(\d+(?:\.\d+)?)\s*(yd|yard|yarda|yd3)/i);
          if (matchYd) valCap = parseFloat(matchYd[1]);
        }
        if (valCap < minCap || valCap > maxCap) return false;
      }
      if (m.precio > 0 && (m.precio < minP || m.precio > maxP)) return false;

      let machineHours = 0;
      let machineMiles = 0;
      const mDynamic = m as any;

      if (m.categoria_tarea === CAT.BOMBAS) {
        machineHours = m.uso_bomba || 0;
        machineMiles = m.uso_motor || 0;
      } else if (TRUCK_CATEGORIES.includes(m.categoria_tarea)) {
        machineHours = mDynamic.uso_horas || m.uso || 0;
        machineMiles = mDynamic.uso_millas || m.uso_motor || 0;
      } else {
        machineHours = mDynamic.uso_horas || m.uso || 0;
      }

      if (maxHoursValue || minHoursValue) {
        if (machineHours < minHrs || machineHours > maxHrs) return false;
      }
      if (maxMilesValue || minMilesValue) {
        if (machineMiles < minMls || machineMiles > maxMls) return false;
      }

      if (selectedEngines.length > 0) {
        const mMotor = (m.motor || '').toUpperCase();
        if (!selectedEngines.includes(mMotor)) return false;
      }

      if (transmissionValue !== 'ALL') {
        const mTrans = (m.transmision || '').toLowerCase();
        if (transmissionValue === 'ESTANDAR' && !mTrans.includes('manual')) return false;
        if (transmissionValue === 'AUTOMATICA' && !mTrans.includes('auto')) return false;
      }

      if (CHASSIS_FILTER_CATEGORIES.includes(m.categoria_tarea)) {
        if (selectedTracciones.length > 0) {
          const mTracc = (mDynamic.traccion_camion || '').toUpperCase();
          if (!selectedTracciones.some(tOpt => mTracc.includes(tOpt))) return false;
        }
        if (selectedEjes.length > 0) {
          const mEjes = (mDynamic.ejes_traseros || '').toUpperCase();
          if (!selectedEjes.some(eOpt => mEjes.includes(eOpt))) return false;
        }
      }

      if (m.categoria_tarea === CAT.MOTOCONFORMADORAS) {
        if (reqRipper === 'YES' && !mDynamic.tiene_ripper) return false;
        if (reqRipper === 'NO' && mDynamic.tiene_ripper) return false;
      }

      if (m.categoria_tarea === CAT.ELEVADORES) {
        if (reqSubtipoElevador !== 'ALL') {
          const subtipoBD = (mDynamic.subtipo_elevador || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
          const reqSubtipo = reqSubtipoElevador.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
          if (subtipoBD !== reqSubtipo) return false;
        }
        if (reqCombustible !== 'ALL') {
          const combBD = (mDynamic.combustible || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
          const reqComb = reqCombustible.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
          if (combBD !== reqComb) return false;
        }
        if (minAlcanceValue || maxAlcanceValue) {
          const alcance = mDynamic.alcance || 0;
          const minA = minAlcanceValue ? parseInt(minAlcanceValue) : 0;
          const maxA = maxAlcanceValue ? parseInt(maxAlcanceValue) : Infinity;
          if (alcance < minA || alcance > maxA) return false;
        }
      }

      if (normalizeCategory(categoryValue) === CAT.ROUGH_TERRAIN_DB) {
        if (categoryValue === CAT.ROUGH_TERRAIN) {
          const subtipoBD = (mDynamic.subtipo_grua_terreno || m.origen_tarea || '').toUpperCase();
          if (!subtipoBD.includes('ROUGH TERRAIN')) return false;
        } else if (categoryValue === CAT.ALL_TERRAIN) {
          const subtipoBD = (mDynamic.subtipo_grua_terreno || m.origen_tarea || '').toUpperCase();
          if (!subtipoBD.includes('ALL TERRAIN')) return false;
        }

        if (minAlcanceValue || maxAlcanceValue) {
          const alcance = mDynamic.alcance || 0;
          const minA = minAlcanceValue ? parseInt(minAlcanceValue) : 0;
          const maxA = maxAlcanceValue ? parseInt(maxAlcanceValue) : Infinity;
          if (alcance < minA || alcance > maxA) return false;
        }
      }

      if (m.categoria_tarea === CAT.BOMBAS && boomTypeValue !== 'ALL') {
        const t = (m.titulo + ' ' + (m.tipo_pluma || '')).toLowerCase();
        if (boomTypeValue === 'Z') {
          if (!/\bz\b/i.test(t) && !/z-boom/i.test(t) && !/z boom/i.test(t) && !/z fold/i.test(t)) return false;
        } else if (boomTypeValue === 'R/F') {
          if (!/r\/f/i.test(t) && !/roll/i.test(t) && !/fold/i.test(t)) return false;
        }
      }

      if (boomBrandValue) {
        const mBoom = (m.marca_pluma || '').toLowerCase();
        if (!mBoom.includes(boomBrandValue.toLowerCase()) && !m.titulo.toLowerCase().includes(boomBrandValue.toLowerCase())) return false;
      }

      if (m.categoria_tarea === CAT.GRUAS_ARTICULADAS || m.categoria_tarea === CAT.GRUAS_TITANES) {
        const isMounted = !!m.marca_camion || /(freightliner|peterbilt|kenworth|international|ford|sterling|mack|volvo|truck|camion)/i.test((m.titulo + ' ' + (m.origen_tarea || '')).toLowerCase());
        if (craneMountStatus === 'MONTADA' && !isMounted) return false;
        if (craneMountStatus === 'DESMONTADA' && isMounted) return false;
      }

      if (m.categoria_tarea === CAT.RETROEXCAVADORAS) {
        if (reqCabin === 'CERRADA' && !m.tiene_cabina) return false;
        if (reqCabin === 'ABIERTA' && m.tiene_cabina) return false;
        if (req4x4 === '4WD' && !m.es_4x4) return false;
        if (req4x4 === '2WD' && m.es_4x4) return false;
        if (reqHammer === 'YES' && !m.tiene_martillo) return false;
        if (reqHammer === 'NO' && m.tiene_martillo) return false;
        if (reqExtension === 'YES' && !m.tiene_extension) return false;
        if (reqExtension === 'NO' && m.tiene_extension) return false;
        if (reqClam === 'YES' && !m.tiene_almeja) return false;
        if (reqClam === 'NO' && m.tiene_almeja) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortValue === 'price_asc') return a.precio - b.precio;
      if (sortValue === 'price_desc') return b.precio - a.precio;
      if (sortValue === 'year_desc') return b.año - a.año;
      return 0;
    });
  }, [
    machines, searchValue, categoryValue, selectedCountries, selectedStates,
    selectedBrands, selectedModels, selectedEngines, minPriceValue, maxPriceValue,
    minYearValue, maxYearValue, minHoursValue, maxHoursValue, minMilesValue,
    maxMilesValue, minCapacityValue, maxCapacityValue, transmissionValue, sortValue,
    boomBrandValue, craneMountStatus, boomTypeValue, reqCabin, reqHammer,
    reqExtension, req4x4, reqClam, selectedTracciones, selectedEjes, reqRipper,
    reqSubtipoElevador, reqCombustible, minAlcanceValue, maxAlcanceValue,
  ]);

  return {
    categoryValue, setCategoryValue, resetAllFilters, filteredMachines,
    searchValue, onSearchChange: setSearchValue,
    selectedCountries, onSelectedCountriesChange: setSelectedCountries, availableCountries,
    selectedStates, onSelectedStatesChange: setSelectedStates,
    selectedBrands, onSelectedBrandsChange: setSelectedBrands, availableBrands,
    selectedModels, onSelectedModelsChange: setSelectedModels, availableModels,
    selectedEngines, onSelectedEnginesChange: setSelectedEngines, availableEngines,
    minPriceValue, onMinPriceChange: setMinPriceValue,
    maxPriceValue, onMaxPriceChange: setMaxPriceValue,
    minYearValue, onMinYearChange: setMinYearValue,
    maxYearValue, onMaxYearChange: setMaxYearValue,
    minCapacityValue, onMinCapacityChange: setMinCapacityValue,
    maxCapacityValue, onMaxCapacityChange: setMaxCapacityValue,
    minHoursValue, onMinHoursChange: setMinHoursValue,
    maxHoursValue, onMaxHoursChange: setMaxHoursValue,
    minMilesValue, onMinMilesChange: setMinMilesValue,
    maxMilesValue, onMaxMilesChange: setMaxMilesValue,
    transmissionValue, onTransmissionChange: setTransmissionValue,
    sortValue, onSortChange: setSortValue,

    boomBrandValue, onBoomBrandChange: setBoomBrandValue,
    craneMountStatus, onCraneMountStatusChange: setCraneMountStatus,
    boomTypeValue, onBoomTypeValueChange: setBoomTypeValue,
    reqCabin, onReqCabinChange: setReqCabin, reqHammer, onReqHammerChange: setReqHammer,
    reqExtension, onReqExtensionChange: setReqExtension, req4x4, onReq4x4Change: setReq4x4,
    reqClam, onReqClamChange: setReqClam,

    selectedTracciones, onSelectedTraccionesChange: setSelectedTracciones, availableTracciones,
    selectedEjes, onSelectedEjesChange: setSelectedEjes, availableEjes,
    reqRipper, onReqRipperChange: setReqRipper,

    reqSubtipoElevador, onReqSubtipoElevadorChange: setReqSubtipoElevador,
    reqCombustible, onReqCombustibleChange: setReqCombustible,
    minAlcanceValue, onMinAlcanceChange: setMinAlcanceValue,
    maxAlcanceValue, onMaxAlcanceChange: setMaxAlcanceValue,
  };
};
