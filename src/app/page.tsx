'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth'; 
import { auth } from '@/lib/firebase';
import Filters from '@/components/Filters';
import MachineCard from '@/components/MachineCard';

import { CATEGORIAS_INICIO } from '@/constants/categories';
import { useMachines } from '@/hooks/useMachines';
import { useMachineFilters } from '@/hooks/useMachineFilters';

function CatalogApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('cat'); 

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Guardamos el usuario

  // --- LÓGICA DE PAGINACIÓN CLIENT-SIDE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24; 
  const [lastFetchedPage, setLastFetchedPage] = useState(0); // Escudo Anti-Loops

  const { 
    machines, setMachines, loading, lastUpdate, hasMore, 
    loadingMore, fetchInitialData, loadMoreData 
  } = useMachines();

  const filters = useMachineFilters(machines);

  // 1. Autenticación y Avatar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 2. Si cambian los filtros, regresamos a la página 1 y reseteamos el escudo
  useEffect(() => {
    setCurrentPage(1);
    setLastFetchedPage(0);
  }, [filters.filteredMachines]);

  // 3. Sincronización de URL inicial
  useEffect(() => {
    if (urlCategory) {
      filters.setCategoryValue(urlCategory);
      fetchInitialData(urlCategory);
    } else {
      setMachines([]);
    }
  }, [urlCategory, fetchInitialData]);

  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

  const handleSelectCategory = (catId: string) => {
    filters.resetTechnicalFilters(); 
    router.push(`/?cat=${encodeURIComponent(catId)}`);
  };

  const goHome = () => { router.push('/'); };

  const isHomeView = !urlCategory;

  const dropdownCategories = useMemo(() => {
    const baseCats = CATEGORIAS_INICIO.filter(c => c.id !== 'ALL').map(c => c.id);
    const loadedCats = machines.map(m => m.categoria_tarea).filter(Boolean);
    return [...new Set([...baseCats, ...loadedCats])].sort();
  }, [machines]);

  // --- CÁLCULOS MATEMÁTICOS DE PAGINACIÓN ---
  const totalPages = Math.ceil(filters.filteredMachines.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filters.filteredMachines.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 4. MOTOR DE AUTO-RECARGA (El reemplazo del botón "Cargar Más") ---
  useEffect(() => {
    // Si estamos en la última página, hay más datos en la nube y no hemos buscado en esta página...
    if (currentPage === totalPages && hasMore && !loadingMore && filters.filteredMachines.length > 0 && lastFetchedPage !== currentPage) {
      setLastFetchedPage(currentPage); // Bloqueamos para que solo busque una vez por página
      loadMoreData(filters.categoryValue); // Auto-busca en segundo plano
    }
  }, [currentPage, totalPages, hasMore, loadingMore, filters.filteredMachines.length, filters.categoryValue, lastFetchedPage, loadMoreData]);

  if (authChecking) return <div className="min-h-screen bg-slate-900 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      
      {/* NAVBAR SUPERIOR CON PERFIL */}
      <nav className="bg-slate-900 text-white p-4 shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          <button onClick={goHome} className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
            WebSourcing <span className="text-orange-500">Live</span>
          </button>
          
          {/* INDICADOR DE RESULTADOS EXACTOS (Ej. 1 - 24 de 100) */}
          {!isHomeView && (
            <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
              <span className="text-slate-300 font-medium hidden md:inline text-sm">Resultados:</span> 
              <span className="text-orange-400 font-bold text-lg">
                {filters.filteredMachines.length > 0 
                  ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filters.filteredMachines.length)} de ${filters.filteredMachines.length}` 
                  : '0'}
              </span>
            </div>
          )}
          
          {/* PERFIL DE USUARIO Y SALIR */}
          <div className="flex items-center gap-4 md:gap-6">
            {currentUser && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Sourcing Team</p>
                  <p className="text-sm font-medium text-slate-200 leading-none">{currentUser.email}</p>
                </div>
                <div className="bg-orange-500 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-lg shadow-sm border-2 border-slate-800">
                  {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm">
              Salir
            </button>
          </div>

        </div>
      </nav>

      {isHomeView ? (
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
            <div className="bg-slate-200 p-1 rounded-xl inline-flex shadow-inner border border-slate-300 overflow-x-auto">
              <button onClick={() => filters.setDataSource('AGENCIAS')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${filters.dataSource === 'AGENCIAS' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                Agencias
              </button>
              <button onClick={() => filters.setDataSource('FACEBOOK')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${filters.dataSource === 'FACEBOOK' ? 'bg-[#1877F2] text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Marketplace
              </button>
              <button onClick={() => filters.setDataSource('ALL')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${filters.dataSource === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                Mezclar Todo
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-full md:w-64 lg:w-72 shrink-0">
              <Filters
                {...filters} 
                categories={dropdownCategories} 
                onRefresh={() => fetchInitialData(filters.categoryValue)}
                isRefreshing={loading} 
                lastUpdate={lastUpdate}
                onCategoryChange={(val) => { 
                  router.push(`/?cat=${encodeURIComponent(val)}`); 
                }}
              />
            </div>

            <main className="flex-1 w-full flex flex-col min-h-screen">
              {loading ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
                  <p className="text-slate-500 mt-4 font-medium italic">Sincronizando con la nube...</p>
                </div>
              ) : filters.filteredMachines.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-700">Sin coincidencias recientes</h3>
                  <p className="text-slate-500 mt-2 mb-6">Tus filtros son muy estrictos o no hay máquinas nuevas.</p>
                  {hasMore && (
                     <button onClick={() => loadMoreData(filters.categoryValue)} disabled={loadingMore} className="px-6 py-3 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors flex items-center gap-2 mx-auto">
                        {loadingMore ? (
                          <><svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Buscando en historial...</>
                        ) : (
                          <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> Forzar búsqueda profunda</>
                        )}
                     </button>
                  )}
                </div>
              ) : (
                <>
                  {/* GRID DE MÁQUINAS PAGINADAS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-grow content-start">
                    {currentItems.map((machine) => <MachineCard key={machine.id} machine={machine} />)}
                  </div>

                  {/* CONTROLES DE PAGINACIÓN INTELIGENTE */}
                  {(totalPages > 1 || hasMore) && (
                    <div className="mt-10 mb-8 flex justify-center items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
                      
                      <button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg font-bold transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      
                      <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all flex-shrink-0 ${currentPage === page ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      {/* Flecha Siguiente (Actúa como Force Fetch si el Auto-Fetch falló) */}
                      <button 
                        onClick={() => {
                          if (currentPage < totalPages) {
                             handlePageChange(currentPage + 1);
                          } else if (hasMore) {
                             loadMoreData(filters.categoryValue);
                          }
                        }} 
                        disabled={currentPage === totalPages && !hasMore}
                        className={`p-2 rounded-lg font-bold transition-colors ${currentPage === totalPages && !hasMore ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                        title={currentPage === totalPages && hasMore ? 'Forzar carga de más registros' : 'Siguiente'}
                      >
                        {loadingMore ? (
                          <svg className="w-5 h-5 animate-spin text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        )}
                      </button>

                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>}>
      <CatalogApp />
    </Suspense>
  );
}