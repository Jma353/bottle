import { defineConfig } from 'tsdown'

export const config = defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  platform: 'browser',
  dts: true,
  clean: true,
})
