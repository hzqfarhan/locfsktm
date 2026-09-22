'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Floor, Room, RoomCategory } from '../types/directory';
import { FLOORS_DATA } from '../data/floors';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  LayoutGrid,
  Building2,
  Laptop,
  GraduationCap,
  Sparkles,
  ChevronsUpDown,
  PersonStanding,
  Moon,
  MapPin,
  Car,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface InteractiveFloorPlanProps {
  floor: Floor;
  floors?: Floor[];
  activeWingId: string | null;
  selectedRoom: Room | null;
  onSelectRoom: (room: Room) => void;
  onClearSelectedRoom?: () => void;
  onOpenDetailModal?: (room: Room) => void;
  onSelectFloor?: (floorId: number) => void;
}

interface RoomNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  subLabel?: string;
  category: RoomCategory;
  wingId: string;
  isSpecialIcon?: 'lift' | 'toilet' | 'surau';
}

interface FloorLayoutDefinition {
  viewBox: string;
  youAreHere?: { x: number; y: number };
  renderOuterLayer: () => React.ReactNode;
  renderCorridors: () => React.ReactNode;
  renderSiteContext?: () => React.ReactNode;
  nodes: RoomNode[];
  leftWingGroup?: {
    transform: string;
    nodes: RoomNode[];
    outerLayer: React.ReactNode;
    corridors: React.ReactNode;
  };
}

