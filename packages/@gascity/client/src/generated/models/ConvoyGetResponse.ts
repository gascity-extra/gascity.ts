/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Bead } from './Bead';
import type { ConvoyProgress } from './ConvoyProgress';
export type ConvoyGetResponse = {
    /**
     * Direct child beads (non-workflow case).
     */
    children?: any[] | null;
    /**
     * Simple convoy bead (non-workflow case).
     */
    convoy?: Bead;
    /**
     * Child bead progress (non-workflow case).
     */
    progress?: ConvoyProgress;
};

