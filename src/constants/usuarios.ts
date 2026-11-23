// Nombres para mostrar por usuario, independientes del `displayName` de
// Firebase (muchas cuentas no lo tienen configurado). Se usa como nombre de
// quien envía al ERP/MVP en vez de caer al correo electrónico.
// Ajusta aquí el nombre exacto de cada persona si no es el correcto.
export const NOMBRES_USUARIOS: Record<string, string> = {
  'sistemas@machineryhunters.com': 'Fernando Zavala',
  'josue@machineryhunters.com': 'Josue Acosta',
  'raul@machineryhunters.com': 'Raul Garcia',
  'glenn@machineryhunters.com': 'Glenn Ritchie',
  'carlos@machineryhunters.com': 'Carlos Campillo',
  'jonathan@machineryhunters.com': 'Jonathan',
  'aurelio@machineryhunters.com': 'Aurelio Bermudez',
  'daray@machineryhunters.com': 'Daray Arrellano',
  'gabriel@machineryhunters.com': 'Gabriel Buchanan',
  'carel@machineryhunters.com': 'Carel Medina',
  'cinthya@machineryhunters.com': 'Cinthya Preciado',
  'marketing@machineryhunters.com': 'Marketing',
  'info@machineryhunters.com': 'Info',
};

// Únicos usuarios que pueden enviar equipos al MVP (el resto de sourcing solo
// envía al ERP). Sistemas tiene acceso a todo.
export const USUARIOS_MVP: ReadonlyArray<string> = [
  'carel@machineryhunters.com',
  'cinthya@machineryhunters.com',
  'sistemas@machineryhunters.com',
];

export const puedeEnviarMvp = (email: string | null | undefined): boolean =>
  !!email && USUARIOS_MVP.includes(email.trim().toLowerCase());
