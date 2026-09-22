// src/config/version.ts
// Centralized System Version & Build Metadata Control

export const APP_VERSION = 'v1.2.2';
export const APP_BUILD_DATE = '2026.09.22';
export const APP_BUILD_TIME = '10:01 AM';
export const APP_ENV = process.env.NODE_ENV || 'development';

export function getFullVersionString(): string {
  return `${APP_VERSION} • Build ${APP_BUILD_DATE}`;
}
