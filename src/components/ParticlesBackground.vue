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
}

const generateInitialParticles = () => {
  const numLayers = 5;
  const particlesPerLayer = [50, 100, 150, 300, 350];
  const canvasWidth = canvas.value?.width || 0;
  const canvasHeight = canvas.value?.height || 0;

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
      const color = "#ffffffee";

      particles.push({
        x,
        y,
        z,
        radius,
        color,
        speedX: 0,
        speedY: 0,
        originalX: x,
        originalY: y,
        alpha,
        alphaTarget
      });
    }
  };

  for (let layerIndex = 0; layerIndex < numLayers; layerIndex++) {
    generateWaveLayer(particlesPerLayer[layerIndex]!, layerIndex);
  }
};

const moveParticles = () => {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.value?.width || 0, canvas.value?.height || 0);

  particles.forEach((particle) => {
    ctx!.beginPath();
    ctx!.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx!.fillStyle = particle.color;
    ctx!.globalAlpha = particle.alpha;
    ctx!.fill();
    ctx!.closePath();

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
};

const onMouseMove = (event: MouseEvent) => {
  if (!canvas.value) return;

  const rect = canvas.value.getBoundingClientRect();
  const offsetX = event.clientX - rect.left;
  const offsetY = event.clientY - rect.top;

  particles.forEach((particle) => {
    const dx = offsetX - particle.x;
    const dy = offsetY - particle.y;
    const z = particle.z;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 120 + (10 - z)) {
      const angle = Math.atan2(dy, dx);
      const speed = (120 + (10 - z) - distance) / 100 + (20 - z * 2) / 40;
      particle.speedX += Math.cos(angle + Math.PI) * speed;
      particle.speedY += Math.sin(angle + Math.PI) * speed;
    }
  });
};

const resizeCanvas = () => {
  if (canvas.value && container.value) {
    canvas.value.width = container.value.offsetWidth;
    canvas.value.height = container.value.offsetHeight;
  }
};

onMounted(() => {
  if (canvas.value) {
    ctx = canvas.value.getContext("2d");
    resizeCanvas();
    generateInitialParticles();
    const animate = () => {
      moveParticles();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
  }

  window.addEventListener("mousemove", onMouseMove);
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  window.removeEventListener("mousemove", onMouseMove);
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
  background-color: #000;
  z-index: -1;
  pointer-events: none;
}
canvas {
  position: absolute;
  top: 0;
  left: 0;
}
</style>
