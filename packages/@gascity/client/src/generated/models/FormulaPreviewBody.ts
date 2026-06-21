/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type FormulaPreviewBody = {
    /**
     * Scope kind (city or rig).
     */
    scope_kind?: string;
    /**
     * Scope reference.
     */
    scope_ref?: string;
    /**
     * Preview target: a bead or convoy ID, or a configured agent identity (for example a workflow root's gc.routed_to value).
     */
    target: string;
    /**
     * Variable name-to-value overrides applied to the compiled preview.
     */
    vars?: Record<string, string>;
};

