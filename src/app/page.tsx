'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Filters from '@/components/Filters';
import MachineCard from '@/components/MachineCard';
import MapaTab from '@/components/MapaTab';

import { CATEGORIAS_INICIO } from '@/constants/categories';
import { TRACTOCAMION_SUBTYPES } from '@/constants/machineCategories';
import { useMachines } from '@/hooks/useMachines';
import { useMachineFilters, type InitialFilters } from '@/hooks/useMachineFilters';
import { useMonitoreoAccess } from '@/hooks/useMonitoreoAccess';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { ITEMS_PER_PAGE } from '@/constants/appConfig';
import type { SortOption } from '@/types';
import { logActivity } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-52 bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="flex justify-between">
        <div className="h-2.5 bg-slate-200 rounded w-1/3" />
        <div className="h-2.5 bg-slate-200 rounded w-1/5" />
      </div>
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
      </div>
      <div className="h-9 bg-slate-200 rounded mt-1" />
    </div>
  </div>
);

function getPaginationRange(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
  if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

const VALID_SORTS: SortOption[] = ['recent', 'price_asc', 'price_desc', 'year_desc'];

function CatalogApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get('cat');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const hasMonitoreoAccess = useMonitoreoAccess(currentUser);
  useInactivityLogout(isAuthenticated);

  const [currentPage, setCurrentPage] = useState(1);
  const [dataSource, setDataSource] = useState<'AGENCIAS' | 'FACEBOOK' | 'ALL'>(
    (searchParams.get('source') as 'AGENCIAS' | 'FACEBOOK' | 'ALL') || 'AGENCIAS'
  );
  const [viewMode, setViewMode] = useState<'catalogo' | 'mapa'>(
    (searchParams.get('view') as 'catalogo' | 'mapa') || 'catalogo'
  );

  // Leer URL una sola vez al montar para inicializar filtros
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialFilters = useMemo((): InitialFilters => {
    const raw = (key: string) => searchParams.get(key) ?? '';
    const list = (key: string) => searchParams.get(key)?.split('|').filter(Boolean) ?? [];
    const sort = raw('sort') as SortOption;
    return {
      searchValue:       raw('q'),
      sortValue:         VALID_SORTS.includes(sort) ? sort : 'recent',
      selectedCountries: searchParams.get('countries')?.split(',').filter(Boolean) ?? [],
      selectedStates:    list('states'),
      selectedBrands:    list('brands'),
      selectedModels:    list('models'),
      minYearValue:      raw('min_year'),
      maxYearValue:      raw('max_year'),
      minPriceValue:     raw('min_price'),
      maxPriceValue:     raw('max_price'),
      minHoursValue:     raw('min_hours'),
      maxHoursValue:     raw('max_hours'),
      minMilesValue:     raw('min_miles'),
      maxMilesValue:     raw('max_miles'),
    };
  }, []); // [] intencional: la URL inicial es solo el punto de partida, el estado maneja el resto

  const { machines, setMachines, loading, lastUpdate, fetchInitialData, platformCount, categoryCount } = useMachines();
  const filters = useMachineFilters(machines, initialFilters);

  const finalMachines = useMemo(() => {
    return filters.filteredMachines.filter(m => {
      if (dataSource === 'FACEBOOK' && m.pagina !== 'Facebook Marketplace') return false;
      if (dataSource === 'AGENCIAS' && m.pagina === 'Facebook Marketplace') return false;
      return true;
    });
  }, [filters.filteredMachines, dataSource]);

  // For the map: always show full category distribution regardless of state filter
  const machinesForMap = useMemo(() => {
    return machines.filter(m => {
      if (dataSource === 'FACEBOOK' && m.pagina !== 'Facebook Marketplace') return false;
      if (dataSource === 'AGENCIAS' && m.pagina === 'Facebook Marketplace') return false;
      return true;
    });
  }, [machines, dataSource]);

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

  // Sincronizar filtros → URL para que sea compartible.
  // Usa filters.categoryValue (con fallback a urlCategory) para que el cambio de
  // categoría desde el dropdown no sea sobreescrito por el urlCategory viejo.
  useEffect(() => {
    if (!urlCategory) return;
    // Cuando el usuario cambia la categoría desde el dropdown, filters.categoryValue ya tiene
    // el nuevo valor antes de que urlCategory se actualice. Lo usamos para evitar que
    // router.replace use el urlCategory viejo y sobreescriba el cambio de categoría.
    const catParam = filters.categoryValue !== 'ALL' ? filters.categoryValue : urlCategory;
    const p = new URLSearchParams();
    p.set('cat', catParam);
    if (dataSource !== 'AGENCIAS')                p.set('source', dataSource);
    if (viewMode   !== 'catalogo')                p.set('view',   viewMode);
    if (filters.searchValue)                      p.set('q', filters.searchValue);
    if (filters.selectedCountries.length > 0)     p.set('countries', filters.selectedCountries.join(','));
    if (filters.selectedStates.length   > 0)      p.set('states',    filters.selectedStates.join('|'));
    if (filters.selectedBrands.length   > 0)      p.set('brands',    filters.selectedBrands.join('|'));
    if (filters.selectedModels.length   > 0)      p.set('models',    filters.selectedModels.join('|'));
    if (filters.minYearValue)                     p.set('min_year',  filters.minYearValue);
    if (filters.maxYearValue)                     p.set('max_year',  filters.maxYearValue);
    if (filters.minPriceValue)                    p.set('min_price', filters.minPriceValue);
    if (filters.maxPriceValue)                    p.set('max_price', filters.maxPriceValue);
    if (filters.minHoursValue)                    p.set('min_hours', filters.minHoursValue);
    if (filters.maxHoursValue)                    p.set('max_hours', filters.maxHoursValue);
    if (filters.minMilesValue)                    p.set('min_miles', filters.minMilesValue);
    if (filters.maxMilesValue)                    p.set('max_miles', filters.maxMilesValue);
    if (filters.sortValue !== 'recent')           p.set('sort', filters.sortValue);
    if (window.location.search !== `?${p.toString()}`) {
      router.replace(`/?${p.toString()}`, { scroll: false });
    }
  }, [
    urlCategory, filters.categoryValue, dataSource, viewMode,
    filters.searchValue, filters.selectedCountries, filters.selectedStates,
    filters.selectedBrands, filters.selectedModels,
    filters.minYearValue, filters.maxYearValue,
    filters.minPriceValue, filters.maxPriceValue,
    filters.minHoursValue, filters.maxHoursValue,
    filters.minMilesValue, filters.maxMilesValue,
    filters.sortValue,
    // router es estable, no genera loops
  ]);

  const handleLogout = async () => { logActivity(LOG_CODES.ACT_LOGOUT, 'Cierre de sesión'); await signOut(auth); router.push('/login'); };

  const handleSelectCategory = (catId: string) => {
    filters.resetAllFilters();
    router.push(`/?cat=${encodeURIComponent(catId)}`);
  };

  const goHome = () => { router.push('/'); };

  const handleEstadosApply = (estadosEntries: string[]) => {
    filters.onSelectedStatesChange(estadosEntries);
    if (estadosEntries.length > 0) filters.onSelectedCountriesChange(['USA']);
    setViewMode('catalogo');
  };

  const isHomeView = !urlCategory;

  const dropdownCategories = useMemo(() => {
    const baseCats = CATEGORIAS_INICIO.filter(c => c.id !== 'ALL').map(c => c.id);
    const loadedCats = machines.map(m => m.categoria_tarea).filter(cat => Boolean(cat) && !TRACTOCAMION_SUBTYPES.includes(cat));
    return [...new Set([...baseCats, ...loadedCats])].sort();
  }, [machines]);

  const totalPages = Math.ceil(finalMachines.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = finalMachines.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authChecking) return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">

      <nav className="bg-slate-900 text-white p-4 shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <button onClick={goHome} className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
            WebSourcing <span className="text-orange-500">Live</span>
          </button>

          {!isHomeView && !loading && (
            <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-2">
              <span className="text-orange-400 font-bold text-lg">
                {finalMachines.length.toLocaleString()}
              </span>
              {finalMachines.length !== machines.length ? (
                <span className="text-slate-400 text-sm font-medium hidden sm:inline">
                  de {machines.length.toLocaleString()}
                </span>
              ) : categoryCount !== null && categoryCount > machines.length ? (
                <span className="text-slate-400 text-sm font-medium hidden sm:inline">
                  de {categoryCount.toLocaleString()}
                </span>
              ) : null}
              <span className="text-slate-500 text-xs font-medium hidden md:inline">
                {finalMachines.length !== machines.length ? 'resultados' : 'equipos'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => router.push('/subastas')}
              className="text-xs font-bold text-violet-400 hover:text-white bg-slate-800 hover:bg-violet-600 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Subastas
            </button>
            <button
              onClick={() => router.push('/portafolio')}
              className="text-xs font-bold text-emerald-400 hover:text-white bg-slate-800 hover:bg-emerald-600 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Para Portafolio
            </button>
            {hasMonitoreoAccess && (
              <button
                onClick={() => router.push('/monitoreo')}
                className="text-xs font-bold text-red-400 hover:text-white bg-slate-800 hover:bg-red-600 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm whitespace-nowrap"
              >
                Monitoreo
              </button>
            )}

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
            <p className="text-slate-500">
              Selecciona una categoría para explorar el mercado global
              {platformCount !== null && (
                <> · <span className="text-orange-500 font-bold">{platformCount.toLocaleString()}</span> equipos disponibles</>
              )}
            </p>
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

          {/* Barra superior: fuente de datos + toggle de vista */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
            <div className="bg-slate-200 p-1 rounded-xl inline-flex shadow-inner border border-slate-300 overflow-x-auto">
              <button
                onClick={() => setDataSource('AGENCIAS')}
                className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${dataSource === 'AGENCIAS' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Agencias
              </button>
              <button
                onClick={() => setDataSource('FACEBOOK')}
                className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${dataSource === 'FACEBOOK' ? 'bg-[#1877F2] text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <span className="w-2 h-2 bg-current rounded-full shrink-0" aria-hidden="true" />
                Marketplace
              </button>
              <button
                onClick={() => setDataSource('ALL')}
                className={`px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap ${dataSource === 'ALL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Todo
              </button>
            </div>

            {/* Toggle Catálogo / Mapa */}
            <div className="bg-slate-200 p-1 rounded-xl inline-flex shadow-inner border border-slate-300 shrink-0">
              <button
                onClick={() => setViewMode('catalogo')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${viewMode === 'catalogo' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Catálogo
              </button>
              <button
                onClick={() => setViewMode('mapa')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${viewMode === 'mapa' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Mapa
              </button>
            </div>
          </div>

          {viewMode === 'mapa' ? (
            <MapaTab machines={machinesForMap} selectedEstados={filters.selectedStates} onEstadosApply={handleEstadosApply} />
          ) : (
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
                  filters.setCategoryValue(val);
                  filters.resetAllFilters();
                }}
              />
            </div>

            <main className="flex-1 w-full flex flex-col min-h-screen">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : finalMachines.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-slate-700">Sin coincidencias con estos filtros</h3>
                  <p className="text-slate-500 mt-2 mb-6">Prueba habilitar "Call For Price" o ajusta los filtros de ubicación y año.</p>
                  <button
                    onClick={filters.resetAllFilters}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-md shadow-orange-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar todos los filtros
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 grow content-start">
                    {currentItems.map((machine) => <MachineCard key={machine.id} machine={machine} />)}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-10 mb-8 flex justify-center items-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        aria-label="Página anterior"
                        className={`p-2 rounded-lg font-bold transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>

                      {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                        page === '...'
                          ? <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold select-none">…</span>
                          : (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page as number)}
                              aria-label={`Ir a página ${page}`}
                              aria-current={currentPage === page ? 'page' : undefined}
                              className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === page ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              {page}
                            </button>
                          )
                      )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        aria-label="Página siguiente"
                        className={`p-2 rounded-lg font-bold transition-colors ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" /></div>}>
      <CatalogApp />
    </Suspense>
  );
}
