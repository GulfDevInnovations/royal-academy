"use server";

export type SessionForCalendar = {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  spotsLeft: number;
  isOnline: boolean;
  room: string | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    bio: string | null;
    specialties: string[];
  };
  subClass: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    durationMinutes: number;
    level: string | null;
    ageGroup: string | null;
    price: number;
    currency: string;
    class: {
      id: string;
      name: string;
    };
  };
};
