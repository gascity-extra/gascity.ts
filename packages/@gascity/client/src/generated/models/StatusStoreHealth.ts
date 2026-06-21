/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StatusStoreHealth = {
    /**
     * RFC3339 timestamp of last maintenance run.
     */
    last_gc_at?: string;
    /**
     * Status of last maintenance run ('success' or 'failed').
     */
    last_gc_status?: string;
    /**
     * Live bead row count.
     */
    live_rows: number;
    /**
     * On-disk path of the Dolt store.
     */
    path: string;
    /**
     * Derived megabytes per row.
     */
    ratio_mb_per_row: number;
    /**
     * Total bytes of the store directory.
     */
    size_bytes: number;
    /**
     * Ratio threshold; a ratio above this trips warning.
     */
    threshold_mb_per_row: number;
    /**
     * True when maintenance is overdue.
     */
    warning: boolean;
};

