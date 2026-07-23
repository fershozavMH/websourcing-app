'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import SubastaCard from '@/components/SubastaCard';
import CalendarioSubastas from '@/components/CalendarioSubastas';
import type { Subasta } from '@/types';
import { SUBASTAS_COLLECTION, MAX_FETCH_LIMIT, ITEMS_PER_PAGE } from '@/constants/appConfig';

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="h-48 bg-slate-200" />
    <div className="p-4 space-y-3">
      <div className="h-2.5 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-full" />
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
      </div>
      <div className="h-9 bg-slate-200 rounded" />
    </div>
  </div>
);

function getPaginationRange(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
  if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function toDate(ts: any): Date | null {
  if (!ts) return null;
  try { return ts.toDate ? ts.toDate() : new Date(ts); } catch { return null; }
}

export default function SubastasPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking]   = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser]     = useState<User | null>(null);

  const [subastas, setSubastas]           = useState<Subasta[]>([]);
  const [loading, setLoading]             = useState(false);
  const [fetchError, setFetchError]       = useState<string | null>(null);

  const [viewMode, setViewMode]           = useState<'lista' | 'calendario'>('lista');
  const [search, setSearch]               = useState('');
  const [estadoFilter, setEstadoFilter]   = useState('');
  const [fuenteFilter, setFuenteFilter]   = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [soloCalendario, setSoloCalendario] = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { setIsAuthenticated(true); setCurrentUser(user); }
      else router.push('/login');
      setAuthChecking(false);
    });
    return () => unsub();
  }, [router]);

  // Fetch
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchSubastas = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, SUBASTAS_COLLECTION), limit(MAX_FETCH_LIMIT)));
        const docs: Subasta[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subasta));
        // Ordenar por fecha_subasta asc en cliente
        docs.sort((a, b) => {
          const da = toDate(a.fecha_subasta);
          const db_ = toDate(b.fecha_subasta);
          if (!da && !db_) return 0;
          if (!da) return 1;
          if (!db_) return -1;
          return da.getTime() - db_.getTime();
        });
        setSubastas(docs);
      } catch (err: any) {
        setFetchError(err?.message ?? 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchSubastas();
  }, [isAuthenticated]);

  const handleToggleCalendario = (id: string, actual: boolean) => {
    setSubastas(prev =>
      prev.map(s => s.id === id ? { ...s, en_calendario: !actual } : s)
    );
  };

  const fuentes = useMemo(() => [...new Set(subastas.map(s => s.fuente).filter(Boolean) as string[])].sort(), [subastas]);
  const estados = useMemo(() => [...new Set(subastas.map(s => s.estado).filter(Boolean) as string[])].sort(), [subastas]);
  const categorias = useMemo(() => [...new Set(subastas.map(s => s.categoria).filter(Boolean) as string[])].sort(), [subastas]);

  const filtered = useMemo(() => {
    let result = subastas;

    if (soloCalendario)  result = result.filter(s => s.en_calendario);
    if (estadoFilter)    result = result.filter(s => s.estado === estadoFilter);
    if (fuenteFilter)    result = result.filter(s => s.fuente === fuenteFilter);
    if (categoriaFilter) result = result.filter(s => s.categoria === categoriaFilter);

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(s =>
        s.titulo?.toLowerCase().includes(term) ||
        s.marca?.toLowerCase().includes(term) ||
        s.modelo?.toLowerCase().includes(term) ||
        s.ubicacion?.toLowerCase().includes(term) ||
        s.descripcion?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [subastas, search, estadoFilter, fuenteFilter, categoriaFilter, soloCalendario]);

  const subastasEnCalendario = useMemo(() => subastas.filter(s => s.en_calendario), [subastas]);

  useEffect(() => { setCurrentPage(1); }, [filtered]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleLogout = async () => { await signOut(auth); router.push('/login'); };

  if (authChecking) return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">

      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md border-b-4 border-violet-600 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              WebSourcing <span className="text-orange-500">Live</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-violet-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Subastas
            </span>
          </div>

          {!loading && (
            <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
              <span className="text-slate-300 font-medium hidden md:inline text-sm">Subastas:</span>
              <span className="text-violet-400 font-bold text-lg">{filtered.length}</span>
              {subastasEnCalendario.length > 0 && (
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  · {subastasEnCalendario.length} en calendario
                </span>
              )}
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
                <div className="bg-violet-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-lg shadow-sm border-2 border-slate-800">
                  {currentUser.email?.charAt(0).toUpperCase() ?? 'U'}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 mt-6">

        {/* Barra de controles */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6 items-start lg:items-center justify-between">

          {/* Filtros izquierda */}
          <div className="flex flex-wrap gap-2 flex-1">
            {/* Búsqueda */}
            <div className="relative min-w-56">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar subasta..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
              />
            </div>

            {/* Estado */}
            {estados.length > 0 && (
              <select
                value={estadoFilter}
                onChange={e => setEstadoFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
              >
                <option value="">Todos los estados</option>
                {estados.map(e => (
                  <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                ))}
              </select>
            )}

            {/* Categoría */}
            {categorias.length > 0 && (
              <select
                value={categoriaFilter}
                onChange={e => setCategoriaFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
              >
                <option value="">Todas las categorías</option>
                {categorias.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}

            {/* Fuente */}
            {fuentes.length > 0 && (
              <select
                value={fuenteFilter}
                onChange={e => setFuenteFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400 shadow-sm"
              >
                <option value="">Todas las fuentes</option>
                {fuentes.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            )}

            {/* Solo calendario */}
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 cursor-pointer hover:border-violet-400 transition-colors shadow-sm select-none">
              <input
                type="checkbox"
                checked={soloCalendario}
                onChange={e => setSoloCalendario(e.target.checked)}
                className="accent-violet-600 w-4 h-4"
              />
              Solo en calendario
            </label>
          </div>

          {/* Toggle vista derecha */}
          <div className="bg-slate-200 p-1 rounded-xl inline-flex shadow-inner border border-slate-300 shrink-0">
            <button
              onClick={() => setViewMode('lista')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${viewMode === 'lista' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Lista
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${viewMode === 'calendario' ? 'bg-white text-slate-800 shadow-md' : 'text-slate-500 hover:text-slate-600'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario
            </button>
          </div>
        </div>

        {/* Contenido */}
        {fetchError ? (
          <div className="text-center py-20 bg-red-50 rounded-2xl border-2 border-dashed border-red-200 shadow-sm">
            <h3 className="text-xl font-bold text-red-700">Error al cargar subastas</h3>
            <p className="text-red-500 mt-2 font-mono text-sm">{fetchError}</p>
            <p className="text-slate-500 mt-3 text-sm max-w-md mx-auto">
              Revisa las reglas de seguridad de Firestore — la colección <code className="bg-slate-100 px-1 rounded">subastas</code> debe permitir lectura a usuarios autenticados.
            </p>
          </div>

        ) : viewMode === 'calendario' ? (
          <CalendarioSubastas subastas={subastasEnCalendario} />

        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>

        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {subastas.length === 0 ? (
              <>
                <h3 className="text-xl font-bold text-slate-700">Sin subastas disponibles</h3>
                <p className="text-slate-500 mt-2">El scraper aún no ha cargado subastas a esta colección.</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-700">Sin coincidencias</h3>
                <p className="text-slate-500 mt-2 mb-6">Ajusta la búsqueda o los filtros.</p>
                <button
                  onClick={() => { setSearch(''); setEstadoFilter(''); setFuenteFilter(''); setCategoriaFilter(''); setSoloCalendario(false); }}
                  className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-md"
                >
                  Limpiar filtros
                </button>
              </>
            )}
          </div>

        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentItems.map(s => (
                <SubastaCard
                  key={s.id}
                  subasta={s}
                  onToggleCalendario={handleToggleCalendario}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 mb-8 flex justify-center items-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit mx-auto">
                <button
                  onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
                        onClick={() => { setCurrentPage(page as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        aria-label={`Ir a página ${page}`}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === page ? 'bg-violet-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {page}
                      </button>
                    )
                )}

                <button
                  onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
      </div>
    </div>
  );
}
