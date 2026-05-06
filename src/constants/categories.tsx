import React from 'react';
import { CAT } from './machineCategories';

const icon32 = "w-32 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm";
const icon42 = "w-42 h-auto object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm";

export const CATEGORIAS_INICIO = [
  { id: CAT.EXCAVADORAS,      nombre: 'Excavadoras',      icon: <img src="/iconos/exc.webp"             alt="Exc"        className={icon32} /> },
  { id: CAT.RETROEXCAVADORAS, nombre: 'Retroexcavadoras', icon: <img src="/iconos/retro.webp"           alt="Retro"      className={icon32} /> },
  { id: CAT.TOPADORES,        nombre: 'Topadores',        icon: <img src="/iconos/topador.webp"         alt="Topador"    className={icon32} /> },
  { id: CAT.CARGADORES,       nombre: 'Cargadores',       icon: <img src="/iconos/topador.webp"         alt="Cargador"   className={icon32} /> },
  { id: CAT.MOTOCONFORMADORAS,nombre: 'Motoconformadoras',icon: <img src="/iconos/motoconformadora.webp" alt="Moto"      className={icon32} /> },
  { id: CAT.CAMIONES_VOLTEO,  nombre: 'Camiones Volteo',  icon: <img src="/iconos/camion-volteo.webp"  alt="Volteo"     className={icon32} /> },
  { id: CAT.CAMIONES_TROMPO,  nombre: 'Camiones Trompo',  icon: <img src="/iconos/trompo.png"          alt="Trompo"     className={icon32} /> },
  { id: CAT.CAMIONES_PIPA,    nombre: 'Camiones Pipa',    icon: <img src="/iconos/pipa.png"            alt="Pipa"       className={icon32} /> },
  { id: CAT.TRACTOCAMIONES,   nombre: 'Tractocamiones',   icon: <img src="/iconos/tractocamion.webp"   alt="Tracto"     className={icon32} /> },
  { id: CAT.GRUAS_TITANES,    nombre: 'Grúas Titanes',    icon: <img src="/iconos/grua.webp"           alt="Titan"      className={icon32} /> },
  { id: CAT.GRUAS_ARTICULADAS,nombre: 'Grúas Articuladas',icon: <img src="/iconos/grua.webp"           alt="Articulada" className={icon32} /> },
  { id: CAT.BOMBAS,           nombre: 'Bombas',           icon: <img src="/iconos/Icon_1019.webp"      alt="Bomba"      className={icon32} /> },
  { id: CAT.ELEVADORES,       nombre: 'Elevadores',       icon: <img src="/iconos/elevador.webp"       alt="Elevador"   className={icon32} /> },
  { id: CAT.ROUGH_TERRAIN,    nombre: 'Rough Terrain',    icon: <img src="/iconos/rough-terrain.webp"  alt="RT"         className={icon42} /> },
  { id: CAT.ALL_TERRAIN,      nombre: 'All Terrain',      icon: <img src="/iconos/all-terrain.webp"    alt="AT"         className={icon42} /> },
  { id: CAT.ALL,              nombre: 'Ver Todo',         icon: <svg className="w-16 h-16 text-slate-700 transition-all duration-300 group-hover:scale-110 group-hover:text-orange-500 mb-6" viewBox="0 0 64 64" fill="currentColor"><path d="M12 12h16v16H12zM36 12h16v16H36zM12 36h16v16H12zM36 36h16v16H36z"/></svg> },
];