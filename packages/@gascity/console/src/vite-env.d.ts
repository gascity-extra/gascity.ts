// Ambient declarations for native modules that are dynamically imported in
// runtime code paths. Both `@homebridge/node-pty-prebuilt-multiarch` and `ws`
// ARE installed as dependencies (see package.json), so we forward to their
// real types via `import type` re-exports rather than shadowing with the DOM
// `WebSocket`. The prior declaration re-exported `globalThis.WebSocket`,
// which broke `.on("message", ...)` because the DOM WebSocket is an
// `addEventListener`-based class — not an EventEmitter.
//
// IMPORTANT: keep this file a *script* (no top-level imports/exports) so the
// `declare module` blocks remain global ambient declarations and the wildcard
// `declare module '*.css'` keeps matching CSS side-effect imports.

declare module '@homebridge/node-pty-prebuilt-multiarch' {
  export type IPty = import('@homebridge/node-pty-prebuilt-multiarch').IPty
  export const spawn: typeof import('@homebridge/node-pty-prebuilt-multiarch').spawn
  export default import('@homebridge/node-pty-prebuilt-multiarch')
}

declare module 'node-pty' {
  export type IPty = import('@homebridge/node-pty-prebuilt-multiarch').IPty
  export const spawn: typeof import('@homebridge/node-pty-prebuilt-multiarch').spawn
  // Some dependencies still import `node-pty` directly. Re-export under
  // that name so bare-specifier imports keep working.
  export default import('@homebridge/node-pty-prebuilt-multiarch')
}

declare module 'ws' {
  export type WebSocket = import('ws').WebSocket
  export const WebSocketServer: typeof import('ws').WebSocketServer
}

declare module '*.css'
