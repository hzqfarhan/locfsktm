'use client';

import { useState } from 'react';
import { Floor, Room, RoomCategory } from '../types/directory';
import {
  FlaskConical,
  GraduationCap,
  Briefcase,
  Users,
  Compass,
  Copy,
  Check,
  Building,
  Info
} from 'lucide-react';

interface RoomCatalogProps {
  floor: Floor;
  activeWingId: string | null;
  onSelectRoom: (room: Room) => void;
}

export default function RoomCatalog({
  floor,
  activeWingId,
  onSelectRoom,
}: RoomCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | 'all'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  // Extract all rooms based on active wing filter
  const displayedWings = activeWingId
    ? floor.wings.filter((w) => w.id === activeWingId)
    : floor.wings;

  const getCategoryIcon = (category: RoomCategory) => {
    switch (category) {
      case 'lab':
        return <FlaskConical size={14} />;
      case 'class':
        return <GraduationCap size={14} />;
      case 'office':
        return <Briefcase size={14} />;
      case 'meeting':
        return <Users size={14} />;
      case 'facility':
      default:
        return <Building size={14} />;
    }
  };

  const getCategoryLabel = (category: RoomCategory) => {
    switch (category) {
      case 'lab':
        return 'Makmal';
      case 'class':
        return 'Kuliah / Tutorial';
      case 'office':
        return 'Pejabat Pensyarah';
      case 'meeting':
        return 'Bilik Mesyuarat';
      case 'facility':
      default:
        return 'Kemudahan';
    }
  };

  const getCategoryBadgeStyle = (category: RoomCategory) => {
    switch (category) {
      case 'lab':
        return { backgroundColor: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' };
      case 'class':
        return { backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' };
      case 'office':
        return { backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' };
      case 'meeting':
        return { backgroundColor: '#F3E8FF', color: '#6B21A8', border: '1px solid #E9D5FF' };
      case 'facility':
      default:
        return { backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Category Filter Chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: selectedCategory === 'all' ? '#B91C1C' : '#FFFFFF',
            color: selectedCategory === 'all' ? '#FFFFFF' : '#475569',
            border: selectedCategory === 'all' ? '1px solid #B91C1C' : '1px solid #E2E8F0',
            boxShadow: selectedCategory === 'all' ? '0 2px 6px rgba(185, 28, 28, 0.25)' : 'none',
            whiteSpace: 'nowrap',
            transition: 'all 150ms ease'
          }}
        >
          Semua Ruang ({floor.stats.totalRooms})
        </button>

        {floor.stats.labs > 0 && (
          <button
            onClick={() => setSelectedCategory('lab')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: selectedCategory === 'lab' ? '#B91C1C' : '#FFFFFF',
              color: selectedCategory === 'lab' ? '#FFFFFF' : '#475569',
              border: selectedCategory === 'lab' ? '1px solid #B91C1C' : '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
              transition: 'all 150ms ease'
            }}
          >
            <FlaskConical size={14} />
            Makmal ({floor.stats.labs})
          </button>
        )}

        {floor.stats.classrooms > 0 && (
          <button
            onClick={() => setSelectedCategory('class')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: selectedCategory === 'class' ? '#B91C1C' : '#FFFFFF',
              color: selectedCategory === 'class' ? '#FFFFFF' : '#475569',
              border: selectedCategory === 'class' ? '1px solid #B91C1C' : '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
              transition: 'all 150ms ease'
            }}
          >
            <GraduationCap size={14} />
            Kuliah & Tutorial ({floor.stats.classrooms})
          </button>
        )}

        {floor.stats.offices > 0 && (
          <button
            onClick={() => setSelectedCategory('office')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: selectedCategory === 'office' ? '#B91C1C' : '#FFFFFF',
              color: selectedCategory === 'office' ? '#FFFFFF' : '#475569',
              border: selectedCategory === 'office' ? '1px solid #B91C1C' : '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
              transition: 'all 150ms ease'
            }}
          >
            <Briefcase size={14} />
            Pejabat Pensyarah ({floor.stats.offices})
          </button>
        )}

        {floor.id === 2 || floor.id === 7 ? (
          <button
            onClick={() => setSelectedCategory('meeting')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: selectedCategory === 'meeting' ? '#B91C1C' : '#FFFFFF',
              color: selectedCategory === 'meeting' ? '#FFFFFF' : '#475569',
              border: selectedCategory === 'meeting' ? '1px solid #B91C1C' : '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
              transition: 'all 150ms ease'
            }}
          >
            <Users size={14} />
            Bilik Mesyuarat
          </button>
        ) : null}

        <button
          onClick={() => setSelectedCategory('facility')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            backgroundColor: selectedCategory === 'facility' ? '#B91C1C' : '#FFFFFF',
            color: selectedCategory === 'facility' ? '#FFFFFF' : '#475569',
            border: selectedCategory === 'facility' ? '1px solid #B91C1C' : '1px solid #E2E8F0',
            whiteSpace: 'nowrap',
            transition: 'all 150ms ease'
          }}
        >
          <Building size={14} />
          Kemudahan (Lif/Tandas/Surau)
        </button>
      </div>

      {/* Wings and Rooms List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {displayedWings.map((wing) => {
          const filteredRooms = wing.rooms.filter((room) =>
            selectedCategory === 'all' ? true : room.category === selectedCategory
          );

          if (filteredRooms.length === 0) return null;

          return (
            <div
              key={wing.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #FEE2E2',
                padding: '18px',
                boxShadow: '0 2px 12px -2px rgba(185, 28, 28, 0.05)'
              }}
            >
              {/* Wing Title Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #F8FAFC'
              }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#991B1B' }}>
                    {wing.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    {wing.description}
                  </div>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#FEF2F2',
                  color: '#B91C1C',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #FECACA'
                }}>
                  {filteredRooms.length} Ruang
                </span>
              </div>

              {/* Room Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {filteredRooms.map((room) => {
                  const badgeStyle = getCategoryBadgeStyle(room.category);
                  const isCopied = copiedCode === room.code;

                  return (
                    <div
                      key={room.id}
                      onClick={() => onSelectRoom(room)}
                      role="button"
                      tabIndex={0}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '14px',
                        padding: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px',
                        transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#DC2626';
                        e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(185, 28, 28, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                        e.currentTarget.style.transform = 'none';
                      }}
                    >
                      {/* Card Top: Code & Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#0F172A'
                            }}
                          >
                            <span>{room.code}</span>
                            <button
                              onClick={(e) => handleCopy(e, room.code)}
                              title="Salin Kod Bilik"
                              style={{
                                color: isCopied ? '#16A34A' : '#94A3B8',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '1px'
                              }}
                            >
                              {isCopied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>

                          {room.shortform && (
                            <span
                              style={{
                                backgroundColor: '#DC2626',
                                color: '#FFFFFF',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                fontSize: '10px',
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
                              }}
                            >
                              {room.shortform}
                            </span>
                          )}
                        </div>

                        {/* Category Pill */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '10px',
                            fontWeight: 700,
                            ...badgeStyle
                          }}
                        >
                          {getCategoryIcon(room.category)}
                          <span>{getCategoryLabel(room.category)}</span>
                        </div>
                      </div>

                      {/* Card Title & Description */}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                          {room.name}
                        </div>
                        {room.nameEn && (
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
                            {room.nameEn}
                          </div>
                        )}
                        {room.description && (
                          <div style={{
                            fontSize: '12px',
                            color: '#475569',
                            marginTop: '6px',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {room.description}
                          </div>
                        )}
                      </div>

                      {/* Card Bottom: Facilities or Directions Preview */}
                      <div style={{
                        paddingTop: '8px',
                        borderTop: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#64748B'
                      }}>
                        {room.directions ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B91C1C', fontWeight: 600 }}>
                            <Compass size={13} />
                            <span style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px'
                            }}>
                              {room.directions}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8' }}>{wing.name}</span>
                        )}

                        <span style={{
                          color: '#DC2626',
                          fontWeight: 700,
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          Perincian →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
