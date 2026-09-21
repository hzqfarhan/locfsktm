'use client';

import { useState } from 'react';
import { Floor, Room } from '../types/directory';
import { Compass, Layers } from 'lucide-react';
import InteractiveFloorPlan from './InteractiveFloorPlan';
import Building3DViewer from './Building3DViewer';

interface FloorMapViewerProps {
  floor: Floor;
  activeWingId?: string | null;
  onSelectWing?: (wingId: string | null) => void;
  selectedRoom?: Room | null;
  onSelectRoom?: (room: Room) => void;
  onSelectFloor?: (floorId: number) => void;
  onClearSelectedRoom?: () => void;
  onOpenDetailModal?: (room: Room) => void;
}

export default function FloorMapViewer({
  floor,
  activeWingId = null,
  selectedRoom = null,
  onSelectRoom = () => {},
  onSelectFloor = () => {},
  onClearSelectedRoom,
  onOpenDetailModal,
}: FloorMapViewerProps) {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  return (
    <div
      className="floor-map-container"
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 96px)',
        minHeight: '660px',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #FEE2E2',
        boxShadow: '0 4px 20px -2px rgba(185, 28, 28, 0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Floating View Switcher: Pelan 2D vs Model 3D Only */}
      <div
        className="view-mode-switcher"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '3px',
          borderRadius: '12px',
          border: '1px solid #FEE2E2',
          boxShadow: '0 4px 16px rgba(185, 28, 28, 0.12)',
          gap: '3px',
        }}
      >
        <button
          onClick={() => setViewMode('2d')}
          title="Paparan Pelan 2D Interaktif"
          aria-label="Pelan 2D"
          className="view-mode-btn"
          style={{
            padding: '7px 14px',
            borderRadius: '9px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: viewMode === '2d' ? '#B91C1C' : 'transparent',
            color: viewMode === '2d' ? '#FFFFFF' : '#475569',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 120ms ease',
            boxShadow: viewMode === '2d' ? '0 2px 8px rgba(185, 28, 28, 0.28)' : 'none',
          }}
        >
          <Compass size={15} />
          <span className="view-mode-btn-text">Pelan 2D</span>
        </button>

        <button
          onClick={() => setViewMode('3d')}
          title="Paparan Model 3D Bangunan FSKTM"
          aria-label="Model 3D"
          className="view-mode-btn"
          style={{
            padding: '7px 14px',
            borderRadius: '9px',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: viewMode === '3d' ? '#B91C1C' : 'transparent',
            color: viewMode === '3d' ? '#FFFFFF' : '#475569',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 120ms ease',
            boxShadow: viewMode === '3d' ? '0 2px 8px rgba(185, 28, 28, 0.28)' : 'none',
          }}
        >
          <Layers size={15} />
          <span className="view-mode-btn-text">Model 3D</span>
        </button>
      </div>

      {/* Main Map Canvas: Exclusively Pelan 2D or Model 3D */}
      <div style={{ flex: 1, width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        {viewMode === '2d' ? (
          <InteractiveFloorPlan
            floor={floor}
            activeWingId={activeWingId}
            selectedRoom={selectedRoom}
            onSelectRoom={onSelectRoom}
            onClearSelectedRoom={onClearSelectedRoom}
            onOpenDetailModal={onOpenDetailModal}
          />
        ) : (
          <Building3DViewer
            selectedFloorId={floor.id}
            onSelectFloor={onSelectFloor}
          />
        )}
      </div>
    </div>
  );
}
