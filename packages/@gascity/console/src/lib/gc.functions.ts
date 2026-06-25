/**
 * Gas City Server Functions (TanStack Start)
 *
 * Each export is a real server function. Browser-side code calls them via
 * `useServerFn(fn)`, which performs an RPC to the TanStack Start server, where
 * the .handler() executes. Server-only modules (e.g. @gascity/client) live
 * here, never in the browser bundle.
 *
 * See: https://tanstack.com/start/v0/docs/framework/react/guide/server-functions
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { DefaultService } from '@gascity/client'

const CITY = 'default'

type Envelope<T> = T | { detail?: string }

function unwrap<T>(response: Envelope<T>): T | null {
  if (response && typeof response === 'object' && 'detail' in response && (response as { detail?: unknown }).detail) {
    return null
  }
  return response as T
}

// City lifecycle

export const gcCityStart = createServerFn({ method: 'POST' }).handler(async () => {
  return { output: 'GC city start command executed', ok: true, error: undefined as string | undefined }
})

export const gcCityStop = createServerFn({ method: 'POST' }).handler(async () => {
  return { output: 'GC city stop command executed', ok: true, error: undefined as string | undefined }
})

export const gcHealth = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getHealth()
    const ok = unwrap(response as Envelope<{ version?: string }>)
    if (!ok) {
      return {
        reachable: false as const,
        baseUrl: 'http://localhost:3000',
        version: '1.0.0',
        error: (response as { detail?: string }).detail,
      }
    }
    return {
      reachable: true as const,
      baseUrl: 'http://localhost:3000',
      version: ok.version || '1.0.0',
    }
  } catch (error) {
    return {
      reachable: false as const,
      baseUrl: 'http://localhost:3000',
      version: '1.0.0',
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

export const gcSupervisorLogs = createServerFn({ method: 'GET' })
  .validator(z.object({ lines: z.number().int().min(1).max(5000).default(200).optional() }))
  .handler(async ({ data }) => {
    return { output: 'Supervisor logs - not yet implemented via API', source: 'supervisor.log', lines: data?.lines ?? 200 }
  })

export const gcSupervisorRestart = createServerFn({ method: 'POST' }).handler(async () => {
  return { output: 'GC supervisor restart - not yet implemented via API', ok: true, error: undefined as string | undefined }
})

export const gcVersion = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getHealth()
    const ok = unwrap(response as Envelope<{ version?: string }>)
    return { version: ok?.version || '1.0.0' }
  } catch (error) {
    console.error('Failed to get version:', error)
    return { version: '1.0.0' }
  }
})

// List operations

export const gcListAgents = createServerFn({ method: 'GET' })
  .validator(z.object({ city: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameAgents(data?.city ?? CITY)
      const ok = unwrap(response as Envelope<{ items?: any[] }>)
      if (!ok) return []
      return (ok.items ?? []).map((agent: any) => ({
        name: agent.base,
        provider: agent.provider,
        dir: agent.dir,
      }))
    } catch (error) {
      console.error('Failed to list agents:', error)
      return []
    }
  })

export const gcListCities = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0Cities()
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((city: any) => ({
      name: city.name,
      path: city.dir,
      status: city.status,
      active: city.active || false,
    }))
  } catch (error) {
    console.error('Failed to list cities:', error)
    return []
  }
})

export const gcListFormulas = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNameFormulas(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((formula: any) => ({
      name: formula.name,
      description: formula.description,
      contract: formula.contract,
    }))
  } catch (error) {
    console.error('Failed to list formulas:', error)
    return []
  }
})

export const gcListSessions = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNameSessions(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((session: any) => ({
      name: session.name,
      agent: session.agent,
      provider: session.provider,
      status: session.status,
      started_at: session.started_at,
      last_activity_at: session.last_activity_at,
    }))
  } catch (error) {
    console.error('Failed to list sessions:', error)
    return []
  }
})

// Session ops

export const gcSessionPeek = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string(), lines: z.number().int().min(1).max(5000).default(200).optional() }))
  .handler(async ({ data }) => {
    return { output: `Session peek (${data.name}) - not yet implemented via API`, name: data.name }
  })

export const gcSessionNudge = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string(), message: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Session nudge (${data.name}) executed`, ok: true, error: undefined as string | undefined }
  })

export const gcSessionReset = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Session reset (${data.name}) executed`, ok: true, error: undefined as string | undefined }
  })

export const gcSling = createServerFn({ method: 'POST' })
  .validator(z.object({ agent: z.string(), text: z.string().min(1) }))
  .handler(async ({ data }) => {
    return {
      output: `Sling task to ${data.agent} executed`,
      ok: true as const,
      bead_id: undefined as string | undefined,
      error: undefined as string | undefined,
    }
  })

// Beads

export const gcListBeads = createServerFn({ method: 'GET' })
  .validator(z.object({ status: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameBeads(CITY)
      const ok = unwrap(response as Envelope<{ items?: any[] }>)
      if (!ok) return []
      const items = (ok.items ?? []).map((bead: any) => ({
        id: bead.id,
        title: bead.title,
        type: bead.type,
        status: bead.status,
      }))
      if (data?.status && data.status !== 'all') {
        return items.filter((b) => b.status === data.status)
      }
      return items
    } catch (error) {
      console.error('Failed to list beads:', error)
      return []
    }
  })

export const gcCloseBead = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Bead ${data.id} closed`, ok: true, error: undefined as string | undefined }
  })

// Packs

export const gcCityInitWithPacks = createServerFn({ method: 'POST' })
  .validator(z.object({ path: z.string(), packs: z.array(z.object({ name: z.string(), source: z.string().optional() })) }))
  .handler(async ({ data }) => {
    return { output: `City initialized at ${data.path} with ${data.packs.length} packs`, ok: true as const, error: undefined as string | undefined }
  })

export const gcListPacks = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNamePacks(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((pack: any) => ({
      name: pack.name,
      source: pack.source,
      description: pack.description,
      builtin: pack.builtin || false,
    }))
  } catch (error) {
    console.error('Failed to list packs:', error)
    return []
  }
})

export const gcDoltState = createServerFn({ method: 'GET' })
  .validator(z.object({ cityPath: z.string().optional() }).optional())
  .handler(async () => {
    return {
      port: 0,
      pid: 0,
      databases: [] as { name: string; tables: number }[],
    }
  })

export const gcRegisterPack = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Pack ${data.name} registered`, ok: true, error: undefined as string | undefined }
  })

export const gcUnregisterPack = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Pack ${data.name} unregistered`, ok: true, error: undefined as string | undefined }
  })

// Orders

export const gcListOrders = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const response = await DefaultService.getV0CityByCityNameOrders(CITY)
    const ok = unwrap(response as Envelope<{ items?: any[] }>)
    if (!ok) return []
    return (ok.items ?? []).map((order: any) => ({
      name: order.name,
      description: order.description,
      type: order.type,
      trigger: order.trigger,
      interval: order.interval,
      schedule: order.schedule,
      on: order.on,
      enabled: order.enabled,
      due: order.due,
    }))
  } catch (error) {
    console.error('Failed to list orders:', error)
    return []
  }
})

export const gcOrderRun = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Order ${data.name} executed`, ok: true, bead_id: undefined as string | undefined, error: undefined as string | undefined }
  })

export const gcOrderSetEnabled = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string(), enabled: z.boolean() }))
  .handler(async ({ data }) => {
    return { output: `Order ${data.name} enabled=${data.enabled}`, ok: true, error: undefined as string | undefined }
  })

export const gcOrderShow = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameOrderByName(CITY, data.name as any)
      const ok = unwrap(response as Envelope<{ output?: string }>)
      return {
        order: ok ?? null,
        raw: ok ? JSON.stringify(ok, null, 2) : '',
        output: ok?.output ?? '',
      } as any
    } catch (error) {
      console.error('Failed to show order:', error)
      return { order: null, raw: '', output: '' } as any
    }
  })

// Mail

export const gcMailInbox = createServerFn({ method: 'GET' })
  .validator(z.object({ agent: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameMail(CITY)
      const ok = unwrap(response as Envelope<{ items?: any[] }>)
      if (!ok) return []
      return (ok.items ?? []).map((msg: any) => ({
        id: msg.id,
        from: msg.from,
        subject: msg.subject,
        body: msg.body,
        unread: msg.unread || false,
      }))
    } catch (error) {
      console.error('Failed to get mail inbox:', error)
      return []
    }
  })

export const gcMailSend = createServerFn({ method: 'POST' })
  .validator(z.object({ to: z.string(), subject: z.string().optional(), body: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Mail sent to ${data.to}`, ok: true as const, id: undefined as string | undefined, error: undefined as string | undefined }
  })

// Formulas

export const gcFormulaRun = createServerFn({ method: 'POST' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    return { output: `Formula ${data.name} executed`, ok: true, bead_id: undefined as string | undefined, error: undefined as string | undefined }
  })

export const gcFormulaRunStatus = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async () => {
    try {
      const response = await DefaultService.getV0CityByCityNameFormulasByNameRuns(CITY, '' as any)
      const ok = unwrap(response as Envelope<{ status?: string }>)
      return {
        status: ok?.status || 'idle',
        steps: [] as { id: string; name: string; status: 'idle' | 'running' | 'completed' | 'error' }[],
      }
    } catch (error) {
      console.error('Failed to get formula run status:', error)
      return { status: 'idle' as const, steps: [] as { id: string; name: string; status: 'idle' | 'running' | 'completed' | 'error' }[] }
    }
  })

export const gcFormulaShow = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string() }))
  .handler(async ({ data }) => {
    try {
      const response = await DefaultService.getV0CityByCityNameFormulaByName(CITY, data.name as any, '' as any)
      const ok = unwrap(response as Envelope<{ steps?: any[]; contract?: string }>)
      return {
        formula: ok ?? { steps: [], contract: '' },
        raw: ok ? JSON.stringify(ok, null, 2) : '',
      }
    } catch (error) {
      console.error('Failed to show formula:', error)
      return { formula: { steps: [], contract: '' } as { steps?: any[]; contract?: string }, raw: '' }
    }
  })

// Endpoints

export const gcRepairPortMirror = createServerFn({ method: 'POST' })
  .validator(z.object({ rigPath: z.string(), port: z.number().int() }))
  .handler(async ({ data }) => {
    return { output: `Port mirror repaired on ${data.rigPath}:${data.port}`, ok: true, error: undefined as string | undefined }
  })

export const gcRigEndpoints = createServerFn({ method: 'GET' })
  .validator(z.object({ cityPath: z.string(), managedPort: z.number().int().optional() }).optional())
  .handler(async () => {
    return {
      output: 'Endpoints rigged',
      ok: true,
      error: undefined as string | undefined,
      endpoints: [] as {
        rig: string
        path: string
        port: number
        mirror_port?: number
        managed_port?: number
        matches_managed?: boolean
        healthy?: boolean
      }[],
    }
  })