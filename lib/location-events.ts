// Simple in-memory event emitter for location updates
// NOTE: In production with multiple server instances (serverless),
// you'd want to use Redis pub/sub or a similar solution

type LocationUpdateListener = (data: LocationUpdate) => void;

interface LocationUpdate {
  catId: string;
  locationId: string;
  apartmentId: string | null;
  entryTime: Date;
  locationName?: string;
  apartmentName?: string;
}

class LocationEventEmitter {
  private listeners: Set<LocationUpdateListener> = new Set();

  subscribe(listener: LocationUpdateListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(data: LocationUpdate) {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in location event listener:', error);
      }
    });
  }

  getListenerCount(): number {
    return this.listeners.size;
  }
}

// Singleton instance
export const locationEvents = new LocationEventEmitter();
