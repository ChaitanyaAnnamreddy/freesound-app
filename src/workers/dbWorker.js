import Dexie from "dexie";

const db = new Dexie("FreesoundApp");
db.version(1).stores({
  sounds: "++id, type, name, blob, createdAt",
});

self.onmessage = async (e) => {
  const { action, data, promiseId } = e.data;
  try {
    if (action === "saveSound") {
      if (!(data.blob instanceof Blob) || data.blob.size === 0 || !data.blob.type) {
        throw new Error(`Invalid Blob: ${data.blob}`);
      }
      const id = await db.sounds.add(data);
      self.postMessage({ status: "success", action, promiseId });
    } else if (action === "getSounds") {
      const sounds = await db.sounds.where("type").equals(data.type).toArray();
      self.postMessage({ status: "success", action, data: sounds, promiseId });
    } else if (action === "getSoundById") {
      const sound = await db.sounds.get(data.id);
      self.postMessage({ status: "success", action, data: sound, promiseId });
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("dbWorker.js: Error", error);
    self.postMessage({ status: "error", action, error: error.message || "Unknown error", promiseId });
  }
};