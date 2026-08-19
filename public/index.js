const response = await fetch("/welcome-message");
const message = await response.text();

const metricsResponse = await fetch("/site-metrics");
const metrics = await metricsResponse.json();

const title = document.querySelector("#welcomeMessage");
const statusLabel = document.querySelector("[data-status-label]");
const statusDot = document.querySelector("[data-status-dot]");
const particleCountEl = document.querySelector("[data-particle-count]");
const glowLevelEl = document.querySelector("[data-glow-level]");
const controlButtons = document.querySelectorAll("[data-mode]");
const densityPill = document.querySelector("[data-density-pill]");
const densityValue = document.querySelector("[data-density-value]");
const visitorCount = document.querySelector("[data-visitor-count]");
const revealDensityButton = document.querySelector("[data-action='reveal-density']");
const visitorButton = document.querySelector("[data-action='visitor-count']");
const particleStage = document.querySelector(".particle-stage");

visitorCount.textContent = String(metrics.visitors ?? 0);
densityValue.textContent = String(metrics.density ?? 128);

const words = message.split("");
title.innerHTML = "";
words.forEach((char, index) => {
  const span = document.createElement("span");
  span.textContent = char === " " ? "\u00A0" : char;
  span.style.animationDelay = `${index * 35}ms`;
  title.appendChild(span);
});

const particleCanvas = document.createElement("canvas");
particleCanvas.className = "particle-canvas";
particleCanvas.setAttribute("aria-hidden", "true");
particleStage.appendChild(particleCanvas);

const particleCtx = particleCanvas.getContext("2d");
const particles = [];
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

const modes = {
  spark: { name: "spark", colors: ["#7cf7ff", "#ffffff", "#ffe58a"], ambientRate: 0.995, moveBurst: 8, downBurst: 42, clickBurst: 28, scrollBurst: 18, keyBurst: 44, hoverBurst: 24, initialBurst: 140, intensity: 0.75, glow: "high", particleScale: 1 },
  nebula: { name: "nebula", colors: ["#ff8bd4", "#7cf7ff", "#b18cff", "#ffffff"], ambientRate: 0.998, moveBurst: 10, downBurst: 52, clickBurst: 36, scrollBurst: 22, keyBurst: 50, hoverBurst: 28, initialBurst: 180, intensity: 0.95, glow: "ultra", particleScale: 1.15 },
  laser: { name: "laser", colors: ["#7cf7ff", "#00ffd5", "#ffffff", "#ff8bd4"], ambientRate: 0.999, moveBurst: 14, downBurst: 70, clickBurst: 48, scrollBurst: 28, keyBurst: 58, hoverBurst: 36, initialBurst: 220, intensity: 1.15, glow: "maximum", particleScale: 1.35 },
  calm: { name: "calm", colors: ["#7cf7ff", "#ffffff", "#dbe8ff"], ambientRate: 0.985, moveBurst: 3, downBurst: 18, clickBurst: 12, scrollBurst: 8, keyBurst: 20, hoverBurst: 10, initialBurst: 70, intensity: 0.45, glow: "soft", particleScale: 0.85 },
};

let currentMode = modes.spark;
let dpr = Math.max(1, window.devicePixelRatio || 1);
let width = 0;
let height = 0;
let densityVisible = false;

function applyMode(modeName) {
  currentMode = modes[modeName] ?? modes.spark;
  document.documentElement.dataset.mode = currentMode.name;
  statusLabel.textContent = currentMode.name;
  glowLevelEl.textContent = currentMode.glow;
  statusDot.style.background = currentMode.colors[0];
  statusDot.style.boxShadow = `0 0 18px ${currentMode.colors[0]}`;

  controlButtons.forEach((button) => {
    const active = button.dataset.mode === currentMode.name;
    button.classList.toggle("is-active", active);
    if (active) {
      button.classList.remove("secondary");
      button.classList.add("primary");
    } else {
      button.classList.remove("primary");
      button.classList.add("secondary");
    }
  });
}

