<template>
  <div class="shell">

    <header class="topbar">
      <span class="brand">Breath Tracker</span>
      <span v-if="phase === 'running'" class="live-dot" aria-label="Session active" />
    </header>

    <div class="content">

      <!-- ── TRACKER pane ── -->
      <div v-if="activeTab === 'tracker'" class="pane tracker-pane">

        <!-- idle -->
        <div v-if="phase === 'idle'" class="phase idle-phase">
          <div class="paw">🐾</div>
          <p class="phase-title">Resting Breath Rate</p>
          <p class="phase-hint">Tap once per breath you observe</p>
          <button class="start-btn" @click="startSession">Start 60 s</button>
        </div>

        <!-- running -->
        <div v-else-if="phase === 'running'" class="phase running-phase">
          <div class="timer-wrap">
            <svg class="timer-ring" viewBox="0 0 100 100" aria-hidden="true">
              <circle class="ring-track" cx="50" cy="50" r="44" />
              <circle class="ring-fill" cx="50" cy="50" r="44"
                :stroke-dasharray="arcLen"
                :stroke-dashoffset="arcOffset" />
            </svg>
            <div class="timer-inner">
              <span class="timer-num">{{ timeRemaining }}</span>
              <span class="timer-unit">sec</span>
            </div>
          </div>

          <div class="count-block">
            <span class="count-num">{{ tapCount }}</span>
            <span class="count-lbl">breaths counted</span>
          </div>

          <button
            class="tap-btn"
            :class="{ 'is-tapping': tapPulse }"
            @click="handleTap"
            @touchstart.prevent="handleTap"
            style="-webkit-tap-highlight-color:transparent"
          >
            <span class="tap-word">TAP</span>
            <span class="tap-sub">each breath</span>
          </button>

          <button class="stop-link" @click="stopEarly">Stop &amp; save early</button>
        </div>

        <!-- result -->
        <div v-else-if="phase === 'result' && lastResult" class="phase result-phase">
          <p class="result-eyebrow">Session complete</p>
          <div class="result-bpm">{{ lastResult.bpm }}</div>
          <p class="result-unit">breaths / min</p>
          <p class="result-detail">{{ lastResult.tapCount }} taps · {{ lastResult.durationSeconds }}s</p>
          <p class="result-status" :class="bpmStatusClass">{{ bpmStatusText }}</p>
          <div class="result-actions">
            <button class="btn-primary" @click="resetToIdle">Done</button>
          </div>
        </div>

      </div>

      <!-- ── HISTORY pane ── -->
      <div v-else-if="activeTab === 'history'" class="pane history-pane">
        <p class="history-title">Past Sessions</p>

        <div v-if="history.length === 0" class="empty-state">
          <span class="empty-icon">🐾</span>
          <p class="empty-msg">No sessions yet</p>
          <p class="empty-sub">Start tracking your pup!</p>
        </div>

        <ul v-else class="entry-list">
          <li v-for="entry in history" :key="entry.id" class="entry-card">
            <div class="entry-info">
              <span class="entry-bpm">{{ entry.bpm }}<em>BPM</em></span>
              <span class="entry-date">{{ formatDate(entry.date) }}</span>
              <span class="entry-meta">{{ entry.tapCount }} taps · {{ entry.durationSeconds }}s</span>
            </div>
            <button class="delete-btn" @click="deleteEntry(entry.id)" aria-label="Delete entry">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>

    </div>

    <!-- ── Bottom navigation ── -->
    <nav class="bottom-nav">
      <button
        class="nav-btn"
        :class="{ active: activeTab === 'tracker' }"
        @click="activeTab = 'tracker'"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2 12 7 12 9 4 11 20 13 12 15 12 17 8 19 12 22 12"/>
        </svg>
        <span class="nav-lbl">Track</span>
      </button>
      <button
        class="nav-btn"
        :class="{ active: activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span class="nav-lbl">History{{ history.length > 0 ? ` (${history.length})` : '' }}</span>
      </button>
    </nav>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBreathTracker } from '~/composables/useBreathTracker'

const activeTab = ref<'tracker' | 'history'>('tracker')

