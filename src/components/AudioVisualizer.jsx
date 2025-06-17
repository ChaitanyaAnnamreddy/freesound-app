import { useEffect, useRef } from "react";

const AudioVisualizer = ({ analyser }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 2;

      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * canvas.width;
        const y = canvas.height - (dataArray[i] / 255) * canvas.height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    draw();
  }, [analyser]);

  return <canvas ref={canvasRef} width={400} height={100} />;
};

export default AudioVisualizer;