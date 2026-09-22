export type RoomCategory = 'lab' | 'class' | 'office' | 'facility' | 'meeting';

export interface ActiveSubject {
  code: string;
  name: string;
  session: string;
  year?: string;
  isCurrentSemester?: boolean;
}

export interface Lecturer {
  id: string;
  name: string;
  cleanName?: string;
  title?: string;
  role: string;
  facultyCode: string;
  facultyName: string;
  department: string;
  username: string;
  email: string;
  phone: string;
  roomLocation: string;
  avatarUrl?: string;
  communityUrl?: string;
  specialities: string[];
  currentSubjects: ActiveSubject[];
  isAvailableFYP?: boolean;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  shortform?: string;
  category: RoomCategory;
  floorId: number;
  wingId: string;
  wingName: string;
  description?: string;
  facilities?: string[];
  directions?: string;
  tags?: string[];
  lecturer?: Lecturer;
  lecturers?: Lecturer[];
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
