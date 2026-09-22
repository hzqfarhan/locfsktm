// src/config/version.ts
// Centralized System Version & Build Metadata Control

export const APP_VERSION = 'v1.1.1';
export const APP_BUILD_DATE = '2026.09.22';
export const APP_BUILD_TIME = '08:37 AM';
export const APP_ENV = process.env.NODE_ENV || 'development';

export function getFullVersionString(): string {
  return `${APP_VERSION} • Build ${APP_BUILD_DATE}`;
}
