import { apiBaseUrl } from './client.js';

export interface LiveLogEvent {
  logger: string;
  level: string;
  message: string;
  thread: string;
  timestamp: string;
}

export type LiveLogConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

export interface LiveLogStreamHandlers {
  onLog: (event: LiveLogEvent) => void;
  onState?: (state: LiveLogConnectionState, detail?: string) => void;
  onProtocolError?: (message: string) => void;
}

const LOG_DESTINATION = '/topic/logs';
const RECONNECT_DELAY_MS = 5_000;
const HEARTBEAT_OUTGOING_MS = 10_000;
const HEARTBEAT_INCOMING_MS = 10_000;

let activeStream: LiveLogStream | undefined;

function liveLogWebSocketUrl(): URL {
  const url = new URL('/ws', apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.search = '';
  url.hash = '';
  return url;
}

function stompFrame(command: string, headers: Record<string, string> = {}, body = ''): string {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
  return `${command}\n${headerLines.join('\n')}\n\n${body}\0`;
}

function parseHeaders(lines: string[]): Record<string, string> {
  return Object.fromEntries(lines.map((line) => {
    const separator = line.indexOf(':');
    if (separator < 0) return [line, ''];
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
}

function normalizedLogEvent(value: unknown): LiveLogEvent | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const object = value as Record<string, unknown>;
  const logger = typeof object.logger === 'string' ? object.logger.trim() : '';
  const level = typeof object.level === 'string' ? object.level.trim().toUpperCase() : '';
  const message = typeof object.message === 'string' ? object.message : '';
  const thread = typeof object.thread === 'string' ? object.thread.trim() : '';
  const timestamp = typeof object.timestamp === 'string' ? object.timestamp.trim() : '';
  if (!message.trim()) return undefined;
  return {
    logger: logger || 'backend',
    level: level || 'INFO',
    message,
    thread: thread || '—',
    timestamp: timestamp || new Date().toISOString(),
  };
}

class LiveLogStream {
  private socket: WebSocket | undefined;
  private reconnectTimer: number | undefined;
  private outgoingHeartbeatTimer: number | undefined;
  private incomingHeartbeatTimer: number | undefined;
  private buffer = '';
  private stopped = false;
  private connected = false;
  private receivedAt = Date.now();
  private readonly subscriptionId = `teacloud-admin-logs-${Math.random().toString(36).slice(2)}`;

  constructor(private readonly handlers: LiveLogStreamHandlers) {}

  start(): void {
    this.stopped = false;
    this.connect(false);
  }

  stop(): void {
    this.stopped = true;
    this.clearReconnect();
    this.clearHeartbeats();
    const socket = this.socket;
    this.socket = undefined;
    this.connected = false;
    if (socket?.readyState === WebSocket.OPEN) {
      try {
        socket.send(stompFrame('UNSUBSCRIBE', { id: this.subscriptionId }));
        socket.send(stompFrame('DISCONNECT', { receipt: `disconnect-${Date.now()}` }));
      } catch {
        // The connection may already be closing.
      }
      socket.close(1000, 'Route changed');
    } else if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close(1000, 'Route changed');
    }
    this.handlers.onState?.('disconnected');
  }

  private connect(reconnecting: boolean): void {
    if (this.stopped) return;
    this.clearReconnect();
    this.clearHeartbeats();
    this.buffer = '';
    this.connected = false;
    this.handlers.onState?.(reconnecting ? 'reconnecting' : 'connecting');

    const url = liveLogWebSocketUrl();
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      this.handlers.onState?.('error', error instanceof Error ? error.message : 'ساخت اتصال WebSocket ناموفق بود.');
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;
    socket.addEventListener('open', () => {
      if (this.stopped || this.socket !== socket) return;
      socket.send(stompFrame('CONNECT', {
        'accept-version': '1.2,1.1,1.0',
        host: url.host,
        'heart-beat': `${HEARTBEAT_OUTGOING_MS},${HEARTBEAT_INCOMING_MS}`,
      }));
    });

    socket.addEventListener('message', (event) => {
      if (this.stopped || this.socket !== socket) return;
      this.receivedAt = Date.now();
      if (typeof event.data === 'string') {
        this.consume(event.data);
      } else if (event.data instanceof Blob) {
        void event.data.text().then((text) => {
          if (!this.stopped && this.socket === socket) this.consume(text);
        });
      }
    });

    socket.addEventListener('error', () => {
      if (this.stopped || this.socket !== socket) return;
      this.handlers.onState?.('error', 'خطای WebSocket');
    });

    socket.addEventListener('close', () => {
      if (this.socket === socket) this.socket = undefined;
      this.connected = false;
      this.clearHeartbeats();
      if (this.stopped) return;
      this.handlers.onState?.('reconnecting', `تلاش مجدد تا ${Math.round(RECONNECT_DELAY_MS / 1000)} ثانیه دیگر`);
      this.scheduleReconnect();
    });
  }

  private consume(chunk: string): void {
    this.buffer += chunk.replace(/^\r?\n+/, '');
    while (true) {
      const terminator = this.buffer.indexOf('\0');
      if (terminator < 0) {
        if (/^\s*$/.test(this.buffer)) this.buffer = '';
        return;
      }
      const rawFrame = this.buffer.slice(0, terminator).replace(/^\r?\n+/, '');
      this.buffer = this.buffer.slice(terminator + 1);
      if (!rawFrame.trim()) continue;
      this.handleFrame(rawFrame);
    }
  }

  private handleFrame(rawFrame: string): void {
    const normalized = rawFrame.replace(/\r\n/g, '\n');
    const separator = normalized.indexOf('\n\n');
    const head = separator >= 0 ? normalized.slice(0, separator) : normalized;
    const body = separator >= 0 ? normalized.slice(separator + 2) : '';
    const [command = '', ...headerLines] = head.split('\n');
    const headers = parseHeaders(headerLines);

    if (command === 'CONNECTED') {
      this.connected = true;
      this.receivedAt = Date.now();
      this.socket?.send(stompFrame('SUBSCRIBE', {
        id: this.subscriptionId,
        destination: LOG_DESTINATION,
        ack: 'auto',
      }));
      this.configureHeartbeats(headers['heart-beat']);
      this.handlers.onState?.('connected');
      return;
    }

    if (command === 'MESSAGE') {
      try {
        const event = normalizedLogEvent(JSON.parse(body) as unknown);
        if (event) this.handlers.onLog(event);
        else this.handlers.onProtocolError?.('ساختار پیام لاگ معتبر نیست.');
      } catch {
        this.handlers.onProtocolError?.('بدنه پیام لاگ JSON معتبر نیست.');
      }
      return;
    }

    if (command === 'ERROR') {
      const detail = headers.message || body || 'خطای STOMP';
      this.handlers.onProtocolError?.(detail);
      this.handlers.onState?.('error', detail);
      this.socket?.close(1011, 'STOMP error');
    }
  }

  private configureHeartbeats(serverHeader: string | undefined): void {
    this.clearHeartbeats();
    const [serverOutgoing = 0, serverIncoming = 0] = String(serverHeader ?? '0,0')
      .split(',')
      .map((value) => Number(value) || 0);

    const outgoingInterval = serverIncoming > 0
      ? Math.max(HEARTBEAT_OUTGOING_MS, serverIncoming)
      : 0;
    if (outgoingInterval > 0) {
      this.outgoingHeartbeatTimer = window.setInterval(() => {
        if (this.connected && this.socket?.readyState === WebSocket.OPEN) this.socket.send('\n');
      }, outgoingInterval);
    }

    const incomingInterval = serverOutgoing > 0
      ? Math.max(HEARTBEAT_INCOMING_MS, serverOutgoing)
      : 0;
    if (incomingInterval > 0) {
      this.incomingHeartbeatTimer = window.setInterval(() => {
        if (Date.now() - this.receivedAt <= incomingInterval * 2.5) return;
        this.handlers.onState?.('error', 'Heartbeat سرور دریافت نشد.');
        this.socket?.close(4000, 'Heartbeat timeout');
      }, incomingInterval);
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== undefined) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect(true);
    }, RECONNECT_DELAY_MS);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer !== undefined) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private clearHeartbeats(): void {
    if (this.outgoingHeartbeatTimer !== undefined) window.clearInterval(this.outgoingHeartbeatTimer);
    if (this.incomingHeartbeatTimer !== undefined) window.clearInterval(this.incomingHeartbeatTimer);
    this.outgoingHeartbeatTimer = undefined;
    this.incomingHeartbeatTimer = undefined;
  }
}

export function startLiveLogStream(handlers: LiveLogStreamHandlers): () => void {
  activeStream?.stop();
  const stream = new LiveLogStream(handlers);
  activeStream = stream;
  stream.start();
  return () => {
    if (activeStream === stream) activeStream = undefined;
    stream.stop();
  };
}

export function stopLiveLogStream(): void {
  activeStream?.stop();
  activeStream = undefined;
}

export const liveLogEndpoint = (): string => liveLogWebSocketUrl().toString();
export const liveLogDestination = LOG_DESTINATION;
