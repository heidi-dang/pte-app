'use client';

import React from 'react';

export function RecordingWaveform({ analyserNode }: { analyserNode?: AnalyserNode | null }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animId: number;
    const draw = () => {
      analyserNode.getByteTimeDomainData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] ?? 128;
        const v = val / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Recording waveform"
      width={300}
      height={80}
      style={{ width: '100%', maxWidth: '300px' }}
    />
  );
}
