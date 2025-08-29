<template>
  <q-page class="app-page">
    <div class="wrapper" ref="container">
      <canvas
        ref="canvasRef"
        @mousemove="onMouseMove"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
        @touchstart="onMouseDown"
        @touchend="onTouchEnd"
        @touchmove="onTouchMove"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

// I allow you to steal this code and use it everywhere you want, no credit needed.
// If ever someone will delete it from this project, hope you burn in hell >:3
// Pet pet the cat, it loves it <3
// And don't ever forget to pet it >_<
// I love kitties :3
// Code is a bit messy because I just wanted to get it done fast :D
// Memory to my cat that disappeared one day :(
// By Koeqaife, 2025, with love =^^=

let animationFrameId: number | null = null;
const container = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let mouseX = 200;
let mouseY = 200;
let lastMouseX = 200;
let lastMouseY = 200;
let mouseIsDown = false;

let ctx: CanvasRenderingContext2D | null = null;
let lastTime = performance.now();

let eyeSize = 0.6;
const eyeSizeVelocity = 0.1;

let leftEyeBallHeight = 0.6;
let rightEyeBallHeight = 0.6;
let isBlinking = false;
let blinkTime = 0;
let nextBlinkIn = Math.random() * 4000 + 2000;

let lastPetTime = 0;
let mouseAtCenter = false;

let leftEarAngleOffset = 0;
let rightEarAngleOffset = 0;
let leftEarAngleTarget = 0;
let rightEarAngleTarget = 0;
let leftEarIdleTimer = 0;
let rightEarIdleTimer = 0;

let isPetting = false;

let catX: number | null = null;
let catY: number | null = null;
let catVX = 0;
let catVY = 0;
const petForceFactor = 0.35;
const catDamping = 0.86;
const maxCatSpeed = 4.0;
const returnSpringStrength = 0.04;
const returnDeadzone = 0.5;
const petMoveThreshold = 1.0;
const maxDragForFull = 40;
const earTouchScale = 0.25;
const smallTouchFactor = 0.001;

let whiskerLeftAngleOffset = -0.2;
let whiskerRightAngleOffset = 0.2;
let whiskerLeftAngleTarget = -0.2;
let whiskerRightAngleTarget = 0.2;
let whiskerIdleTimer = 0;

// 0 - >.<, 1 - watching cursor, 2 - watching ur soul ;3
let currentState = 0;

function easeInQuad(t: number): number {
  return t * t;
}

function onMouseDown() {
  mouseIsDown = true;
}

function onMouseUp() {
  mouseIsDown = false;
}

function onMouseMove(e: MouseEvent) {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  mouseAtCenter = false;
}

function onTouchEnd() {
  mouseIsDown = false;
  const centerX = canvasRef.value!.width / 2;
  const centerY = canvasRef.value!.height / 2;
  mouseX = centerX;
  mouseY = centerY;
  mouseAtCenter = true;
}

function onTouchMove(e: TouchEvent) {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  if (e.touches.length > 0) {
    mouseX = e.touches[0]!.clientX - rect.left;
    mouseY = e.touches[0]!.clientY - rect.top;
  }
  mouseAtCenter = false;
}

function drawHead(x: number, y: number, size: number, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#444";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 2.05, size * 1.9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  angleOffset: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + angleOffset);

  ctx.fillStyle = "#444";
  ctx.beginPath();
  ctx.moveTo(-size * 1, -size * 0.05);
  ctx.lineTo(0, -size * 2);
  ctx.lineTo(size * 1, -size * 0.05);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ffeeee";
  size *= 0.7;
  ctx.beginPath();
  ctx.moveTo(-size * 1, -size * 0.05);
  ctx.lineTo(0, -size * 2);
  ctx.lineTo(size * 1, -size * 0.05);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawEye(
  x: number,
  y: number,
  size: number,
  ctx: CanvasRenderingContext2D,
  eyeHeight: number = 0.6,
  angle: number = 0
): number {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const dx = mouseX - x;
  const dy = mouseY - y;

  const dist = Math.sqrt(dx * dx + dy * dy);

  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.9, size * eyeHeight * Math.min(currentState ** 2, 1), 0, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = "#7ddb65";
  ctx.fill();

  const maxDist = size * 0.25;
  const scale = dist > maxDist ? maxDist / dist : 1;

  const pupilWidth = size * eyeSize;
  const pupilHeight = size * 0.5;
  let pupilX = dx * scale;
  let pupilY = dy * scale;
  if (currentState >= 2 || mouseAtCenter) {
    pupilX = 0;
    pupilY = 0;
  }

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.ellipse(pupilX, pupilY, pupilWidth, pupilHeight, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  return dist;
}

function drawCuteEye(x: number, y: number, size: number, isLeft: boolean, ctx: CanvasRenderingContext2D) {
  if (currentState > 0.5) return;
  const t = (0.5 - currentState) / 0.5;
  const yOffset = (size / 2) * t;

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  if (isLeft) {
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x - size, y - yOffset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x - size, y + yOffset);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y - yOffset);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y + yOffset);
    ctx.stroke();
  }
}

