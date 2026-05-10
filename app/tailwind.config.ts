import type { Config } from 'tailwindcss'

export default {
  content: [
    './app.vue',
    './pages/**/*.vue',
    './composables/**/*.ts',
    './components/**/*.vue',
  ],
} satisfies Config
