'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import MachineCard from '@/components/MachineCard';
import type { Machine } from '@/types';

const MAX_FETCH_LIMIT = 1000;
const ITEMS_PER_PAGE = 24;

type Tab = 'ERP' | 'MVP';
type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'year_desc';

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

const formatDate = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
};

const SentBadge = ({ machine, tab }: { machine: Machine; tab: Tab }) => {
  const fecha = formatDate(tab === 'ERP' ? machine.fecha_envio_erp : machine.fecha_envio_mvp);
  const accent = tab === 'ERP' ? 'bg-emerald-500' : 'bg-indigo-500';
  const detail = tab === 'ERP'
    ? [fecha, machine.enviado_por, machine.id_erp ? `ID Frappe: ${machine.id_erp}` : null].filter(Boolean).join(' · ')
    : fecha;

  return (
    <div
      className={`absolute top-2 right-2 z-20 ${accent} text-white text-[9px] font-black px-2.5 py-1 rounded shadow uppercase tracking-widest flex items-center gap-1`}
      title={detail || undefined}
    >
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
      </svg>
      {tab === 'ERP' ? 'ERP' : 'MVP'}
    </div>
  );
};

export default function EnviadosPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('ERP');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [currentPage, setCurrentPage] = useState(1);

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
    if (!isAuthenticated) return;
    const fetchMachines = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const colRef = collection(db, 'maquinaria_aprobada');
        const q = query(colRef, limit(MAX_FETCH_LIMIT));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
        setMachines(docs);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        setFetchError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, [isAuthenticated]);

  const sentMachines = useMemo(() => {
    return machines.filter(m =>
      activeTab === 'ERP' ? m.estado_sourcing === 'enviado_erp' : m.enviado_mvp === true
    );
  }, [machines, activeTab]);

  const erpCount = useMemo(() => machines.filter(m => m.estado_sourcing === 'enviado_erp').length, [machines]);
  const mvpCount = useMemo(() => machines.filter(m => m.enviado_mvp === true).length, [machines]);

  const filteredMachines = useMemo(() => {
    let result = sentMachines;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(m =>
        m.id?.toLowerCase().includes(term) ||
        m.titulo?.toLowerCase().includes(term) ||
        m.categoria_tarea?.toLowerCase().includes(term) ||
        m.ubicacion?.toLowerCase().includes(term) ||
        m.modelo?.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case 'price_asc':  return [...result].sort((a, b) => (a.precio || 0) - (b.precio || 0));
      case 'price_desc': return [...result].sort((a, b) => (b.precio || 0) - (a.precio || 0));
      case 'year_desc':  return [...result].sort((a, b) => (b.año || 0) - (a.año || 0));
      default:           return result;
    }
  }, [sentMachines, search, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [filteredMachines]);

  const totalPages = Math.ceil(filteredMachines.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredMachines.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

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

          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
              WebSourcing <span className="text-orange-500">Live</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Enviados
            </span>
          </div>

          {!loading && (
            <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
              <span className="text-slate-300 font-medium hidden md:inline text-sm">Equipos:</span>
              <span className="text-orange-400 font-bold text-lg">
                {filteredMachines.length > 0
                  ? `${indexOfFirstItem + 1}–${Math.min(indexOfLastItem, filteredMachines.length)} de ${filteredMachines.length}`
                  : sentMachines.length > 0 ? '0 resultados' : '0'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-xs font-bold text-orange-400 hover:text-white bg-slate-800 hover:bg-orange-500 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm whitespace-nowrap"
            >
              ← Sourcing
            </button>

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

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 mt-6">

        {/* Tabs ERP / MVP */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('ERP')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border ${activeTab === 'ERP' ? 'bg-emerald-500 text-white border-emerald-500 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}
          >
            Enviadas a ERP <span className="ml-1 opacity-80">({erpCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('MVP')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border ${activeTab === 'MVP' ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
          >
            Enviadas al MVP <span className="ml-1 opacity-80">({mvpCount})</span>
          </button>
        </div>

        {/* Barra de búsqueda y orden */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por ID, título, marca, ubicación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm min-w-40"
          >
            <option value="recent">Más recientes</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="year_desc">Año: más nuevo</option>
          </select>
        </div>

        <main className="flex-1 w-full flex flex-col min-h-screen">
          {fetchError ? (
            <div className="text-center py-20 bg-red-50 rounded-2xl border-2 border-dashed border-red-200 shadow-sm">
              <svg className="w-12 h-12 text-red-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <h3 className="text-xl font-bold text-red-700">Error al cargar los equipos</h3>
              <p className="text-red-500 mt-2 font-mono text-sm">{fetchError}</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredMachines.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {sentMachines.length === 0 ? (
                <>
                  <h3 className="text-xl font-bold text-slate-700">
                    Aún no hay equipos enviados {activeTab === 'ERP' ? 'al ERP' : 'al MVP'}
                  </h3>
                  <p className="text-slate-500 mt-2">Cuando se envíe una máquina desde el catálogo, aparecerá aquí.</p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-700">Sin coincidencias</h3>
                  <p className="text-slate-500 mt-2 mb-6">Ajusta la búsqueda.</p>
                  <button
                    onClick={() => setSearch('')}
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-md"
                  >
                    Limpiar búsqueda
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 grow content-start">
                {currentItems.map(machine => (
                  <div key={machine.id} className="relative">
                    <SentBadge machine={machine} tab={activeTab} />
                    <MachineCard machine={machine} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 mb-8 flex justify-center items-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Página anterior"
                    className={`p-2 rounded-lg font-bold transition-colors ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                    page === '...'
                      ? <span key={`e-${idx}`} className="w-10 h-10 flex items-center justify-center text-slate-400 font-bold select-none">…</span>
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
