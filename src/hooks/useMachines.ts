import { useState, useCallback, useEffect } from 'react';
import { collection, query, orderBy, where, getDocs, limit, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Machine } from '@/types';
import { CAT, normalizeCategory, TRACTOCAMION_SUBTYPES } from '@/constants/machineCategories';
import { FIREBASE_COLLECTION, MAX_FETCH_LIMIT } from '@/constants/appConfig';
import { logError } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';

export const useMachines = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [platformCount, setPlatformCount] = useState<number | null>(null);
  const [categoryCount, setCategoryCount] = useState<number | null>(null);

  useEffect(() => {
    getCountFromServer(collection(db, FIREBASE_COLLECTION))
      .then(snap => setPlatformCount(snap.data().count))
      .catch(() => {});
  }, []);

  const fetchInitialData = useCallback(async (categoryToFetch: string) => {
    setLoading(true);
    setMachines([]);
    setCategoryCount(null);
    try {
      const colRef = collection(db, FIREBASE_COLLECTION);
      const categoryForQuery = normalizeCategory(categoryToFetch);
      const subtypes = [...TRACTOCAMION_SUBTYPES];

      const q = categoryForQuery === CAT.ALL
        ? query(colRef, orderBy('timestamp', 'desc'), limit(MAX_FETCH_LIMIT))
        : categoryForQuery === CAT.TRACTOCAMIONES
          ? query(colRef, where('categoria_tarea', 'in', subtypes), orderBy('timestamp', 'desc'), limit(MAX_FETCH_LIMIT))
          : query(colRef, where('categoria_tarea', '==', categoryForQuery), orderBy('timestamp', 'desc'), limit(MAX_FETCH_LIMIT));

      const countQ = categoryForQuery === CAT.ALL
        ? query(colRef)
        : categoryForQuery === CAT.TRACTOCAMIONES
          ? query(colRef, where('categoria_tarea', 'in', subtypes))
          : query(colRef, where('categoria_tarea', '==', categoryForQuery));

      const [snapshot, countSnap] = await Promise.all([
        getDocs(q),
        getCountFromServer(countQ),
      ]);

      const newMachines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
      setMachines(newMachines);
      setCategoryCount(countSnap.data().count);
      setLastUpdate(new Date());
    } catch (err: any) {
      logError(LOG_CODES.ERR_FETCH_MACHINES, err?.message ?? 'Error al obtener máquinas', {
        stack: err?.stack,
        metadata: { categoryToFetch },
      });
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
    platformCount,
    categoryCount,
  };
};
