/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WorkflowDeleteResponse = {
    /**
     * Number of beads closed.
     */
    closed: number;
    /**
     * Number of beads deleted.
     */
    deleted: number;
    /**
     * True when one or more teardown steps failed; Closed/Deleted still reflect what succeeded.
     */
    partial?: boolean;
    /**
     * Human-readable errors from failed teardown steps.
     */
    partial_errors?: any[] | null;
    /**
     * Workflow ID.
     */
    workflow_id: string;
};

