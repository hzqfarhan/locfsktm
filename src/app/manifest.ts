import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FSKTM Floor Directory | UTHM',
    short_name: 'FSKTM Map',
    description: 'Interactive 8-floor campus directory and navigation for FSKTM UTHM students & visitors',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#B91C1C',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
