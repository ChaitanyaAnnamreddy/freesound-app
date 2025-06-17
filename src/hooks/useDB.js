import { useEffect, useState, useRef, useCallback } from "react";

const useDB = () => {
  const [worker, setWorker] = useState(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState(null);
  const pendingPromises = useRef(new Map());

  useEffect(() => {
    let dbWorker;
    try {
      dbWorker = new Worker(new URL("../workers/dbWorker.js", import.meta.url), {
        type: "module",
      });

      dbWorker.onerror = (error) => {
        const errorMsg = error.message || `Failed to load worker: ${error.filename || "unknown"}:${error.lineno || "unknown"}`;
        console.error("Web Worker Error:", error, errorMsg);
        setWorkerError(`Worker error: ${errorMsg}`);
        setIsWorkerReady(false);
        pendingPromises.current.forEach((promise, id) => {
          promise.reject(new Error(errorMsg));
          pendingPromises.current.delete(id);
        });
      };

      dbWorker.onmessageerror = (e) => {
        console.error("Web Worker Message Error:", e);
        setWorkerError("Worker message error");
        setIsWorkerReady(false);
      };


dbWorker.onmessage = (e) => {
  const { action, status, data, error, promiseId } = e.data;
  const promise = pendingPromises.current.get(promiseId);
  if (promise) {
    if (status === "success") {
      promise.resolve(data);
    } else {
      promise.reject(new Error(error || "Unknown worker error"));
    }
    pendingPromises.current.delete(promiseId);
  } else {
    console.warn("useDB: No promise found for promiseId =", promiseId);
  }
};

      setWorker(dbWorker);
      setIsWorkerReady(true);
    } catch (error) {
      const errorMsg = error.message || "Unknown initialization error";
      console.error("Worker Initialization Error:", error);
      setWorkerError(`Failed to initialize worker: ${errorMsg}`);
      setIsWorkerReady(false);
    }

    return () => {
      if (dbWorker) {
        dbWorker.terminate();
        setIsWorkerReady(false);
        setWorker(null);
        pendingPromises.current.forEach((promise, id) => {
          promise.reject(new Error("Worker terminated"));
          pendingPromises.current.delete(id);
        });
      }
    };
  }, []);

const sendMessage = (action, data) => {
  if (!worker || !isWorkerReady) {
    const errorMsg = workerError || "Web Worker is not initialized";
    console.error("sendMessage error:", errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
  return new Promise((resolve, reject) => {
    // Use a unique ID for each message
    const promiseId = `${action}-${Date.now()}-${Math.random()}`;
    pendingPromises.current.set(promiseId, { resolve, reject });
    try {
      const isValidBlob = data.blob instanceof Blob && data.blob.size > 0 && data.blob.type;
      const transfer = isValidBlob ? [data.blob] : [];
      worker.postMessage({ action, data, promiseId }, transfer);
    } catch (error) {
      console.error("postMessage error:", error);
      // Fallback: Send without transfer
      try {
        worker.postMessage({ action, data, promiseId }, []);
        resolve();
      } catch (fallbackError) {
        console.error("sendMessage fallback error:", fallbackError);
        reject(new Error(`Failed to send message: ${fallbackError.message}`));
      }
    }
  });
};

const saveSound = useCallback((type, name, blob) => {
    if (!(blob instanceof Blob) || blob.size === 0 || !blob.type) {
      console.error("saveSound: Invalid Blob", blob);
      return Promise.reject(new Error("Invalid Blob provided"));
    }
    return sendMessage("saveSound", {
      type,
      name,
      blob,
      createdAt: new Date(),
    });
  }, [worker, isWorkerReady]);

const getSounds = useCallback((type) => {
    return sendMessage("getSounds", { type }).then((sounds) => {
      return sounds;
    });
  }, [worker, isWorkerReady]);

const getSoundById = useCallback((id) => {
    return sendMessage("getSoundById", { id });
  }, [worker, isWorkerReady]);

  return { saveSound, getSounds, getSoundById, isWorkerReady, workerError };
};

export default useDB;