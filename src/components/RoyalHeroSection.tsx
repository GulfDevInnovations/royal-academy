"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Section {
  id: string;
  label: string;
  subtitle: string;
  image: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    id: "ballet",
    label: "Ballet",
    subtitle: "Grace in every movement",
    image: "/images/ballet-hero.jpg",
  },
  {
    id: "dance & wellness",
    label: "Dance & Wellness",
    subtitle: "Rhythm of the soul",
    image: "/images/dance-hero.jpg",
  },
  {
    id: "music",
    label: "Music",
    subtitle: "The language of kings",
    image: "/images/music-hero.jpg",
  },
  {
    id: "art",
    label: "Art",
    subtitle: "Vision beyond the canvas",
    image: "/images/art-hero.jpg",
  },
];

// ─── Vertex Shader ─────────────────────────────────────────────────────────────
const VERT = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ─── Fragment Shader (liquid/ripple transition) ────────────────────────────────
const FRAG = `
  precision highp float;
  uniform sampler2D u_from;
  uniform sampler2D u_to;
  uniform float u_progress;
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 v_uv;

  // Gold shimmer noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Fbm for richer distortion
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p *= 2.1;
      amp *= 0.5;
    }
    return v;
  }

  // Cover-fit UV for aspect ratio
  vec2 coverUV(vec2 uv, vec2 texRes, vec2 screenRes) {
    float screenAspect = screenRes.x / screenRes.y;
    float texAspect = texRes.x / texRes.y;
    vec2 scale;
    if (screenAspect > texAspect) {
      scale = vec2(1.0, texAspect / screenAspect);
    } else {
      scale = vec2(screenAspect / texAspect, 1.0);
    }
    return (uv - 0.5) / scale + 0.5;
  }

  void main() {
    float p = u_progress;
    float t = u_time;

    // Animated displacement — royal ripple / liquid gold
    vec2 distUV = v_uv * 3.5 + vec2(t * 0.04, t * 0.03);
    float disp = fbm(distUV) * 2.0 - 1.0;

    // Wave propagation: moves from left to right across screen
    float wave = smoothstep(0.0, 1.0, p * 1.6 - v_uv.x * 0.6);
    float waveBack = smoothstep(0.0, 1.0, (1.0 - p) * 1.6 - (1.0 - v_uv.x) * 0.6);

    // Distortion strength peaks at transition midpoint
    float strength = sin(p * 3.14159) * 0.07;
    vec2 dispVec = vec2(disp * strength, disp * strength * 0.5);

    vec2 uvFrom = v_uv + dispVec * (1.0 - wave);
    vec2 uvTo   = v_uv - dispVec * waveBack;

    // Clamp
    uvFrom = clamp(uvFrom, 0.0, 1.0);
    uvTo   = clamp(uvTo, 0.0, 1.0);

    vec4 texFrom = texture2D(u_from, uvFrom);
    vec4 texTo   = texture2D(u_to, uvTo);

    // Gold shimmer overlay at transition edge
    float edge = smoothstep(0.0, 0.15, wave) * smoothstep(1.0, 0.85, wave);
    float shimmer = fbm(v_uv * 8.0 + vec2(t * 0.3, 0.0)) * 0.6 + 0.4;
    vec3 goldColor = vec3(0.77, 0.67, 0.51) * shimmer; // royal gold

    vec4 color = mix(texFrom, texTo, wave);
    color.rgb = mix(color.rgb, goldColor, edge * 0.35);

    // Subtle dark vignette for depth
    float vignette = 1.0 - smoothstep(0.3, 1.0, length(v_uv - 0.5) * 1.4);
    color.rgb *= mix(0.75, 1.0, vignette);

    gl_FragColor = color;
  }
`;

