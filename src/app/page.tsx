'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, where, getDocs, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Machine, SortOption } from '@/types';
import Filters from '@/components/Filters';
import MachineCard from '@/components/MachineCard';

const MACHINES_PER_PAGE = 50;

const CATEGORIAS_INICIO = [
  { id: 'Excavadoras', nombre: 'Excavadoras', icon: <img src="/iconos/exc.webp" alt="Exc" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Retroexcavadoras', nombre: 'Retroexcavadoras', icon: <img src="/iconos/retro.webp" alt="Retro" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Topadores', nombre: 'Topadores', icon: <img src="/iconos/topador.webp" alt="Topador" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Cargadores', nombre: 'Cargadores', icon: <img src="/iconos/topador.webp" alt="Cargador" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Motoconformadoras', nombre: 'Motoconformadoras', icon: <img src="/iconos/motoconformadora.webp" alt="Moto" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Camiones Volteo', nombre: 'Camiones Volteo', icon: <img src="/iconos/camion-volteo.webp" alt="Volteo" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Camiones Trompo', nombre: 'Camiones Trompo', icon: <img src="/iconos/trompo.png" alt="Trompo" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Camiones Pipa', nombre: 'Camiones Pipa', icon: <img src="/iconos/pipa.png" alt="Pipa" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Tractocamiones', nombre: 'Tractocamiones', icon: <img src="/iconos/tractocamion.webp" alt="Tracto" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Gruas Titanes', nombre: 'Grúas Titanes', icon: <img src="/iconos/grua.webp" alt="Titan" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Gruas Articuladas', nombre: 'Grúas Articuladas', icon: <img src="/iconos/grua.webp" alt="Articulada" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Bombas', nombre: 'Bombas', icon: <img src="/iconos/Icon_1019.webp" alt="Bomba" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Elevadores', nombre: 'Elevadores', icon: <img src="/iconos/elevador.webp" alt="Elevador" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'Rough Terrain', nombre: 'Rough Terrain', icon: <img src="/iconos/rough-terrain.webp" alt="RT" className="w-42 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'All Terrain', nombre: 'All Terrain', icon: <img src="/iconos/all-terrain.webp" alt="AT" className="w-42 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" /> },
  { id: 'ALL', nombre: 'Ver Todo', icon: <svg className="w-16 h-16 text-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:text-orange-500 mb-6" viewBox="0 0 64 64" fill="currentColor"><path d="M12 12h16v16H12zM36 12h16v16H36zM12 36h16v16H12zM36 36h16v16H36z"/></svg> }
];

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeView, setActiveView] = useState<'home' | 'catalog'>('home');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- ESTADOS DE FILTROS ---
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
  
  // --- NUEVOS ESTADOS DE UBICACIÓN ---
  const [countryValue, setCountryValue] = useState('');
  const [stateValue, setStateValue] = useState('');
  
  const [minCapacityValue, setMinCapacityValue] = useState('');
  const [maxCapacityValue, setMaxCapacityValue] = useState('');
  const [boomBrandValue, setBoomBrandValue] = useState('');
  const [truckBrandValue, setTruckBrandValue] = useState('');
  
  const [sortValue, setSortValue] = useState<SortOption>('recent');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setIsAuthenticated(true); else router.push('/login');
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

  const fetchInitialData = useCallback(async (categoryToFetch: string) => {
    setLoading(true); setMachines([]);
    try {
      const colRef = collection(db, 'maquinaria_aprobada');
      let q = categoryToFetch === 'ALL' 
        ? query(colRef, orderBy('timestamp', 'desc'), limit(MACHINES_PER_PAGE))
        : query(colRef, where('categoria_tarea', '==', categoryToFetch), orderBy('timestamp', 'desc'), limit(MACHINES_PER_PAGE));
      
      const snapshot = await getDocs(q); 
      const newMachines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
      setMachines(newMachines);
      setLastUpdate(new Date());
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === MACHINES_PER_PAGE);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  const handleSelectCategory = (catId: string) => {
    setCategoryValue(catId);
    setMinCapacityValue(''); setMaxCapacityValue(''); 
    setBoomBrandValue(''); setTruckBrandValue('');
    setHoursMaxValue(''); setMilesMaxValue('');
    setActiveView('catalog'); fetchInitialData(catId);
  };

  const goHome = () => { setActiveView('home'); setMachines([]); };

  const loadMoreData = async () => {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const colRef = collection(db, 'maquinaria_aprobada');
      let q = categoryValue === 'ALL'
        ? query(colRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(MACHINES_PER_PAGE))
        : query(colRef, where('categoria_tarea', '==', categoryValue), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(MACHINES_PER_PAGE));
      const snapshot = await getDocs(q);
      const newMachines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
      setMachines(prev => [...prev, ...newMachines]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === MACHINES_PER_PAGE);
    } catch (e) { console.error(e); } finally { setLoadingMore(false); }
  };

  const dropdownCategories = useMemo(() => {
    const baseCats = CATEGORIAS_INICIO.filter(c => c.id !== 'ALL').map(c => c.id);
    const loadedCats = machines.map(m => m.categoria_tarea).filter(Boolean);
    return [...new Set([...baseCats, ...loadedCats])].sort();
  }, [machines]);

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
      // 1. Text Search
      if (term) {
          const generalText = `${m.titulo} ${m.origen_tarea} ${m.marca_pluma || ''} ${m.marca_camion || ''}`.toLowerCase();
          if (!generalText.includes(term)) return false;
      }

      if (categoryValue !== 'ALL' && m.categoria_tarea !== categoryValue) return false;
      if (dataSource === 'FACEBOOK' && m.pagina !== 'Facebook Marketplace') return false;
      if (dataSource === 'AGENCIAS' && m.pagina === 'Facebook Marketplace') return false;
      
      // 2. Precios
      if (m.precio === 0 || !m.precio) {
          if (!showCallForPrice) return false; 
      } else {
          if (m.precio < minP || m.precio > maxP) return false;
      }

      if (m.año < minY || m.año > maxY) return false;

      // 3. Uso (Horas/Millas)
      const isTruck = ['Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa', 'Tractocamiones', 'Gruas Titanes'].includes(m.categoria_tarea);
      const usoValor = ('uso_bomba' in m && 'uso_motor' in m) ? (m.uso_bomba || 0) : (m.uso || 0);
      if (isTruck) {
         if (maxMls !== Infinity && usoValor > maxMls) return false;
      } else {
         if (maxHrs !== Infinity && usoValor > maxHrs) return false;
      }

      // 4. Mecánica
      if (engineTerm) {
          const mMotor = (m.motor || "").toLowerCase();
          if (!mMotor.includes(engineTerm) && !m.titulo.toLowerCase().includes(engineTerm)) return false;
      }
      if (transTerm) {
          const mTrans = (m.transmision || "").toLowerCase();
          if (mTrans !== transTerm) return false; 
      }
      
      // 5. LÓGICA DE UBICACIÓN (PAÍS Y ESTADO)
      if (countryValue || stateValue) {
          const loc = (m.ubicacion || "").toLowerCase();
          
          if (stateValue) {
              // Si eligió un estado específico (Ej. "TX|Texas")
              const [abbr, fullName] = stateValue.toLowerCase().split('|');
              const matchAbbr = new RegExp(`\\b${abbr}\\b`).test(loc);
              const matchName = loc.includes(fullName);
              
              if (!matchAbbr && !matchName) return false;
          } else if (countryValue) {
              // CORRECCIÓN: Agregamos \b al inicio y final para evitar que "Houston" se confunda con "ON" (Ontario)
              const canadaRegex = /\b(ab|bc|mb|nb|nl|ns|on|pe|qc|sk)\b|alberta|british columbia|manitoba|new brunswick|newfoundland|nova scotia|ontario|prince edward|quebec|saskatchewan|canada/i;
              const isCanada = canadaRegex.test(loc);
              
              if (countryValue === 'Canadá' && !isCanada) return false;
              if (countryValue === 'USA' && isCanada) return false; // Descartar máquinas en Canadá si busca USA
          }
      }

      // 6. Capacidad
      if (minCapacityValue || maxCapacityValue) {
          const matchCap = (m.capacidad || '').match(/([\d\.]+)/);
          const valCap = matchCap ? parseFloat(matchCap[1]) : 0;
          if (!valCap) return false; 
          
          const minC = minCapacityValue ? parseFloat(minCapacityValue) : 0;
          const maxC = maxCapacityValue ? parseFloat(maxCapacityValue) : Infinity;
          if (valCap < minC || valCap > maxC) return false;
      }
      
      // 7. Grúas (Pluma/Camión)
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

  if (authChecking) return <div className="min-h-screen bg-slate-900 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      <nav className="bg-slate-900 text-white p-6 shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <button onClick={goHome} className="text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
            WebSourcing <span className="text-orange-500">Live</span>
          </button>
          {activeView === 'catalog' && (
            <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
              <span className="text-slate-300 font-medium hidden md:inline">Resultados:</span> 
              <span className="text-orange-400 font-bold text-2xl">{filteredMachines.length}</span>
            </div>
          )}
          <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500 px-3 py-2 rounded border border-slate-700 transition-colors">Salir</button>
        </div>
      </nav>

      {activeView === 'home' ? (
        <main className="max-w-6xl mx-auto px-6 mt-12 mb-20 animate-fade-in">
          <div className="text-center mb-16 border-b border-slate-200 pb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Inventario de Equipos</h2>
            <p className="text-slate-500">Selecciona una categoría para explorar el mercado global</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-16 gap-x-8">
            {CATEGORIAS_INICIO.map((cat) => (
              <button key={cat.id} onClick={() => handleSelectCategory(cat.id)} className="flex flex-col items-center justify-center text-center group cursor-pointer">
                <div className="h-36 flex items-center justify-center w-full">{cat.icon}</div>
                <span className="mt-2 text-sm md:text-base font-bold text-slate-700 group-hover:text-orange-600 transition-colors">{cat.nombre}</span>
              </button>
            ))}
          </div>
        </main>
      ) : (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 mt-6">
          
          <div className="flex justify-center md:justify-start mb-6">
            <div className="bg-slate-200 p-1 rounded-xl inline-flex shadow-inner border border-slate-300">
              <button onClick={() => setDataSource('AGENCIAS')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${dataSource === 'AGENCIAS' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                Agencias
              </button>
              <button onClick={() => setDataSource('FACEBOOK')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${dataSource === 'FACEBOOK' ? 'bg-[#1877F2] text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Marketplace
              </button>
              <button onClick={() => setDataSource('ALL')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${dataSource === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                Mezclar Todo
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            
            <div className="w-full md:w-64 lg:w-72 shrink-0">
              <Filters
                categories={dropdownCategories} 
                searchValue={searchValue} onSearchChange={setSearchValue}
                categoryValue={categoryValue} onCategoryChange={(val) => { setCategoryValue(val); fetchInitialData(val); }}
                
                minPriceValue={minPriceValue} onMinPriceChange={setMinPriceValue}
                maxPriceValue={maxPriceValue} onMaxPriceChange={setMaxPriceValue}
                showCallForPrice={showCallForPrice} onShowCallForPriceChange={setShowCallForPrice}
                
                minYearValue={minYearValue} onMinYearChange={setMinYearValue}
                maxYearValue={maxYearValue} onMaxYearChange={setMaxYearValue}
                
                hoursMaxValue={hoursMaxValue} onHoursMaxChange={setHoursMaxValue}
                milesMaxValue={milesMaxValue} onMilesMaxChange={setMilesMaxValue}
                
                engineValue={engineValue} onEngineChange={setEngineValue}
                transmissionValue={transmissionValue} onTransmissionChange={setTransmissionValue}
                
                countryValue={countryValue} onCountryChange={setCountryValue}
                stateValue={stateValue} onStateChange={setStateValue}
                
                minCapacityValue={minCapacityValue} onMinCapacityChange={setMinCapacityValue}
                maxCapacityValue={maxCapacityValue} onMaxCapacityChange={setMaxCapacityValue}
                boomBrandValue={boomBrandValue} onBoomBrandChange={setBoomBrandValue}
                truckBrandValue={truckBrandValue} onTruckBrandChange={setTruckBrandValue}
                
                sortValue={sortValue} onSortChange={setSortValue}
                
                onRefresh={() => fetchInitialData(categoryValue)}
                isRefreshing={loading} lastUpdate={lastUpdate}
              />
            </div>

            <main className="flex-1 w-full">
              {loading ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
                  <p className="text-slate-500 mt-4 font-medium italic">Sincronizando con la nube...</p>
                </div>
              ) : filteredMachines.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-700">Sin coincidencias con estos filtros</h3>
                  <p className="text-slate-500 mt-2">Prueba habilitar "Call For Price" o limpiar los filtros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMachines.map((machine) => <MachineCard key={machine.id} machine={machine} />)}
                </div>
              )}

              {!loading && hasMore && (
                <div className="flex justify-center mt-12 mb-8">
                  <button onClick={loadMoreData} disabled={loadingMore} className={`py-4 px-10 rounded-full font-black shadow-lg transition-all ${loadingMore ? 'bg-slate-300 text-slate-500' : 'bg-slate-900 text-white hover:scale-105 hover:bg-orange-600'}`}>
                    {loadingMore ? 'Cargando más...' : 'Ver Inventario Histórico ↓'}
                  </button>
                </div>
              )}
            </main>

          </div>
        </div>
      )}
    </div>
  );
}