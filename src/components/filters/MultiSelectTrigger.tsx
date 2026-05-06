import React from 'react';

interface Props {
  title: string;
  selected: string[];
  onOpen: () => void;
  onRemove: (val: string) => void;
}

export function MultiSelectTrigger({ title, selected, onOpen, onRemove }: Props) {
  return (
    <div className="space-y-2 animate-fade-in">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</label>
      <button
        onClick={onOpen}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-left hover:border-orange-400 focus:ring-2 focus:ring-orange-500 outline-none transition-all flex justify-between items-center shadow-sm"
      >
        <span className="text-slate-600 font-medium">
          {selected.length > 0 ? `${selected.length} seleccionado${selected.length !== 1 ? 's' : ''}` : 'Seleccionar opciones...'}
        </span>
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 animate-fade-in">
          {selected.map(item => (
            <span key={item} className="bg-orange-100 text-orange-800 text-[11px] pl-2.5 pr-1 py-1 rounded-md flex items-center gap-1.5 font-bold border border-orange-200">
              {item.split(' - ')[0]}
              <button onClick={() => onRemove(item)} aria-label={`Quitar ${item}`} className="hover:bg-orange-200 rounded-full p-1 transition-colors text-orange-600">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
