/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MaintenanceRunBody } from './MaintenanceRunBody';
export type MaintenanceTriggerBody = {
    /**
     * True when the supervisor accepted the trigger (202) or completed it (200).
     */
    accepted: boolean;
    /**
     * Full run summary, populated when the caller set ?wait=true.
     */
    run?: MaintenanceRunBody;
    /**
     * RFC3339 start time of the triggered run; doubles as a run identifier for async callers.
     */
    started_at?: string;
};

