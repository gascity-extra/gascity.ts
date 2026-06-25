// Ambient declarations for native modules that are dynamically imported in
// runtime code paths but not installed as dev dependencies. TanStack Start
// keeps them external on the SSR bundle.

declare module 'node-pty' {
  export interface IPty {
    onData(cb: (data: string) => void): void
    onExit(cb: (e: { exitCode: number }) => void): void
    write(s: string): void
    resize(cols: number, rows: number): void
    kill(): void
  }
  export function spawn(
    cmd: string,
    args: string[],
    opts: Record<string, unknown>,
  ): IPty
}

declare module 'ws' {
  export interface WebSocket extends globalThis.WebSocket {}
  export const WebSocketServer: unknown
  export const WebSocket: typeof globalThis.WebSocket
}

declare module '*.css'
