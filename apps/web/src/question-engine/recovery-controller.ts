import type { QuestionSessionId, ResponseState } from '@pte-app/contracts';

export interface LocalRecoverySnapshot {
  sessionId: QuestionSessionId;
  lastAcknowledgedRevision: number;
  pendingResponse: unknown;
  pendingResponseState: ResponseState;
  pendingEvents: any[];
  retryCount: number;
  lastAttemptAt: string;
}

export interface QuestionRecoveryStore {
  load(sessionId: QuestionSessionId): Promise<LocalRecoverySnapshot | null>;
  save(snapshot: LocalRecoverySnapshot): Promise<void>;
  clear(sessionId: QuestionSessionId): Promise<void>;
}

export class IndexedDbRecoveryStore implements QuestionRecoveryStore {
  private readonly dbName = 'PteQuestionRecoveryDB';
  private readonly storeName = 'recoverySnapshots';

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
        return;
      }
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'sessionId' });
        }
      };
    });
  }

  public async load(sessionId: QuestionSessionId): Promise<LocalRecoverySnapshot | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const req = store.get(sessionId);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result || null);
      });
    } catch {
      return null;
    }
  }

  public async save(snapshot: LocalRecoverySnapshot): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(snapshot);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  public async clear(sessionId: QuestionSessionId): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.delete(sessionId);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve();
      });
    } catch {
      // ignore
    }
  }
}
