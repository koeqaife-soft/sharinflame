<template>
  <div class="particle-background" ref="container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const canvas = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLDivElement | null>(null);

const particles: Particle[] = [];
let ctx: CanvasRenderingContext2D | null = null;
let animationFrameId: number | null = null;
const grid: { [key: string]: Particle[] } = {};
const gridSize = 150;

const visibleParticles: Particle[] = [];

let mouseX = -1000;
let mouseY = -1000;
let mouseMoved = false;
let lastTime = performance.now();

let centerX: number;
let centerY: number;
const speedK = 5;

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  originalX: number;
  originalY: number;
  alpha: number;
  alphaTarget: number;
  theta: number;
  centerRadius: number;
  omega: number;
  threshold: number;
  speedOffset: number;
}

const generateInitialParticles = () => {
  const canvasWidth = canvas.value?.width ?? 0;
  const canvasHeight = canvas.value?.height ?? 0;

  const particlesCount = canvasWidth * 10;

  centerX = canvasWidth * 1.5;
  centerY = canvasHeight;

  const computedStyle = getComputedStyle(document.body);
  const particleColor = computedStyle.getPropertyValue("--on-background").trim();

  particles.length = 0;

  for (let i = 0; i < particlesCount; i++) {
    const maxRadius = Math.max(canvasWidth * 2, canvasHeight);
    const minRadius = canvasWidth / 3;

    const angle = Math.random() * 6.2832;
    const radius = minRadius + Math.sqrt(Math.random()) * (maxRadius - minRadius);

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    const r = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

    const isTooClose = r < minRadius;
    const isTooFar = r > maxRadius * 1.5;

    if (isTooClose || isTooFar) continue;

    const z = Math.random() * 10;
    const size = Math.random() * 2 + 1;
    const threshold = 130 - z;
    const speedOffset = (20 - z * 2) / 40;

    const alpha = Math.random();
    const alphaTarget = Math.random();

    const theta = Math.atan2(y - centerY, x - centerX);

    const omega = speedK / r;

    particles.push({
      x,
      y,
      z,
      size,
      color: particleColor,
      speedX: 0,
      speedY: 0,
      originalX: x,
      originalY: y,
      alpha,
      alphaTarget,
      theta,
      centerRadius: r,
      omega,
      threshold,
      speedOffset
    });
  }
};

const updateParticleColors = () => {
  const computedStyle = getComputedStyle(document.body);
  const newColor = computedStyle.getPropertyValue("--on-background").trim();
  if (particles[0]?.color == newColor) return;
  particles.forEach((particle) => {
    particle.color = newColor;
  });
};

const updateGrid = () => {
  for (const key in grid) grid[key]!.length = 0;
  visibleParticles.length = 0;

  const canvasWidth = canvas.value?.width ?? 0;
  const canvasHeight = canvas.value?.height ?? 0;
  const minX = -5;
  const maxX = canvasWidth + 5;
  const minY = -5;
  const maxY = canvasHeight + 5;

  particles.forEach((p) => {
    if ((p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY) || p.originalX - p.x || p.originalY - p.y) {
      const key = `${Math.floor(p.x / gridSize)},${Math.floor(p.y / gridSize)}`;
      grid[key] = grid[key] || [];
      grid[key].push(p);
      visibleParticles.push(p);
    }
  });
};

const moveParticles = (currentTime: number) => {
  if (!ctx || !canvas.value) return;

  const canvasWidth = canvas.value?.width ?? 0;
  const canvasHeight = canvas.value?.height ?? 0;

  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;

  ctx.clearRect(-5, -5, canvas.value.width + 5, canvas.value.height + 5);

  updateParticleColors();

  if (mouseMoved) {
    const mouseCol = Math.floor(mouseX / gridSize);
    const mouseRow = Math.floor(mouseY / gridSize);
    const cellsToCheck: Particle[] = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const key = `${mouseCol + i},${mouseRow + j}`;
        if (grid[key]) cellsToCheck.push(...grid[key]);
      }
    }

    cellsToCheck.forEach((particle) => {
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distSquared = dx * dx + dy * dy;
      if (distSquared < particle.threshold * particle.threshold) {
        const distance = Math.sqrt(distSquared);
        const angle = Math.atan2(dy, dx);
        const speed = ((particle.threshold - distance) / 100 + particle.speedOffset) * 60;
        particle.speedX += Math.cos(angle + Math.PI) * speed;
        particle.speedY += Math.sin(angle + Math.PI) * speed;
      }
    });
    mouseMoved = false;
  }
  const decayFactor = Math.pow(0.94, 60 * deltaTime);

  ctx.lineCap = "round";
  visibleParticles.forEach((p) => {
    ctx!.globalAlpha = p.alpha;
    ctx!.strokeStyle = p.color;
    ctx!.lineWidth = p.size * 2;
    ctx!.beginPath();
    ctx!.moveTo(p.x, p.y);
    ctx!.lineTo(p.x, p.y);
    ctx!.stroke();

    p.x += p.speedX * deltaTime;
    p.y += p.speedY * deltaTime;

    if (p.speedX || p.speedY) {
      p.speedX *= decayFactor;
      p.speedY *= decayFactor;
    }

    const alphaSpeed = 0.3;
    if (p.alpha < p.alphaTarget) {
      p.alpha = Math.min(p.alpha + alphaSpeed * deltaTime, p.alphaTarget);
    } else if (p.alpha > p.alphaTarget) {
      p.alpha = Math.max(p.alpha - alphaSpeed * deltaTime, p.alphaTarget);
    }

    if (Math.abs(p.alpha - p.alphaTarget) < 0.01) {
      if (p.alphaTarget > 0) {
        p.alphaTarget = 0;
      } else {
        p.x = p.originalX;
        p.y = p.originalY;
        p.speedX = 0;
        p.speedY = 0;
        p.alphaTarget = Math.random() * 0.4 + 0.6;
      }
    }
  });
  particles.forEach((p) => {
    if (Math.abs(p.x - p.originalX) < 0.1 && Math.abs(p.y - p.originalY) < 0.1) {
      p.theta += p.omega * deltaTime;
      p.x = p.originalX = canvasWidth * 1.5 + p.centerRadius * Math.cos(p.theta);
      p.y = p.originalY = canvasHeight + p.centerRadius * Math.sin(p.theta);
    }
  });

  updateGrid();
};

const onMouseMove = (event: MouseEvent) => {
  if (!canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
  mouseMoved = true;
};

const resizeCanvas = () => {
  if (canvas.value && container.value) {
    canvas.value.width = container.value.offsetWidth;
    canvas.value.height = container.value.offsetHeight;
  }
};

const animate = (time: number) => {
  moveParticles(time);
  animationFrameId = requestAnimationFrame(animate);
};

const onBlur = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
};

const onFocus = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(animate);
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext("2d");
    resizeCanvas();
    generateInitialParticles();
    updateGrid();
    animationFrameId = requestAnimationFrame(animate);
  }

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("focus", onFocus, { passive: true });
  window.addEventListener("blur", onBlur, { passive: true });
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("focus", onFocus);
  window.removeEventListener("blur", onBlur);
});
</script>

<style scoped>
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: var(--background);
  z-index: -1;
  pointer-events: none;
}
canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
