type MessageEventListener = (data: MessageEvent) => void;

export interface MessageEvent {
  messageId: string;
  content: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  replyToId?: string | null;
  replyToContent?: string | null;
  replyToUserName?: string | null;
}

class MessageEventEmitter {
  private listeners: Set<MessageEventListener> = new Set();

  subscribe(listener: MessageEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(data: MessageEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error in message event listener:", error);
      }
    });
  }

  getListenerCount(): number {
    return this.listeners.size;
  }
}

export const messageEvents = new MessageEventEmitter();
