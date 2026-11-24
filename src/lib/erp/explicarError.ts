// Traduce los rechazos de Frappe/ERPNext a un mensaje claro para el equipo de
// sourcing: qué dato falló y qué hacer. El detalle técnico completo se queda en
// los logs; esto es lo único que ve el usuario.

const MENSAJES_ENLACE = /(?:No se pudo encontrar|Could not find)\s+(.+)/i;
const MENSAJES_OBLIGATORIOS = /(?:Valores?\s+Faltantes?\s+Requeridos?|Faltan\s+campos?\s+obligatorios?|Mandatory\s+fields?\s+required[^:]*|Missing\s+Fields?)\s*:?\s*(.+)/i;

const limpiar = (s: string): string =>
  s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// Frappe devuelve `_server_messages` como un JSON con strings JSON dentro.
const mensajesDelServidor = (cuerpo: string): { mensaje: string; excType: string } => {
  try {
    const j = JSON.parse(cuerpo);
    const excType = typeof j?.exc_type === 'string' ? j.exc_type : '';
    const crudos: unknown = typeof j?._server_messages === 'string' ? JSON.parse(j._server_messages) : [];
    const textos = (Array.isArray(crudos) ? crudos : [])
      .map((m) => {
        try { return limpiar(String(JSON.parse(String(m))?.message ?? '')); } catch { return ''; }
      })
      .filter(Boolean);
    return { mensaje: textos.join(' | '), excType };
  } catch {
    return { mensaje: '', excType: '' };
  }
};

const consejoPorCampo = (campo: string, valor: string): string => {
  const c = campo.toLowerCase();
  if (c.includes('modelo equipo')) return `El modelo «${valor}» no existe en el ERP. Créalo en el ERP (Modelo Equipo, con su marca) y vuelve a enviar.`;
  if (c.includes('territorio') || c.includes('territory')) return `El territorio «${valor}» no existe en el ERP. Revisa la ubicación del equipo o avisa a sistemas.`;
  if (c.includes('marca') || c.includes('brand')) return `La marca «${valor}» no existe en el ERP. Créala en el ERP (Marca) y vuelve a enviar.`;
  if (c.includes('uom') || c.includes('unidad')) return `La unidad de medida «${valor}» no existe en el ERP. Avisa a sistemas.`;
  return `«${valor}» no existe en el campo «${campo}» del ERP. Avisa a sistemas.`;
};

export function explicarErrorErp(status: number, cuerpo: string): string {
  if (status === 401 || status === 403) {
    return 'El ERP no autorizó el envío (credenciales o permisos del usuario). Avisa a sistemas.';
  }
  if (status >= 500 && status !== 417) {
    // Frappe responde 417 para validaciones; otros 5xx son caídas del servicio.
    const { mensaje } = mensajesDelServidor(cuerpo);
    if (!mensaje) return 'El ERP no está respondiendo en este momento. Intenta de nuevo en unos minutos; si sigue igual, avisa a sistemas.';
  }

  const { mensaje, excType } = mensajesDelServidor(cuerpo);

  const enlace = mensaje.match(MENSAJES_ENLACE);
  if (enlace) {
    // "Modelo Equipo: 424, Territorio del Equipo: AZ" → una línea por campo faltante
    const pares = enlace[1].split(/,\s+(?=[^:,]+:\s)/).map((p) => {
      const i = p.indexOf(':');
      return i === -1 ? null : { campo: p.slice(0, i).trim(), valor: p.slice(i + 1).trim() };
    });
    if (pares.every(Boolean)) {
      return `El ERP rechazó el equipo:\n${(pares as { campo: string; valor: string }[]).map((p) => `• ${consejoPorCampo(p.campo, p.valor)}`).join('\n')}`;
    }
  }

  const obligatorio = mensaje.match(MENSAJES_OBLIGATORIOS);
  if (obligatorio || excType === 'MandatoryError') {
    return `Falta un dato obligatorio en el ERP${obligatorio ? `: ${obligatorio[1]}` : ''}. Avisa a sistemas.`;
  }

  if (excType === 'DuplicateEntryError') {
    return 'Ya existe un registro con ese nombre en el ERP. Revisa si el equipo ya fue enviado.';
  }

  if (mensaje) return `El ERP rechazó el equipo: ${mensaje.slice(0, 300)}`;
  return `El ERP rechazó el equipo (código ${status}). Avisa a sistemas; el detalle quedó en los logs.`;
}
