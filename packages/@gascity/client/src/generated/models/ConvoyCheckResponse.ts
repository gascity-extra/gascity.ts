/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ConvoyCheckResponse = {
    /**
     * Closed child bead count.
     */
    closed: number;
    /**
     * True when all child beads are closed and total > 0.
     */
    complete: boolean;
    /**
     * Convoy ID.
     */
    convoy_id: string;
    /**
     * Total child bead count.
     */
    total: number;
};

