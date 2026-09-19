"use client";

import { motion } from "framer-motion";

// Slow-drifting blurred blobs behind the page content — the "depth" that makes a flat dark
// UI feel alive at rest, before the user has even touched the search box.
const BLOBS = [
  { color: "bg-violet-600/30", size: 480, start: { x: "-10%", y: "-10%" }, end: { x: "20%", y: "30%" }, duration: 22 },
  { color: "bg-fuchsia-600/20", size: 420, start: { x: "70%", y: "10%" }, end: { x: "50%", y: "50%" }, duration: 26 },
  { color: "bg-sky-500/20", size: 520, start: { x: "40%", y: "70%" }, end: { x: "65%", y: "35%" }, duration: 30 },
];

export function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-950">
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${blob.color} blur-[120px]`}
          style={{ width: blob.size, height: blob.size }}
          initial={{ left: blob.start.x, top: blob.start.y }}
          animate={{
            left: [blob.start.x, blob.end.x, blob.start.x],
            top: [blob.start.y, blob.end.y, blob.start.y],
          }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-3xl" />
    </div>
  );
}
