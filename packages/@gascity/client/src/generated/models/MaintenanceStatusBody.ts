/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MaintenanceRunBody } from './MaintenanceRunBody';
export type MaintenanceStatusBody = {
    /**
     * Whether [maintenance.dolt] enabled=true in city.toml.
     */
    enabled: boolean;
    /**
     * Bounded ring of recent run outcomes (oldest first).
     */
    history: any[] | null;
    /**
     * True when a maintenance cycle is currently running.
     */
    in_flight: boolean;
    /**
     * RFC3339 start time of the in-flight run.
     */
    in_flight_start?: string;
    /**
     * Configured scheduling interval in seconds (0 when disabled).
     */
    interval_seconds: number;
    /**
     * Most recent completed run, or null when none.
     */
    last_run?: MaintenanceRunBody;
    /**
     * RFC3339 approximate next scheduled run time.
     */
    next_scheduled?: string;
};

