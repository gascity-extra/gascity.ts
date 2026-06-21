/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionStrandedPayload = {
    /**
     * Canonical session bead ID for the stranded pool session (also the envelope Subject).
     */
    session_id: string;
    /**
     * Runtime session name from the session bead metadata, when set.
     */
    session_name?: string;
    /**
     * Pool template name when known at the emission site.
     */
    template?: string;
    /**
     * IDs of the open/in-progress work beads still assigned to the session. Never truncated, unlike the envelope Message. Empty when the work-collection query failed at emission time.
     */
    work_bead_ids?: any[] | null;
};