function drawNose(x: number, y: number, size: number, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#ff9999";
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x, y + size / 2);
  ctx.closePath();
  ctx.fill();
}

function drawWhiskers(
  x: number,
  y: number,
  size: number,
  ctx: CanvasRenderingContext2D,
  leftOffset: number = 0,
  rightOffset: number = 0
) {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1.5;

  const whiskerLength = size * 1.4;

  for (let i = -1; i <= 1; i++) {
    const offsetY = i * 10;

    ctx.save();
    const leftStartX = x - size;
    ctx.translate(leftStartX, y + offsetY);
    const leftBaseAngle = -0.2 + i * 0.05 + leftOffset;
    ctx.rotate(leftBaseAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-whiskerLength, i * 10 - 30);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const rightStartX = x + size;
    ctx.translate(rightStartX, y + offsetY);
    const rightBaseAngle = 0.2 + i * -0.05 + rightOffset;
    ctx.rotate(rightBaseAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(whiskerLength, i * 10 - 30);
    ctx.stroke();
    ctx.restore();
  }
}

function drawMouth(x: number, y: number, size: number, ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x - size / 2, y + size / 2, size / 2, 0, Math.PI / 2, false);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, Math.PI / 2, Math.PI, false);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI / 2, false);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x - size / 2, y + size / 2, size / 2, Math.PI / 2, Math.PI, false);
  ctx.stroke();
}

