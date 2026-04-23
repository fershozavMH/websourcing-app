import { useState, useCallback } from 'react';
import { collection, query, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Machine } from '@/types';

const MAX_FETCH_LIMIT = 1000; 

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchInitialData = useCallback(async (categoryToFetch: string) => {
    setLoading(true); 
    setMachines([]);
    try {
      const colRef = collection(db, 'maquinaria_aprobada');
      let q = categoryToFetch === 'ALL' 
        ? query(colRef, orderBy('timestamp', 'desc'), limit(MAX_FETCH_LIMIT))
        : query(colRef, where('categoria_tarea', '==', categoryToFetch), orderBy('timestamp', 'desc'), limit(MAX_FETCH_LIMIT));
      
      const snapshot = await getDocs(q); 
      const newMachines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
      setMachines(newMachines);
      setLastUpdate(new Date());
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  return {
    machines,
    setMachines,
    loading,
    lastUpdate,
    fetchInitialData
  };
};