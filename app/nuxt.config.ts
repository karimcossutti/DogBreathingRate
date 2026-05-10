export default defineNuxtConfig({
  ssr: true,

  modules: [
    '@nuxtjs/tailwindcss',
  ],

  app: {
    head: {
      title: 'Breath Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: "Track your dog's resting breath rate" },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
    },
  },

  compatibilityDate: '2025-05-10',
})
