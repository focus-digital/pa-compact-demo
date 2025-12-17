// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/test-setup.ts'],
    globalSetup: ['./tests/test-global-setup.ts'],    
    environment: 'node',
    // Force single-threaded execution for now to keep things simple
    fileParallelism: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },  
})