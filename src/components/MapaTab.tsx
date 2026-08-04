'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import type { Machine } from '@/types';

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_MAPPER: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia',
};

// Full state name → "XX - Full Name" format used by the filter system
const FULL_NAME_TO_ENTRY: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_MAPPER).map(([abbr, full]) => [full, `${abbr} - ${full}`])
);

interface MapaTabProps {
  machines: Machine[];
  selectedEstados?: string[]; // "TX - Texas" format from parent filter
  onEstadosApply?: (estados: string[]) => void;
}

interface EstadoConteo {
  id: string;
  cantidad: number;
}

function extractState(ubicacion: string): string {
  const texto = String(ubicacion).toUpperCase().trim();

  for (const sigla of Object.keys(STATE_MAPPER)) {
    if (new RegExp(`\\b${sigla}\\b`).test(texto)) {
      return STATE_MAPPER[sigla];
    }
  }

  for (const nombre of Object.values(STATE_MAPPER)) {
    if (texto.includes(nombre.toUpperCase())) {
      return nombre;
    }
  }

  return '';
}

export default function MapaTab({ machines, selectedEstados = [], onEstadosApply }: MapaTabProps) {
  const selectedFullNames = useMemo(
    () => selectedEstados.map(entry => entry.split(' - ')[1] || entry),
    [selectedEstados]
  );

  const [pendingEstados, setPendingEstados] = useState<string[]>(selectedFullNames);
  const [estadoHover, setEstadoHover] = useState<{ nombre: string; cant: number } | null>(null);

  // Sync when parent applies or clears state filters
  useEffect(() => {
    setPendingEstados(selectedFullNames);
  }, [selectedFullNames]);

  const datosEstados = useMemo<EstadoConteo[]>(() => {
    const conteo: Record<string, number> = {};
    for (const m of machines) {
      const estado = extractState(m.ubicacion || '');
      if (estado) conteo[estado] = (conteo[estado] || 0) + 1;
    }
    return Object.entries(conteo).map(([id, cantidad]) => ({ id, cantidad }));
  }, [machines]);

  const colorScale = useMemo(() => {
    const cantidades = datosEstados.map(d => d.cantidad);
    return scaleQuantile<string>()
      .domain(cantidades.length > 0 ? cantidades : [0, 10])
      .range(['#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c']);
  }, [datosEstados]);

  const handleGeoClick = (nombre: string, cantidad: number) => {
    if (cantidad === 0) return;
    setPendingEstados(prev =>
      prev.includes(nombre) ? prev.filter(e => e !== nombre) : [...prev, nombre]
    );
  };

  const handleApply = () => {
    const entries = pendingEstados.map(n => FULL_NAME_TO_ENTRY[n]).filter(Boolean);
    onEstadosApply?.(entries);
  };

  const totalEstados = datosEstados.length;
  const totalMaquinas = machines.length;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* Panel izquierdo: métricas y selección */}
      <div className="lg:col-span-1 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
        <div>
          <h3 className="text-lg font-black text-slate-800">Distribución Geográfica</h3>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">EE.UU.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-orange-500">{totalMaquinas}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Equipos</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-slate-700">{totalEstados}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Estados</p>
          </div>
        </div>

        {/* Hover info */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Estado activo</p>
          <p className="text-xl font-black text-slate-800 truncate">
            {estadoHover ? estadoHover.nombre : '—'}
          </p>
          <p className="text-sm font-bold text-orange-500 mt-1">
            {estadoHover
              ? `${estadoHover.cant} equipo${estadoHover.cant !== 1 ? 's' : ''}`
              : 'Pasa el cursor sobre un estado'}
          </p>
          {estadoHover && estadoHover.cant > 0 && (
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
              </svg>
              Clic para {pendingEstados.includes(estadoHover.nombre) ? 'deseleccionar' : 'seleccionar'}
            </p>
          )}
        </div>

        {/* Estados seleccionados + botón Aplicar */}
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Estados seleccionados</p>
          {pendingEstados.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Haz clic en estados del mapa</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {pendingEstados.map(nombre => (
                <span
                  key={nombre}
                  className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-orange-200"
                >
                  {nombre}
                  <button
                    onClick={() => setPendingEstados(prev => prev.filter(e => e !== nombre))}
                    aria-label={`Quitar ${nombre}`}
                    className="text-orange-400 hover:text-orange-700 transition-colors ml-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {pendingEstados.length > 0 && (
            <button
              onClick={handleApply}
              className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-orange-500/20"
            >
              Aplicar {pendingEstados.length === 1 ? 'filtro' : `filtros (${pendingEstados.length})`}
            </button>
          )}
        </div>

        {/* Top 5 estados */}
        {datosEstados.length > 0 && (
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">Top estados</p>
            <div className="space-y-1.5">
              {[...datosEstados]
                .sort((a, b) => b.cantidad - a.cantidad)
                .slice(0, 5)
                .map(e => (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600 truncate">{e.id}</span>
                    <span className="font-black text-orange-500 ml-2 shrink-0">{e.cantidad}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Leyenda */}
        <div className="mt-auto">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Densidad</p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
            <span>Menos</span>
            <div className="flex h-3 rounded overflow-hidden border border-slate-200">
              {['#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c'].map(c => (
                <div key={c} className="w-4" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>Más</span>
          </div>
        </div>
      </div>

      {/* Panel derecho: mapa SVG */}
      <div className="lg:col-span-3 flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 p-2 relative">
        {machines.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-sm font-bold text-slate-400">Sin datos para mostrar</p>
            <p className="text-xs text-slate-400">Selecciona una categoría para ver la distribución</p>
          </div>
        ) : (
          <ComposableMap projection="geoAlbersUsa" className="w-full h-auto max-h-112.5">
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const nombre = geo.properties.name as string;
                  const datos = datosEstados.find(d => d.id === nombre);
                  const cantidad = datos?.cantidad ?? 0;
                  const isSelected = pendingEstados.includes(nombre);
                  const isHovered = estadoHover?.nombre === nombre;

                  const fill = isSelected
                    ? '#f97316'
                    : cantidad > 0
                      ? colorScale(cantidad)
                      : '#f8fafc';

                  const stroke = isSelected ? '#ea580c' : isHovered ? '#fb923c' : '#cbd5e1';
                  const strokeWidth = isSelected ? 2 : isHovered ? 1.2 : 0.6;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      className="transition-all duration-150 outline-none"
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          outline: 'none',
                          cursor: cantidad > 0 ? 'pointer' : 'default',
                          fill: isSelected ? '#ea580c' : cantidad > 0 ? '#f97316' : '#e2e8f0',
                        },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={() => setEstadoHover({ nombre, cant: cantidad })}
                      onMouseLeave={() => setEstadoHover(null)}
                      onClick={() => handleGeoClick(nombre, cantidad)}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        )}
      </div>

    </div>
  );
}
