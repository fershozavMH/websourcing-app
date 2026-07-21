export const LOG_LEVELS = ['error', 'security', 'info'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export const LOG_CATEGORIES = ['error', 'security', 'activity'] as const;
export type LogCategory = (typeof LOG_CATEGORIES)[number];

export const LOG_SOURCES = ['client', 'server'] as const;
export type LogSource = (typeof LOG_SOURCES)[number];

export const LOG_CODES = {
  ERR_FETCH_MACHINES: 'ERR_FETCH_MACHINES',
  ERR_ERP_SEND: 'ERR_ERP_SEND',
  ERR_ERP_CREDENTIALS_MISSING: 'ERR_ERP_CREDENTIALS_MISSING',
  ERR_ERP_TRACE_UPDATE_FAILED: 'ERR_ERP_TRACE_UPDATE_FAILED',
  ERR_PORTAFOLIO_LOAD: 'ERR_PORTAFOLIO_LOAD',
  ERR_IMAGE_LOAD: 'ERR_IMAGE_LOAD',
  ERR_UNCAUGHT_CLIENT: 'ERR_UNCAUGHT_CLIENT',
  ERR_UNCAUGHT_SERVER: 'ERR_UNCAUGHT_SERVER',
  SEC_LOGIN_FAILED: 'SEC_LOGIN_FAILED',
  SEC_UNAUTHORIZED_ACCESS: 'SEC_UNAUTHORIZED_ACCESS',
  ACT_LOGIN: 'ACT_LOGIN',
  ACT_LOGOUT: 'ACT_LOGOUT',
  ACT_SEND_ERP: 'ACT_SEND_ERP',
  ACT_SESSION_TIMEOUT: 'ACT_SESSION_TIMEOUT',
} as const;

export type LogCode = (typeof LOG_CODES)[keyof typeof LOG_CODES];

export const LOG_CODE_TO_CATEGORY: Record<LogCode, LogCategory> = {
  ERR_FETCH_MACHINES: 'error',
  ERR_ERP_SEND: 'error',
  ERR_ERP_CREDENTIALS_MISSING: 'error',
  ERR_ERP_TRACE_UPDATE_FAILED: 'error',
  ERR_PORTAFOLIO_LOAD: 'error',
  ERR_IMAGE_LOAD: 'error',
  ERR_UNCAUGHT_CLIENT: 'error',
  ERR_UNCAUGHT_SERVER: 'error',
  SEC_LOGIN_FAILED: 'security',
  SEC_UNAUTHORIZED_ACCESS: 'security',
  ACT_LOGIN: 'activity',
  ACT_LOGOUT: 'activity',
  ACT_SEND_ERP: 'activity',
  ACT_SESSION_TIMEOUT: 'activity',
};

export function isKnownLogCode(code: string): code is LogCode {
  return Object.prototype.hasOwnProperty.call(LOG_CODE_TO_CATEGORY, code);
}
