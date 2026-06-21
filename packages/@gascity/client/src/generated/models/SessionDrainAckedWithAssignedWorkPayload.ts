/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SessionDrainAckedWithAssignedWorkPayload = {
    /**
     * ID of the work bead still holding this session as its assignee.
     */
    bead_id: string;
    /**
     * Status of the stranded bead at emission time (typically 'in_progress' for cap-hit, 'open' if recovery races claim).
     */
    bead_status?: string;
    /**
     * Short diagnostic context. Today both emission sites pass 'drain_acked_with_assigned_work'; reserved for finer-grained shape discriminators if later Shape-N variants land.
     */
    reason?: string;
    /**
     * Canonical session bead ID for the session that drain-acked.
     */
    session_id: string;
    /**
     * Pool template name when known at the emission site.
     */
    template?: string;
};

