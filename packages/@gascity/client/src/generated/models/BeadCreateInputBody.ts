/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BeadCreateInputBody = {
    /**
     * Assigned agent.
     */
    assignee?: string;
    /**
     * Hide the bead from ready views until this time.
     */
    defer_until?: string;
    /**
     * Bead description.
     */
    description?: string;
    /**
     * Bead labels.
     */
    labels?: any[] | null;
    /**
     * Metadata key-value pairs to set at create time.
     */
    metadata?: Record<string, string>;
    /**
     * Parent bead ID.
     */
    parent?: string;
    /**
     * Bead priority.
     */
    priority?: number;
    /**
     * Rig name.
     */
    rig?: string;
    /**
     * Bead title.
     */
    title: string;
    /**
     * Bead type.
     */
    type?: string;
};

