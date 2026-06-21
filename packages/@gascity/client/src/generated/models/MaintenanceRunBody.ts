/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MaintenanceRunBody = {
    /**
     * Store size in bytes after the run (0 when not measured).
     */
    after_bytes: number;
    /**
     * Store size in bytes before the run (0 when not measured).
     */
    before_bytes: number;
    /**
     * Elapsed wall-clock seconds between started_at and finished_at.
     */
    duration_s: number;
    /**
     * Error message when Stage names a failing phase; empty on success.
     */
    err?: string;
    /**
     * RFC3339 timestamp when the run completed.
     */
    finished_at: string;
    /**
     * Absolute path to the snapshot directory created for this run.
     */
    snapshot_path?: string;
    /**
     * Outcome stage: 'done' on success or 'backup'/'gc'/'smoke-test'/'prune' on failure.
     */
    stage: string;
    /**
     * RFC3339 timestamp when the run began.
     */
    started_at: string;
};

