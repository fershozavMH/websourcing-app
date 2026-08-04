'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';

interface AdminEntry {
  email: string;
  addedBy: string;
  active: boolean;
}

export default function AdminsPanel() {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadAdmins = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/monitoreo/admins', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json().catch(() => null);
      if (data?.success) setAdmins(data.admins);
    } catch {
      // se deja la lista vacía; el mensaje de error del formulario cubre el caso de escritura
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/monitoreo/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        setNewEmail('');
        setMessage('Correo agregado con acceso al centro de monitoreo.');
        loadAdmins();
      } else {
        setMessage(data?.error ?? 'Error al agregar el correo.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-5">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Accesos al Centro de Monitoreo</h3>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="email"
          required
          placeholder="correo@machineryhunters.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? 'Agregando…' : 'Agregar acceso'}
        </button>
      </form>

      {message && <p className="text-sm text-slate-600 mb-4">{message}</p>}

      <ul className="space-y-1">
        {admins.map((admin) => (
          <li key={admin.email} className="text-sm text-slate-700 flex justify-between border-b border-slate-100 py-2">
            <span>{admin.email}</span>
            <span className="text-slate-400 text-xs">agregado por {admin.addedBy}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