// Multi-line SVG text wrapper to prevent any label overflowing its room box
function renderWrappedText(
  text: string,
  subText: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  textColor: string,
  compact = false
) {
  const maxChars = compact || w < 65 ? 8 : w < 105 ? 12 : 16;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';

  for (const word of words) {
    if ((cur + ' ' + word).trim().length <= maxChars) {
      cur = (cur + ' ' + word).trim();
    } else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);

  const fontSize = compact || w < 65 ? 7 : w < 95 ? 8 : lines.length > 2 ? 8.5 : 9.5;
  const lineHeight = fontSize * 1.25;
  const totalTextHeight = lines.length * lineHeight + (subText ? 10 : 0);
  const startY = y + (h - totalTextHeight) / 2 + fontSize * 0.8;

  return (
    <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <text
        x={x + w / 2}
        y={startY}
        textAnchor="middle"
        fill={textColor}
        fontSize={`${fontSize}px`}
        fontWeight={800}
        letterSpacing="-0.01em"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {lines.map((line, idx) => (
          <tspan key={idx} x={x + w / 2} dy={idx === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
      {subText && (
        <text
          x={x + w / 2}
          y={startY + lines.length * lineHeight + 2}
          textAnchor="middle"
          fill="#64748B"
          fontSize={`${Math.max(fontSize - 1.5, 6.5)}px`}
          fontWeight={600}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {subText}
        </text>
      )}
    </g>
  );
}

export default function InteractiveFloorPlan({
  floor,
  floors = FLOORS_DATA,
  activeWingId,
  selectedRoom,
  onSelectRoom,
  onClearSelectedRoom,
  onOpenDetailModal,
  onSelectFloor,
}: InteractiveFloorPlanProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<{ node: RoomNode; room?: Room; clientX: number; clientY: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | RoomCategory>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // Set default rotation to -90° (left), pan x: 0, y: 0, and zoom 1.5 (150%) on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 640) {
      setRotation(-90);
      setZoom(1.5);
      setPan({ x: 0, y: 0 });
    }
  }, []);

  // Gesture tracking refs for ultra-responsive mobile touch pinch & pan
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomRef = useRef<number>(1);
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartZoomRef = useRef<number>(1);
  const touchStartMidRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchMovedRef = useRef<boolean>(false);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Clear any active tooltip when switching floors, and reset mobile alignment
  useEffect(() => {
    setHoveredNode(null);
    if (typeof window !== 'undefined' && window.innerWidth <= 640) {
      setPan({ x: 0, y: 0 });
      setZoom(1.5);
      setRotation(-90);
    }
  }, [floor.id]);

  // Map room data from floor.wings for instant lookup
  const roomLookup = useMemo(() => {
    const map = new Map<string, Room>();
    floor.wings.forEach((wing) => {
      wing.rooms.forEach((room) => {
        map.set(room.id.toLowerCase(), room);
        map.set(room.code.toLowerCase(), room);
        if (room.shortform) {
          map.set(room.shortform.toLowerCase(), room);
        }
      });
    });
    return map;
  }, [floor]);

  // Robust room resolver for node clicks and hovers across all floors
  const getRoomForNode = (node: RoomNode): Room | undefined => {
    const exact = roomLookup.get(node.id.toLowerCase());
    if (exact) return exact;

    const fCode = floor.id === 0 ? 'g' : `${floor.id}`;
    if (node.isSpecialIcon === 'lift') {
      return (
        roomLookup.get(`${fCode}-lif`) ||
        roomLookup.get(`lif-${fCode}`) ||
        roomLookup.get(`${fCode}-lif-1`) ||
        roomLookup.get(`${fCode}-lif-kiri`) ||
        roomLookup.get(`${fCode}-lif-kanan`)
      );
    }
    if (node.isSpecialIcon === 'toilet') {
      return (
        roomLookup.get(`${fCode}-tandas`) ||
        roomLookup.get(`${fCode}-tandas-kiri`) ||
        roomLookup.get(`${fCode}-tandas-kanan`) ||
        roomLookup.get(`${fCode}-tandas-tengah`) ||
        roomLookup.get(`tandas-${fCode}`)
      );
    }
    if (node.isSpecialIcon === 'surau') {
      return (
        roomLookup.get(`${fCode}-surau`) ||
        roomLookup.get(`surau-${fCode}`) ||
        roomLookup.get('3-surau') ||
        roomLookup.get('2-surau')
      );
    }
    return undefined;
  };

  // Comprehensive Layout definition matching physical kiosk photos IMG_1815 through IMG_1822
  // Strictly unified 1060 x 620 viewBox across ALL 8 floors so the frame NEVER shifts or moves
  const layout = useMemo<FloorLayoutDefinition>(() => {
    const floorId = floor.id;

    // Stationary Ghost Foundation / Podium Silhouette for Floors 4-7
    const renderGhostPodium = () => (
      <g opacity="0.38" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 4" fill="#F8FAFC">
        {/* Sayap Kiri Outline */}
        <g transform="translate(415, 274) rotate(-33)">
          <rect x="-455" y="-172" width="460" height="190" rx="16" />
          <text
            x="-230"
            y="-70"
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="9px"
            fontWeight="800"
            letterSpacing="0.06em"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            BUMBUNG SAYAP KIRI (ARAS BAWAH - 3)
          </text>
        </g>
        {/* Sayap Kanan Outline */}
        <rect x="635" y="180" width="355" height="205" rx="16" />
        <text
          x="812"
          y="286"
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="9px"
          fontWeight="800"
          letterSpacing="0.06em"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          BUMBUNG SAYAP KANAN (ARAS BAWAH - 3)
        </text>
      </g>
    );

    // ----------------------------------------------------
    // GROUND FLOOR (IMG_1815.JPG)
    // ----------------------------------------------------
    if (floorId === 0) {
      const menaraAndKananNodes: RoomNode[] = [
        // Menara Tengah
        { id: 'g-admin', x: 425, y: 28, w: 200, h: 120, label: 'PEJABAT PENTADBIRAN', subLabel: 'DEKAN & AKADEMIK', category: 'office', wingId: 'menara-tengah' },
        { id: 'g-lif', x: 445, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },
        { id: 'g-lif-kanan', x: 555, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },

        // Sayap Kanan (Horizontal)
        { id: 'g-makmal-grafik', x: 645, y: 190, w: 160, h: 66, label: 'MAKMAL GRAFIK DAN ANIMASI', category: 'lab', wingId: 'sayap-kanan' },
        { id: 'g-studio-av', x: 815, y: 190, w: 165, h: 66, label: 'STUDIO MULTIMEDIA', category: 'lab', wingId: 'sayap-kanan' },
        { id: 'g-makmal-vr', x: 645, y: 292, w: 160, h: 86, label: 'MAKMAL REKABENTUK MULTIMEDIA', category: 'lab', wingId: 'sayap-kanan' },
        { id: 'g-makmal-data', x: 815, y: 292, w: 118, h: 86, label: 'MAKMAL SAINS DATA', category: 'lab', wingId: 'sayap-kanan' },
        { id: 'g-tandas-kanan', x: 941, y: 292, w: 42, h: 86, label: 'TANDAS', category: 'facility', wingId: 'sayap-kanan', isSpecialIcon: 'toilet' },
      ];

      // Sayap Kiri inside rotated group (-33 degrees)
      // Sayap Kiri inside rotated group (-33 degrees)
      const leftWingNodes: RoomNode[] = [
        // Backside row (top edge, y = -166, h = 70, extends to middle corridor at y = -96)
        // Bilik Pasca Siswazah sits above Bilik Siswazah 1, sharing a wall at y = -76 (h = 90)
        { id: 'g-pasca', x: -95, y: -166, w: 95, h: 90, label: 'MAKMAL PASCA SISWAZAH', category: 'class', wingId: 'sayap-kiri' },
        { id: 'g-siswazah-6', x: -195, y: -166, w: 100, h: 70, label: 'BILIK SISWAZAH 6', category: 'class', wingId: 'sayap-kiri' },
        { id: 'g-siswazah-5', x: -260, y: -166, w: 65, h: 70, label: 'BILIK SISWAZAH 5', category: 'class', wingId: 'sayap-kiri' },
        { id: 'g-siswazah-4', x: -340, y: -166, w: 80, h: 70, label: 'BILIK SISWAZAH 4', category: 'class', wingId: 'sayap-kiri' },
        { id: 'g-tandas-kiri', x: -406, y: -166, w: 66, h: 70, label: 'TANDAS', category: 'facility', wingId: 'sayap-kiri', isSpecialIcon: 'toilet' },
        { id: 'g-tandas-end', x: -448, y: -166, w: 22, h: 70, label: 'TANDAS', category: 'facility', wingId: 'sayap-kiri', isSpecialIcon: 'toilet' },

        // Frontside row (between middle corridor at y = -76 and front walkway at y = -12, h = 64)
        { id: 'g-siswazah-1', x: -95, y: -76, w: 95, h: 64, label: 'BILIK SISWAZAH 1', category: 'class', wingId: 'sayap-kiri' },
        { id: 'g-siswazah-2', x: -195, y: -76, w: 100, h: 64, label: 'BILIK SISWAZAH 2', category: 'class', wingId: 'sayap-kiri' },
        // (Open walkway gap below Siswazah 5: x = -260 to -195)
        { id: 'g-siswazah-3', x: -340, y: -76, w: 80, h: 64, label: 'BILIK SISWAZAH 3', category: 'class', wingId: 'sayap-kiri' },
        { id: 'g-ptm', x: -406, y: -76, w: 66, h: 64, label: 'PUSAT TEKNOLOGI MAKLUMAT', category: 'lab', wingId: 'sayap-kiri' },
        { id: 'g-pantri', x: -448, y: -76, w: 22, h: 64, label: 'PANTRI', category: 'facility', wingId: 'sayap-kiri' },
      ];

      return {
        viewBox: '-80 0 1140 620',
        youAreHere: { x: 525, y: 274 },
        nodes: menaraAndKananNodes,
        leftWingGroup: {
          transform: 'translate(415, 274) rotate(-33)',
          nodes: leftWingNodes,
          outerLayer: (
            <rect x="-455" y="-172" width="460" height="190" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          ),
          corridors: (
            <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
              {/* Frontside continuous walkway connecting to Menara corridor */}
              <rect x="-448" y="-12" width="453" height="24" fill="#FFFFFF" stroke="none" />
              <line x1="-448" y1="-12" x2="3" y2="-12" />
              <line x1="-448" y1="12" x2="3" y2="12" />
              <line x1="-448" y1="-12" x2="-448" y2="12" />

              {/* Open Walkway gap below Bilik Siswazah 5 connecting front walkway to middle corridor */}
              <rect x="-260" y="-76" width="65" height="64" fill="#FFFFFF" stroke="none" />
              <line x1="-260" y1="-12" x2="-260" y2="-76" />
              <line x1="-195" y1="-12" x2="-195" y2="-76" />

              {/* Middle Corridor between the two rows of rooms */}
              <rect x="-406" y="-96" width="311" height="20" fill="#FFFFFF" stroke="none" />
              <line x1="-406" y1="-96" x2="-95" y2="-96" />
              <line x1="-195" y1="-76" x2="-95" y2="-76" />
              <line x1="-406" y1="-76" x2="-260" y2="-76" />

              {/* Cross cut-through walkway between Tandas 1/PTM and Tandas End/Pantri */}
              <rect x="-426" y="-166" width="20" height="154" fill="#FFFFFF" stroke="none" />
              <line x1="-406" y1="-166" x2="-406" y2="-96" />
              <line x1="-406" y1="-76" x2="-406" y2="-12" />
              <line x1="-426" y1="-166" x2="-426" y2="-12" />
            </g>
          ),
        },
        renderOuterLayer: () => (
          <g>
            <rect x="415" y="20" width="220" height="266" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
            <rect x="635" y="180" width="355" height="205" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          </g>
        ),
        renderCorridors: () => (
          <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
            {/* Sayap Kanan Hallway */}
            <rect x="635" y="262" width="355" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="635" y1="262" x2="990" y2="262" />
            <line x1="635" y1="286" x2="990" y2="286" />

            {/* Menara Vertical Hallway */}
            <rect x="512" y="20" width="26" height="266" fill="#FFFFFF" stroke="none" />
            <line x1="512" y1="20" x2="512" y2="286" />
            <line x1="538" y1="20" x2="538" y2="286" />

            {/* Menara Horizontal Connector */}
            <rect x="415" y="262" width="220" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="415" y1="262" x2="635" y2="262" />
            <line x1="415" y1="286" x2="635" y2="286" />
          </g>
        ),
        renderSiteContext: () => (
          <g opacity="0.8">
            <circle cx="525" cy="410" r="54" fill="#F1F5F9" stroke="#64748B" strokeWidth="2.5" />
            <circle cx="525" cy="410" r="38" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="5 4" />
            <RotateCcw x={517} y={386} size={16} color="#475569" strokeWidth={2.2} />
            <text x="525" y="418" textAnchor="middle" fill="#475569" fontSize="9px" fontWeight="800">
              BULATAN UTAMA
            </text>

            <g stroke="#94A3B8" strokeWidth="1.5">
              <line x1="650" y1="365" x2="840" y2="365" />
              <line x1="650" y1="460" x2="840" y2="460" />
              <line x1="650" y1="365" x2="650" y2="460" />
              <line x1="840" y1="365" x2="840" y2="460" />
              {[670, 690, 710, 730, 750, 770, 790, 810, 830].map((px) => (
                <line key={px} x1={px} y1="365" x2={px} y2="460" stroke="#CBD5E1" strokeDasharray="3 3" />
              ))}
              <Car x={737} y={395} size={16} color="#64748B" strokeWidth={2} />
              <text x="745" y="424" textAnchor="middle" fill="#64748B" fontSize="8.5px" fontWeight="800">
                TEMPAT LETAK KENDERAAN
              </text>
            </g>
          </g>
        ),
      };
    }

    // ----------------------------------------------------
    // FIRST FLOOR (IMG_1816.JPG)
    // ----------------------------------------------------
    if (floorId === 1) {
      const menaraAndKananNodes: RoomNode[] = [
        // Menara Tengah
        { id: '1-pb-101-06', x: 425, y: 28, w: 82, h: 50, label: 'PB-101-06', category: 'office', wingId: 'menara-tengah' },
        { id: '1-pb-101-05a', x: 425, y: 84, w: 82, h: 50, label: 'PB-101-05A', category: 'office', wingId: 'menara-tengah' },
        { id: '1-lif', x: 445, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },

        { id: '1-pb-101-07', x: 543, y: 28, w: 82, h: 50, label: 'PB-101-07', category: 'office', wingId: 'menara-tengah' },
        { id: '1-pb-101-08', x: 543, y: 84, w: 82, h: 48, label: 'PB-101-08', category: 'office', wingId: 'menara-tengah' },
        { id: '1-pb-101-09', x: 543, y: 138, w: 82, h: 48, label: 'PB-101-09', category: 'office', wingId: 'menara-tengah' },
        { id: '1-lif-kanan', x: 555, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },

        // Sayap Kanan
        { id: '1-kj', x: 642, y: 194, w: 72, h: 62, label: 'PEJABAT KETUA JABATAN', category: 'office', wingId: 'sayap-kanan' },
        { id: '1-makmal-se', x: 722, y: 190, w: 135, h: 66, label: 'MAKMAL KEJURUTERAAN PERISIAN', category: 'lab', wingId: 'sayap-kanan' },
        { id: '1-pej-ict', x: 864, y: 190, w: 118, h: 66, label: 'PEJABAT ICT', category: 'office', wingId: 'sayap-kanan' },
        { id: '1-makmal-dev', x: 645, y: 292, w: 160, h: 86, label: 'MAKMAL PEMBANGUNAN PERISIAN', category: 'lab', wingId: 'sayap-kanan' },
        { id: '1-makmal-prog', x: 815, y: 292, w: 118, h: 86, label: 'MAKMAL PENGATURCARAAN', category: 'lab', wingId: 'sayap-kanan' },
        { id: '1-tandas-kanan', x: 941, y: 292, w: 42, h: 86, label: 'TANDAS', category: 'facility', wingId: 'sayap-kanan', isSpecialIcon: 'toilet' },
      ];

      const leftWingNodes: RoomNode[] = [
        { id: '1-tandas-kiri', x: -44, y: -52, w: 40, h: 40, label: 'TANDAS', category: 'facility', wingId: 'sayap-kiri', isSpecialIcon: 'toilet' },
        { id: '1-makmal-infosys', x: -190, y: -166, w: 146, h: 154, label: 'MAKMAL INFOSYS', category: 'lab', wingId: 'sayap-kiri' },
        { id: '1-ruang-membaca', x: -366, y: -166, w: 172, h: 154, label: 'RUANG MEMBACA PELAJAR', category: 'class', wingId: 'sayap-kiri' },
        { id: '1-kubikel-1', x: -448, y: -166, w: 78, h: 48, label: 'BILIK 1', category: 'class', wingId: 'sayap-kiri' },
        { id: '1-kubikel-2', x: -448, y: -113, w: 78, h: 48, label: 'BILIK 2', category: 'class', wingId: 'sayap-kiri' },
        { id: '1-kubikel-3', x: -448, y: -60, w: 78, h: 48, label: 'BILIK 3', category: 'class', wingId: 'sayap-kiri' },
      ];

      return {
        viewBox: '-80 0 1140 620',
        youAreHere: { x: 525, y: 274 },
        nodes: menaraAndKananNodes,
        leftWingGroup: {
          transform: 'translate(415, 274) rotate(-33)',
          nodes: leftWingNodes,
          outerLayer: (
            <rect x="-455" y="-172" width="460" height="190" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          ),
          corridors: (
            <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
              {/* Frontside continuous walkway connecting to Menara corridor */}
              <rect x="-448" y="-12" width="453" height="24" fill="#FFFFFF" stroke="none" />
              <line x1="-448" y1="-12" x2="3" y2="-12" />
              <line x1="-448" y1="12" x2="3" y2="12" />
              <line x1="-448" y1="-12" x2="-448" y2="12" />
            </g>
          ),
        },
        renderOuterLayer: () => (
          <g>
            <rect x="415" y="20" width="220" height="266" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
            <rect x="635" y="180" width="355" height="205" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          </g>
        ),
        renderCorridors: () => (
          <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
            <rect x="635" y="262" width="355" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="635" y1="262" x2="990" y2="262" />
            <line x1="635" y1="286" x2="990" y2="286" />

            <rect x="512" y="20" width="26" height="266" fill="#FFFFFF" stroke="none" />
            <line x1="512" y1="20" x2="512" y2="286" />
            <line x1="538" y1="20" x2="538" y2="286" />

            <rect x="415" y="262" width="220" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="415" y1="262" x2="635" y2="262" />
            <line x1="415" y1="286" x2="635" y2="286" />
          </g>
        ),
      };
    }

    // ----------------------------------------------------
    // SECOND FLOOR (IMG_1817.JPG)
    // ----------------------------------------------------
    if (floorId === 2) {
      const menaraAndKananNodes: RoomNode[] = [
        // Menara Upper Block
        { id: '2-mesy-pengurusan', x: 425, y: 28, w: 200, h: 60, label: 'BILIK MESYUARAT PENGURUSAN FSKTM', category: 'meeting', wingId: 'menara-tengah' },
        { id: '2-pb-101-09', x: 543, y: 94, w: 82, h: 45, label: 'PB-101-09', category: 'office', wingId: 'menara-tengah' },
        { id: '2-pb-102-01', x: 543, y: 143, w: 82, h: 45, label: 'PB-102-01', category: 'office', wingId: 'menara-tengah' },
        { id: '2-lif-kiri', x: 445, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },
        { id: '2-lif', x: 555, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },

        // Menara SOUTH EXTENSION (PB-208..206 left, PB-202..205 right)
        { id: '2-pb-208', x: 424, y: 292, w: 84, h: 90, label: 'PB-208', category: 'office', wingId: 'menara-tengah' },
        { id: '2-pb-207', x: 424, y: 388, w: 84, h: 90, label: 'PB-207', category: 'office', wingId: 'menara-tengah' },
        { id: '2-pb-206', x: 424, y: 484, w: 84, h: 90, label: 'PB-206', category: 'office', wingId: 'menara-tengah' },

        { id: '2-pb-202', x: 542, y: 292, w: 84, h: 66, label: 'PB-202', category: 'office', wingId: 'menara-tengah' },
        { id: '2-pb-203', x: 542, y: 364, w: 84, h: 66, label: 'PB-203', category: 'office', wingId: 'menara-tengah' },
        { id: '2-pb-204', x: 542, y: 436, w: 84, h: 66, label: 'PB-204', category: 'office', wingId: 'menara-tengah' },
        { id: '2-pb-205', x: 542, y: 508, w: 84, h: 66, label: 'PB-205', category: 'office', wingId: 'menara-tengah' },

        // Sayap Kanan
        { id: '2-pb-213', x: 642, y: 198, w: 55, h: 58, label: 'PB-213', category: 'office', wingId: 'sayap-kanan' },
        { id: '2-makmal-forensik', x: 705, y: 190, w: 135, h: 66, label: 'MAKMAL FORENSIK DIGITAL', category: 'lab', wingId: 'sayap-kanan' },
        { id: '2-akademi-aruba', x: 848, y: 190, w: 88, h: 66, label: 'AKADEMI HP ARUBA', category: 'lab', wingId: 'sayap-kanan' },
        { id: '2-surau', x: 944, y: 190, w: 38, h: 66, label: 'SURAU', category: 'facility', wingId: 'sayap-kanan', isSpecialIcon: 'surau' },
        { id: '2-akademi-cisco', x: 645, y: 292, w: 160, h: 86, label: 'AKADEMI RANGKAIAN CISCO', category: 'lab', wingId: 'sayap-kanan' },
        { id: '2-makmal-keselamatan', x: 815, y: 292, w: 118, h: 86, label: 'MAKMAL KESELAMATAN KOMPUTER', category: 'lab', wingId: 'sayap-kanan' },
        { id: '2-tandas-kanan', x: 941, y: 292, w: 42, h: 86, label: 'TANDAS', category: 'facility', wingId: 'sayap-kanan', isSpecialIcon: 'toilet' },
      ];

      const leftWingNodes: RoomNode[] = [
        { id: '2-tandas-kiri', x: -44, y: -52, w: 40, h: 40, label: 'TANDAS', category: 'facility', wingId: 'sayap-kiri', isSpecialIcon: 'toilet' },
        { id: '2-tutorial-5', x: -130, y: -166, w: 86, h: 154, label: 'BILIK TUTORIAL 3', category: 'class', wingId: 'sayap-kiri' },
        { id: '2-tutorial-2', x: -236, y: -166, w: 106, h: 154, label: 'BILIK TUTORIAL 2', category: 'class', wingId: 'sayap-kiri' },
        { id: '2-tutorial-1', x: -342, y: -166, w: 106, h: 154, label: 'BILIK TUTORIAL 1', category: 'class', wingId: 'sayap-kiri' },
        { id: '2-seminar', x: -448, y: -166, w: 106, h: 154, label: 'BILIK SEMINAR 1', category: 'class', wingId: 'sayap-kiri' },
      ];

      return {
        viewBox: '-80 0 1140 620',
        youAreHere: { x: 525, y: 274 },
        nodes: menaraAndKananNodes,
        leftWingGroup: {
          transform: 'translate(415, 274) rotate(-33)',
          nodes: leftWingNodes,
          outerLayer: (
            <rect x="-455" y="-172" width="460" height="190" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          ),
          corridors: (
            <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
              {/* Frontside continuous walkway connecting to Menara corridor */}
              <rect x="-448" y="-12" width="453" height="24" fill="#FFFFFF" stroke="none" />
              <line x1="-448" y1="-12" x2="3" y2="-12" />
              <line x1="-448" y1="12" x2="3" y2="12" />
              <line x1="-448" y1="-12" x2="-448" y2="12" />
            </g>
          ),
        },
        renderOuterLayer: () => (
          <g>
            <rect x="415" y="20" width="220" height="565" rx="18" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
            <rect x="635" y="180" width="355" height="205" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          </g>
        ),
        renderCorridors: () => (
          <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
            <rect x="635" y="262" width="355" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="635" y1="262" x2="990" y2="262" />
            <line x1="635" y1="286" x2="990" y2="286" />

            <rect x="512" y="20" width="26" height="565" fill="#FFFFFF" stroke="none" />
            <line x1="512" y1="20" x2="512" y2="585" />
            <line x1="538" y1="20" x2="538" y2="585" />

            <rect x="415" y="262" width="220" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="415" y1="262" x2="635" y2="262" />
            <line x1="415" y1="286" x2="635" y2="286" />
          </g>
        ),
      };
    }

    // ----------------------------------------------------
    // THIRD FLOOR (IMG_1818.JPG)
    // ----------------------------------------------------
    if (floorId === 3) {
      const menaraAndKananNodes: RoomNode[] = [
        // Menara Upper Block
        { id: '3-pb-301-09', x: 425, y: 28, w: 82, h: 36, label: 'PB-301-09', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-301-08', x: 425, y: 68, w: 82, h: 36, label: 'PB-301-08', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-301-07', x: 425, y: 108, w: 82, h: 36, label: 'PB-301-07', category: 'office', wingId: 'menara-tengah' },
        { id: '3-tandas', x: 435, y: 148, w: 60, h: 40, label: 'TANDAS', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'toilet' },
        { id: '3-lif-kiri', x: 445, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },

        { id: '3-pejabat-am', x: 543, y: 28, w: 82, h: 36, label: 'PEJABAT', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-301-11', x: 543, y: 68, w: 82, h: 36, label: 'PB-301-11', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-301-12', x: 543, y: 108, w: 82, h: 36, label: 'PB-301-12', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-301-13', x: 543, y: 148, w: 82, h: 40, label: 'PB-301-13', category: 'office', wingId: 'menara-tengah' },
        { id: '3-lif', x: 555, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-tengah', isSpecialIcon: 'lift' },

        // Menara SOUTH EXTENSION (PB-302-08..05 left, PB-302-01..04 right)
        { id: '3-pb-302-08', x: 424, y: 292, w: 84, h: 66, label: 'PB-302-08', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-302-07', x: 424, y: 364, w: 84, h: 66, label: 'PB-302-07', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-302-06', x: 424, y: 436, w: 84, h: 66, label: 'PB-302-06', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-302-05', x: 424, y: 508, w: 84, h: 66, label: 'PB-302-05', category: 'office', wingId: 'menara-tengah' },

        { id: '3-pb-302-01', x: 542, y: 292, w: 84, h: 66, label: 'PB-302-01', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-302-02', x: 542, y: 364, w: 84, h: 66, label: 'PB-302-02', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-302-03', x: 542, y: 436, w: 84, h: 66, label: 'PB-302-03', category: 'office', wingId: 'menara-tengah' },
        { id: '3-pb-302-04', x: 542, y: 508, w: 84, h: 66, label: 'PB-302-04', category: 'office', wingId: 'menara-tengah' },

        // Sayap Kanan
        { id: '3-auditorium', x: 645, y: 190, w: 145, h: 66, label: 'AUDITORIUM', category: 'class', wingId: 'sayap-kanan' },
        { id: '3-makmal-internet', x: 798, y: 190, w: 138, h: 66, label: 'MAKMAL PENGATURCARAAN INTERNET', category: 'lab', wingId: 'sayap-kanan' },
        { id: '3-surau', x: 944, y: 190, w: 38, h: 66, label: 'SURAU', category: 'facility', wingId: 'sayap-kanan', isSpecialIcon: 'surau' },
        { id: '3-makmal-sistem', x: 645, y: 292, w: 160, h: 86, label: 'MAKMAL SISTEM KOMPUTER', category: 'lab', wingId: 'sayap-kanan' },
        { id: '3-makmal-web', x: 815, y: 292, w: 118, h: 86, label: 'MAKMAL TEKNOLOGI WEB', category: 'lab', wingId: 'sayap-kanan' },
        { id: '3-tandas-kanan', x: 941, y: 292, w: 42, h: 86, label: 'TANDAS', category: 'facility', wingId: 'sayap-kanan', isSpecialIcon: 'toilet' },
      ];

      const leftWingNodes: RoomNode[] = [
        { id: '3-tandas-kiri', x: -44, y: -52, w: 40, h: 40, label: 'TANDAS', category: 'facility', wingId: 'sayap-kiri', isSpecialIcon: 'toilet' },
        { id: '3-smc', x: -230, y: -166, w: 186, h: 154, label: 'SOFT COMPUTING & DATA MINING CENTRE (SMC)', category: 'lab', wingId: 'sayap-kiri' },
        { id: '3-tutorial-4', x: -340, y: -166, w: 110, h: 154, label: 'BILIK TUTORIAL 4', category: 'class', wingId: 'sayap-kiri' },
        { id: '3-bilik-aktiviti', x: -448, y: -166, w: 108, h: 154, label: 'BILIK AKTIVITI STAF', category: 'office', wingId: 'sayap-kiri' },
      ];

      return {
        viewBox: '-80 0 1140 620',
        youAreHere: { x: 525, y: 274 },
        nodes: menaraAndKananNodes,
        leftWingGroup: {
          transform: 'translate(415, 274) rotate(-33)',
          nodes: leftWingNodes,
          outerLayer: (
            <rect x="-455" y="-172" width="460" height="190" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          ),
          corridors: (
            <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
              {/* Frontside continuous walkway connecting to Menara corridor */}
              <rect x="-448" y="-12" width="453" height="24" fill="#FFFFFF" stroke="none" />
              <line x1="-448" y1="-12" x2="3" y2="-12" />
              <line x1="-448" y1="12" x2="3" y2="12" />
              <line x1="-448" y1="-12" x2="-448" y2="12" />
            </g>
          ),
        },
        renderOuterLayer: () => (
          <g>
            <rect x="415" y="20" width="220" height="565" rx="18" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
            <rect x="635" y="180" width="355" height="205" rx="16" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          </g>
        ),
        renderCorridors: () => (
          <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
            <rect x="635" y="262" width="355" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="635" y1="262" x2="990" y2="262" />
            <line x1="635" y1="286" x2="990" y2="286" />

            <rect x="512" y="20" width="26" height="565" fill="#FFFFFF" stroke="none" />
            <line x1="512" y1="20" x2="512" y2="585" />
            <line x1="538" y1="20" x2="538" y2="585" />

            <rect x="415" y="262" width="220" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="415" y1="262" x2="635" y2="262" />
            <line x1="415" y1="286" x2="635" y2="286" />
          </g>
        ),
      };
    }

    // ----------------------------------------------------
    // FOURTH FLOOR (IMG_1819.JPG)
    // Anchored at identical master coordinates in stationary frame
    // ----------------------------------------------------
    if (floorId === 4) {
      const nodes: RoomNode[] = [
        // North Left Column
        { id: '4-pb-401-10', x: 424, y: 28, w: 84, h: 36, label: 'PB-401-10', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-09', x: 424, y: 68, w: 84, h: 36, label: 'PB-401-09', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-08', x: 424, y: 108, w: 84, h: 36, label: 'PB-401-08', category: 'office', wingId: 'menara-utama' },
        { id: '4-tandas', x: 435, y: 148, w: 60, h: 40, label: 'TANDAS', category: 'facility', wingId: 'menara-utama', isSpecialIcon: 'toilet' },
        { id: '4-lif-kiri', x: 445, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-utama', isSpecialIcon: 'lift' },

        // North Right Column
        { id: '4-pb-401-11', x: 542, y: 28, w: 84, h: 36, label: 'PB-401-11', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-12', x: 542, y: 68, w: 84, h: 36, label: 'PB-401-12', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-13', x: 542, y: 108, w: 84, h: 36, label: 'PB-401-13', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-14', x: 542, y: 148, w: 84, h: 40, label: 'PB-401-14', category: 'office', wingId: 'menara-utama' },
        { id: '4-lif', x: 555, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-utama', isSpecialIcon: 'lift' },

        // South Left Column (4 rooms)
        { id: '4-pb-401-24', x: 424, y: 292, w: 84, h: 66, label: 'PB-401-24', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-23', x: 424, y: 364, w: 84, h: 66, label: 'PB-401-23', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-22', x: 424, y: 436, w: 84, h: 66, label: 'PB-401-22', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-21', x: 424, y: 508, w: 84, h: 66, label: 'PB-401-21', category: 'office', wingId: 'menara-utama' },

        // South Right Column (5 rooms)
        { id: '4-pb-401-16', x: 542, y: 292, w: 84, h: 51, label: 'PB-401-16', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-17', x: 542, y: 349, w: 84, h: 51, label: 'PB-401-17', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-18', x: 542, y: 406, w: 84, h: 51, label: 'PB-401-18', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-19', x: 542, y: 463, w: 84, h: 51, label: 'PB-401-19', category: 'office', wingId: 'menara-utama' },
        { id: '4-pb-401-20', x: 542, y: 520, w: 84, h: 54, label: 'PB-401-20', category: 'office', wingId: 'menara-utama' },
      ];

      return {
        viewBox: '-80 0 1140 620',
        youAreHere: { x: 525, y: 274 },
        nodes,
        renderOuterLayer: () => (
          <g>
            {renderGhostPodium()}
            <rect x="415" y="20" width="220" height="565" rx="18" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          </g>
        ),
        renderCorridors: () => (
          <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
            <rect x="512" y="20" width="26" height="565" fill="#FFFFFF" stroke="none" />
            <line x1="512" y1="20" x2="512" y2="585" />
            <line x1="538" y1="20" x2="538" y2="585" />

            <rect x="415" y="262" width="220" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="415" y1="262" x2="635" y2="262" />
            <line x1="415" y1="286" x2="635" y2="286" />
          </g>
        ),
      };
    }

    // ----------------------------------------------------
    // FIFTH & SIXTH FLOORS (IMG_1820.JPG & IMG_1821.JPG)
    // Anchored at identical master coordinates in stationary frame
    // ----------------------------------------------------
    if (floorId === 5 || floorId === 6) {
      const p = floorId;
      const nodes: RoomNode[] = [
        // North Left Column
        { id: `${p}-pb-${p}01-05`, x: 424, y: 28, w: 84, h: 36, label: `PB-${p}01-05`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-04`, x: 424, y: 68, w: 84, h: 36, label: `PB-${p}01-04`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-03`, x: 424, y: 108, w: 84, h: 36, label: `PB-${p}01-03`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-tandas`, x: 435, y: 148, w: 60, h: 40, label: 'TANDAS', category: 'facility', wingId: 'menara-utama', isSpecialIcon: 'toilet' },
        { id: `${p}-lif-kiri`, x: 445, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-utama', isSpecialIcon: 'lift' },

        // North Right Column
        { id: `${p}-pb-${p}01-06`, x: 542, y: 28, w: 84, h: 36, label: `PB-${p}01-06`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-07`, x: 542, y: 68, w: 84, h: 36, label: `PB-${p}01-07`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-08`, x: 542, y: 108, w: 84, h: 36, label: `PB-${p}01-08`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-09`, x: 542, y: 148, w: 84, h: 40, label: `PB-${p}01-09`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-lif`, x: 555, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'menara-utama', isSpecialIcon: 'lift' },

        // South Left Column (5 rooms)
        { id: `${p}-pb-${p}01-20`, x: 424, y: 292, w: 84, h: 51, label: `PB-${p}01-20`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-19`, x: 424, y: 349, w: 84, h: 51, label: `PB-${p}01-19`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-18`, x: 424, y: 406, w: 84, h: 51, label: `PB-${p}01-18`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-17`, x: 424, y: 463, w: 84, h: 51, label: `PB-${p}01-17`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-16`, x: 424, y: 520, w: 84, h: 54, label: `PB-${p}01-16`, category: 'office', wingId: 'menara-utama' },

        // South Right Column (5 rooms)
        { id: `${p}-pb-${p}01-11`, x: 542, y: 292, w: 84, h: 51, label: `PB-${p}01-11`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-12`, x: 542, y: 349, w: 84, h: 51, label: `PB-${p}01-12`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-13`, x: 542, y: 406, w: 84, h: 51, label: `PB-${p}01-13`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-14`, x: 542, y: 463, w: 84, h: 51, label: `PB-${p}01-14`, category: 'office', wingId: 'menara-utama' },
        { id: `${p}-pb-${p}01-15`, x: 542, y: 520, w: 84, h: 54, label: `PB-${p}01-15`, category: 'office', wingId: 'menara-utama' },
      ];

      return {
        viewBox: '-80 0 1140 620',
        youAreHere: { x: 525, y: 274 },
        nodes,
        renderOuterLayer: () => (
          <g>
            {renderGhostPodium()}
            <rect x="415" y="20" width="220" height="565" rx="18" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
          </g>
        ),
        renderCorridors: () => (
          <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
            <rect x="512" y="20" width="26" height="565" fill="#FFFFFF" stroke="none" />
            <line x1="512" y1="20" x2="512" y2="585" />
            <line x1="538" y1="20" x2="538" y2="585" />

            <rect x="415" y="262" width="220" height="24" fill="#FFFFFF" stroke="none" />
            <line x1="415" y1="262" x2="635" y2="262" />
            <line x1="415" y1="286" x2="635" y2="286" />
          </g>
        ),
      };
    }

    // ----------------------------------------------------
    // SEVENTH FLOOR (IMG_1822.JPG)
    // Anchored at identical master coordinates in stationary frame
    // ----------------------------------------------------
    const nodes: RoomNode[] = [
      // Top Boardroom
      { id: '7-mesyuarat-utama', x: 425, y: 26, w: 200, h: 76, label: 'BILIK MESYUARAT UTAMA', category: 'meeting', wingId: 'aras-eksekutif' },

      // North Below Boardroom
      { id: '7-tandas', x: 435, y: 114, w: 60, h: 42, label: 'TANDAS', category: 'facility', wingId: 'aras-eksekutif', isSpecialIcon: 'toilet' },
      { id: '7-lif-kiri', x: 445, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'aras-eksekutif', isSpecialIcon: 'lift' },

      { id: '7-mesyuarat-eksekutif', x: 542, y: 114, w: 84, h: 72, label: 'BILIK MESYUARAT EKSEKUTIF', category: 'meeting', wingId: 'aras-eksekutif' },
      { id: '7-lif', x: 555, y: 195, w: 50, h: 48, label: 'LIF', category: 'facility', wingId: 'aras-eksekutif', isSpecialIcon: 'lift' },

      // South Left Column (PB-701-18..14)
      { id: '7-pb-701-18', x: 424, y: 292, w: 84, h: 51, label: 'PB-701-18', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-17', x: 424, y: 349, w: 84, h: 51, label: 'PB-701-17', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-16', x: 424, y: 406, w: 84, h: 51, label: 'PB-701-16', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-15', x: 424, y: 463, w: 84, h: 51, label: 'PB-701-15', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-14', x: 424, y: 520, w: 84, h: 54, label: 'PB-701-14', category: 'office', wingId: 'aras-eksekutif' },

      // South Right Column (PB-701-09..13)
      { id: '7-pb-701-09', x: 542, y: 292, w: 84, h: 51, label: 'PB-701-09', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-10', x: 542, y: 349, w: 84, h: 51, label: 'PB-701-10', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-11', x: 542, y: 406, w: 84, h: 51, label: 'PB-701-11', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-12', x: 542, y: 463, w: 84, h: 51, label: 'PB-701-12', category: 'office', wingId: 'aras-eksekutif' },
      { id: '7-pb-701-13', x: 542, y: 520, w: 84, h: 54, label: 'PB-701-13', category: 'office', wingId: 'aras-eksekutif' },
    ];

    return {
      viewBox: '-80 0 1140 620',
      youAreHere: { x: 525, y: 274 },
      nodes,
      renderOuterLayer: () => (
        <g>
          {renderGhostPodium()}
          <rect x="415" y="20" width="220" height="565" rx="18" fill="#F8FAFC" stroke="#334155" strokeWidth="3.5" />
        </g>
      ),
      renderCorridors: () => (
        <g fill="#FFFFFF" stroke="#475569" strokeWidth="2">
          <rect x="512" y="20" width="26" height="565" fill="#FFFFFF" stroke="none" />
          <line x1="512" y1="20" x2="512" y2="585" />
          <line x1="538" y1="20" x2="538" y2="585" />

          <rect x="415" y="262" width="220" height="24" fill="#FFFFFF" stroke="none" />
          <line x1="415" y1="262" x2="635" y2="262" />
          <line x1="415" y1="286" x2="635" y2="286" />
        </g>
      ),
    };
  }, [floor.id]);

  // Color styles per category (Light Mode Only + UTHM Red)
  const getCategoryStyles = (category: RoomCategory, isSelected: boolean, isDimmed: boolean) => {
    if (isDimmed) {
      return {
        fill: '#F1F5F9',
        stroke: '#CBD5E1',
        strokeWidth: 1,
        textColor: '#94A3B8',
        opacity: 0.22,
      };
    }

    if (isSelected) {
      switch (category) {
        case 'office':
          return { fill: '#FFE4E6', stroke: '#E11D48', strokeWidth: 3.5, textColor: '#881337', opacity: 1 };
        case 'lab':
          return { fill: '#DBEAFE', stroke: '#2563EB', strokeWidth: 3.5, textColor: '#1E3A8A', opacity: 1 };
        case 'class':
          return { fill: '#FEF9C3', stroke: '#CA8A04', strokeWidth: 3.5, textColor: '#713F12', opacity: 1 };
        case 'facility':
          return { fill: '#DCFCE7', stroke: '#16A34A', strokeWidth: 3.5, textColor: '#14532D', opacity: 1 };
        case 'meeting':
          return { fill: '#F3E8FF', stroke: '#9333EA', strokeWidth: 3.5, textColor: '#581C87', opacity: 1 };
        default:
          return { fill: '#FEE2E2', stroke: '#DC2626', strokeWidth: 3.5, textColor: '#991B1B', opacity: 1 };
      }
    }

    switch (category) {
      case 'office':
        return { fill: '#FFF1F2', stroke: '#FECDD3', strokeWidth: 1.5, textColor: '#9F1239', opacity: 1 };
      case 'lab':
        return { fill: '#EFF6FF', stroke: '#BFDBFE', strokeWidth: 1.5, textColor: '#1E40AF', opacity: 1 };
      case 'class':
        return { fill: '#FEFCE8', stroke: '#FEF08A', strokeWidth: 1.5, textColor: '#854D0E', opacity: 1 };
      case 'facility':
        return { fill: '#F0FDF4', stroke: '#BBF7D0', strokeWidth: 1.5, textColor: '#166534', opacity: 1 };
      case 'meeting':
        return { fill: '#FAF5FF', stroke: '#E9D5FF', strokeWidth: 1.5, textColor: '#6B21A8', opacity: 1 };
      default:
        return { fill: '#FFFFFF', stroke: '#CBD5E1', strokeWidth: 1.5, textColor: '#334155', opacity: 1 };
    }
  };

  // Zoom & Pan Handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;
    setZoom(isMobile ? 1.5 : 1);
    setPan({ x: 0, y: 0 });
    setRotation(isMobile ? -90 : 0);
  };

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
      setDragStart(dragStartRef.current);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      setPan({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  // Mobile Touch Gestures: Pinch-to-zoom & Smooth Swipe/Pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      setIsDragging(true);
      touchMovedRef.current = false;
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - panRef.current.x,
        y: touch.clientY - panRef.current.y,
      };
      setDragStart(dragStartRef.current);
    } else if (e.touches.length === 2) {
      isDraggingRef.current = true;
      setIsDragging(true);
      touchMovedRef.current = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      touchStartDistRef.current = dist;
      touchStartZoomRef.current = zoomRef.current;
      touchStartMidRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
      touchStartPanRef.current = { ...panRef.current };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStartRef.current.x;
      const newY = touch.clientY - dragStartRef.current.y;
      if (Math.abs(newX - panRef.current.x) > 4 || Math.abs(newY - panRef.current.y) > 4) {
        touchMovedRef.current = true;
      }
      setPan({ x: newX, y: newY });
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      touchMovedRef.current = true;
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      if (touchStartDistRef.current > 0) {
        const scale = currentDist / touchStartDistRef.current;
        const newZoom = Math.min(Math.max(touchStartZoomRef.current * scale, 0.6), 3.5);
        setZoom(newZoom);

        const currentMidX = (touch1.clientX + touch2.clientX) / 2;
        const currentMidY = (touch1.clientY + touch2.clientY) / 2;
        const deltaX = currentMidX - touchStartMidRef.current.x;
        const deltaY = currentMidY - touchStartMidRef.current.y;
        setPan({
          x: touchStartPanRef.current.x + deltaX,
          y: touchStartPanRef.current.y + deltaY,
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isDraggingRef.current = false;
      setIsDragging(false);
      touchStartDistRef.current = null;
      setTimeout(() => {
        touchMovedRef.current = false;
      }, 100);
    } else if (e.touches.length === 1) {
      touchStartDistRef.current = null;
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - panRef.current.x,
        y: touch.clientY - panRef.current.y,
      };
      setDragStart(dragStartRef.current);
    }
  };

  // Reusable node renderer
  const renderNode = (node: RoomNode, compact = false) => {
    const roomData = getRoomForNode(node);
    const isSelected = Boolean(
      selectedRoom &&
        (selectedRoom.id.toLowerCase() === node.id.toLowerCase() ||
          (roomData &&
            (selectedRoom.id.toLowerCase() === roomData.id.toLowerCase() ||
              selectedRoom.code.toLowerCase() === roomData.code.toLowerCase() ||
              (selectedRoom.shortform &&
                roomData.shortform &&
                selectedRoom.shortform.toLowerCase() === roomData.shortform.toLowerCase()))))
    );
    const isDimmed =
      selectedRoom !== null
        ? !isSelected
        : (activeWingId !== null && node.wingId !== activeWingId) ||
          (categoryFilter !== 'all' && node.category !== categoryFilter);
    const style = getCategoryStyles(node.category, isSelected, isDimmed);

    return (
      <g
        key={node.id}
        id={`room-svg-${node.id}`}
        style={{
          cursor: isDimmed ? 'default' : 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (touchMovedRef.current) {
            return; // Prevent selecting room if user was swiping or pinching
          }
          if (roomData) {
            onSelectRoom(roomData);
          }
        }}
        onMouseEnter={(e) => {
          if (!isDimmed) {
            setHoveredNode({
              node,
              room: roomData,
              clientX: e.clientX,
              clientY: e.clientY,
            });
          }
        }}
        onMouseMove={(e) => {
          if (hoveredNode) {
            setHoveredNode({
              node,
              room: roomData,
              clientX: e.clientX,
              clientY: e.clientY,
            });
          }
        }}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {/* Room Boundary Box */}
        <rect
          x={node.x}
          y={node.y}
          width={node.w}
          height={node.h}
          rx="6"
          ry="6"
          fill={style.fill}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
          opacity={style.opacity}
          style={{
            transition: 'fill 120ms ease, stroke 120ms ease, opacity 120ms ease',
            filter: isSelected ? 'drop-shadow(0 0 14px rgba(220, 38, 38, 0.6))' : undefined,
          }}
        />

        {/* Door Entrance Indicator */}
        <line
          x1={node.x + node.w * 0.4}
          y1={node.y + node.h}
          x2={node.x + node.w * 0.6}
          y2={node.y + node.h}
          stroke={style.stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={isDimmed ? 0.2 : 1}
        />

        {/* Small Shortform Pill Badge in SVG Room */}
        {roomData?.shortform && !node.isSpecialIcon && (
          <g style={{ pointerEvents: 'none', opacity: isDimmed ? 0.18 : 1 }}>
            <rect
              x={node.x + 3}
              y={node.y + 3}
              width={Math.max(roomData.shortform.length * 5.8 + 10, 24)}
              height={11}
              rx={3}
              fill={isSelected ? '#DC2626' : '#DC2626'}
            />
            <text
              x={node.x + 3 + Math.max(roomData.shortform.length * 5.8 + 10, 24) / 2}
              y={node.y + 11.2}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="6.5px"
              fontWeight={900}
              letterSpacing="0.08em"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {roomData.shortform}
            </text>
          </g>
        )}

        {/* Lecturer Avatar in SVG Room for office rooms */}
        {roomData?.lecturer?.avatarUrl && !node.isSpecialIcon && node.w >= 28 && node.h >= 24 && (
          <g style={{ pointerEvents: 'none', opacity: isDimmed ? 0.2 : 1 }}>
            <clipPath id={`avatar-clip-${node.id}`}>
              <circle
                cx={node.x + node.w - 10}
                cy={node.y + 10}
                r={7}
              />
            </clipPath>
            <circle
              cx={node.x + node.w - 10}
              cy={node.y + 10}
              r={8}
              fill="#FFFFFF"
              stroke="#FECACA"
              strokeWidth={1.5}
            />
            <image
              href={roomData.lecturer.avatarUrl}
              x={node.x + node.w - 17}
              y={node.y + 3}
              width={14}
              height={14}
              clipPath={`url(#avatar-clip-${node.id})`}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        )}

        {/* Kiosk Service Badges for Lifts, Toilets, Surau */}
        {node.isSpecialIcon === 'lift' && (
          <g opacity={isDimmed ? 0.2 : 1}>
            <rect
              x={node.x + node.w / 2 - 8}
              y={node.y + 4}
              width="16"
              height="15"
              rx="3.5"
              fill="#2563EB"
            />
            <ChevronsUpDown
              x={node.x + node.w / 2 - 5}
              y={node.y + 6.5}
              size={10}
              color="#FFFFFF"
              strokeWidth={2.2}
            />
          </g>
        )}

        {node.isSpecialIcon === 'toilet' && (
          <g opacity={isDimmed ? 0.2 : 1}>
            <rect
              x={node.x + node.w / 2 - 8}
              y={node.y + 4}
              width="16"
              height="15"
              rx="3.5"
              fill="#0284C7"
            />
            <PersonStanding
              x={node.x + node.w / 2 - 5}
              y={node.y + 6.5}
              size={10}
              color="#FFFFFF"
              strokeWidth={2.2}
            />
          </g>
        )}

        {node.isSpecialIcon === 'surau' && (
          <g opacity={isDimmed ? 0.2 : 1}>
            <rect
              x={node.x + node.w / 2 - 8}
              y={node.y + 4}
              width="16"
              height="15"
              rx="3.5"
              fill="#0D9488"
            />
            <Moon
              x={node.x + node.w / 2 - 5}
              y={node.y + 6.5}
              size={10}
              color="#FFFFFF"
              strokeWidth={2.2}
            />
          </g>
        )}

        {/* Room Label with Smart Multi-line Wrapping */}
        {renderWrappedText(
          node.label,
          node.subLabel,
          node.x,
          node.y + (node.isSpecialIcon ? 13 : 0),
          node.w,
          node.h - (node.isSpecialIcon ? 13 : 0),
          style.textColor,
          compact
        )}
      </g>
    );
  };

  return (
    <div
      className="floor-plan-root"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '660px',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Floating Floor Toggle & Category Filter Badge */}
      <div
        className="floor-info-overlay"
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none',
          width: 'max-content',
          maxWidth: 'calc(100% - 24px)',
        }}
      >
        {/* Floor Toggle (G, 1, 2, 3, 4, 5, 6, 7) */}
        <div
          className="floor-title-badge"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #FEE2E2',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 4px 16px rgba(185, 28, 28, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            pointerEvents: 'auto',
            width: 'fit-content',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <button
            onClick={() => onSelectFloor && floor.id > 0 && onSelectFloor(floor.id - 1)}
            disabled={floor.id === 0}
            title="Turun satu tingkat"
            aria-label="Turun satu tingkat"
            className="floor-nav-btn"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: floor.id === 0 ? '#F8FAFC' : '#FFFFFF',
              color: floor.id === 0 ? '#CBD5E1' : '#B91C1C',
              border: floor.id === 0 ? '1px solid #E2E8F0' : '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: floor.id === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 120ms ease',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {floors.map((f) => {
            const isSelected = f.id === floor.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectFloor && onSelectFloor(f.id)}
                title={`${f.nameMalay} (${f.name})`}
                className={`floor-toggle-btn ${isSelected ? 'active' : ''}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  fontSize: '12px',
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
                  flexShrink: 0,
                }}
              >
                {f.levelCode}
              </button>
            );
          })}

          <button
            onClick={() => onSelectFloor && floor.id < floors.length - 1 && onSelectFloor(floor.id + 1)}
            disabled={floor.id === floors.length - 1}
            title="Naik satu tingkat"
            aria-label="Naik satu tingkat"
            className="floor-nav-btn"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: floor.id === floors.length - 1 ? '#F8FAFC' : '#FFFFFF',
              color: floor.id === floors.length - 1 ? '#CBD5E1' : '#B91C1C',
              border: floor.id === floors.length - 1 ? '1px solid #E2E8F0' : '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: floor.id === floors.length - 1 ? 'not-allowed' : 'pointer',
              transition: 'all 120ms ease',
              flexShrink: 0,
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Quick Category Filter Pills */}
        <div
          className="category-filters-scroll"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: '9999px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            pointerEvents: 'auto',
            overflowX: 'auto',
            maxWidth: 'calc(100vw - 32px)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {[
            { id: 'all', label: 'Semua', icon: LayoutGrid },
            { id: 'office', label: 'Pejabat', icon: Building2 },
            { id: 'lab', label: 'Makmal', icon: Laptop },
            { id: 'class', label: 'Kuliah', icon: GraduationCap },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as any)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#B91C1C' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#475569',
                  border: isActive ? '1px solid #B91C1C' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 120ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                }}
              >
                <Icon size={12} color={isActive ? '#FFFFFF' : '#64748B'} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Blueprint Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          width: '100%',
          flex: 1,
          minHeight: '660px',
          backgroundColor: '#FCFDFE',
          backgroundImage: 'radial-gradient(#CBD5E1 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px',
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <svg
          viewBox={layout.viewBox}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
            transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 150ms ease-out',
            filter: 'drop-shadow(0 4px 16px rgba(15, 23, 42, 0.06))',
          }}
        >
          {/* 1. Surrounding Site Context (Ground Floor drop-off roundabout & parking) */}
          {layout.renderSiteContext && layout.renderSiteContext()}

          {/* 2. Outer Building Envelope / Outer Architectural Walls */}
          {layout.renderOuterLayer()}

          {/* 3. Sayap Kiri Rotated Outer Envelope and Corridors */}
          {layout.leftWingGroup && (
            <g transform={layout.leftWingGroup.transform}>
              {layout.leftWingGroup.outerLayer}
              {layout.leftWingGroup.corridors}
              {layout.leftWingGroup.nodes.map((node) => renderNode(node, true))}
            </g>
          )}

          {/* 4. Corridors (Walking Hallways) */}
          {layout.renderCorridors()}

          {/* 5. Main Rooms (Menara & Sayap Kanan) */}
          {layout.nodes.map((node) => renderNode(node, false))}

          {/* 6. Animated "YOU ARE HERE / ANDA DI SINI" Pin */}
          {layout.youAreHere && (
            <g transform={`translate(${layout.youAreHere.x}, ${layout.youAreHere.y})`}>
              <circle r="12" fill="rgba(220, 38, 38, 0.2)">
                <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="6.5" fill="#DC2626" stroke="#FFFFFF" strokeWidth="2" />
              <circle r="2.5" fill="#FFFFFF" />

              <rect x="-38" y="-29" width="76" height="19" rx="5" fill="#991B1B" />
              <polygon points="0,-10 -4,-7 4,-7" fill="#991B1B" />
              <MapPin x={-32} y={-25} size={11} color="#FFFFFF" strokeWidth={2.2} />
              <text
                x="4"
                y="-17"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="7.5px"
                fontWeight="800"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                ANDA DI SINI
              </text>
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredNode && (
          <div
            style={{
              position: 'fixed',
              top: hoveredNode.clientY + 14,
              left: Math.min(hoveredNode.clientX + 14, typeof window !== 'undefined' ? window.innerWidth - 240 : 200),
              backgroundColor: '#FFFFFF',
              border: '1px solid #FECACA',
              borderRadius: '10px',
              padding: '10px 12px',
              boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.18)',
              pointerEvents: 'none',
              zIndex: 9999,
              minWidth: '180px',
              maxWidth: '240px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #FEE2E2',
                  }}
                >
                  {hoveredNode.room?.code || hoveredNode.node.id.toUpperCase()}
                </span>
                {hoveredNode.room?.shortform && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      letterSpacing: '0.08em',
                      boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
                    }}
                  >
                    {hoveredNode.room.shortform}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                {hoveredNode.node.category === 'office' && <Building2 size={11} color="#991B1B" />}
                {hoveredNode.node.category === 'lab' && <Laptop size={11} color="#2563EB" />}
                {hoveredNode.node.category === 'class' && <GraduationCap size={11} color="#D97706" />}
                {hoveredNode.node.category === 'facility' && <Sparkles size={11} color="#16A34A" />}
                <span>{hoveredNode.room?.wingName || 'FSKTM'}</span>
              </div>
            </div>

            {/* Lecturer Hover PFP Header */}
            {hoveredNode.room?.lecturer && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #FEE2E2' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1.5px solid #FECACA',
                  backgroundColor: '#FEE2E2',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {hoveredNode.room.lecturer.avatarUrl ? (
                    <img
                      src={hoveredNode.room.lecturer.avatarUrl}
                      alt={hoveredNode.room.lecturer.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (hoveredNode.room?.lecturer?.fallbackAvatarUrl && target.src !== hoveredNode.room.lecturer.fallbackAvatarUrl) {
                          target.src = hoveredNode.room.lecturer.fallbackAvatarUrl;
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                  ) : null}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hoveredNode.room.lecturer.name}
                  </div>
                  <div style={{ fontSize: '9.5px', color: '#B91C1C', fontWeight: 700 }}>
                    {hoveredNode.room.lecturer.role}
                  </div>
                </div>
              </div>
            )}
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A', marginBottom: '2px' }}>
              {hoveredNode.room?.name || hoveredNode.node.label}
            </div>
            {hoveredNode.room?.nameEn && (
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '6px' }}>
                {hoveredNode.room.nameEn}
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Info size={11} />
              <span>Klik untuk maklumat lengkap</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom-Right Zoom & Pan Controls */}
      <div
        className="floor-zoom-controls"
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '4px 6px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          gap: '4px',
        }}
      >
        <button
          onClick={handleZoomOut}
          title="Zoom Keluar"
          aria-label="Zoom keluar"
          style={{
            padding: '6px',
            borderRadius: '8px',
            color: '#991B1B',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ZoomOut size={16} />
        </button>

        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            minWidth: '38px',
            textAlign: 'center',
            color: '#B91C1C',
          }}
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          title="Zoom Masuk"
          aria-label="Zoom masuk"
          style={{
            padding: '6px',
            borderRadius: '8px',
            color: '#991B1B',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ZoomIn size={16} />
        </button>

        <div style={{ width: '1px', height: '18px', backgroundColor: '#E2E8F0', margin: '0 2px' }} />

        <button
          onClick={handleRotateLeft}
          title="Pusing 90° ke Kiri"
          aria-label="Pusing 90 darjah ke kiri"
          style={{
            padding: '6px 8px',
            borderRadius: '8px',
            color: '#991B1B',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={13} />
          <span>90°</span>
        </button>

        <button
          onClick={handleResetZoom}
          title="Reset Kedudukan & Zoom"
          aria-label="Reset pandangan"
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            color: '#475569',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Floating Bottom-Left Minimal Legend */}
      <div
        className="hide-mobile"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          padding: '6px 14px',
          borderRadius: '9999px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
          fontSize: '11px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Building2 size={13} color="#E11D48" />
          <span style={{ fontWeight: 600 }}>Pejabat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Laptop size={13} color="#2563EB" />
          <span style={{ fontWeight: 600 }}>Makmal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <GraduationCap size={13} color="#D97706" />
          <span style={{ fontWeight: 600 }}>Kuliah</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Sparkles size={13} color="#16A34A" />
          <span style={{ fontWeight: 600 }}>Kemudahan</span>
        </div>
        <div style={{ width: '1px', height: '14px', backgroundColor: '#CBD5E1' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronsUpDown size={11} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 600 }}>Lif</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PersonStanding size={11} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 600 }}>Tandas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Moon size={10} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 600 }}>Surau</span>
        </div>
      </div>
      {/* Active Searched Room Floating Focus Bar */}
      {selectedRoom && (
        <div
          style={{
            position: 'absolute',
            bottom: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #FECACA',
            borderRadius: '16px',
            padding: '8px 16px',
            boxShadow: '0 10px 30px -5px rgba(185, 28, 28, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            maxWidth: 'calc(100vw - 32px)',
            animation: 'fadeIn 180ms ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Lecturer PFP Avatar if present */}
            {selectedRoom.lecturer?.avatarUrl && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #FECACA',
                  backgroundColor: '#FEE2E2',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(185, 28, 28, 0.18)',
                }}
              >
                <img
                  src={selectedRoom.lecturer.avatarUrl}
                  alt={selectedRoom.lecturer.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (selectedRoom.lecturer?.fallbackAvatarUrl && target.src !== selectedRoom.lecturer.fallbackAvatarUrl) {
                      target.src = selectedRoom.lecturer.fallbackAvatarUrl;
                    } else {
                      target.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}
            {selectedRoom.shortform && (
              <span
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  boxShadow: '0 1px 3px rgba(220, 38, 38, 0.3)',
                }}
              >
                {selectedRoom.shortform}
              </span>
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                {selectedRoom.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                Aras {floor.levelCode} • {selectedRoom.code} • {selectedRoom.wingName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onOpenDetailModal && (
              <button
                onClick={() => onOpenDetailModal(selectedRoom)}
                style={{
                  backgroundColor: '#B91C1C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(185, 28, 28, 0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                Perincian
              </button>
            )}
            {onClearSelectedRoom && (
              <button
                onClick={onClearSelectedRoom}
                title="Papar semua bilik"
                style={{
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
