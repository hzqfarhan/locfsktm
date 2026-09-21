'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FLOORS_DATA, getAllRooms } from '../data/floors';
import { Floor, Room } from '../types/directory';
import Navbar from '../components/Navbar';
import FloorMapViewer from '../components/FloorMapViewer';
import SearchModal from '../components/SearchModal';
import RoomDetailModal from '../components/RoomDetailModal';
import PwaRegister from '../components/PwaRegister';
import ProjectFooter from '../components/ProjectFooter';
import { Search } from 'lucide-react';

function DirectoryContent() {
  const searchParams = useSearchParams();
  const [selectedFloorId, setSelectedFloorId] = useState<number>(0);
  const [activeWingId, setActiveWingId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [detailModalRoom, setDetailModalRoom] = useState<Room | null>(null);

  // Sync with URL query parameters if present (e.g. ?floor=3&room=3-surau)
  useEffect(() => {
    const floorParam = searchParams.get('floor');
    const roomParam = searchParams.get('room');

    if (floorParam !== null) {
      const parsedFloor = parseInt(floorParam, 10);
      if (!isNaN(parsedFloor) && parsedFloor >= 0 && parsedFloor <= 7) {
        setSelectedFloorId(parsedFloor);
      }
    }

    if (roomParam) {
      const allRooms = getAllRooms();
      const matchedRoom = allRooms.find(
        (r) =>
          r.id === roomParam ||
          r.code.toLowerCase() === roomParam.toLowerCase() ||
          (r.shortform && r.shortform.toLowerCase() === roomParam.toLowerCase())
      );
      if (matchedRoom) {
        setSelectedRoom(matchedRoom);
        setSelectedFloorId(matchedRoom.floorId);
      }
    }
  }, [searchParams]);

  const currentFloor: Floor = FLOORS_DATA[selectedFloorId] || FLOORS_DATA[0];

  const handleSelectFloor = (floorId: number) => {
    setSelectedFloorId(floorId);
    setActiveWingId(null); // Reset wing filter on floor switch
    setSelectedRoom(null); // Reset selected room on floor switch
  };

  const handleSelectSearchResult = (floorId: number, room: Room) => {
    setSelectedFloorId(floorId);
    setActiveWingId(null);
    setSelectedRoom(room);
    setDetailModalRoom(null); // Keep modal closed so the user sees the highlighted room and greyed map!
  };

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setDetailModalRoom(room);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      <PwaRegister />

      {/* Top Navbar with Integrated Floor Selector & Search */}
      <Navbar
        floors={FLOORS_DATA}
        selectedFloorId={selectedFloorId}
        onSelectFloor={handleSelectFloor}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Floor Map Centric View */}
      <main
        className="main-content"
        style={{
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: '12px 14px 40px 14px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Floor Map & Twin View Container */}
        <FloorMapViewer
          floor={currentFloor}
          activeWingId={activeWingId}
          onSelectWing={setActiveWingId}
          selectedRoom={selectedRoom}
          onSelectRoom={handleRoomClick}
          onSelectFloor={handleSelectFloor}
          onClearSelectedRoom={() => setSelectedRoom(null)}
          onOpenDetailModal={(room) => setDetailModalRoom(room)}
        />

        {/* Liquid Glassmorphic Collaborators & Project Footer */}
        <ProjectFooter />
      </main>

      {/* Floating Mobile Bottom Search Bar */}
      <div
        className="mobile-search-bar"
        style={{
          position: 'fixed',
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          display: 'none',
          width: 'auto',
        }}
      >
        <button
          onClick={() => setIsSearchOpen(true)}
          style={{
            backgroundColor: '#B91C1C',
            color: '#FFFFFF',
            borderRadius: '9999px',
            padding: '11px 20px',
            boxShadow: '0 8px 24px rgba(185, 28, 28, 0.42), 0 2px 8px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <Search size={16} />
          <span>Cari Bilik di Aras {currentFloor.levelCode}</span>
        </button>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Room Detail Modal / Drawer */}
      <RoomDetailModal
        room={detailModalRoom}
        floor={currentFloor}
        onClose={() => {
          setDetailModalRoom(null);
          setSelectedRoom(null);
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F8FAFC',
            color: '#B91C1C',
            fontWeight: 800,
          }}
        >
          Memuatkan Direktori Aras FSKTM...
        </div>
      }
    >
      <DirectoryContent />
    </Suspense>
  );
}
