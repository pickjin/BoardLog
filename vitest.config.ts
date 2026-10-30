import { defineConfig } from 'vitest/config';

// Pure-function rules live in src/utils and run in plain Node. Coverage is a merge gate only for the
// rules whose mistakes lose or leak data (D-030); everything else is reported without blocking.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/utils/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        'src/utils/sharedPlay.ts': { branches: 100 },
        'src/utils/backupImport.ts': { branches: 100 }
      }
    }
  }
});
