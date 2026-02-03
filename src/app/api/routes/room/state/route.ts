import { NextResponse } from "next/server";
import { rooms } from "../store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomCode = String(searchParams.get("code") ?? "").trim();

  if (!roomCode) {
    return NextResponse.json(
      { ok: false, message: "code required" },
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

  return NextResponse.json({
    ok: true,
    room: {
      code: room.code,
      createdAt: room.createdAt,
      playersCount: room.players.length,
    },
  });
}
