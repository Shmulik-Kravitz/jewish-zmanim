import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    watch: false,
    // reporters: [''],
    coverage: {
      provider: 'v8',
      enabled: true,
      exclude: [
        '**/node_modules/**',
        '**/*.d.ts',
        '**/dist/**',
        '**/*.config.js',
        '**/*.pnp.cjs',
        '**/*.mjs',
      ],
    },
  },
});
