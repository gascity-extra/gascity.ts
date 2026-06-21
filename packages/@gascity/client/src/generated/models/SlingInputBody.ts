/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SlingInputBody = {
    /**
     * Bead ID to attach a formula to.
     */
    attached_bead_id?: string;
    /**
     * Bead ID to sling.
     */
    bead?: string;
    /**
     * Bypass cross-rig guards; for direct bead routes, also bypass missing-bead validation. Formula-backed graph routes may replace existing live workflow roots but still require the source bead to exist.
     */
    force?: boolean;
    /**
     * Formula name for workflow launch.
     */
    formula?: string;
    /**
     * Rig name.
     */
    rig?: string;
    /**
     * Scope kind (city or rig).
     */
    scope_kind?: string;
    /**
     * Scope reference.
     */
    scope_ref?: string;
    /**
     * Target agent or pool.
     */
    target: string;
    /**
     * Workflow title.
     */
    title?: string;
    /**
     * Formula variables.
     */
    vars?: Record<string, string>;
};

