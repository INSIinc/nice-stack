import { LeveldbPersistence } from 'y-leveldb';
import * as Y from 'yjs';
import { WSSharedDoc } from './ws-shared-doc';
const persistenceDir = process.env.YPERSISTENCE;
interface Persistence {
  bindState: (docName: string, ydoc: WSSharedDoc) => void;
  writeState: (docName: string, ydoc: WSSharedDoc) => Promise<any>;
  provider: any;
}
let persistence: Persistence | null = null;

if (typeof persistenceDir === 'string') {
  console.info('Persisting documents to "' + persistenceDir + '"');
  const ldb = new LeveldbPersistence(persistenceDir);
  persistence = {
    provider: ldb,
    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);
      ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
      ydoc.on('update', (update: Uint8Array) => {
        ldb.storeUpdate(docName, update);
      });
    },
    writeState: async (_docName, _ydoc) => { },
  };
}

export const setPersistence = (persistence_: Persistence | null) => {
  persistence = persistence_;
};

export const getPersistence = (): Persistence | null => persistence;
