'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, MapPin, ArrowRight, Layers } from 'lucide-react';
import { FLOORS_DATA } from '../data/floors';
import { Room } from '../types/directory';

interface SearchResultItem {
  room: Room;
  floorId: number;
  floorName: string;
  floorCode: string;
  wingName: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (floorId: number, room: Room) => void;
}

export default function SearchModal({
  isOpen,
  onClose,
  onSelectResult,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on modal open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via custom event or let parent handle
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Flatten all rooms across all floors
  const allRoomsList = useMemo(() => {
    const list: SearchResultItem[] = [];
    FLOORS_DATA.forEach((floor) => {
      floor.wings.forEach((wing) => {
        wing.rooms.forEach((room) => {
          list.push({
            room,
            floorId: floor.id,
            floorName: floor.nameMalay,
            floorCode: floor.levelCode,
            wingName: wing.name,
          });
        });
      });
    });
    return list;
  }, []);

  // Filter items based on query
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allRoomsList.filter((item) => {
      const { room, floorName, floorCode, wingName } = item;
      const matchName = room.name.toLowerCase().includes(q);
      const matchCode = room.code.toLowerCase().includes(q);
      const matchShortform = room.shortform ? room.shortform.toLowerCase().includes(q) : false;
      const matchEn = room.nameEn ? room.nameEn.toLowerCase().includes(q) : false;
      const matchFloor = floorName.toLowerCase().includes(q) || floorCode.toLowerCase() === q;
      const matchWing = wingName.toLowerCase().includes(q);
      const matchTags = room.tags ? room.tags.some((t) => t.toLowerCase().includes(q)) : false;
      const matchDesc = room.description ? room.description.toLowerCase().includes(q) : false;

      return matchName || matchCode || matchShortform || matchEn || matchFloor || matchWing || matchTags || matchDesc;
    });
  }, [allRoomsList, query]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px 16px',
        animation: 'fadeIn 180ms ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          width: '100%',
          maxWidth: '640px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(185, 28, 28, 0.25), 0 0 0 1px #FECACA',
          overflow: 'hidden',
          marginTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #FEE2E2',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#FFFFFF'
        }}>
          <Search size={22} color="#DC2626" strokeWidth={2.4} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari bilik, makmal, singkatan (cth: MRM, CISCO, ISYS, BT1)..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              fontWeight: 600,
              color: '#0F172A',
              backgroundColor: 'transparent'
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{ padding: '4px', color: '#94A3B8' }}
            >
              <X size={18} />
            </button>
          ) : (
            <kbd style={{
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '2px 6px',
              fontSize: '11px',
              color: '#64748B',
              fontWeight: 700
            }}>
              ESC
            </kbd>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        {!query && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F8FAFC', backgroundColor: '#FEF2F2' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Carian Popular Pelajar & Singkatan:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['MRM', 'CISCO', 'ISYS', 'MGA', 'BT1', 'MSD', 'MKP', 'AUDITORIUM', 'Surau', 'Ruang Membaca', 'Pejabat Pentadbiran'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #FECACA',
                    color: '#B91C1C',
                    borderRadius: '9999px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px'
        }}>
          {query && filteredResults.length === 0 && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                Tiada padanan dijumpai untuk &quot;{query}&quot;
              </div>
              <div style={{ fontSize: '13px' }}>
                Cuba kata kunci seperti &quot;makmal&quot;, &quot;bilik&quot;, &quot;tutorial&quot;, atau nombor kod bilik.
              </div>
            </div>
          )}

          {filteredResults.map((item) => (
            <div
              key={item.room.id}
              onClick={() => {
                onSelectResult(item.floorId, item.room);
                onClose();
              }}
              role="button"
              tabIndex={0}
              style={{
                padding: '12px 14px',
                borderRadius: '14px',
                border: '1px solid transparent',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 140ms ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#FEF2F2';
                e.currentTarget.style.borderColor = '#FECACA';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Floor Pill */}
                <div style={{
                  backgroundColor: '#B91C1C',
                  color: '#FFFFFF',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(185, 28, 28, 0.3)'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: 900, lineHeight: 1 }}>
                    {item.floorCode}
                  </span>
                  <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase' }}>
                    Aras
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                      {item.room.name}
                    </span>
                    {item.room.shortform && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        backgroundColor: '#DC2626',
                        color: '#FFFFFF',
                        padding: '1px 8px',
                        borderRadius: '9999px',
                        letterSpacing: '0.08em',
                        boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
                        flexShrink: 0
                      }}>
                        {item.room.shortform}
                      </span>
                    )}
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.room.code}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span>{item.floorName}</span>
                    <span>•</span>
                    <span>{item.wingName}</span>
                  </div>
                </div>
              </div>

              <div style={{
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <span className="hide-mobile">Lihat</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #F1F5F9',
          backgroundColor: '#FAFAFA',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748B'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="#991B1B" />
            <span>Mencari di seluruh 8 aras FSKTM</span>
          </div>
          <span>Ketik mana-mana hasil untuk buka pelan</span>
        </div>
      </div>
    </div>
  );
}
