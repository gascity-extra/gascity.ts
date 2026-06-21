/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type EventRotateArchive = {
    /**
     * Archive compression status.
     */
    compression_status: EventRotateArchive.compression_status;
    /**
     * First event sequence included in the archive.
     */
    first_seq: number;
    /**
     * Last event sequence included in the archive.
     */
    last_seq: number;
    /**
     * Absolute path to the archive.
     */
    path: string;
};
export namespace EventRotateArchive {
    /**
     * Archive compression status.
     */
    export enum compression_status {
        PENDING = 'pending',
        COMPLETE = 'complete',
    }
}