function drawCat(ctx: CanvasRenderingContext2D, time: number) {
  ctx.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);

  const deltaTime = Math.min(time - lastTime, 100);
  lastTime = time;

  const canvasCenterX = canvasRef.value!.width / 2;
  const canvasCenterY = canvasRef.value!.height / 2;

  if (catX === null || catY === null) {
    catX = canvasCenterX;
    catY = canvasCenterY;
  }

  const headSize = 75;

  const leftEarX = catX - headSize;
  const rightEarX = catX + headSize;
  const earY = catY - headSize - 5;

  const dx = mouseX - catX;
  const dy = mouseY - catY;
  const dist = Math.hypot(dx, dy);

  const earInfluenceRadius = headSize * 1.5;

  const leftDistToMouse = Math.hypot(mouseX - leftEarX, mouseY - earY);
  const rightDistToMouse = Math.hypot(mouseX - rightEarX, mouseY - earY);

  const dragX = mouseX - lastMouseX;
  const dragY = mouseY - lastMouseY;
  const dragSpeed = Math.hypot(dragX, dragY);

  if (isPetting && mouseIsDown) {
    const isNearBody = Math.hypot(mouseX - catX, mouseY - catY) < headSize * 1.1;
    const isTouchingEarOnly =
      !isNearBody && (leftDistToMouse < earInfluenceRadius || rightDistToMouse < earInfluenceRadius);
    const touchScale = isTouchingEarOnly ? earTouchScale : 1;

    const normalized = Math.max(0, Math.min(1, (dragSpeed - petMoveThreshold) / (maxDragForFull - petMoveThreshold)));
    const powerFromDrag = normalized;
    const tinyTouch = smallTouchFactor * (isNearBody ? 1 : 0.5);
    const petPower = Math.max(powerFromDrag, tinyTouch);

    const forceScale = petForceFactor * petPower * touchScale;

    catVX += dragX * forceScale * (deltaTime / 16.67);
    catVY += dragY * forceScale * (deltaTime / 16.67);
  }

  catVX *= Math.pow(catDamping, deltaTime / 16.67);
  catVY *= Math.pow(catDamping, deltaTime / 16.67);

  const speed = Math.hypot(catVX, catVY);
  if (speed > maxCatSpeed) {
    const s = maxCatSpeed / speed;
    catVX *= s;
    catVY *= s;
  }

  catX += catVX * (deltaTime / 16.67);
  catY += catVY * (deltaTime / 16.67);

  const returnDX = canvasCenterX - catX;
  const returnDY = canvasCenterY - catY;
  const returnDist = Math.hypot(returnDX, returnDY);

  if (!isPetting && returnDist > returnDeadzone) {
    catVX += returnDX * returnSpringStrength * (deltaTime / 16.67);
    catVY += returnDY * returnSpringStrength * (deltaTime / 16.67);
  }

  if (mouseIsDown && leftDistToMouse < earInfluenceRadius) {
    const influenceX = Math.max(-1, Math.min(1, (mouseX - leftEarX) / (headSize * 1.5)));
    leftEarAngleTarget = -0.6 + influenceX * 0.25 + dragX / 120 + dragY / 400;
  } else {
    leftEarIdleTimer += deltaTime;
    const idleSwingLeft = Math.sin(leftEarIdleTimer / 600) * 0.03;
    leftEarAngleTarget = -0.4 + idleSwingLeft;
  }

  if (mouseIsDown && rightDistToMouse < earInfluenceRadius) {
    const influenceX = Math.max(-1, Math.min(1, (mouseX - rightEarX) / (headSize * 1.5)));
    rightEarAngleTarget = 0.6 - influenceX * -0.25 + dragX / 120 + dragY / 400;
  } else {
    rightEarIdleTimer += deltaTime;
    const idleSwingRight = Math.sin(rightEarIdleTimer / 700) * 0.03;
    rightEarAngleTarget = 0.4 + idleSwingRight;
  }

  const earLerpSpeed = 0.18 * (deltaTime / 16.67);
  leftEarAngleOffset += (leftEarAngleTarget - leftEarAngleOffset) * earLerpSpeed;
  rightEarAngleOffset += (rightEarAngleTarget - rightEarAngleOffset) * earLerpSpeed;

  const whiskerBaseY = catY + headSize * 0.7;
  const leftWhiskerBaseX = catX - headSize;
  const rightWhiskerBaseX = catX + headSize;
  const whiskerInfluenceRadius = headSize * 1.1;

  if (mouseIsDown && Math.hypot(mouseX - leftWhiskerBaseX, mouseY - whiskerBaseY) < whiskerInfluenceRadius) {
    const influenceX = Math.max(-1, Math.min(1, (mouseX - leftWhiskerBaseX) / (headSize * 1.3)));
    whiskerLeftAngleTarget = -0.3 + influenceX * 0.45 + dragX / 200 + dragY / 500;
  } else {
    whiskerIdleTimer += deltaTime;
    whiskerLeftAngleTarget = -0.2 + Math.sin(whiskerIdleTimer / 800) * 0.05;
  }

  if (mouseIsDown && Math.hypot(mouseX - rightWhiskerBaseX, mouseY - whiskerBaseY) < whiskerInfluenceRadius) {
    const influenceX = Math.max(-1, Math.min(1, (mouseX - rightWhiskerBaseX) / (headSize * 1.3)));
    whiskerRightAngleTarget = 0.3 + influenceX * 0.45 + dragX / 200 + dragY / 500;
  } else {
    whiskerIdleTimer += deltaTime;
    whiskerRightAngleTarget = 0.2 + Math.sin(whiskerIdleTimer / 900) * 0.05;
  }

  const whiskerLerpSpeed = 0.12 * (deltaTime / 16.67);
  whiskerLeftAngleOffset += (whiskerLeftAngleTarget - whiskerLeftAngleOffset) * whiskerLerpSpeed;
  whiskerRightAngleOffset += (whiskerRightAngleTarget - whiskerRightAngleOffset) * whiskerLerpSpeed;

  drawEar(ctx, leftEarX, earY, headSize * 0.9, 0, Math.max(Math.min(leftEarAngleOffset, -0.35), -2));
  drawEar(ctx, rightEarX, earY, headSize * 0.9, 0, Math.max(Math.min(rightEarAngleOffset, 2), 0.35));

  drawHead(catX, catY, headSize, ctx);

  drawNose(catX, catY + 15, 25, ctx);
  drawMouth(catX, catY + 35, 40, ctx);

  drawWhiskers(catX, catY + headSize * 0.7, headSize, ctx, whiskerLeftAngleOffset, whiskerRightAngleOffset);

  let targetEyeSize: number;
  if ((dist < headSize * 2.2 && !mouseAtCenter) || currentState >= 2) {
    targetEyeSize = 0.6;
  } else {
    targetEyeSize = 0.1;
  }

  if (currentState >= 0.5) {
    eyeSize += (targetEyeSize - eyeSize) * eyeSizeVelocity * (deltaTime / 16.67);
    eyeSize = Math.min(Math.max(eyeSize, 0.1), 0.5);
    let leftEyeSizeChanged = false;
    let rightEyeSizeChanged = false;

    const leftEyeDist = drawEye(catX - 53, catY - 28, 39, ctx, leftEyeBallHeight, 0.07);
    const rightEyeDist = drawEye(catX + 53, catY - 28, 39, ctx, rightEyeBallHeight, -0.07);

    const speedEye = 0.05;
    if (leftEyeDist < 60 && !mouseAtCenter) {
      const targetHeight = 0.1 + (leftEyeDist / 60) * 0.3;
      const diff = leftEyeBallHeight - targetHeight;
      leftEyeBallHeight -= easeInQuad(diff * speedEye * deltaTime);
      leftEyeBallHeight = Math.max(targetHeight, leftEyeBallHeight);
      leftEyeSizeChanged = true;
    }

    if (rightEyeDist < 60 && !mouseAtCenter) {
      const targetHeight = 0.1 + (rightEyeDist / 60) * 0.3;
      const diff = rightEyeBallHeight - targetHeight;
      rightEyeBallHeight -= easeInQuad(diff * speedEye * deltaTime);
      rightEyeBallHeight = Math.max(targetHeight, rightEyeBallHeight);
      rightEyeSizeChanged = true;
    }

    if (isBlinking) {
      blinkTime += deltaTime;
      if (!leftEyeSizeChanged) {
        leftEyeBallHeight = Math.max(0, 0.6 - (blinkTime / 200) * 0.5);
        leftEyeSizeChanged = true;
      }
      if (!rightEyeSizeChanged) {
        rightEyeBallHeight = Math.max(0, 0.6 - (blinkTime / 200) * 0.5);
        rightEyeSizeChanged = true;
      }

      if (blinkTime >= 250) {
        isBlinking = false;
        blinkTime = 0;
        nextBlinkIn = Math.random() * 4000 + 2000;
      }
    } else {
      nextBlinkIn -= deltaTime;
      if (nextBlinkIn <= 0) {
        isBlinking = true;
        blinkTime = 0;
      }
    }

    if (!leftEyeSizeChanged && leftEyeBallHeight < 0.6) {
      leftEyeBallHeight += (0.6 - leftEyeBallHeight) * 0.2 * (deltaTime / 16.67);
      leftEyeBallHeight = Math.min(leftEyeBallHeight, 0.6);
    }
    if (!rightEyeSizeChanged && rightEyeBallHeight < 0.6) {
      rightEyeBallHeight += (0.6 - rightEyeBallHeight) * 0.2 * (deltaTime / 16.67);
      rightEyeBallHeight = Math.min(rightEyeBallHeight, 0.6);
    }
  } else if (currentState < 0.5) {
    drawCuteEye(catX - 53, catY - 28, 30, true, ctx);
    drawCuteEye(catX + 53, catY - 28, 30, false, ctx);
  }

  const dxMove = mouseX - lastMouseX;
  const dyMove = mouseY - lastMouseY;
  const moveDist = Math.sqrt(dxMove * dxMove + dyMove * dyMove);
  lastMouseX = mouseX;
  lastMouseY = mouseY;
  const lastPetDelta = time - lastPetTime;

  if ((moveDist != 0 && mouseIsDown && dist < headSize * 3 && mouseY < catY - 20) || lastPetDelta < 500) {
    currentState += (0 - currentState) * 0.1 * (deltaTime / 16.67);
    currentState = Math.max(currentState, 0);
    isPetting = true;
    if (moveDist != 0 && mouseIsDown && dist < headSize * 3 && mouseY < catY - 20) {
      lastPetTime = time;
    }
  } else {
    isPetting = false;
    if (currentState < 2 && currentState < 1.98) {
      currentState += (2 - currentState) * (currentState < 1 ? 0.05 : 0.005) * (deltaTime / 16.67);
      currentState = Math.min(currentState, 1.98);
    }
    if (currentState >= 1.98 && currentState < 2 && isBlinking) {
      currentState = 1.99;
    }
    if (currentState == 1.99 && !isBlinking) {
      currentState = 2;
    }
  }
}

const resizeCanvas = () => {
  if (canvasRef.value && container.value) {
    canvasRef.value.width = container.value.offsetWidth;
    canvasRef.value.height = container.value.offsetHeight;
    const centerX = canvasRef.value.width / 2;
    const centerY = canvasRef.value.height / 2;
    mouseX = centerX;
    mouseY = centerY;
    mouseAtCenter = true;
  }
};

const animate = (time: number) => {
  if (ctx) drawCat(ctx, time);
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
  nextBlinkIn = Math.random() * 4000 + 2000;
  animationFrameId = requestAnimationFrame(animate);
};

let resizeTimeout: NodeJS.Timeout | null = null;
const onResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }
  resizeTimeout = setTimeout(() => {
    resizeCanvas();
  }, 500);
};

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext("2d");
    resizeCanvas();
    animationFrameId = requestAnimationFrame(animate);
  }

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
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

<style>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: black;
}

canvas {
  background: black;
}
</style>
