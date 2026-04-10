'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
// IMPORTAMOS getDocs PARA LA LECTURA ÚNICA
import { collection, query, orderBy, onSnapshot, getDocs, DocumentData } from 'firebase/firestore';
import type { Machine, SortOption } from '@/types';
import Filters from '@/components/Filters';
import MachineCard from '@/components/MachineCard';

export default function Home() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState('ALL');
  const [priceValue, setPriceValue] = useState('');
  const [sortValue, setSortValue] = useState<SortOption>('recent');

  const categories = useMemo(() => {
    const cats = [...new Set(machines.map(m => m.categoria_tarea).filter(Boolean))];
    return cats.sort();
  }, [machines]);

  // 1. EL ESCUCHA EN TIEMPO REAL (Se ejecuta solo una vez al abrir la página)
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

    // Si cierras la pestaña, cerramos el tubo. ¡Excelente práctica!
    return () => unsubscribe();
  }, []);

  // 2. EL BOTÓN DE REFRESCO MANUAL (Lectura única, sin fugas de memoria)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'maquinaria_aprobada'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q); // Petición limpia y cerrada
      
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

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10">
      <nav className="bg-slate-900 text-white p-6 shadow-md border-b-4 border-orange-500 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              WebSourcing <span className="text-orange-500">Live</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Inteligencia de Adquisición para Machinery Hunters</p>
          </div>
          <div className="bg-slate-800 px-5 py-2 rounded-lg border border-slate-700 shadow-inner flex items-center gap-3">
            <span className="text-slate-300 font-medium">Inventario Rentable:</span> 
            <span className="text-orange-400 font-bold text-2xl">{filteredMachines.length}</span>
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