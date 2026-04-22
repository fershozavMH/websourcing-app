import { useState, useCallback } from 'react';
import { collection, query, orderBy, where, getDocs, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Machine } from '@/types';

const MACHINES_PER_PAGE = 28;

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchInitialData = useCallback(async (categoryToFetch: string) => {
    setLoading(true); 
    setMachines([]);
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
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  const loadMoreData = async (categoryValue: string) => {
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
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingMore(false); 
    }
  };

  return {
    machines,
    setMachines,
    loading,
    lastUpdate,
    hasMore,
    loadingMore,
    fetchInitialData,
    loadMoreData
  };
};