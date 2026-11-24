import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { LOG_CODES } from '@/constants/logCodes';
import { requireAuthenticatedUser } from '@/lib/apiAuth';
import { explicarErrorErp } from '@/lib/erp/explicarError';
import { buscarEquipoEnErp } from '@/lib/erp/coincidencias';
import { FIREBASE_COLLECTION, PORTAFOLIO_COLLECTION } from '@/constants/appConfig';

// Credenciales de Frappe por usuario (email → api_key / api_secret)
// Fallback: ERP_API_KEY / ERP_API_SECRET (admin) cuando el usuario no tiene credenciales propias
const CREDENCIALES_ERP: Record<string, { key: string; secret: string }> = {
  'sistemas@machineryhunters.com': { key: process.env.ERP_API_KEY_SISTEMAS ?? '', secret: process.env.ERP_API_SECRET_SISTEMAS ?? '' },
  'josue@machineryhunters.com':    { key: process.env.ERP_API_KEY_JOSUE    ?? '', secret: process.env.ERP_API_SECRET_JOSUE    ?? '' },
  'raul@machineryhunters.com':     { key: process.env.ERP_API_KEY_RAUL     ?? '', secret: process.env.ERP_API_SECRET_RAUL     ?? '' },
  'glenn@machineryhunters.com':    { key: process.env.ERP_API_KEY_GLENN    ?? '', secret: process.env.ERP_API_SECRET_GLENN    ?? '' },
  'carlos@machineryhunters.com':   { key: process.env.ERP_API_KEY_CAMPILLO ?? '', secret: process.env.ERP_API_SECRET_CAMPILLO ?? '' },
  'jorge@machineryhunters.com':    { key: process.env.ERP_API_KEY_JORGE    ?? '', secret: process.env.ERP_API_SECRET_JORGE    ?? '' }

};

// Categorías cuyo equipo tiene chassis de camión (rellenan la sección "Informacion del Camion")
const CATS_CON_CAMION = new Set([
  'Sleeper', 'Day cab',
  'Camiones Volteo', 'Camiones Trompo', 'Camiones Pipa',
  'Gruas Titanes', 'Gruas Articuladas',
  'Bombas',
]);

// Mapeo de categorías del scraper → grupo en custom_categoria_equipo de Frappe
const CATEGORIA_MAP: Record<string, string> = {
  'Retroexcavadoras':  'MAQUINARIA AMARILLA',
  'Excavadoras':       'MAQUINARIA AMARILLA',
  'Topadores':         'MAQUINARIA AMARILLA',
  'Cargadores':        'MAQUINARIA AMARILLA',
  'Motoconformadoras': 'MAQUINARIA AMARILLA',
  'Compactadoras':     'MAQUINARIA AMARILLA',
  'Camiones Volteo':   'CAMIONES',
  'Camiones Trompo':   'CAMIONES',
  'Camiones Pipa':     'CAMIONES',
  'Sleeper':           'TRACTOCAMION',
  'Day cab':           'TRACTOCAMION',
  'Gruas Titanes':     'GRUA',
  'Gruas Articuladas': 'GRUA',
  'rough_terrain':     'GRUA',
  'Bombas':            'CONCRETO',
  'Elevadores':        'ELEVACION',
};

// UOM de capacidad de carga por categoría (deben existir tal cual en el doctype UOM del ERP)
const CAPACIDAD_UOM: Record<string, string> = {
  'Camiones Trompo':   'Yarda',
  'Camiones Volteo':   'Yarda',
  'Camiones Pipa':     'Galones',
  'Gruas Titanes':     'ton',
  'Gruas Articuladas': 'ton',
  'rough_terrain':     'ton',
};

// Normaliza la transmisión → "Manual" | "Automatico" | ""
const normalizarTransmision = (transmision: string): string => {
  if (!transmision) return '';
  const t = transmision.toUpperCase();
  const esManual = ['MANUAL', 'EATON', 'FULLER', 'SPICER', 'MACK T', 'ZF M'].some(k => t.includes(k));
  const esAuto   = ['ALLISON', 'AUTO', 'VOITH', 'ZF A'].some(k => t.includes(k));
  if (esManual) return 'Manual';
  if (esAuto)   return 'Automatico';
  return '';
};

