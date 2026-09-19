import * as net from 'net';

export async function isPostgresListening(
  host = process.env.DB_HOST || 'localhost',
  port = parseInt(process.env.DB_PORT || '5432', 10),
  timeoutMs = 400,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let handled = false;

    const cleanup = (result: boolean) => {
      if (!handled) {
        handled = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => cleanup(true));
    socket.once('timeout', () => cleanup(false));
    socket.once('error', () => cleanup(false));

    socket.connect(port, host);
  });
}

