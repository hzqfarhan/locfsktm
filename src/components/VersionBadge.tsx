'use client';

import React from 'react';
import { APP_VERSION, APP_BUILD_TIME, getFullVersionString } from '../config/version';

interface VersionBadgeProps {
  className?: string;
  variant?: 'light' | 'dark';
  style?: React.CSSProperties;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({
  className = '',
  variant = 'light',
  style,
}) => {
  const isDark = variant === 'dark';

  return (
    <span
      className={`version-badge ${className}`}
      title={`System Build Version: ${getFullVersionString()} (${APP_BUILD_TIME})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '10px',
        fontWeight: 800,
        padding: '3px 8px',
        borderRadius: '6px',
        lineHeight: 1,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#F1F5F9',
        color: isDark ? '#E2E8F0' : '#475569',
        border: isDark ? '1px solid rgba(51, 65, 85, 0.8)' : '1px solid #E2E8F0',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        cursor: 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        transition: 'all 150ms ease',
        ...style,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          flexShrink: 0,
          boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
          animation: 'pulseGlowGreen 2s infinite',
        }}
        aria-hidden="true"
      />
      <span>{getFullVersionString()}</span>
    </span>
  );
};

export default VersionBadge;
