import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import { tmuxWebSocketPlugin } from './vite/pty-websocket'

// Workaround for "Duplicate declaration \"hot\"" in dev: with
// addHmr: false set above, the router-plugin still emits a
// `TSRSplitComponent` reference inside an `if (import.meta.hot)`
// bookkeeping block whose declaration has been removed. We strip
// the orphaned reference so the route compiles cleanly.
const stripSplitHmrBookkeeping = () => ({
  name: 'gascity-strip-split-hmr-bookkeeping',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!id.includes('/routes/')) return null
    let out = code
    // Drop the HMR `import.meta.hot.data["..."] = TSRSplitComponent` line.
    // NOSONAR: HMR-specific regex, acceptable for dev-only code
    out = out.replace(
      /^\s*\(import\.meta\.hot\.data\s*\?\?=\s*\{\}\)\[[^\]]+\]\s*=\s*TSRSplitComponent;?\s*$/gm,
      '',
    )
    // Drop the `TSRSplitComponent = (props) => ...` definition block.
    out = out.replace(
      /^[ \t]*TSRSplitComponent\s*=[^;]+;?\s*$/gm,
      '',
    )
    return out === code ? null : { code: out, map: null }
  },
})

export default defineConfig({
  plugins: [
    tanstackStart({
      // SSR enabled by default; the dev server handles both client and server.
      // The /api/pty WebSocket is served by `tmuxWebSocketPlugin` below; this
      // file route is reduced to a probe/health endpoint.
    }),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      codeSplittingOptions: {
        // Suppress the code-splitter's route-HMR statement insertion
        // (the `const hot = import.meta.hot` block it appends to every
        // route). When combined with @vitejs/plugin-react's HMR preamble,
        // Babel sees the same `hot` binding declared twice and throws
        // "Duplicate declaration \"hot\"" in dev. A full page reload on
        // route change is acceptable for this local console.
        addHmr: false,
      },
    }),
    react(),
    tailwindcss(),
    tmuxWebSocketPlugin(),
    stripSplitHmrBookkeeping(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // The prebuilt fork is preferred; the canonical `node-pty` is fallback.
      // Resolving both to the same module keeps `import 'node-pty'` working
      // in user code while preferring a no-compile-install path.
      'node-pty': '@homebridge/node-pty-prebuilt-multiarch',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/gc': {
        target: process.env.GC_API_BASE_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8372',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    exclude: ['node-pty', '@homebridge/node-pty-prebuilt-multiarch', 'ws'],
  },
  ssr: {
    external: ['node-pty', '@homebridge/node-pty-prebuilt-multiarch', 'ws'],
  },
  build: {
    rollupOptions: {
      external: ['node-pty', '@homebridge/node-pty-prebuilt-multiarch', 'ws'],
    },
  },
})