import { NextResponse } from "next/server";
import { rooms } from "../store";

function makePlayerId() {
  return crypto.randomUUID();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = String(body.roomCode ?? "").trim();

    if (!roomCode) {
      return NextResponse.json(
        { ok: false, message: "roomCode required" },
        { status: 400 },
      );
    }

    const room = rooms.get(roomCode);
    if (!room) {
      return NextResponse.json(
        { ok: false, message: "Room not found" },
        { status: 404 },
      );
    }

    // ✅ room дүүрсэн эсэх
    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json(
        { ok: false, message: "Room is full" },
        { status: 409 },
      );
    }

    const playerId = makePlayerId();
    room.players.push(playerId);

    return NextResponse.json({
      ok: true,
      roomCode,
      playerId,
      playersCount: room.players.length,
      maxPlayers: room.maxPlayers,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Failed to join room" },
      { status: 500 },
    );
  }
}
