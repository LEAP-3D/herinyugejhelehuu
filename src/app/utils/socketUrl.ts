export function resolveSocketUrl() {
  const configured =
    process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_SOCKET_URL;

  if (configured?.trim()) {
    return configured.trim();
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalHost) {
      return "http://localhost:4000";
    }

    // In deployed environments, prefer same-origin so reverse-proxy setups work.
    return origin;
  }

  return "http://localhost:4000";
}

export function getConnectionErrorMessage(errorMessage: string, socketUrl: string) {
  const message = errorMessage.toLowerCase();

  if (message.includes("timeout")) {
    return `Connection timeout (${socketUrl})`;
  }

  if (message.includes("websocket error")) {
    return `WebSocket failed (${socketUrl})`;
  }

  if (message.includes("xhr poll error")) {
    return `Server is not responding (${socketUrl})`;
  }

  return errorMessage;
}
