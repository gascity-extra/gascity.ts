/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StatusAgentDetail = {
    /**
     * True when the pool is draining this instance.
     */
    draining?: boolean;
    /**
     * True when this row is a pool-expanded instance (renderer indents differently).
     */
    expanded?: boolean;
    /**
     * Pool group label for expanded rows; same as QualifiedName for singletons.
     */
    group_name?: string;
    /**
     * Unqualified agent name (for pool instances, the per-instance short name like 'polecat-1').
     */
    name: string;
    /**
     * Rig-qualified name when applicable, else the bare agent name.
     */
    qualified_name: string;
    /**
     * Observed running state of the agent's session.
     */
    running: boolean;
    /**
     * 'scaled (min=N, max=M)' header emitted once per pool group.
     */
    scale_label?: string;
    /**
     * city or rig.
     */
    scope: string;
    /**
     * tmux session name CLI drain-ops key on.
     */
    session_name?: string;
    /**
     * Whether the agent (or its rig) is suspended.
     */
    suspended: boolean;
};

