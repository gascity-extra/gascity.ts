/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventRotateAnchor } from './EventRotateAnchor';
import type { EventRotateArchive } from './EventRotateArchive';
export type EventRotateResponse = {
    /**
     * Anchor event metadata when rotated is true.
     */
    anchor_event?: EventRotateAnchor;
    /**
     * Archive metadata when rotated is true.
     */
    archive?: EventRotateArchive;
    /**
     * No-op reason when rotated is false.
     */
    reason?: string;
    /**
     * Whether an archive was produced.
     */
    rotated: boolean;
};