function toggleDensity() {
  densityVisible = !densityVisible;
  densityPill.classList.toggle("is-hidden", !densityVisible);
}

function resizeCanvas() {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  width = window.innerWidth;
  height = window.innerHeight;
  particleCanvas.width = Math.floor(width * dpr);
  particleCanvas.height = Math.floor(height * dpr);
  particleCanvas.style.width = `${width}px`;
  particleCanvas.style.height = `${height}px`;
  particleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function spawnParticle(x, y, intensity = 1) {
  const angle = Math.random() * Math.PI * 2;
  const speed = (Math.random() * 2.2 + 0.8) * intensity * currentMode.intensity;
  particles.push({
    x,
    y,
    vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.7,
    vy: Math.sin(angle) * speed - Math.random() * 0.5,
    life: 50 + Math.random() * 80,
    age: 0,
    size: (Math.random() * 3 + 1) * currentMode.particleScale,
    color: currentMode.colors[(Math.random() * currentMode.colors.length) | 0],
  });
}

function burst(x, y, amount = 12, intensity = 1) {
  for (let index = 0; index < amount; index += 1) {
    spawnParticle(x, y, intensity);
  }
  particleCountEl.textContent = String(particles.length);
}

function ambientSpray() {
  burst(Math.random() * width, Math.random() * height, 3, 0.45);
}

function animate() {
  particleCtx.clearRect(0, 0, width, height);

  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.age += 1;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.vy += 0.02;

    const progress = particle.age / particle.life;
    const alpha = Math.max(0, 1 - progress);

    if (alpha <= 0) {
      particles.splice(index, 1);
      continue;
    }

    const size = particle.size * (1 + (1 - progress) * 0.8);
    const glowSize = size * 5;

    particleCtx.save();
    particleCtx.globalCompositeOperation = "lighter";
    particleCtx.globalAlpha = alpha;

    const gradient = particleCtx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, glowSize);
    gradient.addColorStop(0, particle.color);
    gradient.addColorStop(0.5, particle.color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    particleCtx.fillStyle = gradient;
    particleCtx.beginPath();
    particleCtx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
    particleCtx.fill();

    particleCtx.fillStyle = "rgba(255, 255, 255, 0.95)";
    particleCtx.beginPath();
    particleCtx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    particleCtx.fill();

    particleCtx.restore();
  }

  if (Math.random() < currentMode.ambientRate) {
    ambientSpray();
  }

  particleCountEl.textContent = String(particles.length);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  burst(pointer.x, pointer.y, currentMode.moveBurst, 0.75);
});

window.addEventListener("pointerdown", (event) => {
  burst(event.clientX, event.clientY, currentMode.downBurst, 1.4);
});

window.addEventListener("click", (event) => {
  burst(event.clientX, event.clientY, currentMode.clickBurst, 1.1);
});

window.addEventListener("scroll", () => {
  burst(Math.random() * width, 60 + Math.random() * Math.max(80, height * 0.18), currentMode.scrollBurst, 0.95);
});

window.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    burst(pointer.x, pointer.y, currentMode.keyBurst, 1.35);
  }
});

document.querySelectorAll(".card, .button").forEach((element) => {
  element.addEventListener("mouseenter", () => {
    const rect = element.getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, currentMode.hoverBurst, 1);
  });
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyMode(button.dataset.mode);
    burst(pointer.x, pointer.y, currentMode.initialBurst / 3, 1.2);
  });
});

revealDensityButton.addEventListener("click", () => {
  toggleDensity();
  burst(pointer.x, pointer.y, 32, 1.1);
});

visitorButton.addEventListener("click", () => {
  visitorCount.textContent = String(Number(visitorCount.textContent || 0) + 1);
  burst(pointer.x, pointer.y, 28, 1.05);
});

resizeCanvas();
applyMode("spark");
burst(pointer.x, pointer.y, currentMode.initialBurst, 1.25);
requestAnimationFrame(animate);
