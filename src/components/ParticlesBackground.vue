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
const gridSize = 125;

let mouseX = -1000;
let mouseY = -1000;
let mouseMoved = false;

interface Particle {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  speedX: number;
  speedY: number;
  originalX: number;
  originalY: number;
  alpha: number;
  alphaTarget: number;
  threshold: number;
  speedOffset: number;
}

const generateInitialParticles = () => {
  const numLayers = 5;
  const particlesPerLayer = [50, 100, 150, 300, 350];
  const canvasWidth = canvas.value?.width || 0;
  const canvasHeight = canvas.value?.height || 0;

  const computedStyle = getComputedStyle(document.body);
  const particleColor = computedStyle.getPropertyValue("--on-background").trim();

  const generateWaveLayer = (numParticles: number, layerIndex: number) => {
    const layerHeight = canvasHeight / numLayers;
    const yOffset = layerHeight * layerIndex;

    for (let i = 0; i < numParticles; i++) {
      let x: number;
      let y: number;
      let radius: number;
      let isOverlapping;

      do {
        x = Math.random() * canvasWidth;
        y = Math.random() * layerHeight + yOffset;
        radius = Math.random() * (2 + layerIndex / 2) + 1;

        isOverlapping = particles.some((particle) => {
          const dx = particle.x - x;
          const dy = particle.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < particle.radius + radius;
        });
      } while (isOverlapping);

      const alpha = Math.random();
      const alphaTarget = Math.random();
      const z = Math.random() * 10;
      const threshold = 120 + (10 - z);
      const speedOffset = (20 - z * 2) / 40;

      particles.push({
        x,
        y,
        z,
        radius,
        color: particleColor,
        speedX: 0,
        speedY: 0,
        originalX: x,
        originalY: y,
        alpha,
        alphaTarget,
        threshold,
        speedOffset
      });
    }
  };

  for (let layerIndex = 0; layerIndex < numLayers; layerIndex++) {
    generateWaveLayer(particlesPerLayer[layerIndex]!, layerIndex);
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
  Object.keys(grid).forEach((key) => (grid[key]!.length = 0));
  particles.forEach((particle) => {
    const col = Math.floor(particle.x / gridSize);
    const row = Math.floor(particle.y / gridSize);
    const key = `${col},${row}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(particle);
  });
};

const moveParticles = () => {
  if (!ctx || !canvas.value) return;

  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);

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
        const speed = (particle.threshold - distance) / 100 + particle.speedOffset;
        particle.speedX += Math.cos(angle + Math.PI) * speed;
        particle.speedY += Math.sin(angle + Math.PI) * speed;
      }
    });
    mouseMoved = false;
  }

  ctx.lineCap = "round";
  particles.forEach((particle) => {
    ctx!.globalAlpha = particle.alpha;
    ctx!.strokeStyle = particle.color;
    ctx!.lineWidth = particle.radius * 2;
    ctx!.beginPath();
    ctx!.moveTo(particle.x, particle.y);
    ctx!.lineTo(particle.x, particle.y);
    ctx!.stroke();

    particle.x += particle.z / 100;
    particle.originalX += particle.z / 100;
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    const speed = Math.sqrt(particle.speedX * particle.speedX + particle.speedY * particle.speedY);
    const decayFactor = 0.94;

    if (speed > 0) {
      const decay = speed * decayFactor;
      particle.speedX *= decay / speed;
      particle.speedY *= decay / speed;
    }

    if (particle.alpha < particle.alphaTarget) {
      particle.alpha += 0.005;
    } else if (particle.alpha > particle.alphaTarget) {
      particle.alpha -= 0.005;
    }

    if (Math.abs(particle.alpha - particle.alphaTarget) < 0.01) {
      if (particle.alphaTarget > 0) {
        particle.alphaTarget = 0;
      } else {
        particle.x = particle.originalX;
        particle.y = particle.originalY;
        particle.speedX = 0;
        particle.speedY = 0;
        particle.alphaTarget = Math.random() * 0.4 + 0.6;
      }
    }

    if (particle.x < 0 || particle.x > canvas.value!.width || particle.y < 0 || particle.y > canvas.value!.height) {
      particle.alphaTarget = 0;
      particle.alpha = 0;
      particle.speedX = 0;
      particle.speedY = 0;
      particle.x = particle.originalX;
      particle.y = particle.originalY;
    }

    if (particle.originalX > canvas.value!.width) {
      particle.originalX = 0;
    }
    if (particle.originalX < 0) {
      particle.x = canvas.value!.width;
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

const animate = () => {
  moveParticles();
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
  animate();
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext("2d");
    resizeCanvas();
    generateInitialParticles();
    updateGrid();
    animate();
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
