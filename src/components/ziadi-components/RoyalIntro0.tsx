// "use client";

// import { useEffect, useRef, MutableRefObject } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Image from "next/image";
// import type { BubblePhysics } from "@/components/HomeClient";

// // ─── Bubble definitions ───────────────────────────────────────────────────────
// const BUBBLES = [
//   {
//     id: 0,
//     title: "World-Class Faculty",
//     text: "Learn under masters of their craft",
//     baseSize: 220,
//   },
//   {
//     id: 1,
//     title: "Royal Certification",
//     text: "Credentials recognised worldwide",
//     baseSize: 210,
//   },
//   {
//     id: 2,
//     title: "Performance Stages",
//     text: "Perform on prestigious platforms",
//     baseSize: 215,
//   },
//   {
//     id: 3,
//     title: "Curated Curriculum",
//     text: "A legacy of excellence since 2024",
//     baseSize: 225,
//   },
//   {
//     id: 4,
//     title: "Elite Scholarships",
//     text: "Merit-based opportunities to ascend",
//     baseSize: 205,
//   },
//   {
//     id: 5,
//     title: "Global Network",
//     text: "Join a fellowship of distinguished alumni",
//     baseSize: 220,
//   },
// ];

// // ─── Physics constants ────────────────────────────────────────────────────────
// const MOUSE_RADIUS = 170;
// const MOUSE_STRENGTH = 10;
// const BOUNCE_DAMPING = 0.68;
// const FRICTION = 0.88;
// const MAX_SPEED_XY = 42;
// const MAX_SPEED_Z = 0.036;
// const Z_FRICTION = 0.85;
// const Z_SCALE_MIN = 0.45;
// const Z_SCALE_MAX = 1.25;
// const Z_OPACITY_MIN = 0.5;
// const Z_OPACITY_MAX = 1;
// const Z_BLUR_MAX = 1;

// // ─── Bubble DOM node ──────────────────────────────────────────────────────────
// function BubbleNode({
//   title,
//   text,
//   baseSize,
//   nodeRef,
// }: {
//   title: string;
//   text: string;
//   baseSize: number;
//   nodeRef: (el: HTMLDivElement | null) => void;
// }) {
//   return (
//     <div
//       ref={nodeRef}
//       style={{
//         position: "absolute",
//         top: 0,
//         left: 0,
//         width: "auto",
//         height: "auto",
//         minWidth: 250,
//         padding: "16px 32px",
//         borderRadius: "9999px",
//         willChange: "transform, opacity, filter",
//         transform: "translate(-9999px, -9999px)",
//         transformOrigin: "center",
//         background: `radial-gradient(circle at 38% 32%,
//   rgba(196,168,130,0.15) 0%,
//   rgba(89,44,65,0.35) 0%,
//   rgba(89,44,65,0.55) 100%)`,
//         backdropFilter: "blur(18px) saturate(1.6)",
//         WebkitBackdropFilter: "blur(18px) saturate(1.6)",
//         boxShadow: `
//           2px 2px 24px rgba(0,0,0,0.2),
//           inset 0 -2px 6px rgba(89,44,65,0.50) `,
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         pointerEvents: "none",
//         userSelect: "none",
//       }}
//     >
//       {/* <div
//         style={{
//           position: "absolute",
//           inset: 0,
//           width: "auto",
//           height: "auto",
//           minWidth: 160,
//           padding: "16px 32px",
//           borderRadius: "9999px",
//           background: `conic-gradient(from 160deg, rgba(196,168,130,0.09), rgba(212,184,150,0.16), rgba(196,168,130,0.04), rgba(222,194,171,0.12), rgba(196,168,130,0.09))`,
//           mixBlendMode: "screen",
//           pointerEvents: "none",
//         }}
//       /> */}
//       <div
//         style={{
//           position: "absolute",
//           inset: 0,
//           borderRadius: "30%",
//           background:
//             "radial-gradient(circle at 62% 72%, rgba(89,44,65,0.45) 0%, transparent 60%)",
//           pointerEvents: "none",
//         }}
//       />
//       <div
//         style={{
//           position: "relative",
//           zIndex: 1,
//           display: "flex",
//           flexDirection: "column",
//           alignItems: "center",
//           justifyContent: "center",
//           padding: "0 14px",
//           textAlign: "center",
//           gap: 4,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 6,
//             marginBottom: 2,
//           }}
//         >
//           <div
//             style={{
//               height: 1,
//               width: 16,
//               background: "rgba(196,168,130,0.6)",
//             }}
//           />
//           <div
//             style={{
//               width: 3,
//               height: 3,
//               borderRadius: "30%",
//               background: "rgba(196,168,130,0.85)",
//             }}
//           />
//           <div
//             style={{
//               height: 1,
//               width: 16,
//               background: "rgba(196,168,130,0.6)",
//             }}
//           />
//         </div>
//         <p
//           style={{
//             fontFamily: "Georgia, 'Times New Roman', serif",
//             fontSize: baseSize > 135 ? "0.72rem" : "0.63rem",
//             fontWeight: 600,
//             letterSpacing: "0.08em",
//             textTransform: "uppercase",
//             color: "rgba(222,194,171,0.95)",
//             lineHeight: 1.2,
//             margin: 0,
//           }}
//         >
//           {title}
//         </p>
//         <p
//           style={{
//             fontFamily: "Georgia, 'Times New Roman', serif",
//             fontStyle: "italic",
//             fontSize: baseSize > 135 ? "0.62rem" : "0.55rem",
//             color: "rgba(196,168,130,0.8)",
//             lineHeight: 1.3,
//             marginTop: 2,
//             margin: 0,
//           }}
//         >
//           {text}
//         </p>
//       </div>
//     </div>
//   );
// }

