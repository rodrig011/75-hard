/* IndexedDB layer — proof photos are stored on-device as compressed blobs. */
'use strict';

const DB = (() => {
  const NAME = 'seventyfive';
  const VERSION = 1;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('proofs')) {
          const store = db.createObjectStore('proofs', { keyPath: 'id' });
          store.createIndex('byTask', 'taskId');
          store.createIndex('byDate', 'date');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction('proofs', mode);
      const store = t.objectStore('proofs');
      const out = fn(store);
      t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }

  return {
    putProof(rec) { return tx('readwrite', s => s.put(rec)); },
    deleteProof(id) { return tx('readwrite', s => s.delete(id)); },
    getProof(id) {
      return open().then(db => new Promise((resolve, reject) => {
        const req = db.transaction('proofs').objectStore('proofs').get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      }));
    },
    allProofs() {
      return open().then(db => new Promise((resolve, reject) => {
        const req = db.transaction('proofs').objectStore('proofs').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }));
    },
    clearProofs() { return tx('readwrite', s => s.clear()); },
  };
})();
