interface EventMap {
  please_token: undefined;
  auth_success: undefined;
  refresh_recommended: undefined;
  notification: ApiNotification;
  notification_read: { id: string; unread: number } | object;
}

type ServerEvent = {
  [K in keyof EventMap]: { event: K; data: EventMap[K] };
}[keyof EventMap];

interface ClientPayload {
  type?: string;
  action?: string;
  token?: string;
  data?: unknown;
  [key: string]: unknown;
}

type EventListener<T> = (data: T) => void | Promise<void>;

class WebSocketService {
  private listeners: Map<keyof EventMap, Set<EventListener<EventMap[keyof EventMap]>>> = new Map();
  private socket: WebSocket | null = null;
  private url: string = "";
  private reconnectAttempts: number = 0;
  private baseReconnectInterval: number = 1000;
  private isManualDisconnect: boolean = false;
  private shouldStayConnected: boolean = true;
  private isReconnecting: boolean = false;
  private reconnectResolve: (() => void) | undefined = undefined;
  private reconnectTimeout: NodeJS.Timeout | undefined = undefined;

  connect(url: string): void {
    if (this.isConnected()) {
      console.debug("Already connected, skipping new connection");
      return;
    }
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.debug("Closing existing socket before new connection");
      this.socket.close();
    }

    this.url = url;
    this.isManualDisconnect = false;
    this.shouldStayConnected = true;
    this.reconnectAttempts = 0;
    this.attemptConnection();
  }

  private attemptConnection(): void {
    try {
      console.debug("Attempting to create WebSocket for URL:", this.url);
      this.socket = new WebSocket(this.url);
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      if (this.shouldStayConnected && !this.isManualDisconnect) {
        void this.handleReconnect();
      }
      return;
    }

    if (!this.socket) {
      console.error("WebSocket initialization failed unexpectedly");
      if (this.shouldStayConnected && !this.isManualDisconnect) {
        void this.handleReconnect();
      }
      return;
    }

    this.socket.onopen = () => {
      console.debug("WebSocket connected");
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
    };

    this.socket.onerror = (error: Event) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onmessage = async (event: MessageEvent) => {
      try {
        const message: ServerEvent = JSON.parse(event.data);
        await this.handleEvent(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.debug(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
      if (this.shouldStayConnected && !this.isManualDisconnect && !this.isReconnecting) {
        void this.handleReconnect();
      }
    };
  }

  private async handleEvent(message: ServerEvent) {
    const eventName = message.event;
    const payload = message.data;

    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          const result = callback(payload);
          if (result instanceof Promise) await result;
        } catch (error) {
          console.error(`Error in callback for event "${eventName}":`, error);
        }
      }
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.isReconnecting) {
      console.debug("Reconnect already in progress, skipping");
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    const delay =
      Math.min(this.baseReconnectInterval * Math.pow(1.5, this.reconnectAttempts), 60000) + Math.random() * 500;

    console.debug(`Reconnecting attempt ${this.reconnectAttempts} in ${Math.round(delay)}ms...`);
    await new Promise<void>((resolve) => {
      this.reconnectResolve = resolve;
      this.reconnectTimeout = setTimeout(() => {
        resolve();
        this.reconnectResolve = undefined;
        this.reconnectTimeout = undefined;
      }, delay);
    });

    this.isReconnecting = false;
    this.attemptConnection();
  }

  on<K extends keyof EventMap>(eventName: K, callback: EventListener<EventMap[K]>): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    (this.listeners.get(eventName) as Set<EventListener<EventMap[K]>>).add(callback);
  }

  off<K extends keyof EventMap>(eventName: K, callback: EventListener<EventMap[K]>): void {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      (callbacks as Set<EventListener<EventMap[K]>>).delete(callback);
    }
  }

  skipReconnectTimeout(): void {
    if (this.reconnectAttempts > 5 && this.reconnectResolve && this.reconnectTimeout) {
      console.debug("Skipping reconnect timeout");
      this.reconnectResolve();
      clearTimeout(this.reconnectTimeout);
    }
  }

  send(data: ClientPayload): void {
    if (this.isConnected()) {
      this.socket!.send(JSON.stringify(data));
    } else {
      console.warn("WebSocket is not connected");
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.shouldStayConnected = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
    }
  }

  isConnected(): boolean {
    return !!(this.socket && this.socket.readyState === WebSocket.OPEN);
  }
}

export default new WebSocketService();