// ─── WebGL Renderer Hook ──────────────────────────────────────────────────────
function useWebGLTransition(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  fromIndex: number,
  toIndex: number,
  progress: number,
  time: number,
) {
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texturesRef = useRef<(WebGLTexture | null)[]>([]);
  const loadedRef = useRef<boolean[]>([]);

  // Init WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false });
    if (!gl) return;
    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERT);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAG);
    gl.compileShader(fs);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    programRef.current = prog;

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Load all textures
    texturesRef.current = new Array(SECTIONS.length).fill(null);
    loadedRef.current = new Array(SECTIONS.length).fill(false);

    SECTIONS.forEach((section, i) => {
      const tex = gl.createTexture();
      texturesRef.current[i] = tex;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // ← add this line
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          img,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        loadedRef.current[i] = true;
      };
      img.src = section.image;
    });
  }, [canvasRef]);

  // Render frame
  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    const prog = programRef.current;
    if (!canvas || !gl || !prog) return;
    if (!loadedRef.current[fromIndex] && !loadedRef.current[toIndex]) return;

    gl.useProgram(prog);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current[fromIndex]);
    gl.uniform1i(gl.getUniformLocation(prog, "u_from"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texturesRef.current[toIndex]);
    gl.uniform1i(gl.getUniformLocation(prog, "u_to"), 1);

    gl.uniform1f(gl.getUniformLocation(prog, "u_progress"), progress);
    gl.uniform1f(gl.getUniformLocation(prog, "u_time"), time);
    gl.uniform2f(
      gl.getUniformLocation(prog, "u_resolution"),
      canvas.width,
      canvas.height,
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RoyalHeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(0);
  const [progress, setProgress] = useState(1);
  const [time, setTime] = useState(0);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());
  const transitionRef = useRef<{
    active: boolean;
    start: number;
    duration: number;
    from: number;
    to: number;
  }>({ active: false, start: 0, duration: 900, from: 0, to: 0 });

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Animation loop
  useEffect(() => {
    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      setTime(elapsed / 1000);

      const tr = transitionRef.current;
      if (tr.active) {
        const t = Math.min((now - tr.start) / tr.duration, 1);
        // Ease in-out cubic
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setProgress(eased);
        if (t >= 1) {
          tr.active = false;
          setFromIndex(tr.to);
          setToIndex(tr.to);
          setProgress(1);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleHover = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      const now = performance.now();
      transitionRef.current = {
        active: true,
        start: now,
        duration: 900,
        from: activeIndex,
        to: index,
      };
      setFromIndex(activeIndex);
      setToIndex(index);
      setProgress(0);
      setActiveIndex(index);
    },
    [activeIndex],
  );

  useWebGLTransition(canvasRef, fromIndex, toIndex, progress, time);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "var(--royal-purple)" }}
    >
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ display: "block" }}
      />

      {/* Dark overlay for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 38% 32%,
  rgba(196,168,130,0.15) 0%,
  rgba(89,44,65,0.35) 55%,
  rgba(89,44,65,0.55) 100%)`,
        }}
      />

      {/* Decorative top gold rule */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(196,168,130,0.6), transparent)",
        }}
      />

      {/* 4-Column hover areas */}
      <div className="absolute inset-0 flex z-10">
        {SECTIONS.map((section, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={section.id}
              className="relative flex-1 flex flex-col justify-end cursor-pointer group"
              style={{ transition: "flex 0.6s cubic-bezier(0.4,0,0.2,1)" }}
              onMouseEnter={() => handleHover(i)}
            >
              {/* Vertical separator line */}
              {i > 0 && (
                <div
                  className="absolute left-0 top-12 bottom-12 w-px"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(196,168,130,0.25), transparent)",
                  }}
                />
              )}

              {/* Text content at bottom */}
              <div
                className="relative px-7 pb-12 flex flex-col gap-1.5"
                style={{ transition: "opacity 0.4s ease" }}
              >
                {/* Section number */}
                {/* <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.3em",
                    color: isActive
                      ? "rgba(196,168,130,0.9)"
                      : "rgba(196,168,130,0.4)",
                    transition: "color 0.5s ease",
                    textTransform: "uppercase",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div> */}

                {/* Section label */}
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: isActive ? "4rem" : "1.35rem",
                    fontWeight: 400,
                    lineHeight: 1.1,
                    color: isActive
                      ? "rgba(222,194,171,1)"
                      : "rgba(222,194,171,0.55)",
                    transition:
                      "font-size 0.5s cubic-bezier(0.4,0,0.2,1), color 0.5s ease",
                    letterSpacing: "0.03em",
                  }}
                >
                  {section.label}
                </div>

                {/* Subtitle — only visible on active */}
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontStyle: "italic",
                    fontSize: "0.78rem",
                    color: "rgba(196,168,130,0.8)",
                    letterSpacing: "0.05em",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateY(0)" : "translateY(6px)",
                    transition:
                      "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
                  }}
                >
                  {section.subtitle}
                </div>

                {/* Gold underline */}
                <div
                  style={{
                    height: 1,
                    marginTop: 6,
                    background:
                      "linear-gradient(to right, rgba(196,168,130,0.7), transparent)",
                    width: isActive ? "100%" : "0%",
                    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom gold rule */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(196,168,130,0.5), transparent)",
        }}
      />

      {/* Scroll hint */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
        style={{ opacity: 0.5 }}
      >
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "0.6rem",
            letterSpacing: "0.3em",
            color: "rgba(196,168,130,0.8)",
            textTransform: "uppercase",
          }}
        >
          Scroll
        </div>
        <div
          style={{
            width: 1,
            height: 24,
            background:
              "linear-gradient(to bottom, rgba(196,168,130,0.7), transparent)",
            animation: "scrollPulse 2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(0.8); }
          50% { opacity: 0.9; transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
}
