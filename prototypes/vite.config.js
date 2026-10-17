import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Prototypes isolés : plusieurs pages HTML, vocab.json lu en lecture seule depuis ../src/data
export default defineConfig({
  server: { fs: { allow: ['..'] } },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        stt: resolve(import.meta.dirname, 'stt-test/index.html'),
        tts: resolve(import.meta.dirname, 'tts-test/index.html'),
        race: resolve(import.meta.dirname, 'race-perf/index.html'),
      },
    },
  },
})
