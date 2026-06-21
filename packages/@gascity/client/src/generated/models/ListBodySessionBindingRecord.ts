/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ListBodySessionBindingRecord = {
    /**
     * The list of items.
     */
    items: any[] | null;
    /**
     * Cursor for the next page of results.
     */
    next_cursor?: string;
    /**
     * True when one or more backends failed and the list is incomplete.
     */
    partial?: boolean;
    /**
     * Human-readable errors from backends that failed during aggregation.
     */
    partial_errors?: any[] | null;
    /**
     * Total number of items matching the query.
     */
    total: number;
};

