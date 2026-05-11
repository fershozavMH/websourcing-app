import { useState, useCallback } from 'react';
import { collection, query, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Machine } from '@/types';
import { CAT, normalizeCategory } from '@/constants/machineCategories';
import { FIREBASE_COLLECTION, MAX_FETCH_LIMIT } from '@/constants/appConfig';

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchInitialData = useCallback(async (categoryToFetch: string) => {
    setLoading(true);
    setMachines([]);
    try {
      const colRef = collection(db, FIREBASE_COLLECTION);
      const categoryForQuery = normalizeCategory(categoryToFetch);
      const q = categoryForQuery === CAT.ALL
        ? query(colRef, orderBy('timestamp', 'desc'), limit(MAX_FETCH_LIMIT))
        : query(colRef, where('categoria_tarea', '==', categoryForQuery), orderBy('timestamp', 'desc'), limit(MAX_FETCH_LIMIT));

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
    fetchInitialData,
  };
};
