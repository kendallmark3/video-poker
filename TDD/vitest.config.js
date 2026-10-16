import { fileURLToPath } from 'node:url'

export default {
  root: fileURLToPath(new URL('..', import.meta.url)),
  test: {
    include: ['TDD/**/*.test.js'],
    testTimeout: 120_000,
  },
}
