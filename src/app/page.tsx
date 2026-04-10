'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase'; // Combinamos las importaciones
import { collection, query, orderBy, onSnapshot, getDocs, DocumentData } from 'firebase/firestore';
import type { Machine, SortOption } from '@/types';
import Filters from '@/components/Filters';
import MachineCard from '@/components/MachineCard';

export default function Home() {
  // ================= ESTADOS DE AUTENTICACIÓN =================
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // ================= ESTADOS DE DATOS =================
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('ALL');
  const [priceValue, setPriceValue] = useState('');
  const [sortValue, setSortValue] = useState<SortOption>('recent');

  // ================= EFECTOS Y LÓGICA =================

  // 1. Escudo de Seguridad
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        router.push('/login');
      }
      setAuthChecking(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const categories = useMemo(() => {
    const cats = [...new Set(machines.map(m => m.categoria_tarea).filter(Boolean))];
    return cats.sort();
  }, [machines]);

  // 2. Escucha en tiempo real (Catálogo)
  useEffect(() => {
    const q = query(collection(db, 'maquinaria_aprobada'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        const newMachines: Machine[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as DocumentData;
          newMachines.push({ id: doc.id, ...data } as Machine);
        });
        
        setMachines(newMachines);
        setLoading(false);
        setLastUpdate(new Date());
      },
      (error) => {
        console.error('Error en tiempo real:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Botón de refresco manual
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'maquinaria_aprobada'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q); 
      
      const newMachines: Machine[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        newMachines.push({ id: doc.id, ...data } as Machine);
      });
      
      setMachines(newMachines);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error al forzar la actualización:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const filteredMachines = useMemo(() => {
    const term = searchValue.toLowerCase();
    const maxPrice = priceValue ? parseFloat(priceValue) : Infinity;
    
    let filtered = machines.filter(machine => {
      const matchesSearch = machine.titulo.toLowerCase().includes(term);
      const matchesCategory = categoryValue === 'ALL' || machine.categoria_tarea === categoryValue;
      const matchesPrice = machine.precio <= maxPrice;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    switch (sortValue) {
      case 'price_asc':
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case 'year_desc':
        filtered.sort((a, b) => b.año - a.año);
        break;
    }

    return filtered;
  }, [machines, searchValue, categoryValue, priceValue, sortValue]);


  // ================= BARRERAS DE RENDERIZADO =================
  
  // Si está verificando la sesión, mostramos pantalla de carga naranja
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Si no está logueado, no renderizamos nada (el useEffect ya lo está mandando a /login)
  if (!isAuthenticated) return null;


  // ================= RENDERIZADO PRINCIPAL (AUTENTICADO) =================
  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      
      {/* NAVBAR CON BOTÓN DE CERRAR SESIÓN */}
      <nav className="bg-slate-900 text-white p-6 shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              WebSourcing <span className="text-orange-500">Live</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Inteligencia de Adquisición para Machinery Hunters</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
              <span className="text-slate-300 font-medium">Inventario Rentable:</span> 
              <span className="text-orange-400 font-bold text-2xl">{filteredMachines.length}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500 border border-slate-700 hover:border-red-600 px-3 py-2 rounded transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <Filters
        categories={categories}
        onSearchChange={setSearchValue}
        onCategoryChange={setCategoryValue}
        onPriceChange={setPriceValue}
        onSortChange={setSortValue}
        onRefresh={handleRefresh}
        searchValue={searchValue}
        categoryValue={categoryValue}
        priceValue={priceValue}
        sortValue={sortValue}
        isRefreshing={isRefreshing}
        lastUpdate={lastUpdate}
      />

      <main className="max-w-7xl mx-auto px-6 mt-2">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
            <p className="text-slate-500 mt-4 font-medium">Extrayendo datos de la nube...</p>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 mt-4 shadow-sm">
            <h3 className="text-xl font-bold text-slate-700">No se encontraron equipos</h3>
            <p className="text-slate-500 mt-2">Intenta ajustar los filtros de búsqueda o categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredMachines.map((machine) => (
              <MachineCard key={machine.id} machine={machine} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}