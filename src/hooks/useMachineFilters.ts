import { useState, useMemo } from 'react';
import type { Machine, SortOption } from '@/types';

export const useMachineFilters = (machines: Machine[]) => {
  const [dataSource, setDataSource] = useState<'AGENCIAS' | 'FACEBOOK' | 'ALL'>('AGENCIAS');
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('ALL');
  
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
  const [stateValue, setStateValue] = useState('');
  
  const [minCapacityValue, setMinCapacityValue] = useState('');
  const [maxCapacityValue, setMaxCapacityValue] = useState('');
  const [boomBrandValue, setBoomBrandValue] = useState('');
  const [truckBrandValue, setTruckBrandValue] = useState('');
  
  const [sortValue, setSortValue] = useState<SortOption>('recent');

  // Función para limpiar filtros al cambiar de categoría principal
  const resetTechnicalFilters = () => {
    setMinCapacityValue(''); setMaxCapacityValue(''); 
    setBoomBrandValue(''); setTruckBrandValue('');
    setHoursMaxValue(''); setMilesMaxValue('');
    setEngineValue(''); setTransmissionValue('');
    setCountryValue(''); setStateValue('');
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
      
      if (m.precio === 0 || !m.precio) {
          if (!showCallForPrice) return false; 
      } else {
          if (m.precio < minP || m.precio > maxP) return false;
      }

      if (m.año < minY || m.año > maxY) return false;

      const isTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(m.categoria_tarea);
      const usoValor = ('uso_bomba' in m && 'uso_motor' in m) ? (m.uso_bomba || 0) : (m.uso || 0);
      if (isTruck) {
         if (maxMls !== Infinity && usoValor > maxMls) return false;
      } else {
         if (maxHrs !== Infinity && usoValor > maxHrs) return false;
      }

      if (engineTerm) {
          const mMotor = (m.motor || "").toLowerCase();
          if (!mMotor.includes(engineTerm) && !m.titulo.toLowerCase().includes(engineTerm)) return false;
      }
      if (transTerm) {
          const mTrans = (m.transmision || "").toLowerCase();
          if (mTrans !== transTerm) return false; 
      }
      
      if (countryValue || stateValue) {
          const loc = (m.ubicacion || "").toLowerCase();
          if (stateValue) {
              const [abbr, fullName] = stateValue.toLowerCase().split('|');
              const matchAbbr = new RegExp(`\\b${abbr}\\b`).test(loc);
              const matchName = loc.includes(fullName);
              if (!matchAbbr && !matchName) return false;
          } else if (countryValue) {
              const canadaRegex = /\b(ab|bc|mb|nb|nl|ns|on|pe|qc|sk)\b|alberta|british columbia|manitoba|new brunswick|newfoundland|nova scotia|ontario|prince edward|quebec|saskatchewan|canada/i;
              const isCanada = canadaRegex.test(loc);
              if (countryValue === 'Canadá' && !isCanada) return false;
              if (countryValue === 'USA' && isCanada) return false;
          }
      }

      if (minCapacityValue || maxCapacityValue) {
          const matchCap = (m.capacidad || '').match(/([\d\.]+)/);
          const valCap = matchCap ? parseFloat(matchCap[1]) : 0;
          if (!valCap) return false; 
          const minC = minCapacityValue ? parseFloat(minCapacityValue) : 0;
          const maxC = maxCapacityValue ? parseFloat(maxCapacityValue) : Infinity;
          if (valCap < minC || valCap > maxC) return false;
      }
      
      if (boomBrandValue) {
          const mBoom = (m.marca_pluma || "").toLowerCase();
          if (!mBoom.includes(boomBrandValue.toLowerCase()) && !m.titulo.toLowerCase().includes(boomBrandValue.toLowerCase())) return false;
      }
      if (truckBrandValue) {
          const mTruck = (m.marca_camion || "").toLowerCase();
          if (!mTruck.includes(truckBrandValue.toLowerCase()) && !m.titulo.toLowerCase().includes(truckBrandValue.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortValue === 'price_asc') return a.precio - b.precio;
      if (sortValue === 'price_desc') return b.precio - a.precio;
      if (sortValue === 'year_desc') return b.año - a.año;
      return 0; 
    });
  }, [machines, searchValue, categoryValue, minPriceValue, maxPriceValue, showCallForPrice, minYearValue, maxYearValue, hoursMaxValue, milesMaxValue, engineValue, transmissionValue, countryValue, stateValue, minCapacityValue, maxCapacityValue, boomBrandValue, truckBrandValue, sortValue, dataSource]);

  return {
    // 1. Estados y funciones necesarios para page.tsx
    dataSource, setDataSource,
    categoryValue, setCategoryValue,
    resetTechnicalFilters,
    filteredMachines,

    // 2. Mapeo exacto para que el truco {...filters} funcione perfecto
    searchValue, onSearchChange: setSearchValue,
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
    stateValue, onStateChange: setStateValue,
    minCapacityValue, onMinCapacityChange: setMinCapacityValue,
    maxCapacityValue, onMaxCapacityChange: setMaxCapacityValue,
    boomBrandValue, onBoomBrandChange: setBoomBrandValue,
    truckBrandValue, onTruckBrandChange: setTruckBrandValue,
    sortValue, onSortChange: setSortValue,
  };
};