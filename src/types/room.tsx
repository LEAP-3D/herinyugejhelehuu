export type PlayerState = {
  hero?: string;
  ready?: boolean;
  name?: string;
};

export type RoomState = {
  roomCode: string;
  maxPlayers: number;
  hostId?: string;
  players: Record<string, PlayerState>;
};

// unknown ирсэн юмыг RoomState мөн эсэхийг шалгах guard
export function isRoomState(v: unknown): v is RoomState {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.roomCode === "string" &&
    typeof o.maxPlayers === "number" &&
    typeof o.players === "object" &&
    o.players !== null
  );
}