// Normaliza el tipo de pluma → "Z" | "Roll and Fold" | "" (únicos valores que acepta el Select en Frappe)
const normalizarTipoPluma = (tipoPluma: string): string => {
  if (!tipoPluma) return '';
  const t = tipoPluma.toUpperCase();
  const esRollAndFold = ['ROLL AND FOLD', 'ROLL-FOLD', 'ROLL & FOLD', 'RZ'].some(k => t.includes(k));
  if (esRollAndFold) return 'Roll and Fold';
  if (t.includes('Z')) return 'Z';
  return '';
};

// Extrae la marca de la pluma del título de una Bomba de Concreto
const extractMarcaBomba = (titulo: string): string => {
  const upper = titulo.toUpperCase();
  if (upper.includes(' ON A ')) {
    const parteP = upper.split(' ON A ')[0];
    const palabras = parteP.split(/\s+/).filter(w => !/^\d/.test(w));
    return palabras[palabras.length - 1] || '';
  }
  const palabras = titulo.split(/\s+/);
  return palabras[1] || '';
};

// Extrae el modelo de la pluma del título de una Bomba de Concreto
const extractModeloBomba = (titulo: string): string => {
  const upper = titulo.toUpperCase();
  if (upper.includes(' ON A ')) {
    const parteP = titulo.split(/ ON A /i)[0];
    const palabras = parteP.trim().split(/\s+/).slice(1);
    return palabras.find(w => /^\d/i.test(w)) || '';
  }
  const palabras = titulo.trim().split(/\s+/);
  return palabras.slice(2).join(' ') || '';
};

// Territorios del ERP (doctype Territory) que corresponden a estados/provincias.
// custom_territory es un Link: si el nombre no existe tal cual, Frappe rechaza el equipo.
const TERRITORIOS_ERP = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'Alberta', 'British Columbia', 'Ontario', 'Quebec',
  'Aguascalientes', 'Baja California Norte', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua',
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Queretaro', 'Quintana Roo', 'San Luis Potosi', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

const ABREVIATURAS_TERRITORIO: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
  LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  AB: 'Alberta', BC: 'British Columbia', ON: 'Ontario', QC: 'Quebec',
};

const TERRITORIOS_POR_NOMBRE = new Map(TERRITORIOS_ERP.map(t => [t.toLowerCase(), t]));

// Estado/provincia → nombre exacto del Territory del ERP ("AZ" y "Arizona" → "Arizona").
// Recorre la ubicación de derecha a izquierda para tolerar "Dallas, TX, USA" o "TX 75001".
// Si no hay coincidencia devuelve '' (el campo es opcional) en vez de provocar un rechazo del ERP.
const extractEstado = (ubicacion: string): string => {
  if (!ubicacion) return '';
  const partes = ubicacion.split(',').map(p => p.trim()).filter(Boolean);
  for (let i = partes.length - 1; i >= 0; i--) {
    const parte = partes[i].replace(/\s+\d{4,5}(-\d{4})?$/, '').trim();
    const porAbrev = ABREVIATURAS_TERRITORIO[parte.toUpperCase()];
    if (porAbrev) return porAbrev;
    const porNombre = TERRITORIOS_POR_NOMBRE.get(parte.toLowerCase());
    if (porNombre) return porNombre;
  }
  return '';
};

// Extrae la ciudad → "Ciudad, Estado" → "Ciudad"
const extractCiudad = (ubicacion: string): string => {
  if (!ubicacion) return '';
  return ubicacion.split(',')[0].trim();
};