const {
  history,
  loadFromStorage,
  deleteEntry,
  phase,
  tapCount,
  timeRemaining,
  progressPercent,
  lastResult,
  startSession,
  recordTap,
  stopEarly,
  resetToIdle,
} = useBreathTracker()

onMounted(() => loadFromStorage())

const arcLen = 2 * Math.PI * 44
const arcOffset = computed(() => arcLen * (1 - progressPercent.value / 100))

const tapPulse = ref(false)
let _tapTimer: ReturnType<typeof setTimeout> | null = null

function handleTap() {
  recordTap()
  if (_tapTimer) clearTimeout(_tapTimer)
  tapPulse.value = true
  _tapTimer = setTimeout(() => { tapPulse.value = false }, 160)
}


const bpmStatusClass = computed(() => {
  if (!lastResult.value) return ''
  const b = lastResult.value.bpm
  if (b < 10 || b > 40) return 'status-bad'
  if (b < 15 || b > 30) return 'status-warn'
  return 'status-ok'
})

const bpmStatusText = computed(() => {
  if (!lastResult.value) return ''
  const b = lastResult.value.bpm
  if (b < 10) return 'Very low — check measurement or consult vet'
  if (b > 40) return 'Elevated — consult vet if at rest'
  if (b > 30) return 'Slightly elevated — monitor closely'
  if (b < 15) return 'Below normal range'
  return 'Normal resting range (15–30 BPM)'
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
/* ── Shell ── */
.shell {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 0%, #161410 0%, #0e0d0b 65%);
  color: #ede8e0;
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  padding-top: env(safe-area-inset-top, 0px);
}

/* ── Top bar ── */
.topbar {
  flex-shrink: 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.brand {
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #ede8e0;
}

.live-dot {
  position: absolute;
  right: 20px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d4901c;
  animation: blink 1.4s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

/* ── Content ── */
.content {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.pane {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tracker pane centers its phases */
.tracker-pane {
  align-items: center;
  justify-content: center;
}

/* ── Phase wrappers ── */
.phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* ── IDLE ── */
.idle-phase {
  gap: 10px;
  padding: 0 28px;
}

.paw {
  font-size: 54px;
  margin-bottom: 8px;
}

.phase-title {
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  color: #ede8e0;
}

.phase-hint {
  font-size: 14px;
  color: #6b6458;
  text-align: center;
}

.start-btn {
  margin-top: 28px;
  width: 100%;
  max-width: 260px;
  height: 56px;
  border-radius: 18px;
  background: #d4901c;
  color: #0e0d0b;
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: transform 0.08s ease, background 0.12s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.start-btn:active { transform: scale(0.96); background: #b87a15; }

@media (hover: hover) {
  .start-btn:hover { background: #c4841a; }
}

/* ── RUNNING ── */
.running-phase {
  height: 100%;
  justify-content: space-evenly;
  padding: 8px 20px;
}

.timer-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-ring {
  width: 96px;
  height: 96px;
  transform: rotate(-90deg);
}

.ring-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.07);
  stroke-width: 7;
}

.ring-fill {
  fill: none;
  stroke: #d4901c;
  stroke-width: 7;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.25s linear;
}

.timer-inner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.timer-num {
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #ede8e0;
  font-variant-numeric: tabular-nums;
}

.timer-unit {
  font-size: 10px;
  color: #6b6458;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 2px;
}

.count-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.count-num {
  font-family: 'Syne', sans-serif;
  font-size: clamp(60px, 16vw, 80px);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: #ede8e0;
}

.count-lbl {
  font-size: 13px;
  color: #6b6458;
}

/* Tap button */
.tap-btn {
  width: clamp(190px, 52vw, 250px);
  height: clamp(190px, 52vw, 250px);
  border-radius: 50%;
  background: radial-gradient(ellipse at 38% 32%, #252017 0%, #141210 100%);
  border: 2px solid rgba(212, 144, 28, 0.6);
  box-shadow:
    0 0 0 8px rgba(212, 144, 28, 0.04),
    0 0 32px rgba(212, 144, 28, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease;
}

.tap-btn.is-tapping {
  transform: scale(0.93);
  border-color: #d4901c;
  box-shadow:
    0 0 0 14px rgba(212, 144, 28, 0.07),
    0 0 52px rgba(212, 144, 28, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.tap-word {
  font-family: 'Syne', sans-serif;
  font-size: clamp(28px, 7.5vw, 36px);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #ede8e0;
}

.tap-sub {
  font-size: 12px;
  color: #6b6458;
  letter-spacing: 0.04em;
}

.stop-link {
  background: none;
  border: none;
  color: #3d3a35;
  font-size: 13px;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  padding: 8px 20px;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.stop-link:active { color: #6b6458; }

@media (hover: hover) {
  .stop-link:hover { color: #6b6458; }
}

/* ── RESULT ── */
.result-phase {
  gap: 8px;
  padding: 16px 28px;
  height: 100%;
  justify-content: center;
}

.result-eyebrow {
  font-size: 12px;
  color: #6b6458;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 4px;
}

.result-bpm {
  font-family: 'Syne', sans-serif;
  font-size: clamp(88px, 24vw, 112px);
  font-weight: 800;
  line-height: 1;
  color: #d4901c;
  font-variant-numeric: tabular-nums;
}

.result-unit {
  font-size: 18px;
  font-weight: 500;
  color: #ede8e0;
}

.result-detail {
  font-size: 13px;
  color: #6b6458;
  margin-top: 2px;
}

.result-status {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 100px;
  margin-top: 4px;
}

.result-status.status-ok   { color: #61b875; background: rgba(97,184,117,0.1); }
.result-status.status-warn { color: #d4901c; background: rgba(212,144,28,0.1); }
.result-status.status-bad  { color: #e05555; background: rgba(224,85,85,0.1); }

.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary {
  height: 50px;
  padding: 0 28px;
  border-radius: 14px;
  background: #d4901c;
  color: #0e0d0b;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: transform 0.08s ease, background 0.12s;
  -webkit-tap-highlight-color: transparent;
}

.btn-primary:active { transform: scale(0.96); background: #b87a15; }

@media (hover: hover) {
  .btn-primary:hover { background: #c4841a; }
}

.btn-ghost {
  height: 50px;
  padding: 0 28px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  color: #ede8e0;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.08s ease, background 0.12s;
  -webkit-tap-highlight-color: transparent;
}

.btn-ghost:active { transform: scale(0.96); }

@media (hover: hover) {
  .btn-ghost:hover { background: rgba(255, 255, 255, 0.09); }
}

/* ── HISTORY pane ── */
.history-pane {
  padding: 20px 16px 0;
  justify-content: flex-start;
}

.history-title {
  font-family: 'Syne', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #ede8e0;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-bottom: 20px;
}

.empty-icon {
  font-size: 44px;
  opacity: 0.25;
}

.empty-msg {
  font-size: 16px;
  font-weight: 500;
  color: #6b6458;
}

.empty-sub {
  font-size: 13px;
  color: #3d3a35;
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0 0 12px 0;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #181613;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 14px 16px;
  flex-shrink: 0;
}

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.entry-bpm {
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #d4901c;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.entry-bpm em {
  font-family: 'DM Sans', sans-serif;
  font-style: normal;
  font-size: 13px;
  font-weight: 400;
  color: #6b6458;
  margin-left: 4px;
}

.entry-date {
  font-size: 13px;
  color: #6b6458;
}

.entry-meta {
  font-size: 11px;
  color: #3d3a35;
}

.delete-btn {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: none;
  border: none;
  color: #3d3a35;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.delete-btn svg { width: 18px; height: 18px; }

.delete-btn:active { color: #e05555; background: rgba(224,85,85,0.1); }

@media (hover: hover) {
  .delete-btn:hover { color: #e05555; background: rgba(224,85,85,0.1); }
}

/* ── Bottom nav ── */
.bottom-nav {
  flex-shrink: 0;
  display: flex;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: #0e0d0b;
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px);
}

.nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 10px 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #3d3a35;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}

.nav-btn.active { color: #d4901c; }

@media (hover: hover) {
  .nav-btn:hover:not(.active) { color: #6b6458; }
}

.nav-icon { width: 22px; height: 22px; }

.nav-lbl {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
</style>