// // ─── Main component ───────────────────────────────────────────────────────────
// export default function RoyalIntro({
//   onScrolled,
//   active,
//   bubblePhysics,
// }: {
//   onScrolled: () => void;
//   active: boolean;
//   bubblePhysics: MutableRefObject<BubblePhysics[]>;
// }) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const rafRef = useRef<number>(0);
//   const mouseRef = useRef({ x: -9999, y: -9999 });
//   const initializedRef = useRef(false);

//   // Initialise positions only ONCE on first mount
//   useEffect(() => {
//     if (initializedRef.current) return;
//     if (!containerRef.current) return;
//     const W = containerRef.current.clientWidth;
//     const H = containerRef.current.clientHeight;
//     const cx = W / 2,
//       cy = H / 2;
//     bubblePhysics.current = bubblePhysics.current.map((p, i) => ({
//       ...p,
//       x:
//         cx +
//         Math.cos((i / BUBBLES.length) * Math.PI * 2) *
//           (420 + Math.random() * 160),
//       y:
//         cy +
//         Math.sin((i / BUBBLES.length) * Math.PI * 2) *
//           (340 + Math.random() * 100),
//     }));
//     initializedRef.current = true;
//   }, [bubblePhysics]);

//   // Mouse tracking
//   useEffect(() => {
//     const onMove = (e: MouseEvent) => {
//       mouseRef.current = { x: e.clientX, y: e.clientY };
//     };
//     const onLeave = () => {
//       mouseRef.current = { x: -9999, y: -9999 };
//     };
//     window.addEventListener("mousemove", onMove);
//     window.addEventListener("mouseleave", onLeave);
//     return () => {
//       window.removeEventListener("mousemove", onMove);
//       window.removeEventListener("mouseleave", onLeave);
//     };
//   }, []);

//   // Physics loop — runs only when active
//   useEffect(() => {
//     if (!active) {
//       cancelAnimationFrame(rafRef.current);
//       return;
//     }

//     const loop = () => {
//       const container = containerRef.current;
//       if (!container) {
//         rafRef.current = requestAnimationFrame(loop);
//         return;
//       }
//       const W = container.clientWidth;
//       const H = container.clientHeight;
//       const mouse = mouseRef.current;
//       const state = bubblePhysics.current;

