'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, where, getDocs, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import type { Machine, SortOption } from '@/types';
import Filters from '@/components/Filters';
import MachineCard from '@/components/MachineCard';

const MACHINES_PER_PAGE = 50;

// === CONFIGURACIÓN LIMPIA DE CATEGORÍAS (Con tus nuevos iconos) ===
const CATEGORIAS_INICIO = [
  {
    id: 'Excavadoras',
    nombre: 'Excavadoras',
    icon: <img src="/iconos/exc.webp" alt="Excavadoras" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Retroexcavadoras',
    nombre: 'Retroexcavadoras',
    icon: <img src="/iconos/retro.webp" alt="Retroexcavadoras" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Topadores',
    nombre: 'Topadores',
    icon: <img src="/iconos/topador.webp" alt="Topadores" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Motoconformadoras',
    nombre: 'Motoconformadoras',
    icon: <img src="/iconos/motoconformadora.webp" alt="Motoconformadoras" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />  
  },
  {
    id: 'Camiones Volteo',
    nombre: 'Camiones Volteo',
    icon: <img src="/iconos/camion-volteo.webp" alt="Camiones Volteo" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />  
  },
  {
    id: 'Camiones Trompo',
    nombre: 'Camiones Trompo',
    icon: <img src="/iconos/trompo.png" alt="Camiones Trompo" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Camiones Pipa',
    nombre: 'Camiones Pipa',
    icon: <img src="/iconos/pipa.png" alt="Camiones Pipa" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Bombas',
    nombre: 'Bombas de Concreto',
    icon: <img src="/iconos/concrete-pump.png" alt="Bombas de Concreto" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Tractocamiones',
    nombre: 'Tractocamiones',
    icon: <img src="/iconos/tractocamion.webp" alt="Tractocamiones" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Gruas',
    nombre: 'Grúas',
    icon: <img src="/iconos/grua.webp" alt="Grúas" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Elevadores',
    nombre: 'Elevadores',
    icon: <img src="/iconos/elevador.webp" alt="Elevadores" className="w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'Rough Terrain',
    nombre: 'Rough Terrain',
    icon: <img src="/iconos/rough-terrain.webp" alt="Rough Terrain" className="w-42 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'All Terrain',
    nombre: 'All Terrain',
    icon: <img src="/iconos/all-terrain.webp" alt="All Terrain" className="w-42 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm" />
  },
  {
    id: 'ALL',
    nombre: 'Ver Todo',
    icon: (
      <svg className="w-16 h-16 text-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:text-orange-500 mb-6" viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12h16v16H12zM36 12h16v16H36zM12 36h16v16H12zM36 36h16v16H36z"/>
      </svg>
    )
  }
];

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeView, setActiveView] = useState<'home' | 'catalog'>('home');

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('ALL');
  // --- ESTADO PARA EL SUB-FILTRO ---
  const [subCategoryValue, setSubCategoryValue] = useState('ALL'); 
  const [priceValue, setPriceValue] = useState('');
  const [minYearValue, setMinYearValue] = useState('');
  const [maxYearValue, setMaxYearValue] = useState('');
  const [maxHoursValue, setMaxHoursValue] = useState('');
  const [sortValue, setSortValue] = useState<SortOption>('recent');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) setIsAuthenticated(true);
      else router.push('/login');
      setAuthChecking(false);
    });
    return () => unsubscribeAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // ==========================================
  // CONSULTA LIMPIA Y DIRECTA A FIREBASE
  // ==========================================
  const fetchInitialData = useCallback(async (categoryToFetch: string) => {
    setLoading(true);
    setMachines([]);
    try {
      const colRef = collection(db, 'maquinaria_aprobada');
      let q;
      
      if (categoryToFetch === 'ALL') {
        q = query(colRef, orderBy('timestamp', 'desc'), limit(MACHINES_PER_PAGE));
      } else {
        q = query(colRef, where('categoria_tarea', '==', categoryToFetch), orderBy('timestamp', 'desc'), limit(MACHINES_PER_PAGE));
      }
      
      const snapshot = await getDocs(q); 
      
      const newMachines: Machine[] = [];
      snapshot.forEach((doc) => {
        newMachines.push({ id: doc.id, ...(doc.data() as DocumentData) } as Machine);
      });
      
      setMachines(newMachines);
      setLastUpdate(new Date());
      
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === MACHINES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleSelectCategory = (catId: string) => {
    setCategoryValue(catId);
    setSubCategoryValue('ALL'); // Reseteamos el sub-filtro al cambiar de categoría
    setActiveView('catalog');
    fetchInitialData(catId);
  };

  const goHome = () => {
    setActiveView('home');
    setSubCategoryValue('ALL'); // Reseteamos el sub-filtro al volver al inicio
    setMachines([]);
  };

  const loadMoreData = async () => {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const colRef = collection(db, 'maquinaria_aprobada');
      let q;
      
      if (categoryValue === 'ALL') {
        q = query(colRef, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(MACHINES_PER_PAGE));
      } else {
        q = query(colRef, where('categoria_tarea', '==', categoryValue), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(MACHINES_PER_PAGE));
      }
      
      const snapshot = await getDocs(q); 
      
      const newMachines: Machine[] = [];
      snapshot.forEach((doc) => {
        newMachines.push({ id: doc.id, ...(doc.data() as DocumentData) } as Machine);
      });
      
      setMachines((prev) => [...prev, ...newMachines]); 
      
      if (snapshot.docs.length > 0) {
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === MACHINES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error al cargar más datos:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Creador Dinámico de Categorías para el Dropdown principal
  const dropdownCategories = useMemo(() => {
    const baseCats = CATEGORIAS_INICIO.filter(c => c.id !== 'ALL').map(c => c.id);
    const loadedCats = machines.map(m => m.categoria_tarea).filter(Boolean);
    const uniqueCats = [...new Set([...baseCats, ...loadedCats])];
    return uniqueCats.sort();
  }, [machines]);

  // Motor de Filtro en Memoria
  const filteredMachines = useMemo(() => {
    const term = searchValue.toLowerCase();
    const maxP = priceValue ? parseFloat(priceValue) : Infinity;
    const minY = minYearValue ? parseInt(minYearValue) : 0;
    const maxY = maxYearValue ? parseInt(maxYearValue) : 9999;
    const maxH = maxHoursValue ? parseInt(maxHoursValue) : Infinity;
    
    let filtered = machines.filter(machine => {
      const matchesSearch = machine.titulo.toLowerCase().includes(term);
      const matchesCategory = categoryValue === 'ALL' || machine.categoria_tarea === categoryValue;
      
      // Lógica crucial del sub-filtro para las Grúas (Busca por origen_tarea)
      const matchesSubCategory = subCategoryValue === 'ALL' || machine.origen_tarea === subCategoryValue;
      
      const matchesPrice = machine.precio <= maxP;
      const matchesYear = machine.año >= minY && machine.año <= maxY;
      
      let matchesHours = true;
      if (maxH !== Infinity) {
        if ('uso_bomba' in machine && 'uso_motor' in machine) {
           matchesHours = (machine.uso_bomba || 0) <= maxH || (machine.uso_motor || 0) <= maxH;
        } else {
           matchesHours = (machine.uso || 0) <= maxH;
        }
      }

      return matchesSearch && matchesCategory && matchesSubCategory && matchesPrice && matchesYear && matchesHours;
    });

    switch (sortValue) {
      case 'price_asc': filtered.sort((a, b) => a.precio - b.precio); break;
      case 'price_desc': filtered.sort((a, b) => b.precio - a.precio); break;
      case 'year_desc': filtered.sort((a, b) => b.año - a.año); break;
    }

    return filtered;
  }, [machines, searchValue, categoryValue, subCategoryValue, priceValue, minYearValue, maxYearValue, maxHoursValue, sortValue]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      
      <nav className="bg-slate-900 text-white p-6 shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <button onClick={goHome} className="text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity text-left">
              WebSourcing <span className="text-orange-500">Live</span>
            </button>
            <p className="text-slate-400 text-sm mt-1">Inteligencia de Adquisición para Machinery Hunters</p>
          </div>
          <div className="flex items-center gap-4">
            {activeView === 'catalog' && (
              <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
                <span className="text-slate-300 font-medium hidden md:inline">Mostrando:</span> 
                <span className="text-orange-400 font-bold text-2xl">{filteredMachines.length}</span>
              </div>
            )}
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500 border border-slate-700 hover:border-red-600 px-3 py-2 rounded transition-colors">
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* ================= VISTA 1: INICIO ================= */}
      {activeView === 'home' && (
        <main className="max-w-6xl mx-auto px-6 mt-12 mb-20 animate-fade-in">
          <div className="text-center mb-16 border-b border-slate-200 pb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Inventario de Equipos 
            </h2>
            <p className="text-slate-500">Selecciona una categoría para explorar el mercado en tiempo real</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-16 gap-x-8">
            {CATEGORIAS_INICIO.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className="flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="h-36 flex items-center justify-center w-full">
                  {cat.icon}
                </div>
                <span className="mt-2 text-sm md:text-base font-bold text-slate-700 group-hover:text-orange-600 transition-colors">
                  {cat.nombre}
                </span>
              </button>
            ))}
          </div>
        </main>
      )}

      {/* ================= VISTA 2: CATÁLOGO ================= */}
      {activeView === 'catalog' && (
        <>
          <Filters
            categories={dropdownCategories} 
            onSearchChange={setSearchValue}
            onCategoryChange={(val) => {
              setCategoryValue(val);
              setSubCategoryValue('ALL'); 
              fetchInitialData(val); 
            }}
            onPriceChange={setPriceValue}
            onMinYearChange={setMinYearValue}
            onMaxYearChange={setMaxYearValue}
            onMaxHoursChange={setMaxHoursValue}
            onSortChange={setSortValue}
            onRefresh={() => fetchInitialData(categoryValue)}
            searchValue={searchValue}
            categoryValue={categoryValue}
            subCategoryValue={subCategoryValue}
            onSubCategoryChange={setSubCategoryValue}
            priceValue={priceValue}
            minYearValue={minYearValue}
            maxYearValue={maxYearValue}
            maxHoursValue={maxHoursValue}
            sortValue={sortValue}
            isRefreshing={isRefreshing}
            lastUpdate={lastUpdate}
          />

          <main className="max-w-7xl mx-auto px-6 mt-2">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
                <p className="text-slate-500 mt-4 font-medium">Extrayendo datos...</p>
              </div>
            ) : filteredMachines.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200 mt-4 shadow-sm">
                <h3 className="text-xl font-bold text-slate-700">No hay equipos disponibles</h3>
                <p className="text-slate-500 mt-2">Ajusta los filtros o intenta cargar el inventario histórico.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredMachines.map((machine) => (
                  <MachineCard key={machine.id} machine={machine} />
                ))}
              </div>
            )}

            {!loading && hasMore && filteredMachines.length > 0 && (
              <div className="flex justify-center mt-12 mb-8">
                <button
                  onClick={loadMoreData}
                  disabled={loadingMore}
                  className={`py-3 px-8 rounded-full font-bold shadow-md transition-all flex items-center gap-2 ${
                    loadingMore 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-lg'
                  }`}
                >
                  {loadingMore ? 'Descargando datos históricos...' : '⬇️ Cargar más inventario antiguo'}
                </button>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}