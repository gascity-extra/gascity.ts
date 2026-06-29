import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ExternalLink,
  GitFork,
  LoaderCircle,
  Plus,
  RotateCw,
  Trash2,
} from "lucide-react";
import clsx from "clsx";

import { AppShell } from "@/components/AppShell";
import {
  gcAddRegistry,
  gcCheckPackUpdates,
  gcInstallMarketplaceEntry,
  gcListMarketplaceEntries,
  gcListRegistries,
  gcRefreshRegistries,
  gcRemoveRegistry,
  gcUnregisterPack,
  gcUpdateAllPacks,
  gcUpdatePack,
  type MarketplaceEntry,
  type PackUpdateInfo,
  type RegistrySummary,
} from "@/lib/gc.functions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace — gc console" }] }),
  component: MarketplacePage,
});

type SortKey = "name" | "installed" | "version"
type Tab = "browse" | "installed"

const TAG_LABELS: Record<string, string> = {
  methodology: "build methodology",
  slack: "slack adapter",
  discord: "discord",
  github: "github intake",
  runtime: "runtime",
  support: "support",
  "agent-context": "agent context",
  contributor: "contributor",
  other: "other",
}

function MarketplacePage() {
  const listFn = useServerFn(gcListMarketplaceEntries);
  const listRegistriesFn = useServerFn(gcListRegistries);
  const installFn = useServerFn(gcInstallMarketplaceEntry);
  const uninstallFn = useServerFn(gcUnregisterPack);
  const addRegistryFn = useServerFn(gcAddRegistry);
  const removeRegistryFn = useServerFn(gcRemoveRegistry);
  const refreshRegistriesFn = useServerFn(gcRefreshRegistries);
  const checkUpdatesFn = useServerFn(gcCheckPackUpdates);
  const updateOneFn = useServerFn(gcUpdatePack);
  const updateAllFn = useServerFn(gcUpdateAllPacks);
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("browse");
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [registryFilter, setRegistryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<MarketplaceEntry | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Add-registry form state.
  const [registryFormOpen, setRegistryFormOpen] = useState(false);
  const [newRegistryName, setNewRegistryName] = useState("");
  const [newRegistrySource, setNewRegistrySource] = useState("");

  const marketplace = useQuery({
    queryKey: ["gc", "marketplace", registryFilter],
    queryFn: () =>
      listFn({
        data: registryFilter === "all" ? undefined : { registry: registryFilter },
      }),
    staleTime: 30_000,
  });

  const registries = useQuery({
    queryKey: ["gc", "registries"],
    queryFn: () => listRegistriesFn({ data: undefined }),
    staleTime: 30_000,
  });

  const updates = useQuery({
    queryKey: ["gc", "marketplace", "updates"],
    queryFn: () => checkUpdatesFn({ data: undefined }),
    staleTime: 30_000,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["gc", "marketplace"] })
    qc.invalidateQueries({ queryKey: ["gc", "registries"] })
    qc.invalidateQueries({ queryKey: ["gc", "marketplace", "updates"] })
  }

  const installMut = useMutation({
    mutationFn: (input: { name: string; source: string; version?: string }) =>
      installFn({ data: input }),
    onSuccess: (r: { ok: boolean; output: string; error?: string }) => {
      if (r.ok) {
        setGlobalError(null)
        setFeedback(r.output)
        invalidateAll()
      } else {
        setGlobalError(r.error ?? r.output ?? "install failed")
        setFeedback(null)
      }
    },
    onError: (e) => setGlobalError(e instanceof Error ? e.message : String(e)),
  })

  const uninstallMut = useMutation({
    mutationFn: (name: string) => uninstallFn({ data: { name } }),
    onSuccess: (r: { ok: boolean; output: string; error?: string }) => {
      if (r.ok) {
        setGlobalError(null)
        setFeedback(r.output)
        invalidateAll()
      } else {
        setGlobalError(r.error ?? r.output ?? "uninstall failed")
      }
    },
    onError: (e) => setGlobalError(e instanceof Error ? e.message : String(e)),
  })

  const addRegistryMut = useMutation({
    mutationFn: (input: { name: string; source: string }) =>
      addRegistryFn({ data: input }),
    onSuccess: (r: { ok: boolean; output: string; error?: string }) => {
      if (r.ok) {
        setGlobalError(null)
        setFeedback(r.output)
        setNewRegistryName("")
        setNewRegistrySource("")
        setRegistryFormOpen(false)
        invalidateAll()
      } else {
        setGlobalError(r.error ?? r.output ?? "add registry failed")
      }
    },
    onError: (e) => setGlobalError(e instanceof Error ? e.message : String(e)),
  })

  const removeRegistryMut = useMutation({
    mutationFn: (name: string) => removeRegistryFn({ data: { name } }),
    onSuccess: (r: { ok: boolean; output: string; error?: string }) => {
      if (!r.ok) {
        setGlobalError(r.error ?? r.output ?? "remove registry failed")
      } else {
        setGlobalError(null)
        setFeedback(r.output)
        invalidateAll()
      }
    },
    onError: (e) => setGlobalError(e instanceof Error ? e.message : String(e)),
  })

  const refreshRegistryMut = useMutation({
    mutationFn: (name?: string) =>
      name ? refreshRegistriesFn({ data: { name } }) : refreshRegistriesFn({ data: {} }),
    onSuccess: (r: { ok: boolean; output: string; error?: string }) => {
      if (!r.ok) {
        setGlobalError(r.error ?? r.output ?? "refresh failed")
      } else {
        setGlobalError(null)
        setFeedback(r.output)
        invalidateAll()
      }
    },
    onError: (e) => setGlobalError(e instanceof Error ? e.message : String(e)),
  })

  const updateOneMut = useMutation({
    mutationFn: (name: string) => updateOneFn({ data: { name } }),
    onSuccess: (r: { ok: boolean; output: string; error?: string }) => {
      if (r.ok) {
        setGlobalError(null)
        setFeedback(r.output)
        invalidateAll()
      } else {
        setGlobalError(r.error ?? r.output ?? "update failed")
      }
    },
    onError: (e) => setGlobalError(e instanceof Error ? e.message : String(e)),
  })

  const updateAllMut = useMutation({
    mutationFn: () => updateAllFn({ data: undefined }),
    onSuccess: (r: { ok: boolean; output: string; error?: string }) => {
      if (r.ok) {
        setGlobalError(null)
        setFeedback(r.output)
        invalidateAll()
      } else {
        setGlobalError(r.error ?? r.output ?? "update all failed")
      }
    },
    onError: (e) => setGlobalError(e instanceof Error ? e.message : String(e)),
  })

  const entries = marketplace.data?.entries ?? []
  const registryMeta = marketplace.data?.registries ?? []
  const installedNames = useMemo(
    () => new Set(entries.filter((e) => e.installed).map((e) => e.name)),
    [entries],
  )

  const tagsInUse = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) set.add(e.tag)
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [entries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = entries
    if (tagFilter !== "all") list = list.filter((e) => e.tag === tagFilter)
    if (q.length > 0) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q),
      )
    }
    list = [...list]
    list.sort((a, b) => {
      if (sort === "installed") {
        if (a.installed !== b.installed) return a.installed ? -1 : 1
      }
      if (sort === "version") {
        const av = a.latestVersion ?? ""
        const bv = b.latestVersion ?? ""
        if (av !== bv) return bv.localeCompare(av)
      }
      return a.name.localeCompare(b.name)
    })
    return list
  }, [entries, search, tagFilter, sort])

  const installedList: PackUpdateInfo[] = updates.data?.updates ?? []
  const updateAvailableCount = updates.data?.availableCount ?? 0

  return (
    <AppShell>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-3">
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="shrink-0 font-mono text-sm">marketplace</h1>
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {registryMeta.length} registries · {entries.length} packs ·{" "}
              {installedNames.size} installed
            </span>
          </div>
          <div className="flex items-center gap-2">
            {marketplace.isFetching && (
              <span className="font-mono text-[11px] text-muted-foreground">
                refreshing…
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                invalidateAll()
                refreshRegistryMut.mutate(undefined)
              }}
              disabled={marketplace.isFetching}
              className="font-mono text-[11px]"
            >
              refresh
            </Button>
          </div>
        </div>

        {/* Tab strip */}
        <div className="flex items-center gap-1 border-b border-border px-6 py-1.5">
          <TabButton active={tab === "browse"} onClick={() => setTab("browse")}>
            browse
            <span className="ml-1.5 text-muted-foreground">{entries.length}</span>
          </TabButton>
          <TabButton active={tab === "installed"} onClick={() => setTab("installed")}>
            installed
            <span className="ml-1.5 text-muted-foreground">{installedList.length}</span>
            {" "}
            {updateAvailableCount > 0 && (
              <Badge variant="default" className="ml-2 font-mono text-[10px]">
                {updateAvailableCount} update{updateAvailableCount === 1 ? "" : "s"}
              </Badge>
            )}
          </TabButton>
        </div>

        {/* Status bar */}
        {(globalError || feedback) && (
          <div
            className={clsx(
              "border-b border-border px-6 py-1.5 font-mono text-[11px]",
              globalError ? "text-red-500" : "text-foreground",
            )}
          >
            {globalError ?? feedback}
          </div>
        )}

        {/* Browse tab */}
        {tab === "browse" && (
          <>
            <RegistriesStrip
              registries={registries.data?.registries ?? []}
              registryMeta={registryMeta}
              activeFilter={registryFilter}
              onFilter={(name) => {
                setRegistryFilter(name)
                setTab("browse")
              }}
              onRefresh={(name) => refreshRegistryMut.mutate(name)}
              onRemove={(name) => removeRegistryMut.mutate(name)}
              onAddClick={() => setRegistryFormOpen(true)}
              isPending={refreshRegistryMut.isPending || removeRegistryMut.isPending}
            />
            <BrowseToolbar
              search={search}
              onSearch={setSearch}
              tagFilter={tagFilter}
              onTagFilter={setTagFilter}
              tags={tagsInUse}
              totalCount={entries.length}
              sort={sort}
              onSort={setSort}
            />
            <div className="flex-1 overflow-y-auto p-6">
              {marketplace.isLoading && (
                <div className="font-mono text-xs text-muted-foreground">
                  loading marketplace…
                </div>
              )}
              {marketplace.error && (
                <div className="font-mono text-xs text-red-500">
                  failed to load marketplace: {String(marketplace.error)}
                </div>
              )}
              {!marketplace.isLoading && !marketplace.error && filtered.length === 0 && (
                <div className="font-mono text-xs text-muted-foreground">
                  {entries.length === 0
                    ? "no registries returned any packs."
                    : "no packs match the current filters."}
                </div>
              )}
              <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((entry) => (
                  <BrowseCard
                    key={`${entry.registryName}/${entry.name}`}
                    entry={entry}
                    isPending={
                      installMut.isPending &&
                      installMut.variables?.name === entry.name
                    }
                    onInstall={() =>
                      installMut.mutate({
                        name: entry.name,
                        source: entry.source,
                        version: entry.latestVersion,
                      })
                    }
                    onUninstall={() => uninstallMut.mutate(entry.name)}
                    onOpenDetails={() => setSelected(entry)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Installed tab */}
        {tab === "installed" && (
          <InstalledView
            installed={installedList}
            isLoading={updates.isLoading}
            updateOnePending={updateOneMut.isPending}
            updateOneVars={updateOneMut.variables}
            updateAllPending={updateAllMut.isPending}
            uninstallPending={uninstallMut.isPending}
            uninstallVars={uninstallMut.variables}
            availableCount={updateAvailableCount}
            onUninstall={(name) => uninstallMut.mutate(name)}
            onUpdate={(name) => updateOneMut.mutate(name)}
            onUpdateAll={() => updateAllMut.mutate()}
          />
        )}
      </div>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl border-border bg-card">
          {selected && <PackDetails entry={selected} onClose={() => setSelected(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={registryFormOpen} onOpenChange={setRegistryFormOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="font-mono text-base">add registry</DialogTitle>
            <DialogDescription className="font-mono text-[11px] text-muted-foreground">
              A registry is a catalog URL (typically a raw registry.toml on GitHub).
              Add your own to mirror upstream packs or expose internal catalogs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={newRegistryName}
              onChange={(e) => setNewRegistryName(e.target.value)}
              placeholder="name (e.g. internal)"
              className="font-mono text-xs"
            />
            <Input
              value={newRegistrySource}
              onChange={(e) => setNewRegistrySource(e.target.value)}
              placeholder="https://example.com/path/to/registry.toml"
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegistryFormOpen(false)}
              className="font-mono text-xs"
            >
              cancel
            </Button>
            <Button
              size="sm"
              disabled={
                !newRegistryName.trim() ||
                !newRegistrySource.trim() ||
                addRegistryMut.isPending
              }
              onClick={() =>
                addRegistryMut.mutate({
                  name: newRegistryName.trim(),
                  source: newRegistrySource.trim(),
                })
              }
              className="font-mono text-xs"
            >
              {addRegistryMut.isPending ? "adding…" : "add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  readonly active: boolean
  readonly onClick: () => void
  readonly children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex items-center rounded px-3 py-1 font-mono text-xs",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function RegistriesStrip({
  registries,
  registryMeta,
  activeFilter,
  onFilter,
  onRefresh,
  onRemove,
  onAddClick,
  isPending,
}: {
  registries: RegistrySummary[]
  registryMeta: Array<{ name: string; stale: boolean; error?: string; fetchedAt: string }>
  activeFilter: string
  onFilter: (name: string) => void
  onRefresh: (name?: string) => void
  onRemove: (name: string) => void
  onAddClick: () => void
  isPending: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-2.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        registries
      </span>
      <RegistryChip
        active={activeFilter === "all"}
        onClick={() => onFilter("all")}
        label="all"
      />
      {registries.map((r) => {
        const meta = registryMeta.find((m) => m.name === r.name)
        return (
          <RegistryChip
            key={r.name}
            active={activeFilter === r.name}
            onClick={() => onFilter(r.name)}
            label={r.name}
            stale={meta?.stale}
            error={meta?.error}
            onRefresh={() => onRefresh(r.name)}
            onRemove={
              registries.length > 1 ? () => onRemove(r.name) : undefined
            }
            isPending={isPending}
          />
        )
      })}
      <Button
        variant="outline"
        size="sm"
        onClick={onAddClick}
        className="h-6 font-mono text-[11px]"
      >
        + add registry
      </Button>
    </div>
  )
}

function RegistryChip({
  active,
  onClick,
  label,
  stale,
  error,
  onRefresh,
  onRemove,
  isPending,
}: {
  readonly active: boolean
  readonly onClick: () => void
  readonly label: string
  readonly stale?: boolean
  readonly error?: string
  readonly onRefresh?: () => void
  readonly onRemove?: () => void
  readonly isPending?: boolean
}) {
  return (
    <div
      className={clsx(
        "group flex max-w-full items-center gap-1 rounded border px-2 py-0.5 font-mono text-[11px]",
        active
          ? "border-foreground bg-foreground text-background"
          : error
            ? "border-red-500/40 text-red-500"
            : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 max-w-[16ch] truncate px-0.5"
        title={label}
      >
        {label}
      </button>
      {stale && !error && (
        <span
          className="text-[9px] uppercase tracking-wider opacity-70"
          title="serving cached data"
        >
          stale
        </span>
      )}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isPending}
          className="px-1 opacity-60 hover:opacity-100 disabled:opacity-30"
          title={error ? `error: ${error}` : "refresh"}
        >
          ↻
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isPending}
          className="px-1 opacity-60 hover:opacity-100 disabled:opacity-30"
          title="remove registry"
        >
          ×
        </button>
      )}
    </div>
  )
}

function BrowseToolbar({
  search,
  onSearch,
  tagFilter,
  onTagFilter,
  tags,
  totalCount,
  sort,
  onSort,
}: Readonly<{
  search: string
  onSearch: (v: string) => void
  tagFilter: string
  onTagFilter: (v: string) => void
  tags: string[]
  totalCount: number
  sort: SortKey
  onSort: (v: SortKey) => void
}>) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-6 py-2.5">
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="search packs…"
        className="h-8 w-56 font-mono text-xs"
      />
      <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
        <span>tag:</span>
        <select
          value={tagFilter}
          onChange={(e) => onTagFilter(e.target.value)}
          className="rounded border border-border bg-background px-2 py-1 font-mono text-xs"
        >
          <option value="all">all ({totalCount})</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {TAG_LABELS[t] ?? t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
        <span>sort:</span>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
          className="rounded border border-border bg-background px-2 py-1 font-mono text-xs"
        >
          <option value="name">name</option>
          <option value="version">version (newest)</option>
          <option value="installed">installed first</option>
        </select>
      </div>
    </div>
  )
}

function BrowseCard({
  entry,
  isPending,
  onInstall,
  onUninstall,
  onOpenDetails,
}: {
  readonly entry: MarketplaceEntry
  readonly isPending: boolean
  readonly onInstall: () => void
  readonly onUninstall: () => void
  readonly onOpenDetails: () => void
}) {
  const tagLabel = TAG_LABELS[entry.tag] ?? entry.tag
  return (
    <Card data-testid={`pack-card-${entry.name}`} className="relative flex h-full min-w-0 flex-col gap-0 overflow-hidden border-border bg-card py-0">
      {/* Top-right corner cluster: source icon + install/uninstall
          action. Both live outside the clickable body so they
          remain real interactive elements (anchors/buttons, not
          nested-inside-button). */}
      <div className="absolute right-2 top-1.5 z-10 flex shrink-0 items-center gap-1.5">
        <a
          href={entry.source}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          title={`open source: ${entry.source}`}
        >
          <ExternalLink className="h-3 w-3" />
        </a>
        {entry.installed ? (
          <Button
            variant="outline"
            size="icon"
            disabled={isPending}
            onClick={onUninstall}
            className="h-6 w-6 shrink-0"
            title="uninstall this pack"
            aria-label="uninstall this pack"
          >
            {isPending ? (
              <LoaderCircle className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            disabled={isPending}
            onClick={onInstall}
            className="h-6 w-6 shrink-0"
            title="install this pack"
            aria-label="install this pack"
          >
            {isPending ? (
              <LoaderCircle className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenDetails}
        className="flex min-w-0 flex-1 flex-col items-start gap-1 rounded-t-xl px-4 pb-3 pt-3 text-left hover:bg-muted/40"
      >
        <CardHeader className="min-w-0 space-y-0 p-0 pr-20">
          {/* pr-20 reserves room for [source] [install] (~78px +
              margins) in the corner cluster. */}
          <CardTitle
            className="min-w-0 truncate font-mono text-sm"
            title={entry.name}
          >
            {entry.name}
          </CardTitle>
          <div className="flex min-w-0 flex-wrap items-center gap-1 pt-0.5">
            <Badge
              variant="secondary"
              className="font-mono text-[10px] normal-case tracking-normal"
            >
              {tagLabel}
            </Badge>
            {entry.tier !== undefined && (
              <Badge
                variant="outline"
                className="font-mono text-[10px] normal-case tracking-normal"
              >
                tier {entry.tier}
              </Badge>
            )}
            {entry.latestVersion && (
              <span className="font-mono text-[10px] text-muted-foreground">
                v{entry.latestVersion}
              </span>
            )}
            <span
              className="min-w-0 truncate font-mono text-[10px] text-muted-foreground/70"
              title={entry.registryName}
            >
              · {entry.registryName}
            </span>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 flex-1 p-0">
          <CardDescription className="line-clamp-3 min-w-0 break-words font-mono text-[11px] leading-snug">
            {entry.description ?? (
              <span className="italic text-muted-foreground/70">no description</span>
            )}
          </CardDescription>
        </CardContent>
      </button>
    </Card>
  )
}

function InstalledView({
  installed,
  isLoading,
  updateOnePending,
  updateOneVars,
  updateAllPending,
  uninstallPending,
  uninstallVars,
  availableCount,
  onUninstall,
  onUpdate,
  onUpdateAll,
}: {
  readonly installed: PackUpdateInfo[]
  readonly isLoading: boolean
  readonly updateOnePending: boolean
  readonly updateOneVars: unknown
  readonly updateAllPending: boolean
  readonly uninstallPending: boolean
  readonly uninstallVars: unknown
  readonly availableCount: number
  readonly onUninstall: (name: string) => void
  readonly onUpdate: (name: string) => void
  readonly onUpdateAll: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {isLoading && (
        <div className="font-mono text-xs text-muted-foreground">checking for updates…</div>
      )}
      {!isLoading && installed.length === 0 && (
        <div className="font-mono text-xs text-muted-foreground">
          no packs installed yet. switch to the browse tab to install one.
        </div>
      )}
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {installed.map((info) => (
          <InstalledCard
            key={info.name}
            info={info}
            isUpdatePending={
              updateOnePending &&
              (updateOneVars as { name?: string } | undefined)?.name === info.name
            }
            isUninstallPending={
              uninstallPending &&
              uninstallVars === info.name
            }
            onUpdate={() => onUpdate(info.name)}
            onUninstall={() => onUninstall(info.name)}
          />
        ))}
      </div>
      {availableCount > 0 && (
        <div className="sticky bottom-4 mt-6 flex justify-end">
          <Button
            size="lg"
            onClick={onUpdateAll}
            disabled={updateAllPending}
            className="font-mono text-xs shadow-lg"
          >
            {updateAllPending
              ? "updating all…"
              : `update all (${availableCount})`}
          </Button>
        </div>
      )}
    </div>
  )
}

function InstalledCard({
  info,
  isUpdatePending,
  isUninstallPending,
  onUpdate,
  onUninstall,
}: {
  readonly info: PackUpdateInfo
  readonly isUpdatePending: boolean
  readonly isUninstallPending: boolean
  readonly onUpdate: () => void
  readonly onUninstall: () => void
}) {
  const statusBadge = (() => {
    if (info.status === "update_available") {
      return (
        <Badge variant="default" className="font-mono text-[10px] uppercase tracking-wider">
          update available
        </Badge>
      )
    }
    if (info.status === "not_in_catalog") {
      return (
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
          direct install
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
        up to date
      </Badge>
    )
  })()
  return (
    <Card data-testid={`installed-card-${info.name}`} className="relative flex h-full min-w-0 flex-col gap-0 overflow-hidden border-border bg-card py-0">
      {/* Top-right corner cluster: action buttons + source icon. */}
      <div className="absolute right-2 top-1.5 z-10 flex shrink-0 items-center gap-1.5">
        {info.status === "update_available" && (
          <Button
            size="icon"
            onClick={onUpdate}
            disabled={isUpdatePending}
            className="h-6 w-6 shrink-0"
            title="update this pack"
            aria-label="update this pack"
          >
            {isUpdatePending ? (
              <LoaderCircle className="h-3 w-3 animate-spin" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={onUninstall}
          disabled={isUninstallPending}
          className="h-6 w-6 shrink-0 disabled:opacity-50"
          title="uninstall this pack"
          aria-label="uninstall this pack"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {info.installedSource && (
          <a
            href={info.installedSource}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            title={`open source: ${info.installedSource}`}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1 px-4 pb-3 pt-3">
        <CardHeader className="min-w-0 space-y-0 p-0 pr-32">
          {/* pr-32 reserves room for the [update?] [uninstall] [source]
              corner cluster. */}
          <CardTitle
            className="min-w-0 truncate font-mono text-sm"
            title={info.name}
          >
            {info.name}
          </CardTitle>
          <div className="flex min-w-0 flex-wrap items-center gap-1 pt-0.5 font-mono text-[10px] text-muted-foreground">
            {info.registryName && (
              <span className="min-w-0 truncate" title={`from ${info.registryName}`}>
                from {info.registryName}
              </span>
            )}
            {info.installedRef && (
              <span className="min-w-0 truncate">
                · ref {info.installedRef.slice(0, 12)}
                {info.installedRef.length > 12 ? "…" : ""}
              </span>
            )}
          </div>
          {/* Status badge moved here so it always sits below the
              title row — the corner cluster above is reserved for
              interactive actions. */}
          <div className="pt-1">{statusBadge}</div>
        </CardHeader>
        <CardContent className="min-w-0 flex-1 space-y-0.5 p-0 font-mono text-[11px] leading-snug text-muted-foreground">
          {info.status === "update_available" && info.latestVersion && (
            <div>latest version: v{info.latestVersion}</div>
          )}
          {info.latestRef && info.latestRef !== info.installedRef && (
            <div className="break-all">latest ref: {info.latestRef.slice(0, 12)}…</div>
          )}
          {info.status === "not_in_catalog" && (
            <div className="italic">not published in any configured registry.</div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

function PackDetails({
  entry,
  onClose,
}: Readonly<{
  entry: MarketplaceEntry
  onClose: () => void
}>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="break-all font-mono text-base">{entry.name}</DialogTitle>
        <DialogDescription className="font-mono text-xs text-muted-foreground">
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
            {entry.tag !== "other" && (
              <span>{TAG_LABELS[entry.tag] ?? entry.tag}</span>
            )}
            {entry.latestVersion && <span>v{entry.latestVersion}</span>}
            <span>
              registry <code className="break-all">{entry.registryName}</code>
            </span>
            <span>{entry.installed ? "installed" : "not installed"}</span>
          </span>
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 font-mono text-xs">
        {entry.description && (
          <p className="break-words leading-relaxed text-foreground/90">
            {entry.description}
          </p>
        )}
        {entry.latestCommit && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              latest commit
            </div>
            <span className="break-all text-foreground/90">{entry.latestCommit}</span>
          </div>
        )}
        {entry.installedRef && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              installed ref
            </div>
            <span className="break-all text-foreground/90">{entry.installedRef}</span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={entry.source}
            target="_blank"
            rel="noopener noreferrer"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " font-mono text-[11px]"
            }
            title={entry.source}
          >
            <ExternalLink className="mr-1 inline h-3 w-3" />
            source
          </a>
          {entry.readmeUrl !== entry.source && (
            <a
              href={entry.readmeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={
                buttonVariants({ variant: "outline", size: "sm" }) +
                " font-mono text-[11px]"
              }
            >
              <GitFork className="mr-1 inline h-3 w-3" />
              readme
            </a>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} className="font-mono text-xs">
          close
        </Button>
      </DialogFooter>
    </>
  )
}
