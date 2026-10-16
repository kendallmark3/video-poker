import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // The adversarial suite in TDD/ runs separately: npm run test:tdd
    exclude: [...configDefaults.exclude, 'TDD/**'],
  },
})
