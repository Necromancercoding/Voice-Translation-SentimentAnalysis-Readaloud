import React, { useState, useRef, useEffect } from "react";

export default function AudioRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false);
  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrRef  = useRef(null);
  const sourceRef   = useRef(null);

  useEffect(() => {
    if (recording) drawVisualizer();
    else if (animRef.current) cancelAnimationFrame(animRef.current);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [recording]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRef.current.ondataavailable = e => chunksRef.current.push(e.data);
    mediaRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onRecorded(blob);
    };
    mediaRef.current.start();
    setupVisualizer(stream);
    setRecording(true);
  };

  const stop = () => {
    mediaRef.current.stop();
    mediaRef.current.stream.getTracks().forEach(t => t.stop());
    teardownVisualizer();
    setRecording(false);
  };

  function setupVisualizer(stream) {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioCtxRef.current.createAnalyser();
    sourceRef.current   = audioCtxRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;
    dataArrRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
  }

  function teardownVisualizer() {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }

  function drawVisualizer() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width: W, height: H } = canvas;

    const render = () => {
      analyserRef.current.getByteTimeDomainData(dataArrRef.current);
      ctx.fillStyle   = "#f3f3f3";
      ctx.fillRect(0, 0, W, H);
      ctx.lineWidth   = 2;
      ctx.strokeStyle = "#4f46e5";
      ctx.beginPath();

      const slice = W / dataArrRef.current.length;
      let x = 0;
      dataArrRef.current.forEach((v, i) => {
        const y = (v / 128.0) * (H/2);
        i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        x += slice;
      });
      ctx.lineTo(W, H/2);
      ctx.stroke();
      animRef.current = requestAnimationFrame(render);
    };
    render();
  }

  return (
    <button
      className="button-primary"
      onClick={recording ? stop : start}
    >
      {recording ? "Stop Recording" : "Record via Mic"}
      {recording && (
        <canvas
          ref={canvasRef}
          width="300"
          height="60"
          style={{
            display: "block",
            marginTop: "10px",
            borderRadius: "4px",
            border: "1px solid #CBD5E0"
          }}
        />
      )}
    </button>
  );
}
