import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { viteObfuscateFile } from 'vite-plugin-obfuscator'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_URL || '/iraqi-tax-system/'
  const isProd = mode === 'production'

  return {
    plugins: [
      react(),
      // ── Code Obfuscation (production only) ─────────────────────────────
      isProd && viteObfuscateFile({
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.5,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.2,
          debugProtection: true,
          debugProtectionInterval: 4000,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          numbersToExpressions: true,
          renameGlobals: false,
          selfDefending: true,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 8,
          stringArray: true,
          stringArrayCallsTransform: true,
          stringArrayEncoding: ['base64'],
          stringArrayIndexShift: true,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayWrappersCount: 2,
          stringArrayWrappersChainedCalls: true,
          stringArrayWrappersParametersMaxCount: 4,
          stringArrayWrappersType: 'function',
          stringArrayThreshold: 0.75,
          transformObjectKeys: false,
          unicodeEscapeSequence: false,
        },
      }),
    ].filter(Boolean),
    base,
    server: {
      port: 5173,
      open: false,
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none',
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 3000,
      minify: 'terser',
      terserOptions: {
        compress: {
          passes: 3,
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.warn', 'console.debug'],
          global_defs: { DEBUG: false },
          dead_code: true,
          unused: true,
        },
        mangle: {
          toplevel: false,
          properties: false,
        },
        format: {
          comments: false,
          ascii_only: false,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            export: ['xlsx', 'jspdf'],
          },
        },
      },
    },
  }
})
