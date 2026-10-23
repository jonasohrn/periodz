import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config.js'

// Extend the base vitest config to exclude Performance.test.ts for Stryker mutation testing
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [...configDefaults.exclude, '**/Performance.test.ts']
    }
  })
)
