'use client';

import { Floor } from '../types/directory';
import { ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';

interface FloorSelectorProps {
  floors: Floor[];
  selectedFloorId: number;
  onSelectFloor: (floorId: number) => void;
}

export default function FloorSelector({
  floors,
  selectedFloorId,
  onSelectFloor,
}: FloorSelectorProps) {
  const currentFloor = floors[selectedFloorId] || floors[0];

  const handleNextFloor = () => {
    if (selectedFloorId < floors.length - 1) {
      onSelectFloor(selectedFloorId + 1);
    }
  };

  const handlePrevFloor = () => {
    if (selectedFloorId > 0) {
      onSelectFloor(selectedFloorId - 1);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '10px 16px',
        border: '1px solid #FEE2E2',
        boxShadow: '0 2px 12px -2px rgba(185, 28, 28, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      {/* Current Floor Info Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 900,
            boxShadow: '0 4px 10px rgba(220, 38, 38, 0.3)',
            flexShrink: 0
          }}
        >
          {currentFloor.levelCode}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>
              {currentFloor.nameMalay}
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              ({currentFloor.name})
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600 }}>
            {currentFloor.description.slice(0, 75)}...
          </div>
        </div>
      </div>

      {/* Horizontal Level Switcher Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={handlePrevFloor}
          disabled={selectedFloorId === 0}
          title="Turun satu tingkat"
          aria-label="Turun satu tingkat"
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            backgroundColor: selectedFloorId === 0 ? '#F1F5F9' : '#FEF2F2',
            color: selectedFloorId === 0 ? '#CBD5E1' : '#B91C1C',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: selectedFloorId === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={16} />
        </button>

        {floors.map((f) => {
          const isSelected = f.id === selectedFloorId;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFloor(f.id)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 900,
                backgroundColor: isSelected ? '#B91C1C' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#334155',
                border: isSelected ? '1px solid #B91C1C' : '1px solid #E2E8F0',
                boxShadow: isSelected ? '0 3px 10px rgba(185, 28, 28, 0.35)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 120ms ease'
              }}
              onMouseOver={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                  e.currentTarget.style.borderColor = '#FECACA';
                  e.currentTarget.style.color = '#B91C1C';
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#334155';
                }
              }}
            >
              {f.levelCode}
            </button>
          );
        })}

        <button
          onClick={handleNextFloor}
          disabled={selectedFloorId === floors.length - 1}
          title="Naik satu tingkat"
          aria-label="Naik satu tingkat"
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            backgroundColor: selectedFloorId === floors.length - 1 ? '#F1F5F9' : '#FEF2F2',
            color: selectedFloorId === floors.length - 1 ? '#CBD5E1' : '#B91C1C',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: selectedFloorId === floors.length - 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
