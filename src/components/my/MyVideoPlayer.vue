<template>
  <div
    class="my-video-player"
    @mousemove.passive="showControlsTemporarily"
    @keydown.space.prevent="togglePlay"
    @keydown.k.prevent="togglePlay"
    @keydown.f.prevent="toggleFullscreen"
    @keydown.m.prevent="toggleMute"
    tabindex="0"
    ref="containerRef"
  >
    <div class="video-stage" @click="onClick">
      <video
        ref="videoRef"
        :src="src"
        :poster="poster"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @play="onPlay"
        @pause="onPause"
        @volumechange="onVolumeChange"
        @dblclick.prevent="toggleFullscreen"
        @waiting="onWaiting"
        @playing="onPlaying"
        @canplay="onCanPlay"
        @stalled="onStalled"
        playsinline
        preload="metadata"
      ></video>

      <div class="center-overlay" v-if="!isPlaying">
        <my-button class="big-play" type="flat" icon="play_arrow" @click.stop="togglePlay" />
      </div>
      <div v-else-if="isBuffering" class="loader center-overlay">
        <my-spinner size="55px" />
      </div>
    </div>

    <div class="controls" v-show="!controlsHidden" :class="{ hide: !showControls || !playedOnce }">
      <div class="top-row">
        <div class="title">{{ title }}</div>
      </div>

      <div class="progress-row">
        <div class="progress-bar-bg" @click="seekByClick" ref="progressContainerRef">
          <div class="progress-played" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <div class="bottom-row">
        <div class="left">
          <my-button class="play-pause" @click="togglePlay" :icon="isPlaying ? 'pause' : 'play_arrow'" />

          <my-button class="mute" :icon="volumeIcon" @click="toggleMute" />

          <input
            class="volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model.number="volumeLocal"
            @input="onVolumeInput"
            :style="{ '--val': volumeLocal * 100 + '%' }"
          />
          <div class="time">{{ formattedCurrent }} / {{ formattedDuration }}</div>
        </div>

        <div class="right">
          <my-button class="pip" @click="togglePip" :disable="!pipSupported" icon="picture_in_picture" />
          <my-button
            class="fullscreen-btn"
            @click="toggleFullscreen"
            :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from "vue";
import MyButton from "./MyButton.vue";

const MySpinner = defineAsyncComponent(() => import("../my/MySpinner.vue"));

interface Props {
  src: string;
  poster?: string;
  title?: string;
  controlsHidden?: boolean;
}

const props = defineProps<Props>();

const videoRef = ref<HTMLVideoElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const progressContainerRef = ref<HTMLElement | null>(null);

const isPlaying = ref(false);
const duration = ref(0);
const currentTime = ref(0);
const progressPercent = ref(0);
const volume = ref(1);
const volumeLocal = ref(1);
const isMuted = ref(false);
const pipSupported = ref(false);
const hideControlsTimeout = ref<number | null>(null);
const showControls = ref(true);
const isBuffering = ref(true);
const playedOnce = ref(false);

const isFullscreen = ref(false);

watch(isPlaying, (v) => {
  if (v) playedOnce.value = true;
});

const volumeIcon = computed(() => {
  if (isMuted.value || volume.value == 0) return "volume_off";
  if (volume.value < 0.1) return "volume_mute";
  if (volume.value < 0.5) return "volume_down";
  return "volume_up";
});

const title = props.title;
const src = props.src;
const poster = props.poster;
const controlsHidden = props.controlsHidden ?? false;

function onClick() {
  showControlsTemporarily();
  togglePlay();
}

function onWaiting() {
  isBuffering.value = true;
}

function onCanPlay() {
  isBuffering.value = false;
}

function onPlaying() {
  isBuffering.value = false;
}

function onStalled() {
  isBuffering.value = true;
}

