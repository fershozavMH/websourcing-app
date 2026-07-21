'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ErroresSeguridadTab from './ErroresSeguridadTab';
import ActividadUsuariosTab from './ActividadUsuariosTab';
import AdminsPanel from './AdminsPanel';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

type AccessState = 'checking' | 'denied' | 'granted';

export default function MonitoreoPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [access, setAccess] = useState<AccessState>('checking');
  const [tab, setTab] = useState<'errores' | 'actividad'>('errores');
  useInactivityLogout(access === 'granted');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const token = await currentUser.getIdToken();
      const res = await fetch('/api/monitoreo/admins', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccess(res.ok ? 'granted' : 'denied');
    })();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (authChecking || access === 'checking') {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (access === 'denied') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 text-center">
        <p className="text-white text-lg font-bold mb-2">Acceso no autorizado</p>
        <p className="text-slate-400 text-sm mb-6">Tu cuenta no tiene permisos para el Centro de Monitoreo.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-slate-900 text-white p-4 shadow-md border-b-4 border-red-600 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              WebSourcing <span className="text-orange-500">Live</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              Monitoreo
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => router.push('/')}
              className="text-xs font-bold text-orange-400 hover:text-white bg-slate-800 hover:bg-orange-500 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm whitespace-nowrap"
            >
              ← Sourcing
            </button>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-red-500 px-4 py-2.5 rounded-lg border border-slate-700 transition-colors shadow-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('errores')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              tab === 'errores' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Errores y Seguridad
          </button>
          <button
            onClick={() => setTab('actividad')}
            className={`px-4 py-2 rounded-lg text-sm font-bold ${
              tab === 'actividad' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Actividad de Usuarios
          </button>
        </div>

        {tab === 'errores' ? <ErroresSeguridadTab /> : <ActividadUsuariosTab />}

        <AdminsPanel />
      </div>
    </div>
  );
}
