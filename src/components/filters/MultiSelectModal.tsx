'use client';

import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  selected: string[];
  onApply: (arr: string[]) => void;
}

export function MultiSelectModal({ isOpen, onClose, title, options, selected, onApply }: Props) {
  const [temp, setTemp] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    if (isOpen) { setTemp(selected); setSearch(''); }
  }, [isOpen, selected]);

  if (!isOpen) return null;

  const filtered = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh] animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h4 className="font-black text-slate-800">{title}</h4>
          <button onClick={onClose} aria-label="Cerrar modal" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {options.length > 6 && (
          <div className="px-4 pt-3 pb-1">
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              autoFocus
            />
          </div>
        )}

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 italic text-center py-4">
              {search ? `Sin resultados para "${search}"` : 'No hay opciones disponibles en esta búsqueda.'}
            </p>
          )}
          {filtered.map(opt => (
            <label key={opt} className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-orange-100">
              <input
                type="checkbox"
                checked={temp.includes(opt)}
                onChange={() => temp.includes(opt) ? setTemp(temp.filter(o => o !== opt)) : setTemp([...temp, opt])}
                className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500 border-slate-300 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">{opt}</span>
            </label>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => { onApply(temp); onClose(); }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-orange-500/20"
          >
            Aplicar ({temp.length} seleccionado{temp.length !== 1 ? 's' : ''})
          </button>
        </div>
      </div>
    </div>
  );
}
