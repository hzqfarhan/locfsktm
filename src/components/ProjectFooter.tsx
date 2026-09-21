'use client';

import React from 'react';
import { Layers, Users, ExternalLink, Heart, Sparkles } from 'lucide-react';

export interface Contributor {
  name: string;
  handle: string;
  githubUrl: string;
  avatarUrl: string;
  fallbackAvatarUrl: string;
  active: boolean;
  highlighted?: boolean;
}

export const CONTRIBUTORS: Contributor[] = [
  {
    name: "Yunn",
    handle: "@hzqfarhan",
    githubUrl: "https://github.com/hzqfarhan",
    avatarUrl: "https://github.com/hzqfarhan.png",
    fallbackAvatarUrl: "https://avatars.githubusercontent.com/u/203814306?v=4",
    active: true,
    highlighted: true,
  },
  {
    name: "Kiro",
    handle: "@pwntable",
    githubUrl: "https://github.com/pwntable",
    avatarUrl: "https://github.com/pwntable.png",
    fallbackAvatarUrl: "https://avatars.githubusercontent.com/u/220985859?v=4",
    active: true,
  },
];

export default function ProjectFooter() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-top">
        {/* Brand & Project Info */}
        <div className="footer-brand-col">
          <div className="footer-brand">
            <div className="footer-logo" aria-hidden="true">
              <Layers size={18} strokeWidth={2.4} />
            </div>
            <span className="footer-title">Direktori Aras FSKTM UTHM</span>
          </div>
          <p className="footer-desc hide-mobile">
            Aplikasi pelan interaktif 2D dan model 3D untuk memudahkan warga universiti serta pelajar mencari bilik kuliah, makmal komputer, pejabat pensyarah dan kemudahan di Fakulti Sains Komputer dan Teknologi Maklumat.
          </p>
        </div>

        {/* Contributors Section */}
        <div className="footer-contributors-col">
          <div className="footer-section-hdr">
            <Users size={15} strokeWidth={2.4} />
            <span className="footer-section-title">Penyumbang Projek</span>
          </div>

          <div className="contributors-grid">
            {CONTRIBUTORS.map((contributor) => (
              <a
                key={contributor.handle}
                href={contributor.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`contributor-card ${contributor.highlighted ? 'contributor-card-highlighted' : ''}`}
                title={`GitHub: ${contributor.handle}`}
              >
                <div className="contributor-avatar-wrap">
                  <img
                    src={contributor.avatarUrl}
                    alt={`${contributor.name} avatar`}
                    className={`contributor-avatar ${contributor.highlighted ? 'contributor-avatar-highlighted' : ''}`}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = contributor.fallbackAvatarUrl;
                    }}
                  />
                  {contributor.active && (
                    <div className="contributor-online-dot" title="Penyumbang Aktif" />
                  )}
                </div>
                <div className="contributor-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span className="contributor-name">{contributor.name}</span>
                    {contributor.highlighted && (
                      <span className="contributor-lead-badge">
                        <Sparkles size={8} strokeWidth={2.5} />
                        Lead
                      </span>
                    )}
                  </div>
                  <span className="contributor-handle">{contributor.handle}</span>
                </div>
                <div className="contributor-link-icon hide-mobile" aria-hidden="true">
                  <ExternalLink size={13} strokeWidth={2.2} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom Sub-bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-text">
          Dibina dengan <Heart size={12} fill="#EF4444" color="#EF4444" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> untuk mahasiswa FSKTM
        </div>
        <div className="footer-bottom-disclaimer">
          Inisiatif komuniti bebas • Tidak rasmi UTHM
        </div>
      </div>
    </footer>
  );
}
