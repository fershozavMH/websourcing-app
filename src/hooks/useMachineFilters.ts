import { useState, useMemo } from 'react';
import type { Machine, SortOption } from '@/types';

export const useMachineFilters = (machines: Machine[]) => {
  const [dataSource, setDataSource] = useState<'AGENCIAS' | 'FACEBOOK' | 'ALL'>('AGENCIAS');
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('ALL');
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  // NUEVO: Arreglo múltiple para marcas de camiones (Trompos, Grúas, etc.)
  const [selectedTruckBrands, setSelectedTruckBrands] = useState<string[]>([]);
  
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
  
  const [craneMountStatus, setCraneMountStatus] = useState('ALL');
  const [boomTypeValue, setBoomTypeValue] = useState('ALL');
  
  const [reqCabin, setReqCabin] = useState('ALL');
  const [reqHammer, setReqHammer] = useState('ALL');
  const [reqExtension, setReqExtension] = useState('ALL');
  const [req4x4, setReq4x4] = useState('ALL');
  const [reqClam, setReqClam] = useState('ALL');

  const [sortValue, setSortValue] = useState<SortOption>('recent');

  const resetTechnicalFilters = () => {
    setSelectedBrands([]); 
    setSelectedTruckBrands([]); // Limpieza del nuevo arreglo
    setMinCapacityValue(''); setMaxCapacityValue(''); 
    setBoomBrandValue(''); 
    setHoursMaxValue(''); setMilesMaxValue('');
    setEngineValue(''); setTransmissionValue('');
    setCountryValue(''); setSelectedStates([]);
    setCraneMountStatus('ALL');
    setBoomTypeValue('ALL');
    setReqCabin('ALL'); setReqHammer('ALL'); setReqExtension('ALL');
    setReq4x4('ALL'); setReqClam('ALL');
  };

  const resetAllFilters = () => {
    setSearchValue('');
    setSelectedBrands([]); 
    setSelectedTruckBrands([]); 
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
    setCraneMountStatus('ALL');
    setBoomTypeValue('ALL');
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
      
      // MARCAS MULTIPLES EQUIPO
      if (selectedBrands.length > 0) {
          const t = m.titulo.toLowerCase();
          const matchesAnyBrand = selectedBrands.some(brand => {
              if (brand === 'CAT') return t.includes('cat') || t.includes('caterpillar');
              return t.includes(brand.toLowerCase());
          });
          if (!matchesAnyBrand) return false;
      }

      // MARCAS MULTIPLES CAMIONES (Trompos, Volteos, Grúas)
      if (selectedTruckBrands.length > 0) {
          const tCamion = (m.marca_camion || "").toLowerCase();
          const tTitulo = m.titulo.toLowerCase();
          const matchesAnyTruck = selectedTruckBrands.some(brand => {
              return tCamion.includes(brand.toLowerCase()) || tTitulo.includes(brand.toLowerCase());
          });
          if (!matchesAnyTruck) return false;
      }

      if (m.precio === 0 || !m.precio) {
          if (!showCallForPrice) return false; 
      } else {
          if (m.precio < minP || m.precio > maxP) return false;
      }
      if (m.año < minY || m.año > maxY) return false;

      const isBomba = m.categoria_tarea === 'Bombas';
      const isTrompo = m.categoria_tarea === 'Camiones Trompo';
      const isTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(m.categoria_tarea);
      
      if (isBomba) {
         if (maxHrs !== Infinity && (m.uso_bomba || 0) > maxHrs) return false;
         if (maxMls !== Infinity && (m.uso_motor || 0) > maxMls) return false;
      } else {
         const usoValor = ('uso_bomba' in m && 'uso_motor' in m) ? (m.uso_bomba || 0) : (m.uso || 0);
         if (isTruck) {
            if (maxMls !== Infinity && usoValor > maxMls) return false;
         } else {
            if (maxHrs !== Infinity && usoValor > maxHrs) return false;
         }
      }

      // MOTOR Y TRANSMISIÓN (Ocultos en Retros y Bombas, pero VISIBLES para Trompos)
      if (categoryValue !== 'Retroexcavadoras' && categoryValue !== 'Bombas') {
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
                  return new RegExp(`\\b${abbr}\\b`, 'i').test(loc) || loc.includes(fullName.toLowerCase());
              });
              if (!matchesAnyState) return false;
          } else if (countryValue) {
              const isCanada = /\b(ab|bc|mb|nb|nl|ns|on|pe|qc|sk)\b|alberta|british columbia|manitoba|new brunswick|newfoundland|nova scotia|ontario|prince edward|quebec|saskatchewan|canada/i.test(loc);
              if (countryValue === 'Canadá' && !isCanada) return false;
              if (countryValue === 'USA' && isCanada) return false;
          }
      }

      // LÓGICA DE CAPACIDAD: Toneladas, Metros Y AHORA YARDAS CÚBICAS
      if (categoryValue !== 'Retroexcavadoras') {
          if (minCapacityValue || maxCapacityValue) {
              let valCap = 0;
              const matchCap = (m.capacidad || '').match(/([\d\.]+)/);
              if (matchCap) valCap = parseFloat(matchCap[1]);

              if (valCap === 0 && isBomba) {
                  const matchM = m.titulo.match(/(\d{2})(?:z|m|x|\-|\s)/i);
                  if (matchM) valCap = parseFloat(matchM[1]);
              }

              // Respaldo para extraer Yardas de Trompos si la variable venía mezclada
              if (valCap === 0 && isTrompo) {
                  const matchYd = (m.titulo + ' ' + (m.capacidad || '')).match(/(\d+(?:\.\d+)?)\s*(yd|yard|yarda|yd3)/i);
                  if (matchYd) valCap = parseFloat(matchYd[1]);
              }

              if (valCap > 0) {
                  const minC = minCapacityValue ? parseFloat(minCapacityValue) : 0;
                  const maxC = maxCapacityValue ? parseFloat(maxCapacityValue) : Infinity;
                  if (valCap < minC || valCap > maxC) return false;
              } else {
                  return false;
              }
          }
      }
      
      if (isBomba && boomTypeValue !== 'ALL') {
          const t = (m.titulo + ' ' + (m.tipo_pluma || '')).toLowerCase();
          if (boomTypeValue === 'Z') {
              if (!/\bz\b/i.test(t) && !/z-boom/i.test(t) && !/z boom/i.test(t) && !/z fold/i.test(t)) return false;
          } else if (boomTypeValue === 'R/F') {
              if (!/r\/f/i.test(t) && !/roll/i.test(t) && !/fold/i.test(t)) return false;
          }
      }

      if (boomBrandValue) {
          const mBoom = (m.marca_pluma || "").toLowerCase();
          if (!mBoom.includes(boomBrandValue.toLowerCase()) && !m.titulo.toLowerCase().includes(boomBrandValue.toLowerCase())) return false;
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
  }, [machines, searchValue, categoryValue, selectedBrands, selectedTruckBrands, minPriceValue, maxPriceValue, showCallForPrice, minYearValue, maxYearValue, hoursMaxValue, milesMaxValue, engineValue, transmissionValue, countryValue, selectedStates, minCapacityValue, maxCapacityValue, boomBrandValue, craneMountStatus, boomTypeValue, reqCabin, reqHammer, reqExtension, req4x4, reqClam, sortValue, dataSource]);

  return {
    dataSource, setDataSource, categoryValue, setCategoryValue,
    resetTechnicalFilters, resetAllFilters, filteredMachines,
    searchValue, onSearchChange: setSearchValue,
    selectedBrands, onSelectedBrandsChange: setSelectedBrands,
    selectedTruckBrands, onSelectedTruckBrandsChange: setSelectedTruckBrands, // Exportar nueva función
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
    craneMountStatus, onCraneMountStatusChange: setCraneMountStatus,
    boomTypeValue, onBoomTypeValueChange: setBoomTypeValue,
    reqCabin, onReqCabinChange: setReqCabin, reqHammer, onReqHammerChange: setReqHammer,
    reqExtension, onReqExtensionChange: setReqExtension, req4x4, onReq4x4Change: setReq4x4,
    reqClam, onReqClamChange: setReqClam, sortValue, onSortChange: setSortValue
  };
};