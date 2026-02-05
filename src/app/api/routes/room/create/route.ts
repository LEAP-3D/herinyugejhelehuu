import { NextResponse } from "next/server";
import { rooms, generateRoomCode, Room } from "../store";

function makePlayerId() {
  return crypto.randomUUID();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const maxPlayers = Number(body.maxPlayers ?? 2);

  // code үүсгэнэ
  let code = generateRoomCode();
  let tries = 0;
  while (rooms.has(code) && tries < 10) {
    code = generateRoomCode();
    tries++;
  }

  const hostId = makePlayerId();

  const room = {
    code,
    createdAt: Date.now(),
    maxPlayers,
    hostId,
    players: [hostId], // join API-тай нийцүүлэхийн тулд хадгалж байна (заавал биш)
  };

  rooms.set(code, room as Room);

  return NextResponse.json({ ok: true, roomCode: code, hostId, maxPlayers });
}