//       for (let i = 0; i < state.length; i++) {
//         const p = state[i];
//         const scale = Z_SCALE_MIN + (Z_SCALE_MAX - Z_SCALE_MIN) * p.z;
//         const r = 90 * scale;
//         // Mouse repulsion
//         const dx = p.x - mouse.x;
//         const dy = p.y - mouse.y;
//         const dist2D = Math.sqrt(dx * dx + dy * dy) || 1;
//         if (dist2D < MOUSE_RADIUS) {
//           const force = ((MOUSE_RADIUS - dist2D) / MOUSE_RADIUS) ** 2;
//           p.vx += (dx / dist2D) * force * MOUSE_STRENGTH;
//           p.vy += (dy / dist2D) * force * MOUSE_STRENGTH;
//           p.vz += force * 0.008;
//         }

//         // Bubble–bubble 3D repulsion
//         for (let j = i + 1; j < state.length; j++) {
//           const q = state[j];
//           const qScale = Z_SCALE_MIN + (Z_SCALE_MAX - Z_SCALE_MIN) * q.z;
//           const qr = 90 * qScale;
//           const minDist = r + qr + 50;
//           const bx = p.x - q.x;
//           const by = p.y - q.y;
//           const zDiff = (p.z - q.z) * W * 0.4;
//           const bd = Math.sqrt(bx * bx + by * by + zDiff * zDiff) || 1;
//           if (bd < minDist) {
//             const push = ((minDist - bd) / minDist) * 0.9;
//             const nx = bx / bd,
//               ny = by / bd,
//               nz = zDiff / bd;
//             p.vx += nx * push;
//             p.vy += ny * push;
//             p.vz += nz * push * 0.015;
//             q.vx -= nx * push;
//             q.vy -= ny * push;
//             q.vz -= nz * push * 0.015;
//           }
//         }

//         p.vx *= FRICTION;
//         p.vy *= FRICTION;
//         p.vz *= Z_FRICTION;

//         const speedXY = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
//         if (speedXY > MAX_SPEED_XY) {
//           p.vx = (p.vx / speedXY) * MAX_SPEED_XY;
//           p.vy = (p.vy / speedXY) * MAX_SPEED_XY;
//         }
//         p.vz = Math.max(-MAX_SPEED_Z, Math.min(MAX_SPEED_Z, p.vz));

//         p.x += p.vx;
//         p.y += p.vy;
//         p.z += p.vz;

//         const marginX = W * 0.1; // ~2 inches at typical screen width (≈10% of width)
//         const marginY = H * 0.05; // ~1 inch at typical screen height (≈10% of height)

//         if (p.x - r < marginX) {
//           p.x = marginX + r;
//           p.vx = Math.abs(p.vx) * BOUNCE_DAMPING;
//         }
//         if (p.x + r > W - marginX) {
//           p.x = W - marginX - r;
//           p.vx = -Math.abs(p.vx) * BOUNCE_DAMPING;
//         }
//         if (p.y - r < marginY) {
//           p.y = marginY + r;
//           p.vy = Math.abs(p.vy) * BOUNCE_DAMPING;
//         }
//         if (p.y + r > H - marginY) {
//           p.y = H - marginY - r;
//           p.vy = -Math.abs(p.vy) * BOUNCE_DAMPING;
//         }
//         if (p.z > 1) {
//           p.z = 1;
//           p.vz = -Math.abs(p.vz) * BOUNCE_DAMPING;
//         }
//         if (p.z < 0) {
//           p.z = 0;
//           p.vz = Math.abs(p.vz) * BOUNCE_DAMPING;
//         }

//         const visualScale = Z_SCALE_MIN + (Z_SCALE_MAX - Z_SCALE_MIN) * p.z;
//         const visualOpacity =
//           Z_OPACITY_MIN + (Z_OPACITY_MAX - Z_OPACITY_MIN) * p.z;
//         const visualBlur = Z_BLUR_MAX * (1 - p.z);

