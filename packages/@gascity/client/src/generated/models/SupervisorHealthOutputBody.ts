/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SupervisorStartup } from './SupervisorStartup';
export type SupervisorHealthOutputBody = {
    /**
     * Build identity (typically a short git commit hash, with "-dirty" suffix when built from an unclean tree). Empty when unavailable.
     */
    build_id?: string;
    /**
     * Cities currently running.
     */
    cities_running: number;
    /**
     * Total managed cities.
     */
    cities_total: number;
    /**
     * SHA-256 hex digest of the first managed city's packs.lock contents, for single-city deployments (mirrors the startup field's first-city semantics). Drift checkers compare this against the committed lockfile copy. Omitted when no city is registered, the city has no packs.lock, or the lockfile is unreadable (read error logged server-side) — treat absence as unknown, not as proof there is no lockfile.
     */
    packs_lock_sha256?: string;
    /**
     * First-city startup info for single-city deployments.
     */
    startup?: SupervisorStartup;
    /**
     * Health status ("ok").
     */
    status: string;
    /**
     * Supervisor uptime in seconds.
     */
    uptime_sec: number;
    /**
     * Supervisor version.
     */
    version: string;
};