// Mapea el campo pagina al catálogo de subastas registrado en Frappe
const getSubastaSite = (pagina: string): string => {
  if (!pagina) return 'Otro';
  const p = pagina.toLowerCase().replace(/\s/g, '');
  if (p.includes('auctiontime'))    return 'AuctionTime';
  if (p.includes('auctionsource'))  return 'Auctionsource';
  if (p.includes('barnone'))        return 'Barnone';
  if (p.includes('bidspotter'))     return 'Bidspotter';
  if (p.includes('bigiron'))        return 'BigIron';
  if (p.includes('cranemarket'))    return 'CraneMarket';
  if (p.includes('cranenetwork'))   return 'CraneNetwork';
  if (p.includes('cranetrader'))    return 'CraneTrader';
  if (p.includes('equipmentfacts')) return 'EquipmentFacts';
  if (p.includes('housby'))         return 'Housby';
  if (p.includes('ironplanet'))     return 'Ironplanet';
  if (p.includes('jjkane') || p.includes('jj kane')) return 'JJ Kane';
  if (p.includes('machinemarket'))  return 'MachineMarket';
  if (p.includes('proxibid'))       return 'Proxibid';
  if (p.includes('purplewave'))     return 'Purplewave';
  if (p.includes('ritchie'))        return 'Ritchie Bros';
  return 'Otro';
};

// Imágenes que se adjuntan al MH Equipo (la primera también pasa a ser custom_image)
const MAX_IMAGENES   = 16;
const IMAGEN_PRIVADA = '0';

// Descarga una imagen y la sube a Frappe como adjunto del MH Equipo (POST /api/method/upload_file).
// Devuelve el file_url que asigna Frappe (ej. "/files/EQUI-000001-1.jpg").
const subirImagenAFrappe = async (
  uploadUrl: string,
  authHeader: string,
  docname: string,
  imagenUrl: string,
  indice: number,
): Promise<string> => {
  const imgRes = await fetch(imagenUrl, { signal: AbortSignal.timeout(20000) });
  if (!imgRes.ok) throw new Error(`No se pudo descargar la imagen (${imgRes.status})`);

  const contentType = imgRes.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const blob = await imgRes.blob();

  const form = new FormData();
  form.append('file', blob, `${docname}-${indice}.${ext}`);
  form.append('doctype', 'MH Equipo');
  form.append('docname', docname);
  form.append('is_private', IMAGEN_PRIVADA);

  const upRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Accept': 'application/json' },
    body: form,
  });
  if (!upRes.ok) throw new Error(`Frappe rechazó la imagen (${upRes.status}): ${(await upRes.text()).slice(0, 200)}`);

  const fileUrl = (await upRes.json().catch(() => null))?.message?.file_url;
  if (typeof fileUrl !== 'string' || !fileUrl) throw new Error('Frappe no devolvió el file_url de la imagen');
  return fileUrl;
};

// Errores de validación cuyo mensaje sí es seguro mostrar al cliente.
class RequestError extends Error {}

// Fallo del ERP: `message` conserva el detalle técnico para los logs y
// `userMessage` es lo que se le muestra al usuario de sourcing.
class ErpError extends Error {
  constructor(public userMessage: string, detail: string, public status = 502) {
    super(detail);
  }
}

export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser(request);
  if (!guard.ok) return guard.response;

  // Identidad tomada del token verificado, nunca del body.
  const usuarioSourcing = guard.name;
  const userEmail       = guard.email;

  try {
    const body = await request.json().catch(() => null);
    const machineId = typeof body?.id === 'string' ? body.id : '';
    if (!machineId) throw new RequestError('Falta el id del equipo.');

    // Los datos del equipo se leen de Firestore; el body del cliente no se usa
    // para que nadie pueda enviar información inventada al ERP.
    const db = getFirestore();
    let snap = await db.collection(FIREBASE_COLLECTION).doc(machineId).get();
    if (!snap.exists) snap = await db.collection(PORTAFOLIO_COLLECTION).doc(machineId).get();
    if (!snap.exists) throw new RequestError('Equipo no encontrado en Firestore.');
    const maquina: Record<string, any> = { ...snap.data(), id: machineId };

    const apiUrl    = process.env.ERP_API_URL;
    const userCreds = CREDENCIALES_ERP[userEmail];
    const apiKey    = (userCreds?.key    && userCreds.key    !== '') ? userCreds.key    : (process.env.ERP_API_KEY    ?? '');
    const apiSecret = (userCreds?.secret && userCreds.secret !== '') ? userCreds.secret : (process.env.ERP_API_SECRET ?? '');

    if (!apiUrl || !apiKey || !apiSecret) {
      throw new Error('Faltan las variables de entorno del ERP.');
    }
    if (!userCreds?.key) {
      console.warn(`Sin credenciales ERP para "${userEmail || 'usuario desconocido'}" — usando credenciales admin`);
      await writeLog({
        level: 'error',
        category: 'error',
        code: LOG_CODES.ERR_ERP_CREDENTIALS_MISSING,
        message: `Sin credenciales ERP propias para "${userEmail || 'usuario desconocido'}", se usaron credenciales admin`,
        source: 'server',
        route: '/api/erp',
        userEmail,
      });
    }

    // Verificar si ya existe en Frappe (evita duplicados), aunque se haya cargado
    // fuera de la app: por [ID] en el nombre, URL de la publicación o número de serie.
    let existente: Awaited<ReturnType<typeof buscarEquipoEnErp>>;
    try {
      existente = await buscarEquipoEnErp(
        { id: maquina.id, url: maquina.url, numeroSerie: maquina.numero_serie },
        { apiUrl, authHeader: `token ${apiKey}:${apiSecret}` },
      );
    } catch (e: any) {
      // Sin poder verificar duplicados no se crea nada: mejor reintentar que duplicar.
      throw new ErpError(
        'No se pudo verificar en el ERP si el equipo ya existe, así que no se envió. Intenta de nuevo en unos minutos; si sigue igual, avisa a sistemas.',
        `Falló la verificación de duplicados en el ERP: ${e?.message ?? e}`,
        504,
      );
    }
    if (existente) {
      // Se deja constancia en Firebase para que el equipo aparezca como enviado. Sin
      // fecha_envio_erp ni enviado_por: no lo envió nadie desde la app.
      try {
        await db.collection(FIREBASE_COLLECTION).doc(machineId).update({
          estado_sourcing: 'enviado_erp',
          id_erp: existente.name,
          sincronizado_erp_en: new Date().toISOString(),
          sincronizado_erp_por: existente.criterio,
        });
      } catch (fbError) {
        console.warn('El equipo ya existía en el ERP, pero no se pudo marcar en Firebase:', fbError);
      }
      return NextResponse.json({ success: true, id_erp: existente.name, ya_existia: true, coincide_por: existente.criterio });
    }

    // ── Datos derivados ──────────────────────────────────────────────────────
    const esCamion  = CATS_CON_CAMION.has(maquina.categoria_tarea);
    const esBomba   = maquina.categoria_tarea === 'Bombas';
    const esSubasta = !!(maquina.es_subasta);

    const marca = maquina.marca
      || maquina.marca_pluma
      || (esBomba ? extractMarcaBomba(maquina.titulo || '') : '')
      || maquina.marca_camion
      || '';

    const territorio = extractEstado(maquina.ubicacion);
    const ciudad     = extractCiudad(maquina.ubicacion);

    // custom_categoria_equipo = grupo; la lógica vive entera en CATEGORIA_MAP
    const categoriaERP = CATEGORIA_MAP[maquina.categoria_tarea] ?? 'OTROS';


    // Sub-categoría: valores exactos del Select sub_categoria_equipo en Frappe
    const subCategoriaERP = (() => {
      const cat = maquina.categoria_tarea;

      if (cat === 'Excavadoras')       return 'EXCAVADORA';
      if (cat === 'Retroexcavadoras')  return 'RETROEXCAVADORA';
      if (cat === 'Topadores')         return 'TOPADOR FRONTAL';
      if (cat === 'Cargadores')        return 'CARGADOR FRONTAL';
      if (cat === 'Motoconformadoras') return 'MOTOCONFORMADORA';

      // COMPACTADORA no existe en el Select; todos los subtipos van como VIBROCOMPACTADOR
      if (cat === 'Compactadoras')     return 'VIBROCOMPACTADOR';

      if (cat === 'Elevadores') {
        const subtipo = (maquina.subtipo_elevador || '').toUpperCase();
        if (subtipo.includes('TELESCOPICO')) return 'ELEVADOR TELESCOPICO';
        if (subtipo.includes('TIJERA'))      return 'ELEVADOR TIJERA';
        return 'ELEVADOR ARTICULADO'; // articulado como default (ELEVADOR plano no existe en el Select)
      }

      if (cat === 'Camiones Volteo')   return 'VOLTEO';
      if (cat === 'Camiones Trompo')   return 'TROMPO REVOLVEDOR';
      if (cat === 'Camiones Pipa')     return 'PIPA DE AGUA';
      if (cat === 'Sleeper')           return 'TRACTOCAMION';
      if (cat === 'Day cab')           return 'TRACTOCAMION';

      if (cat === 'Gruas Titanes')     return 'TITAN';
      if (cat === 'Gruas Articuladas') return 'ARTICULADA';

      if (cat === 'rough_terrain') {
        const subtipo = (maquina.subtipo_grua_terreno || '').toUpperCase();
        return subtipo.includes('ALL TERRAIN') ? 'ALL TERRAIN' : 'ROUGH TERRAIN';
      }

      if (cat === 'Bombas')            return 'BOMBA DE CONCRETO';

      return 'OTROS';
    })();

    // Horas de uso
    const usoHoras  = maquina.uso_horas || maquina.uso || maquina.uso_motor || 0;
    const usoMillas = maquina.uso_millas || 0;
    const usoBomba  = maquina.uso_bomba  || 0;

    // Campo `horas`: horas principales del equipo (aplica a todas las categorías)
    // Bombas priorizan horas de la bomba; resto usa horas de motor
    const horasPrincipales = esBomba
      ? (usoBomba || usoHoras || 0)
      : usoHoras;

    // `condicion_camion` / `condicion_um`: solo para camiones; prioriza millas
    const condicionFields = (() => {
      if (!esCamion) return {};
      if (usoMillas > 0) return { condicion_camion: usoMillas, condicion_um: 'Mi' };
      if (usoHoras  > 0) return { condicion_camion: usoHoras,  condicion_um: 'Hr' };
      return {};
    })();

    // Alcance: Bombas parsean "capacidad" como alcance de pluma; resto usa campo `alcance`
    let alcanceValor = '';
    let alcanceUom   = '';
    if (esBomba && maquina.capacidad) {
      const num = parseFloat(maquina.capacidad.toString());
      if (!isNaN(num) && num > 0) {
        alcanceValor = String(num);
        const upper  = maquina.capacidad.toString().toUpperCase();
        alcanceUom   = (upper.includes('FT') || upper.includes('FEET') || upper.includes("'"))
          ? 'Pies' : 'Metros';
      }
    } else if (maquina.alcance > 0) {
      alcanceValor = String(maquina.alcance);
      alcanceUom   = 'Pies';
    }

    // Capacidad de carga: solo categorías que no son Bombas
    const capacidadValor = esBomba ? '' : String(maquina.capacidad || '');
    const capacidadUom   = esBomba ? '' : (maquina.capacidad ? (CAPACIDAD_UOM[maquina.categoria_tarea] || '') : '');

    // datos_contacto
    const datosContacto = [
      `Origen: ${maquina.pagina || 'Scraper'}`,
      maquina.telefono_vendedor ? `Tel: ${maquina.telefono_vendedor}` : '',
    ].filter(Boolean).join('\n');

    // Información adicional libre
    const lineasUso = [
      usoHoras  > 0 ? `Horas: ${usoHoras.toLocaleString()}`            : '',
      usoMillas > 0 ? `Millas: ${usoMillas.toLocaleString()}`           : '',
      usoBomba  > 0 ? `Horas Bomba: ${usoBomba.toLocaleString()}`       : '',
    ].filter(Boolean).join('\n');

    const infoAdicional =
`UBICACION COMPLETA: ${maquina.ubicacion || 'N/D'}

USO:
${lineasUso || 'N/D'}

ENVIADO POR: ${usuarioSourcing}`;

    // ── Payload ──────────────────────────────────────────────────────────────
    const payloadERP: Record<string, any> = {
      // Cabecera
      nombre:                  `${maquina.titulo || 'Equipo sin título'} [${maquina.id ?? Date.now()}]`,
      status:                  esSubasta ? 'Subasta' : 'Proveedor',
      custom_categoria_equipo: categoriaERP,
      sub_categoria_equipo:    subCategoriaERP,

      // Subasta
      enlace_web_sourcing_live: maquina.url || '',
      ...(esSubasta && {
        custom_subasta:  getSubastaSite(maquina.pagina || ''),
        subasta_inicia:  maquina.subasta_inicia || '',
        subasta_cierre:  maquina.subasta_cierre || '',
      }),

      // Informacion del Equipo
      ...(maquina.año > 0 && { custom_ano_equipo: String(maquina.año) }),
      numero_de_serie:                     maquina.numero_serie || '',
      custom_image:                        maquina.imagenes?.[0] ?? '',
      custom_marca:                        marca,
      custom_modelo_equipo:                maquina.modelo || (esBomba ? extractModeloBomba(maquina.titulo || '') : ''),
      capacidad_equipo:                    capacidadValor,
      uom_capacidad:                       capacidadUom,
      custom_alcance:                      alcanceValor,
      alcance_uom:                         alcanceUom,
      kit_para_martillo:                   maquina.tiene_martillo  ? 1 : 0,
      extension:                           maquina.tiene_extension ? 1 : 0,
      cabina:                              maquina.tiene_cabina    ? 1 : 0,
      ...(horasPrincipales > 0 && { horas: horasPrincipales }),
      tipo_de_pluma:                       normalizarTipoPluma(maquina.tipo_pluma || ''),
      ripper:                              maquina.tiene_ripper ? 1 : 0,
      custom_territory:                    territorio,
      ciudad:                              ciudad,
      custom_informacion_adicional_equipo: infoAdicional,

      // Informacion del Camion
      ano_camion:               esCamion && maquina.año > 0 ? String(maquina.año) : '',
      motor_camion:             esCamion ? (maquina.motor        || '') : '',
      marca_camion:             esCamion ? (maquina.marca_camion || '') : '',
      modelo_camion:            esCamion ? (maquina.modelo       || '') : '',
      ...(esCamion && normalizarTransmision(maquina.transmision || '') && {
        transmision_camion: normalizarTransmision(maquina.transmision || ''),
      }),
      custom_suspension_camion: esCamion ? (maquina.ejes_traseros || '') : '',
      '4x4':                    maquina.es_4x4 ? 1 : 0,
      ...condicionFields,

      // Datos Generales
      estimated_costing: Number(maquina.precio) || 0,
      ...(esSubasta && {
        precio_minimo: Number(maquina.precio)        || 0,
        precio_maximo: Number(maquina.precio_maximo) || 0,
      }),
      datos_contacto:   datosContacto,
      custom_supplier:  '',
      custom_comprador: '',
    };

    let responseFrappe: Response;
    try {
      responseFrappe = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type':  'application/json',
          'Accept':        'application/json',
        },
        body: JSON.stringify(payloadERP),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (e: any) {
      throw new ErpError(
        'No se pudo conectar con el ERP (sin respuesta). Intenta de nuevo en unos minutos; si sigue igual, avisa a sistemas.',
        `No se pudo conectar con el ERP: ${e?.message ?? e}`,
        504,
      );
    }

    if (!responseFrappe.ok) {
      const errorData = await responseFrappe.text();
      throw new ErpError(explicarErrorErp(responseFrappe.status, errorData), `Error del ERP (${responseFrappe.status}): ${errorData}`);
    }

    const frappeResult = await responseFrappe.json();
    const idFrappe = frappeResult?.data?.name ?? frappeResult?.name;

    // Subir todas las imágenes a Frappe y luego apuntar custom_image a la primera ya almacenada en el ERP.
    // Un fallo aquí no invalida el envío ya creado; si la primera no se sube, custom_image conserva el link original.
    const imagenes: string[] = Array.isArray(maquina.imagenes)
      ? maquina.imagenes.filter((u: unknown) => typeof u === 'string' && u).slice(0, MAX_IMAGENES)
      : [];
    let imagenesSubidas = 0;
    if (idFrappe && imagenes.length > 0) {
      const uploadUrl  = `${new URL(apiUrl).origin}/api/method/upload_file`;
      const authHeader = `token ${apiKey}:${apiSecret}`;
      const resultados = await Promise.allSettled(
        imagenes.map((url, i) => subirImagenAFrappe(uploadUrl, authHeader, idFrappe, url, i + 1)),
      );
      const fallidas: { url: string; error: string }[] = [];
      resultados.forEach((r, i) => {
        if (r.status === 'rejected') fallidas.push({ url: imagenes[i], error: String(r.reason?.message ?? r.reason) });
      });
      imagenesSubidas = resultados.length - fallidas.length;

      const principal = resultados[0];
      if (principal.status === 'fulfilled') {
        try {
          const putRes = await fetch(`${apiUrl}/${encodeURIComponent(idFrappe)}`, {
            method: 'PUT',
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ custom_image: principal.value }),
          });
          if (!putRes.ok) throw new Error(`Frappe rechazó custom_image (${putRes.status}): ${(await putRes.text()).slice(0, 200)}`);
        } catch (e: any) {
          fallidas.push({ url: imagenes[0], error: `No se pudo asignar custom_image: ${e?.message ?? e}` });
        }
      }

      if (fallidas.length > 0) {
        await writeLog({
          level: 'error',
          category: 'error',
          code: LOG_CODES.ERR_ERP_IMAGE_UPLOAD_FAILED,
          message: `${fallidas.length} de ${resultados.length} imágenes no se subieron al ERP (${idFrappe})`,
          source: 'server',
          route: '/api/erp',
          userEmail,
          metadata: { machineId: maquina.id, idFrappe, fallidas },
        });
      }
    }

    // Actualizar Firebase para trazabilidad
    try {
      await db.collection(FIREBASE_COLLECTION).doc(machineId).update({
        estado_sourcing: 'enviado_erp',
        id_erp:          idFrappe,
        enviado_por:     usuarioSourcing,
        fecha_envio_erp: new Date().toISOString(),
      });
    } catch (fbError: any) {
      console.warn('La máquina se envió al ERP, pero falló la actualización en Firebase:', fbError);
      await writeLog({
        level: 'error',
        category: 'error',
        code: LOG_CODES.ERR_ERP_TRACE_UPDATE_FAILED,
        message: fbError?.message ?? 'Falló la actualización de trazabilidad en Firebase tras enviar al ERP',
        stack: fbError?.stack,
        source: 'server',
        route: '/api/erp',
        userEmail,
        metadata: { machineId: maquina.id, idFrappe },
      });
    }

    await writeLog({
      level: 'info',
      category: 'activity',
      code: LOG_CODES.ACT_SEND_ERP,
      message: `Máquina enviada al ERP por ${usuarioSourcing}`,
      source: 'server',
      route: '/api/erp',
      userEmail,
      metadata: { machineId: maquina.id, idFrappe },
    });

    return NextResponse.json({
      success: true,
      id_erp:  idFrappe,
      imagenes_subidas: imagenesSubidas,
      imagenes_total:   imagenes.length,
      audit:   `Enviado por ${usuarioSourcing}`,
    });

  } catch (error: any) {
    await writeLog({
      level: 'error',
      category: 'error',
      code: LOG_CODES.ERR_ERP_SEND,
      message: error?.message ?? 'Error al enviar máquina al ERP',
      stack: error?.stack,
      source: 'server',
      route: '/api/erp',
      userEmail,
    });
    if (error instanceof RequestError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    if (error instanceof ErpError) {
      return NextResponse.json({ success: false, error: error.userMessage }, { status: error.status });
    }
    return NextResponse.json(
      { success: false, error: 'No se pudo completar el envío al ERP. El detalle quedó registrado en los logs.' },
      { status: 500 },
    );
  }
}
