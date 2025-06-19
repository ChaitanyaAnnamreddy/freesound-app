self.onmessage = async (e) => {
  const { action, data } = e.data;
  if (action === "mixAudio") {
   
    self.postMessage({ status: "success", action, data: data.sound1 });
  }
};
