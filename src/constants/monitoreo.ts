export const SYSTEM_LOGS_COLLECTION = 'system_logs';
export const MONITOREO_ADMINS_COLLECTION = 'monitoreo_admins';
export const USER_PRESENCE_COLLECTION = 'user_presence';

// Ventana para considerar a un usuario "activo ahora": debe ser mayor al
// intervalo de heartbeat del cliente para tolerar el desfase entre envíos.
export const PRESENCE_ACTIVE_WINDOW_MS = 10 * 60 * 1000;
export const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

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
