export type RoomCategory = 'lab' | 'class' | 'office' | 'facility' | 'meeting';

export interface Room {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  category: RoomCategory;
  floorId: number;
  wingId: string;
  wingName: string;
  description?: string;
  facilities?: string[];
  directions?: string;
  tags?: string[];
}

export interface Wing {
  id: string;
  name: string;
  description: string;
  rooms: Room[];
}

export interface Floor {
  id: number;
  name: string;
  nameMalay: string;
  levelCode: string;
  mapImage: string;
  description: string;
  highlights: string[];
  wings: Wing[];
  stats: {
    totalRooms: number;
    labs: number;
    classrooms: number;
    offices: number;
    facilities: number;
  };
}
