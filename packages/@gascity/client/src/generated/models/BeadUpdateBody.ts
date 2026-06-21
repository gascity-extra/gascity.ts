/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type BeadUpdateBody = {
    /**
     * Assigned agent.
     */
    assignee?: string;
    /**
     * Bead description.
     */
    description?: string;
    /**
     * Bead labels.
     */
    labels?: any[] | null;
    /**
     * Metadata key-value pairs to set.
     */
    metadata?: Record<string, string>;
    /**
     * Parent bead ID. Use null or an empty string to clear.
     */
    parent?: string | null;
    /**
     * Bead priority.
     */
    priority?: number;
    /**
     * Labels to remove.
     */
    remove_labels?: any[] | null;
    /**
     * Bead status.
     */
    status?: string;
    /**
     * Bead title.
     */
    title?: string;
    /**
     * Bead type.
     */
    type?: string;
};

