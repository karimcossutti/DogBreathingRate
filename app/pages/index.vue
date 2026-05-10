<template>
  <div class="min-h-screen bg-slate-900 text-white flex flex-col">

    <!-- Header -->
    <header class="px-4 py-4 flex items-center justify-between bg-slate-800 shadow-md">
      <h1 class="text-xl font-bold tracking-tight">Breath Tracker</h1>
      <nav class="flex gap-2">
        <button
          @click="activeTab = 'tracker'"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            activeTab === 'tracker'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
          ]"
        >
          Track
        </button>
        <button
          @click="activeTab = 'history'"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
          ]"
        >
          History ({{ history.length }})
        </button>
      </nav>
    </header>

    <!-- TRACKER TAB -->
    <main
      v-if="activeTab === 'tracker'"
      class="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8"
    >

      <!-- IDLE -->
      <template v-if="phase === 'idle'">
        <div class="text-center space-y-3">
          <p class="text-5xl">🐶</p>
          <p class="text-slate-300 text-lg font-medium">Resting breath rate</p>
          <p class="text-slate-500 text-sm">Tap once for each breath you observe</p>
        </div>
        <button
          @click="startSession"
          class="w-64 h-16 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-2xl text-xl font-bold shadow-lg transition-colors select-none"
        >
          Start 60s Session
        </button>
      </template>

      <!-- RUNNING -->
      <template v-else-if="phase === 'running'">
        <!-- Countdown ring -->
        <div class="relative flex items-center justify-center">
          <svg class="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" stroke-width="10" />
            <circle
              cx="60" cy="60" r="52"
              fill="none"
              stroke="#3b82f6"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="circumference"
              :stroke-dashoffset="dashOffset"
              class="transition-all duration-200"
            />
          </svg>
          <div class="absolute text-center">
            <div class="text-4xl font-mono font-bold">{{ timeRemaining }}</div>
            <div class="text-slate-400 text-xs uppercase tracking-widest">seconds</div>
          </div>
        </div>

        <!-- Tap count -->
        <div class="text-center">
          <div class="text-7xl font-bold tabular-nums">{{ tapCount }}</div>
          <div class="text-slate-400 mt-1">breaths counted</div>
        </div>

        <!-- Large tap button -->
        <button
          @click="recordTap"
          @touchstart.prevent="recordTap"
          class="w-72 h-72 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 active:bg-blue-700
                 shadow-2xl text-2xl font-bold transition-transform duration-75 select-none
                 flex flex-col items-center justify-center touch-none"
          style="-webkit-tap-highlight-color: transparent;"
        >
          <span class="text-3xl font-black">TAP</span>
          <span class="text-base font-normal text-blue-200 mt-1">for each breath</span>
        </button>

        <button
          @click="stopEarly"
          class="text-slate-500 hover:text-slate-300 text-sm underline underline-offset-2 transition-colors"
        >
          Stop early &amp; save
        </button>
      </template>

      <!-- RESULT -->
      <template v-else-if="phase === 'result' && lastResult">
        <div class="text-center space-y-2">
          <p class="text-slate-400 text-sm uppercase tracking-widest">Session saved</p>
          <div class="text-8xl font-bold text-blue-400 tabular-nums">{{ lastResult.bpm }}</div>
          <p class="text-2xl text-slate-300">breaths per minute</p>
        </div>
        <div class="text-center space-y-1">
          <p class="text-slate-500 text-sm">
            {{ lastResult.tapCount }} taps in {{ lastResult.durationSeconds }}s
          </p>
          <p :class="bpmStatusClass" class="text-sm font-semibold">{{ bpmStatusText }}</p>
        </div>
        <div class="flex gap-4">
          <button
            @click="startSession"
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
          >
            New Session
          </button>
          <button
            @click="() => { resetToIdle(); activeTab = 'history' }"
            class="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
          >
            View History
          </button>
        </div>
      </template>

    </main>

    <!-- HISTORY TAB -->
    <main
      v-else-if="activeTab === 'history'"
      class="flex-1 flex flex-col px-4 py-6 gap-4 max-w-lg mx-auto w-full"
    >
      <h2 class="text-lg font-semibold text-slate-300">Past Sessions</h2>

      <p v-if="history.length === 0" class="text-slate-500 text-center py-16">
        No sessions recorded yet.<br>Go track a breath!
      </p>

      <ul v-else class="flex flex-col gap-3">
        <li
          v-for="entry in history"
          :key="entry.id"
          class="bg-slate-800 rounded-2xl px-4 py-4 flex items-center justify-between gap-4 shadow"
        >
          <div>
            <div class="text-2xl font-bold tabular-nums text-blue-400">
              {{ entry.bpm }}
              <span class="text-base font-normal text-slate-400">BPM</span>
            </div>
            <div class="text-slate-400 text-sm mt-0.5">{{ formatDate(entry.date) }}</div>
            <div class="text-slate-600 text-xs mt-0.5">
              {{ entry.tapCount }} taps &middot; {{ entry.durationSeconds }}s
            </div>
          </div>
          <button
            @click="deleteEntry(entry.id)"
            class="text-slate-600 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-700 shrink-0"
            aria-label="Delete entry"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </li>
      </ul>
    </main>

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

onMounted(() => {
  loadFromStorage()
})

const circumference = 2 * Math.PI * 52
const dashOffset = computed(
  () => circumference - (progressPercent.value / 100) * circumference
)

const bpmStatusClass = computed(() => {
  if (!lastResult.value) return ''
  const bpm = lastResult.value.bpm
  if (bpm < 10 || bpm > 40) return 'text-red-400'
  if (bpm < 15 || bpm > 30) return 'text-yellow-400'
  return 'text-green-400'
})

const bpmStatusText = computed(() => {
  if (!lastResult.value) return ''
  const bpm = lastResult.value.bpm
  if (bpm < 10) return 'Very low — check measurement or consult vet'
  if (bpm > 40) return 'Elevated — consult vet if at rest'
  if (bpm > 30) return 'Slightly elevated — monitor closely'
  if (bpm < 15) return 'Below normal range'
  return 'Normal resting range (15–30 BPM)'
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>
