self.onmessage = async (e) => {
  const { action, data } = e.data;
  if (action === "mixAudio") {
    // Placeholder: Return first sound (implement actual mixing with Web Audio API or ffmpeg.wasm)
    self.postMessage({ status: "success", action, data: data.sound1 });
  }
};
