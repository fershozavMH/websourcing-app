import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { requireAuthenticatedUser } from '@/lib/apiAuth';
import { FIREBASE_COLLECTION } from '@/constants/appConfig';
import { CAT, STATS_CATEGORIES, TRACTOCAMION_SUBTYPES } from '@/constants/machineCategories';

export const dynamic = 'force-dynamic';

// Conteo de maquinaria por categoría, calculado en Firestore con count()
// (no se descargan documentos).
export async function GET(request: Request) {
  const guard = await requireAuthenticatedUser(request);
  if (!guard.ok) return guard.response;

  const col = getFirestore().collection(FIREBASE_COLLECTION);

  const countCategory = async (categoria: string): Promise<number> => {
    const q = categoria === CAT.TRACTOCAMIONES
      ? col.where('categoria_tarea', 'in', [...TRACTOCAMION_SUBTYPES, CAT.TRACTOCAMIONES])
      : col.where('categoria_tarea', '==', categoria);
    return (await q.count().get()).data().count;
  };

  const [totalResult, ...categoryResults] = await Promise.allSettled([
    col.count().get().then(s => s.data().count),
    ...STATS_CATEGORIES.map(countCategory),
  ]);

  const porCategoria: { categoria: string; total: number }[] = [];
  let hayErrores = totalResult.status === 'rejected';
  categoryResults.forEach((r, i) => {
    if (r.status === 'fulfilled') porCategoria.push({ categoria: STATS_CATEGORIES[i], total: r.value });
    else hayErrores = true;
  });
  porCategoria.sort((a, b) => b.total - a.total);

  const total = totalResult.status === 'fulfilled' ? totalResult.value : null;
  const sumaCategorias = porCategoria.reduce((acc, c) => acc + c.total, 0);
  // categoria_tarea es texto libre de los scrapers: lo que no cae en una categoría conocida va a "Otros".
  const otros = total !== null && !hayErrores ? Math.max(total - sumaCategorias, 0) : null;

  if (porCategoria.length === 0) {
    return NextResponse.json({ success: false, error: 'No se pudieron obtener las estadísticas.' }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, porCategoria, otros, total, parcial: hayErrores },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
