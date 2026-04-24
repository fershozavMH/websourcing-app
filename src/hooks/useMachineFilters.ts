import { useState, useMemo } from 'react';
import type { Machine, SortOption } from '@/types';

export const useMachineFilters = (machines: Machine[]) => {
  const [dataSource, setDataSource] = useState<'AGENCIAS' | 'FACEBOOK' | 'ALL'>('AGENCIAS');
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('ALL');
  
  // NUEVO: Ahora es un arreglo para selección múltiple
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  
  const [minPriceValue, setMinPriceValue] = useState('');
  const [maxPriceValue, setMaxPriceValue] = useState('');
  const [showCallForPrice, setShowCallForPrice] = useState(false);
  
  const [minYearValue, setMinYearValue] = useState('');
  const [maxYearValue, setMaxYearValue] = useState('');
  const [hoursMaxValue, setHoursMaxValue] = useState('');
  const [milesMaxValue, setMilesMaxValue] = useState('');
  
  const [engineValue, setEngineValue] = useState('');
  const [transmissionValue, setTransmissionValue] = useState('');
  
  const [countryValue, setCountryValue] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  
  const [minCapacityValue, setMinCapacityValue] = useState('');
  const [maxCapacityValue, setMaxCapacityValue] = useState('');
  const [boomBrandValue, setBoomBrandValue] = useState('');
  const [truckBrandValue, setTruckBrandValue] = useState('');
  
  const [craneMountStatus, setCraneMountStatus] = useState('ALL');
  
  const [reqCabin, setReqCabin] = useState('ALL');
  const [reqHammer, setReqHammer] = useState('ALL');
  const [reqExtension, setReqExtension] = useState('ALL');
  const [req4x4, setReq4x4] = useState('ALL');
  const [reqClam, setReqClam] = useState('ALL');

  const [sortValue, setSortValue] = useState<SortOption>('recent');

  const resetTechnicalFilters = () => {
    setSelectedBrands([]); // <-- Reseteamos el arreglo
    setMinCapacityValue(''); setMaxCapacityValue(''); 
    setBoomBrandValue(''); setTruckBrandValue('');
    setHoursMaxValue(''); setMilesMaxValue('');
    setEngineValue(''); setTransmissionValue('');
    setCountryValue(''); setSelectedStates([]);
    setCraneMountStatus('ALL');
    setReqCabin('ALL'); setReqHammer('ALL'); setReqExtension('ALL');
    setReq4x4('ALL'); setReqClam('ALL');
  };

  const resetAllFilters = () => {
    setSearchValue('');
    setSelectedBrands([]); // <-- Reseteamos en la búsqueda nueva
    setMinPriceValue('');
    setMaxPriceValue('');
    setShowCallForPrice(false);
    setMinYearValue('');
    setMaxYearValue('');
    setHoursMaxValue('');
    setMilesMaxValue('');
    setEngineValue('');
    setTransmissionValue('');
    setCountryValue('');
    setSelectedStates([]);
    setMinCapacityValue('');
    setMaxCapacityValue('');
    setBoomBrandValue('');
    setTruckBrandValue('');
    setCraneMountStatus('ALL');
    setReqCabin('ALL'); setReqHammer('ALL'); setReqExtension('ALL');
    setReq4x4('ALL'); setReqClam('ALL');
    setSortValue('recent');
  };

  const filteredMachines = useMemo(() => {
    const term = searchValue.toLowerCase().trim();
    const minP = minPriceValue ? parseFloat(minPriceValue) : 0;
    const maxP = maxPriceValue ? parseFloat(maxPriceValue) : Infinity;
    const minY = minYearValue ? parseInt(minYearValue) : 0;
    const maxY = maxYearValue ? parseInt(maxYearValue) : 9999;
    const maxHrs = hoursMaxValue ? parseInt(hoursMaxValue) : Infinity;
    const maxMls = milesMaxValue ? parseInt(milesMaxValue) : Infinity;
    const engineTerm = engineValue.toLowerCase().trim();
    const transTerm = transmissionValue.toLowerCase().trim();
    
    return machines.filter(m => {
      if (term) {
          const generalText = `${m.titulo} ${m.origen_tarea} ${m.marca_pluma || ''} ${m.marca_camion || ''}`.toLowerCase();
          if (!generalText.includes(term)) return false;
      }

      if (categoryValue !== 'ALL' && m.categoria_tarea !== categoryValue) return false;
      if (dataSource === 'FACEBOOK' && m.pagina !== 'Facebook Marketplace') return false;
      if (dataSource === 'AGENCIAS' && m.pagina === 'Facebook Marketplace') return false;
      
      // LÓGICA DE MARCAS MÚLTIPLES
      if (selectedBrands.length > 0) {
          const t = m.titulo.toLowerCase();
          const matchesAnyBrand = selectedBrands.some(brand => {
              if (brand === 'CAT') {
                  return t.includes('cat') || t.includes('caterpillar');
              }
              return t.includes(brand.toLowerCase());
          });
          if (!matchesAnyBrand) return false;
      }

      if (m.precio === 0 || !m.precio) {
          if (!showCallForPrice) return false; 
      } else {
          if (m.precio < minP || m.precio > maxP) return false;
      }
      if (m.año < minY || m.año > maxY) return false;

      const usoValor = ('uso_bomba' in m && 'uso_motor' in m) ? (m.uso_bomba || 0) : (m.uso || 0);
      
      if (maxHrs !== Infinity && usoValor > maxHrs) return false;
      if (maxMls !== Infinity && usoValor > maxMls) return false;

      if (categoryValue !== 'Retroexcavadoras') {
          if (engineTerm) {
              const mMotor = (m.motor || "").toLowerCase();
              if (!mMotor.includes(engineTerm) && !m.titulo.toLowerCase().includes(engineTerm)) return false;
          }
          if (transTerm) {
              const mTrans = (m.transmision || "").toLowerCase();
              if (mTrans !== transTerm) return false; 
          }
      }
      
      if (countryValue || selectedStates.length > 0) {
          const loc = (m.ubicacion || "").toLowerCase();
          if (selectedStates.length > 0) {
              const matchesAnyState = selectedStates.some(st => {
                  const [abbr, fullName] = st.toLowerCase().split('|');
                  const matchAbbr = new RegExp(`\\b${abbr}\\b`).test(loc);
                  const matchName = loc.includes(fullName);
                  return matchAbbr || matchName;
              });
              if (!matchesAnyState) return false;
          } else if (countryValue) {
              const canadaRegex = /\b(ab|bc|mb|nb|nl|ns|on|pe|qc|sk)\b|alberta|british columbia|manitoba|new brunswick|newfoundland|nova scotia|ontario|prince edward|quebec|saskatchewan|canada/i;
              const isCanada = canadaRegex.test(loc);
              if (countryValue === 'Canadá' && !isCanada) return false;
              if (countryValue === 'USA' && isCanada) return false;
          }
      }

      if (categoryValue !== 'Retroexcavadoras') {
          if (minCapacityValue || maxCapacityValue) {
              const matchCap = (m.capacidad || '').match(/([\d\.]+)/);
              const valCap = matchCap ? parseFloat(matchCap[1]) : 0;
              if (!valCap) return false; 
              const minC = minCapacityValue ? parseFloat(minCapacityValue) : 0;
              const maxC = maxCapacityValue ? parseFloat(maxCapacityValue) : Infinity;
              if (valCap < minC || valCap > maxC) return false;
          }
      }
      
      if (boomBrandValue) {
          const mBoom = (m.marca_pluma || "").toLowerCase();
          if (!mBoom.includes(boomBrandValue.toLowerCase()) && !m.titulo.toLowerCase().includes(boomBrandValue.toLowerCase())) return false;
      }
      if (truckBrandValue) {
          const mTruck = (m.marca_camion || "").toLowerCase();
          if (!mTruck.includes(truckBrandValue.toLowerCase()) && !m.titulo.toLowerCase().includes(truckBrandValue.toLowerCase())) return false;
      }

      if (categoryValue === 'Gruas Articuladas') {
          const isMounted = !!m.marca_camion || /(freightliner|peterbilt|kenworth|international|ford|sterling|mack|volvo|truck|camion)/i.test((m.titulo + ' ' + (m.origen_tarea || '')).toLowerCase());
          if (craneMountStatus === 'MONTADA' && !isMounted) return false;
          if (craneMountStatus === 'DESMONTADA' && isMounted) return false;
      }

      if (categoryValue === 'Retroexcavadoras') {
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
  }, [machines, searchValue, categoryValue, selectedBrands, minPriceValue, maxPriceValue, showCallForPrice, minYearValue, maxYearValue, hoursMaxValue, milesMaxValue, engineValue, transmissionValue, countryValue, selectedStates, minCapacityValue, maxCapacityValue, boomBrandValue, truckBrandValue, craneMountStatus, reqCabin, reqHammer, reqExtension, req4x4, reqClam, sortValue, dataSource]);

  return {
    dataSource, setDataSource,
    categoryValue, setCategoryValue,
    resetTechnicalFilters,
    resetAllFilters,
    filteredMachines,

    searchValue, onSearchChange: setSearchValue,
    selectedBrands, onSelectedBrandsChange: setSelectedBrands, // <-- Exportamos el arreglo
    
    minPriceValue, onMinPriceChange: setMinPriceValue,
    maxPriceValue, onMaxPriceChange: setMaxPriceValue,
    showCallForPrice, onShowCallForPriceChange: setShowCallForPrice,
    minYearValue, onMinYearChange: setMinYearValue,
    maxYearValue, onMaxYearChange: setMaxYearValue,
    hoursMaxValue, onHoursMaxChange: setHoursMaxValue,
    milesMaxValue, onMilesMaxChange: setMilesMaxValue,
    engineValue, onEngineChange: setEngineValue,
    transmissionValue, onTransmissionChange: setTransmissionValue,
    countryValue, onCountryChange: setCountryValue,
    selectedStates, onSelectedStatesChange: setSelectedStates,
    minCapacityValue, onMinCapacityChange: setMinCapacityValue,
    maxCapacityValue, onMaxCapacityChange: setMaxCapacityValue,
    boomBrandValue, onBoomBrandChange: setBoomBrandValue,
    truckBrandValue, onTruckBrandChange: setTruckBrandValue,
    craneMountStatus, onCraneMountStatusChange: setCraneMountStatus,
    reqCabin, onReqCabinChange: setReqCabin,
    reqHammer, onReqHammerChange: setReqHammer,
    reqExtension, onReqExtensionChange: setReqExtension,
    req4x4, onReq4x4Change: setReq4x4,
    reqClam, onReqClamChange: setReqClam,
    sortValue, onSortChange: setSortValue
  };
};