function formatTime(t: number): string {
  if (!isFinite(t) || t <= 0) return "0:00";
  const hrs = Math.floor(t / 3600);
  const mins = Math.floor((t % 3600) / 60);
  const secs = Math.floor(t % 60);
  const mm = mins.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");
  return hrs > 0 ? `${hrs}:${mm}:${ss}` : `${mins}:${ss}`;
}

const formattedCurrent = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() => formatTime(duration.value));

function onLoadedMetadata(): void {
  const v = videoRef.value;
  if (!v) return;
  duration.value = v.duration || 0;
  pipSupported.value = !!document.pictureInPictureEnabled && !!v.requestPictureInPicture;
}

function onTimeUpdate(): void {
  const v = videoRef.value;
  if (!v) return;
  currentTime.value = v.currentTime;
  progressPercent.value = duration.value > 0 ? (v.currentTime / duration.value) * 100 : 0;
}

function togglePlay(): void {
  const v = videoRef.value;
  if (!v) return;
  if (v.paused || v.ended) {
    v.play().catch(() => {
      /* ignore play promise rejection (autoplay block) */
    });
  } else {
    v.pause();
  }
}

function onPlay(): void {
  isPlaying.value = true;
}

function onPause(): void {
  isPlaying.value = false;
}

function seekByClick(e: MouseEvent): void {
  const rect = progressContainerRef.value?.getBoundingClientRect();
  const v = videoRef.value;
  if (!rect || !v) return;
  const x = e.clientX - rect.left;
  const pct = Math.min(Math.max(x / rect.width, 0), 1);
  v.currentTime = pct * duration.value;
  onTimeUpdate();
}

function onVolumeInput(): void {
  const v = videoRef.value;
  if (!v) return;
  volume.value = volumeLocal.value;
  v.volume = volume.value;
  isMuted.value = v.volume === 0;
}

function onVolumeChange(): void {
  const v = videoRef.value;
  if (!v) return;
  volume.value = v.volume;
  volumeLocal.value = v.volume;
  isMuted.value = v.muted || v.volume === 0;
}

function toggleMute(): void {
  const v = videoRef.value;
  if (!v) return;
  v.muted = !v.muted;
  isMuted.value = v.muted;
}

async function togglePip(): Promise<void> {
  const v = videoRef.value;
  if (!v) return;
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await v.requestPictureInPicture();
    }
  } catch {
    /* ignore */
  }
}

function toggleFullscreen(): void {
  const el = containerRef.value;
  if (!el) return;
  const doc = document;
  if (!doc.fullscreenElement) {
    el.requestFullscreen?.().catch(() => {});
  } else {
    void doc.exitFullscreen?.();
  }
}

function showControlsTemporarily(): void {
  showControls.value = true;
  scheduleHideControls();
}

function scheduleHideControls(): void {
  if (controlsHidden) return;
  if (hideControlsTimeout.value) clearTimeout(hideControlsTimeout.value);
  hideControlsTimeout.value = window.setTimeout(() => {
    showControls.value = false;
  }, 3500);
}

watch(volumeLocal, (v) => {
  volume.value = v;
  if (videoRef.value) videoRef.value.volume = v;
});

onMounted(() => {
  const v = videoRef.value;
  if (v) {
    v.volume = volume.value;
  }

  showControls.value = false;
  scheduleHideControls();

  // keyboard focus
  containerRef.value?.addEventListener("focus", showControlsTemporarily);
  document.addEventListener("fullscreenchange", fullscreenHandler);
});

onBeforeUnmount(() => {
  if (hideControlsTimeout.value) clearTimeout(hideControlsTimeout.value);

  const video = videoRef.value;
  if (video) {
    video.pause();

    video.removeAttribute("src");
    video.load();

    video.remove();
  }

  containerRef.value?.removeEventListener("focus", showControlsTemporarily);
  document.removeEventListener("fullscreenchange", fullscreenHandler);
});

function fullscreenHandler() {
  isFullscreen.value = document.fullscreenElement == containerRef.value;
}
</script>
