"use client";

import { useEffect, useRef } from "react";

export default function BinaryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);
    const rainDrops: number[] = Array(columns).fill(1).map(() => Math.random() * -100);

    const draw = () => {
      ctx.fillStyle = "rgba(3, 7, 4, 0.15)"; // Very faint trail
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "rgba(16, 185, 129, 0.15)"; // Dim green for most binary digits
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < rainDrops.length; i++) {
        // Randomly pick '0' or '1'
        const text = Math.random() > 0.5 ? "1" : "0";
        const x = i * fontSize;
        const y = rainDrops[i] * fontSize;

        // Draw with fading opacity
        if (Math.random() > 0.98) {
          ctx.fillStyle = "#00ff66"; // Occasional bright glowing digit at the head
        } else {
          ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
    };

    const interval = setInterval(draw, 33); // ~30 FPS is plenty and light on CPU

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1]"
      style={{ opacity: 0.8 }}
    />
  );
}
