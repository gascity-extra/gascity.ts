/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BeadsDiagnostic } from './BeadsDiagnostic';
import type { StatusAgentCounts } from './StatusAgentCounts';
import type { StatusMailCounts } from './StatusMailCounts';
import type { StatusRigCounts } from './StatusRigCounts';
import type { StatusSessionCountsDetail } from './StatusSessionCountsDetail';
import type { StatusStoreHealth } from './StatusStoreHealth';
import type { StatusWorkCounts } from './StatusWorkCounts';
export type StatusBody = {
    /**
     * Total agent count (deprecated, use agents.total).
     */
    agent_count: number;
    /**
     * Per-agent state (for CLI status views). Empty when none.
     */
    agent_details?: any[] | null;
    /**
     * Agent state counts.
     */
    agents: StatusAgentCounts;
    /**
     * Bead store selection diagnostic. Omitted when unavailable.
     */
    beads?: BeadsDiagnostic;
    /**
     * Version of the bd (beads) CLI the supervisor drives. Omitted when the probe failed or the binary is unavailable.
     */
    beads_version?: string;
    /**
     * Version of the dolt engine binary the supervisor drives. Omitted when the probe failed or the binary is unavailable.
     */
    dolt_version?: string;
    /**
     * Mail counts.
     */
    mail: StatusMailCounts;
    /**
     * City name.
     */
    name: string;
    /**
     * Per-named-session detail. Empty when none configured.
     */
    named_session_details?: any[] | null;
    /**
     * True when one or more status backing reads returned incomplete data.
     */
    partial?: boolean;
    /**
     * Human-readable errors from incomplete status backing reads.
     */
    partial_errors?: any[] | null;
    /**
     * City directory path.
     */
    path: string;
    /**
     * Total rig count (deprecated, use rigs.total).
     */
    rig_count: number;
    /**
     * Per-rig detail (for CLI status views). Empty when none.
     */
    rig_details?: any[] | null;
    /**
     * Rig state counts.
     */
    rigs: StatusRigCounts;
    /**
     * Number of running agent processes.
     */
    running: number;
    /**
     * Active/suspended session counts. Omitted when unavailable.
     */
    session_counts_detail?: StatusSessionCountsDetail;
    /**
     * Dolt bead store health summary. Omitted when unavailable.
     */
    store_health?: StatusStoreHealth;
    /**
     * Whether the city is suspended.
     */
    suspended: boolean;
    /**
     * Server uptime in seconds.
     */
    uptime_sec: number;
    /**
     * Server version.
     */
    version?: string;
    /**
     * Work item counts.
     */
    work: StatusWorkCounts;
};

