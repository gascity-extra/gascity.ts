/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WorkflowSnapshotResponse = {
    beads: any[] | null;
    deps: any[] | null;
    logical_edges: any[] | null;
    logical_nodes: any[] | null;
    partial: boolean;
    resolved_root_store: string;
    root_bead_id: string;
    root_store_ref: string;
    scope_groups: any[] | null;
    scope_kind: string;
    scope_ref: string;
    snapshot_event_seq?: number;
    snapshot_version: number;
    stores_scanned: any[] | null;
    workflow_id: string;
};

