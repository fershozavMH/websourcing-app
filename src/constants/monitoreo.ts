export const SYSTEM_LOGS_COLLECTION = 'system_logs';
export const MONITOREO_ADMINS_COLLECTION = 'monitoreo_admins';

export const LOG_MESSAGE_MAX_LEN = 2000;
export const LOG_STACK_MAX_LEN = 4000;
export const LOG_METADATA_MAX_LEN = 2000;
export const LOG_REQUEST_MAX_BYTES = 10_000;

export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 20;

export const LOGS_PAGE_SIZE_DEFAULT = 50;
export const LOGS_PAGE_SIZE_MAX = 200;

// Emails sembrados manualmente en Firestore (monitoreo_admins) antes del primer deploy.
export const MONITOREO_BOOTSTRAP_ADMIN_EMAIL = 'sistemas@machineryhunters.com';

// Presencia: última vez que un usuario con sesión abierta mostró actividad.
// Firebase `lastSignInTime` no cambia cuando la sesión persiste, por eso se
// lleva un registro propio.
export const USER_PRESENCE_COLLECTION = 'user_presence';
export const PRESENCE_PING_INTERVAL_MS = 5 * 60_000;
export const PRESENCE_ONLINE_WINDOW_MS = 10 * 60_000;

// Umbrales de alerta del tab "Salud del Sistema".
export const STALE_DATA_WARN_HOURS = 12;
export const STALE_DATA_CRIT_HOURS = 36;
export const FAILED_LOGIN_ALERT_THRESHOLD = 5; // intentos fallidos en 24h por correo/IP

// Retención de logs: cada log lleva `expireAt`; Firestore lo borra solo si se
// activa una política TTL sobre ese campo en la colección system_logs.
export const LOG_RETENTION_DAYS = 90;
export const LOG_VOLUME_WARN_DOCS = 50_000;

// Historial de presencia, agregado por día (un doc por usuario y día), para
// estimar horas activas sin guardar cada latido individual. Comparte el
// patrón de expireAt + TTL de system_logs (requiere su propia política TTL
// sobre esta colección).
export const USER_PRESENCE_DAILY_COLLECTION = 'user_presence_daily';
export const PRESENCE_RETENTION_DAYS = 90;