//         const el = nodeRefs.current[i];
//         if (el) {
//           const hw = (p.baseSize * visualScale) / 2;
//           el.style.transform = `translate(${p.x - hw}px, ${p.y - hw}px) scale(${visualScale})`;
//           el.style.opacity = String(visualOpacity);
//           el.style.filter =
//             visualBlur > 0.3 ? `blur(${visualBlur.toFixed(1)}px)` : "none";
//           el.style.zIndex = String(Math.round(p.z * 100));
//         }
//       }

//       rafRef.current = requestAnimationFrame(loop);
//     };

//     rafRef.current = requestAnimationFrame(loop);
//     return () => cancelAnimationFrame(rafRef.current);
//   }, [active, bubblePhysics]);

//   // Scroll trigger — only when active
//   useEffect(() => {
//     if (!active) return;
//     const trigger = () => {
//       if (active) onScrolled();
//     };
//     const onKey = (e: KeyboardEvent) => {
//       if (["ArrowDown", " ", "PageDown"].includes(e.key)) trigger();
//     };
//     window.addEventListener("wheel", trigger, { once: true });
//     window.addEventListener("touchmove", trigger, { once: true });
//     window.addEventListener("keydown", onKey, { once: true });
//     return () => {
//       window.removeEventListener("wheel", trigger);
//       window.removeEventListener("touchmove", trigger);
//       window.removeEventListener("keydown", onKey);
//     };
//   }, [active, onScrolled]);

//   return (
//     <div ref={containerRef} className="w-full h-full relative">
//       {/* Room background */}

//       {/* Subtle vignette */}
//       <div
//         style={{
//           position: "absolute",
//           inset: 0,
//           zIndex: 1,
//           background:
//             "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(10,15,44,0.18) 100%)",
//           pointerEvents: "none",
//         }}
//       />

//       <div
//         style={{
//           position: "absolute",
//           inset: 0,
//           zIndex: 2,
//           clipPath: "inset(0)",
//         }}
//       >
//         {/* Bubbles */}
//         {BUBBLES.map((b, i) => (
//           <motion.div
//             key={b.id}
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{
//               delay: 0.3 + i * 0.18,
//               duration: 1.4,
//               ease: "easeInOut",
//             }}
//             style={{
//               position: "absolute",
//               top: 0,
//               left: 0,
//               zIndex: 2,
//               willChange: "opacity",
//             }}
//           >
//             <BubbleNode
//               title={b.title}
//               text={b.text}
//               baseSize={b.baseSize}
//               nodeRef={(el) => {
//                 nodeRefs.current[i] = el;
//               }}
//             />
//           </motion.div>
//         ))}
//       </div>

//       {/* Scroll hint */}
//       <AnimatePresence>
//         {active && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ delay: 1.5, duration: 0.8 }}
//             style={{
//               position: "absolute",
//               bottom: 40,
//               left: "50%",
//               transform: "translateX(-50%)",
//               display: "flex",
//               flexDirection: "column",
//               alignItems: "center",
//               gap: 8,
//               pointerEvents: "none",
//               zIndex: 20,
//             }}
//           >
//             <p
//               style={{
//                 fontFamily: "Georgia, 'Times New Roman', serif",
//                 fontSize: "0.6rem",
//                 letterSpacing: "0.35em",
//                 color: "rgba(196,168,130,0.65)",
//                 textTransform: "uppercase",
//               }}
//             >
//               Scroll to Departments
//             </p>
//             <motion.div
//               animate={{ y: [0, 8, 0] }}
//               transition={{
//                 duration: 2,
//                 repeat: Infinity,
//                 ease: "easeInOut",
//               }}
//               style={{
//                 width: 1,
//                 height: 28,
//                 background:
//                   "linear-gradient(to bottom, rgba(196,168,130,0.7), transparent)",
//               }}
//             />
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }
