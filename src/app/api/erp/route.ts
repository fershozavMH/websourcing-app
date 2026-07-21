import '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { writeLog } from '@/lib/monitoreo/writeLog';
import { LOG_CODES } from '@/constants/logCodes';

// Credenciales de Frappe por usuario (email → api_key / api_secret)
// Fallback: ERP_API_KEY / ERP_API_SECRET (admin) cuando el usuario no tiene credenciales propias
const CREDENCIALES_ERP: Record<string, { key: string; secret: string }> = {
  'sistemas@machineryhunters.com': { key: process.env.ERP_API_KEY_SISTEMAS ?? '', secret: process.env.ERP_API_SECRET_SISTEMAS ?? '' },
  'josue@machineryhunters.com':    { key: process.env.ERP_API_KEY_JOSUE    ?? '', secret: process.env.ERP_API_SECRET_JOSUE    ?? '' },
  'raul@machineryhunters.com':     { key: process.env.ERP_API_KEY_RAUL     ?? '', secret: process.env.ERP_API_SECRET_RAUL     ?? '' },
  'glenn@machineryhunters.com':    { key: process.env.ERP_API_KEY_GLENN    ?? '', secret: process.env.ERP_API_SECRET_GLENN    ?? '' },
  'carlos@machineryhunters.com':   { key: process.env.ERP_API_KEY_CAMPILLO ?? '', secret: process.env.ERP_API_SECRET_CAMPILLO ?? '' },
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

// UOM de capacidad de carga por categoría
const CAPACIDAD_UOM: Record<string, string> = {
  'Camiones Trompo':   'Yardas',
  'Camiones Volteo':   'Yardas',
  'Camiones Pipa':     'Galones',
  'Gruas Titanes':     'Toneladas',
  'Gruas Articuladas': 'Toneladas',
  'rough_terrain':     'Toneladas',
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

// Extrae el estado/provincia → "Ciudad, Estado" → "Estado"
const extractEstado = (ubicacion: string): string => {
  if (!ubicacion) return '';
  const partes = ubicacion.split(',');
  if (partes.length < 2) return '';
  return partes[partes.length - 1].trim();
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

export async function POST(request: Request) {
  try {
    const maquina = await request.json();
    const usuarioSourcing = maquina.usuario_sourcing || 'Analista_Desconocido';

    const apiUrl    = process.env.ERP_API_URL;
    const userEmail = maquina.usuario_email ?? '';
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

    // Verificar si ya existe en Frappe (evita duplicados)
    if (maquina.id) {
      const filtros = encodeURIComponent(JSON.stringify([['nombre', 'like', `%[${maquina.id}]`]]));
      const checkRes = await fetch(`${apiUrl}?filters=${filtros}&fields=["name"]&limit=1`, {
        headers: { 'Authorization': `token ${apiKey}:${apiSecret}`, 'Accept': 'application/json' },
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData?.data?.length > 0) {
          const idExistente = checkData.data[0].name;
          return NextResponse.json({ success: true, id_erp: idExistente, ya_existia: true });
        }
      }
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
      custom_enlace: maquina.url || '',
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
      tipo_de_pluma:                       maquina.tipo_pluma || '',
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

    const responseFrappe = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${apiKey}:${apiSecret}`,
        'Content-Type':  'application/json',
        'Accept':        'application/json',
      },
      body: JSON.stringify(payloadERP),
    });

    if (!responseFrappe.ok) {
      const errorData = await responseFrappe.text();
      throw new Error(`Error del ERP: ${errorData}`);
    }

    const frappeResult = await responseFrappe.json();
    const idFrappe = frappeResult?.data?.name ?? frappeResult?.name;

    // Actualizar Firebase para trazabilidad
    try {
      const db = getFirestore();
      if (maquina.id) {
        await db.collection('maquinaria_aprobada').doc(maquina.id).update({
          estado_sourcing: 'enviado_erp',
          id_erp:          idFrappe,
          enviado_por:     usuarioSourcing,
          fecha_envio_erp: new Date().toISOString(),
        });
      }
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
    });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
