'use client';

import { Floor } from '../types/directory';
import { Search, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface NavbarProps {
  floors: Floor[];
  selectedFloorId: number;
  onSelectFloor: (floorId: number) => void;
  onOpenSearch: () => void;
}

export default function Navbar({
  floors,
  selectedFloorId,
  onSelectFloor,
  onOpenSearch,
}: NavbarProps) {
  const currentFloor = floors[selectedFloorId] || floors[0];

  const handlePrev = () => {
    if (selectedFloorId > 0) onSelectFloor(selectedFloorId - 1);
  };

  const handleNext = () => {
    if (selectedFloorId < floors.length - 1) onSelectFloor(selectedFloorId + 1);
  };

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

        {/* Center: Integrated Floor Selector (G to 7) */}
        <div
          className="navbar-floor-selector"
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            padding: '4px 6px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            gap: '3px',
          }}
        >
          <button
            onClick={handlePrev}
            disabled={selectedFloorId === 0}
            title="Turun satu tingkat"
            aria-label="Turun satu tingkat"
            className="navbar-nav-btn"
            style={{
              padding: '5px',
              borderRadius: '7px',
              backgroundColor: selectedFloorId === 0 ? 'transparent' : '#FFFFFF',
              color: selectedFloorId === 0 ? '#CBD5E1' : '#B91C1C',
              border: selectedFloorId === 0 ? '1px solid transparent' : '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: selectedFloorId === 0 ? 'not-allowed' : 'pointer',
              lineHeight: 1,
            }}
          >
            <ChevronLeft size={15} />
          </button>

          <span
            className="hide-mobile"
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#64748B',
              padding: '0 4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Aras:
          </span>

          {floors.map((f) => {
            const isSelected = f.id === selectedFloorId;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFloor(f.id)}
                title={`${f.nameMalay} (${f.name})`}
                className={`navbar-floor-btn ${isSelected ? 'active' : ''}`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 900,
                  backgroundColor: isSelected ? '#B91C1C' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  border: isSelected ? '1px solid #B91C1C' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 2px 8px rgba(185, 28, 28, 0.35)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 120ms ease',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#FEF2F2';
                    e.currentTarget.style.color = '#B91C1C';
                    e.currentTarget.style.borderColor = '#FECACA';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }
                }}
              >
                {f.levelCode}
              </button>
            );
          })}

          <button
            onClick={handleNext}
            disabled={selectedFloorId === floors.length - 1}
            title="Naik satu tingkat"
            aria-label="Naik satu tingkat"
            className="navbar-nav-btn"
            style={{
              padding: '5px',
              borderRadius: '7px',
              backgroundColor: selectedFloorId === floors.length - 1 ? 'transparent' : '#FFFFFF',
              color: selectedFloorId === floors.length - 1 ? '#CBD5E1' : '#B91C1C',
              border: selectedFloorId === floors.length - 1 ? '1px solid transparent' : '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: selectedFloorId === floors.length - 1 ? 'not-allowed' : 'pointer',
              lineHeight: 1,
            }}
          >
            <ChevronRight size={15} />
          </button>
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
    </header>
  );
}
