import { ref, computed, onUnmounted } from 'vue'

export interface BreathEntry {
  id: string
  date: string
  bpm: number
  tapCount: number
  durationSeconds: number
}

const STORAGE_KEY = 'breath-tracker-history'
const SESSION_DURATION = 60

function loadHistory(): BreathEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as BreathEntry[]) : []
  } catch {
    return []
  }
}

function saveHistory(entries: BreathEntry[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useBreathTracker() {
  const history = ref<BreathEntry[]>([])

  function loadFromStorage() {
    history.value = loadHistory()
  }

  function deleteEntry(id: string) {
    history.value = history.value.filter((e) => e.id !== id)
    saveHistory(history.value)
  }

  type SessionPhase = 'idle' | 'running' | 'result'

  const phase = ref<SessionPhase>('idle')
  const tapCount = ref(0)
  const timeRemaining = ref(SESSION_DURATION)
  const lastResult = ref<BreathEntry | null>(null)

  let timerInterval: ReturnType<typeof setInterval> | null = null
  let sessionStartTime = 0

  const progressPercent = computed(
    () => ((SESSION_DURATION - timeRemaining.value) / SESSION_DURATION) * 100
  )

  function startSession() {
    tapCount.value = 0
    timeRemaining.value = SESSION_DURATION
    lastResult.value = null
    sessionStartTime = Date.now()
    phase.value = 'running'

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
      timeRemaining.value = Math.max(0, SESSION_DURATION - elapsed)
      if (timeRemaining.value === 0) {
        _finishSession()
      }
    }, 250)
  }

  function recordTap() {
    if (phase.value !== 'running') return
    tapCount.value++
  }

  function stopEarly() {
    if (phase.value !== 'running') return
    _finishSession()
  }

  function generateId(): string {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2)
  }

  function _finishSession() {
    if (phase.value !== 'running') return

    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    const elapsed = Math.min(
      SESSION_DURATION,
      Math.floor((Date.now() - sessionStartTime) / 1000)
    )
    const durationSeconds = elapsed === 0 ? 1 : elapsed

    const bpm = Math.round((tapCount.value / durationSeconds) * 60)

    const entry: BreathEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      bpm,
      tapCount: tapCount.value,
      durationSeconds,
    }

    lastResult.value = entry
    phase.value = 'result'

    if (tapCount.value > 0) {
      history.value = [entry, ...history.value]
      saveHistory(history.value)
    }
  }

  function resetToIdle() {
    phase.value = 'idle'
    lastResult.value = null
  }

  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval)
  })

  return {
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
  }
}
