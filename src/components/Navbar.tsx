'use client';

import { Floor } from '../types/directory';
import { Search, Layers } from 'lucide-react';
import VersionBadge from './VersionBadge';

interface NavbarProps {
  floors?: Floor[];
  selectedFloorId?: number;
  onSelectFloor?: (floorId: number) => void;
  onOpenSearch: () => void;
}

export default function Navbar({
  onOpenSearch,
}: NavbarProps) {

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#FFFFFF',
        borderBottom: '2px solid #FEE2E2',
        boxShadow: '0 2px 10px -2px rgba(185, 28, 28, 0.08)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 3px 8px rgba(185, 28, 28, 0.3)',
              flexShrink: 0,
            }}
          >
            <Layers size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#991B1B', letterSpacing: '-0.02em' }}>
                FSKTM
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  backgroundColor: '#FEE2E2',
                  color: '#B91C1C',
                  padding: '1px 5px',
                  borderRadius: '4px',
                }}
              >
                UTHM
              </span>
            </div>
            <div className="hide-mobile" style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
              Direktori Aras Bangunan
            </div>
          </div>
        </div>

        {/* Right Section: Version Badge & Search Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="hide-mobile">
            <VersionBadge />
          </div>

          {/* Search button */}
          <button
            onClick={onOpenSearch}
          aria-label="Cari bilik atau makmal"
          className="navbar-search-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#991B1B',
            borderRadius: '9999px',
            padding: '7px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            flexShrink: 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#FEE2E2';
            e.currentTarget.style.borderColor = '#F87171';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#FEF2F2';
            e.currentTarget.style.borderColor = '#FECACA';
          }}
        >
          <Search size={15} color="#DC2626" strokeWidth={2.4} />
          <span className="hide-mobile">Cari Bilik</span>
          <kbd
            className="hide-mobile"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              fontSize: '10px',
              padding: '1px 5px',
              color: '#64748B',
              fontWeight: 700,
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>
      </div>
    </header>
  );
}
