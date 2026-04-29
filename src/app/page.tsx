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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Estado del Tab de Origen de Datos (Movido aquí para mejor arquitectura)
  const [dataSource, setDataSource] = useState<'AGENCIAS' | 'FACEBOOK' | 'ALL'>('AGENCIAS');

  const { machines, setMachines, loading, lastUpdate, fetchInitialData } = useMachines();
  const filters = useMachineFilters(machines);

  // --- FILTRADO MAESTRO ---
  // Aplica el filtro de la página sobre las máquinas que ya filtró el "cerebro" técnico
  const finalMachines = useMemo(() => {
    return filters.filteredMachines.filter(m => {
      if (dataSource === 'FACEBOOK' && m.pagina !== 'Facebook Marketplace') return false;
      if (dataSource === 'AGENCIAS' && m.pagina === 'Facebook Marketplace') return false;
      return true;
    });
  }, [filters.filteredMachines, dataSource]);

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

  // Si el usuario cambia cualquier filtro o tab, regresamos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [finalMachines]);

  useEffect(() => {
    if (urlCategory) {
      filters.setCategoryValue(urlCategory);
      fetchInitialData(urlCategory);
    } else {
      setMachines([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory, fetchInitialData]);

  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

  const handleSelectCategory = (catId: string) => {
    filters.resetAllFilters(); // Limpiamos todos los modales y rangos al cambiar de categoría
    router.push(`/?cat=${encodeURIComponent(catId)}`);
  };

  const goHome = () => { router.push('/'); };

  const isHomeView = !urlCategory;

  const dropdownCategories = useMemo(() => {
    const baseCats = CATEGORIAS_INICIO.filter(c => c.id !== 'ALL').map(c => c.id);
    const loadedCats = machines.map(m => m.categoria_tarea).filter(Boolean);
    return [...new Set([...baseCats, ...loadedCats])].sort();
  }, [machines]);

  // --- CÁLCULOS PRECISOS DE PAGINACIÓN ---
  const totalPages = Math.ceil(finalMachines.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = finalMachines.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authChecking) return <div className="min-h-screen bg-slate-900 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">

      <nav className="bg-slate-900 text-white p-4 shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <button onClick={goHome} className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
            WebSourcing <span className="text-orange-500">Live</span>
          </button>

          {!isHomeView && (
            <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
              <span className="text-slate-300 font-medium hidden md:inline text-sm">Resultados:</span>
              <span className="text-orange-400 font-bold text-lg">
                {finalMachines.length > 0
                  ? `${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, finalMachines.length)} de ${finalMachines.length}`
                  : '0'}
              </span>
            </div>
          )}

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
              <button onClick={() => setDataSource('AGENCIAS')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${dataSource === 'AGENCIAS' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                Agencias
              </button>
              <button onClick={() => setDataSource('FACEBOOK')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${dataSource === 'FACEBOOK' ? 'bg-[#1877F2] text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Marketplace
              </button>
              <button onClick={() => setDataSource('ALL')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${dataSource === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}>
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
                onClearAll={filters.resetAllFilters}
                onCategoryChange={(val: string) => {
                  router.push(`/?cat=${encodeURIComponent(val)}`);
                }}
              />
            </div>

            <main className="flex-1 w-full flex flex-col min-h-screen">
              {loading ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
                  <p className="text-slate-500 mt-4 font-medium italic">Descargando catálogo completo...</p>
                </div>
              ) : finalMachines.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-700">Sin coincidencias con estos filtros</h3>
                  <p className="text-slate-500 mt-2 mb-6">Prueba habilitar "Call For Price" o limpiar los filtros de ubicación y año.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 grow content-start">
                    {currentItems.map((machine) => <MachineCard key={machine.id} machine={machine} />)}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 mb-8 flex justify-center items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg font-bold transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>

                      <div className="flex gap-1 overflow-x-auto max-w-50 sm:max-w-none no-scrollbar">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-10 h-10 rounded-lg font-bold text-sm transition-all shrink-0 ${currentPage === page ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg font-bold transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
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