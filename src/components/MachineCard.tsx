'use client';

import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import type { Machine } from '@/types';
import { CAT, YELLOW_CATEGORIES, TRACTOCAMION_SUBTYPES } from '@/constants/machineCategories';
import { CURRENCY_LOCALE, CURRENCY, BADGE_COLOR } from '@/constants/appConfig';
import { logError } from '@/lib/logger';
import { LOG_CODES } from '@/constants/logCodes';

export default function MachineCard({ machine }: { machine: Machine }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const isYellow = YELLOW_CATEGORIES.includes(machine.categoria_tarea);

  const formatPrice = (price: number | string) => {
    if (!price || price === 0) return null;
    return new Intl.NumberFormat(CURRENCY_LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 }).format(Number(price));
  };

  const renderUso = () => {
    const millas = machine.uso_millas || machine.uso_motor || 0;
    const horas = machine.uso_horas || machine.uso_bomba || machine.uso || 0;

    if (millas > 0 && horas > 0) {
      return (
        <div className="flex flex-col leading-tight mt-0.5">
          <span className="font-black text-slate-800">{millas.toLocaleString()} mi</span>
          <span className="text-[10px] text-slate-500 font-bold">{horas.toLocaleString()} hrs</span>
        </div>
      );
    }
    if (millas > 0) return <span className="font-black text-slate-800">{millas.toLocaleString()} mi</span>;
    if (horas > 0) return <span className="font-black text-slate-800">{horas.toLocaleString()} hrs</span>;
    return <span className="font-black text-slate-800">N/D</span>;
  };

  const phoneClean = machine.telefono_vendedor ? machine.telefono_vendedor.replace(/[^\d+]/g, '') : '';
  const phoneLink = phoneClean.startsWith('+') ? phoneClean : `+${phoneClean}`;

  const hasImages = machine.imagenes && machine.imagenes.length > 0;
  const imageCount = hasImages ? machine.imagenes.length : 0;

  const handleNextImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (hasImages) setImgIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  };

  const handlePrevImg = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (hasImages) setImgIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  };

  // Validación: ¿Ya fue enviada al ERP?
  // NOTA: Ajusta 'estado_sourcing' si en tu BD se llama diferente
  const yaEnviado = (machine as any).estado_sourcing === 'enviado_erp' || !!(machine as any).id_erp;

  const enviarAERP = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEnviando(true);
    
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const usuarioActual = user?.displayName || user?.email || "Analista_Manual";
      
      const payload = {
        ...machine,
        usuario_sourcing: usuarioActual,
        usuario_email:    user?.email ?? '',
      };

      const res = await fetch('/api/erp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.ya_existia) {
          alert(`Esta máquina ya está registrada en el ERP.\nID Frappe: ${data.id_erp}`);
        } else {
          alert(`¡Máquina enviada con éxito al ERP!\nRegistrado por: ${usuarioActual}\nID Frappe: ${data.id_erp}`);
        }
        (machine as any).estado_sourcing = 'enviado_erp';
        (machine as any).id_erp = data.id_erp;
      } else {
        alert(`Error al enviar: ${data.error}`);
      }
    } catch (error: any) {
      console.error(error);
      logError(LOG_CODES.ERR_ERP_SEND, error?.message ?? 'Error de conexión al enviar máquina al ERP', {
        stack: error?.stack,
        metadata: { machineId: machine.id },
      });
      alert('Hubo un problema de conexión con el servidor.');
    } finally {
      setEnviando(false);
      setMenuAbierto(false);
    }
  };

  const formattedPrice = formatPrice(machine.precio);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 flex flex-col overflow-hidden group h-full relative">

      {/* Menú de Opciones (Botón de 3 puntos naranja) */}
      <div className="absolute top-2 right-2 z-20">
        <button 
          onClick={(e) => { e.preventDefault(); setMenuAbierto(!menuAbierto); }}
          className="bg-white/90 hover:bg-orange-500 text-orange-500 hover:text-white p-1.5 rounded-full backdrop-blur-sm transition-all shadow-sm focus:outline-none"
          aria-label="Opciones"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>

        {menuAbierto && (
          <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-30 overflow-hidden">
            <button
              onClick={enviarAERP}
              disabled={enviando}
              className={`w-full text-left px-4 py-3 text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                yaEnviado
                  ? 'text-emerald-700 hover:bg-emerald-50'
                  : 'text-slate-700 hover:bg-orange-50'
              }`}
            >
              {enviando ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verificando ERP...
                </>
              ) : yaEnviado ? (
                <>
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  Re-enviar al ERP
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                  Enviar a ERP
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Carrusel de imágenes */}
      <div className="relative w-full h-52 bg-slate-100 shrink-0 overflow-hidden">
        {hasImages ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={machine.imagenes[imgIndex]}
              alt={`${machine.titulo} - imagen ${imgIndex + 1} de ${imageCount}`}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />

            {imageCount > 1 && (
              <>
                <button onClick={handlePrevImg} aria-label="Imagen anterior" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleNextImg} aria-label="Imagen siguiente" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-orange-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md z-10">
                  {imgIndex + 1} / {imageCount}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-xs font-medium text-slate-400">Sin imágenes</span>
          </div>
        )}

        <div className="absolute top-2 left-2 text-white text-[9px] font-black px-2.5 py-1 rounded shadow uppercase tracking-widest z-10" style={{ backgroundColor: BADGE_COLOR }}>
          {machine.pagina}
        </div>
      </div>

      {/* Datos del equipo */}
      <div className="p-4 flex flex-col grow">
        <div className="flex justify-between items-start mb-1 gap-2">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest truncate">{machine.categoria_tarea}</p>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
            ID: {machine.id?.substring(0, 6) || 'N/D'}
          </span>
        </div>

        <h4 className="font-bold text-slate-800 text-base leading-snug mb-2 line-clamp-2" title={machine.titulo}>
          {machine.titulo}
        </h4>

        {/* Score IA (sourcing) */}
        {(machine as any).score_ia && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black px-2 py-0.5 rounded border border-green-200">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Aprobada por IA: Score {(machine as any).score_ia}/100
            </span>
          </div>
        )}

        {/* Score de oportunidad y margen (portafolio) */}
        {machine.score_oportunidad && (
          <div className="mb-3 flex flex-wrap gap-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded border ${
              machine.score_oportunidad === 'HIGH'   ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              machine.score_oportunidad === 'MEDIUM' ? 'bg-amber-50   text-amber-700   border-amber-200'   :
                                                       'bg-slate-50   text-slate-600   border-slate-200'
            }`}>
              Oportunidad: {machine.score_oportunidad}
            </span>
            {machine.margen_bruto_estimado != null && machine.margen_bruto_estimado > 0 && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded border border-blue-200">
                Margen: ${machine.margen_bruto_estimado.toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Etiquetas dinámicas por categoría */}
        {(() => {
          const tags: string[] = [];
          if (machine.tiene_martillo)  tags.push('Martillo');
          if (machine.tiene_extension) tags.push('Extensión');
          if (machine.tiene_cabina)    tags.push('Cabina');
          if (machine.tiene_almeja)    tags.push('Almeja');
          if (machine.tiene_ripper)    tags.push('Ripper');
          if (machine.es_4x4)          tags.push('4x4');
          if (machine.tipo_pluma)      tags.push(machine.tipo_pluma);
          // subtipo_elevador y combustible van en la fila de specs de Elevadores, no en tags
          if (machine.subtipo_elevador && machine.subtipo_elevador !== 'ALL' && machine.categoria_tarea !== CAT.ELEVADORES) tags.push(machine.subtipo_elevador);
          if (machine.combustible && machine.categoria_tarea !== CAT.ELEVADORES) tags.push(machine.combustible);
          if (machine.traccion_camion) tags.push(machine.traccion_camion);
          if (machine.ejes_traseros)   tags.push(machine.ejes_traseros);
          if (machine.subtipo_compactadora) tags.push(machine.subtipo_compactadora);
          if (!tags.length) return null;
          return (
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map(t => (
                <span key={t} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                  {t}
                </span>
              ))}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 mt-2">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Precio Venta</p>
            {formattedPrice
              ? <p className="text-lg font-black text-emerald-600 truncate">{formattedPrice}</p>
              : <p className="text-sm font-black text-slate-400 truncate">Consultar precio</p>
            }
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Año</p>
            <p className="text-lg font-black text-slate-800">{machine.año > 0 ? machine.año : 'N/D'}</p>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Uso</p>
            <div className="text-sm truncate">{renderUso()}</div>
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Ubicación</p>
            <p className="text-sm font-bold text-slate-700 truncate" title={machine.ubicacion}>{machine.ubicacion || 'N/D'}</p>
          </div>
        </div>

        {/* Fila de specs técnicos: varía según categoría */}
        {machine.categoria_tarea === CAT.ELEVADORES ? (
          <div className="grid grid-cols-3 divide-x divide-slate-200 bg-slate-50 rounded-lg mb-3 overflow-hidden text-center">
            <div className="px-2 py-2">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Alcance</p>
              <p className="text-[11px] font-bold text-slate-700">{machine.alcance ? `${machine.alcance} ft` : 'N/D'}</p>
            </div>
            <div className="px-2 py-2">
              <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">Subtipo</p>
              <p className="text-[11px] font-bold text-slate-700 truncate">{machine.subtipo_elevador || 'N/D'}</p>
            </div>
            <div className="px-2 py-2">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Combustible</p>
              <p className="text-[11px] font-bold text-slate-700 truncate">{machine.combustible || 'N/D'}</p>
            </div>
          </div>
        ) : (machine.motor || machine.transmision || machine.peso_eje) ? (() => {
          const isTractocamion = TRACTOCAMION_SUBTYPES.includes(machine.categoria_tarea);
          const showMiddle = isTractocamion ? !!machine.peso_eje : !!machine.capacidad;
          return (
            <div className={`grid ${showMiddle ? 'grid-cols-3' : 'grid-cols-2'} divide-x divide-slate-200 bg-slate-50 rounded-lg mb-3 overflow-hidden text-center`}>
              <div className="px-2 py-2">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Motor</p>
                <p className="text-[11px] font-bold text-slate-700 truncate">{machine.motor || 'N/D'}</p>
              </div>
              {showMiddle && (
                <div className="px-2 py-2">
                  {isTractocamion ? (
                    <>
                      <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">Peso Eje</p>
                      <p className="text-[11px] font-bold text-slate-700">{machine.peso_eje} ton</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">Capacidad</p>
                      <p className="text-[11px] font-bold text-slate-700 truncate">{machine.capacidad}</p>
                    </>
                  )}
                </div>
              )}
              <div className="px-2 py-2">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Transm.</p>
                <p className="text-[11px] font-bold text-slate-700 truncate">{machine.transmision || 'N/D'}</p>
              </div>
            </div>
          );
        })() : null}

        {/* Footer: teléfono y botón */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
          <a href={`tel:${phoneLink}`} className="flex items-center gap-1.5 group cursor-pointer hover:bg-orange-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-orange-100 overflow-hidden max-w-[50%]">
            <div className="bg-orange-100 p-1.5 rounded-md group-hover:bg-orange-500 transition-colors shrink-0">
              <svg className="w-2.5 h-2.5 text-orange-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-orange-600 transition-colors truncate">
              {machine.telefono_vendedor && machine.telefono_vendedor !== 'N/D' ? machine.telefono_vendedor : 'Llamar'}
            </span>
          </a>
          <a href={machine.url} target="_blank" rel="noopener noreferrer" className="shrink-0 bg-slate-900 text-white font-bold py-2 px-3 rounded-lg text-[10px] hover:bg-orange-500 transition-colors shadow-sm ml-auto text-center">
            Ver Detalles
          </a>
        </div>
      </div>
    </div>
  );
}