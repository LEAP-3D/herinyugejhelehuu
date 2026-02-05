export type Room = {
  code: string;
  createdAt: number;
  players: string[];
  maxPlayers: number; // ✅ нэмэв
};

const g = globalThis as unknown as { __rooms?: Map<string, Room> };

export const rooms: Map<string, Room> = g.__rooms ?? new Map<string, Room>();
g.__rooms = rooms;

export function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
