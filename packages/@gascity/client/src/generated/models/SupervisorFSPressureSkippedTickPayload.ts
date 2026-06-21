/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SupervisorFSPressureSkippedTickPayload = {
    /**
     * The Linux PSI some avg60 value observed for filesystem IO pressure.
     */
    avg60: number;
    /**
     * Number of consecutive pressure skips including this tick.
     */
    consecutive_skips: number;
    /**
     * Maximum consecutive skips before the supervisor forces one reconciliation tick.
     */
    max_consecutive_skips: number;
    /**
     * The pressure decision outcome: skipped for a shed tick or forced for the bounded liveness tick.
     */
    outcome: string;
    /**
     * The configured avg60 threshold that triggered the skip.
     */
    threshold: number;
    /**
     * The daemon tick trigger, such as patrol or poke.
     */
    trigger?: string;
};

