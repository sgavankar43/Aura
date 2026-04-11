/**
 * Socket.io Transport — real-time WebSocket connection to Aura server.
 *
 * Architecture: Implements ITransport using socket.io-client.
 * This is the production transport. Tests use MockTransport.
 */

import { io, Socket } from 'socket.io-client';
import type { ITransport, FlagUpdateEvent } from './types.js';

export class SocketTransport implements ITransport {
  private socket: Socket;
  private callbacks: Array<(event: FlagUpdateEvent) => void> = [];

  constructor(serverUrl: string, apiKey: string) {
    this.socket = io(serverUrl, {
      auth: { 'x-aura-api-key': apiKey },
      transports: ['websocket', 'polling'],
      autoConnect: false, // We connect explicitly in connect()
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    // Wire up the flag_updated event
    this.socket.on('flag_updated', (event: FlagUpdateEvent) => {
      for (const cb of this.callbacks) {
        cb(event);
      }
    });
  }

  connect(): void {
    this.socket.connect();
  }

  disconnect(): void {
    this.socket.disconnect();
  }

  onFlagUpdate(callback: (event: FlagUpdateEvent) => void): void {
    this.callbacks.push(callback);
  }

  isConnected(): boolean {
    return this.socket.connected;
  }
}
