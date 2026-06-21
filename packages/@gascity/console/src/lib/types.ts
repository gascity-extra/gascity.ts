/**
 * Gas City Console Types
 * Type definitions for Gas City console UI
 */

export interface FormulaStep {
  id: string;
  name: string;
  description?: string;
  status?: "idle" | "running" | "completed" | "error";
  output?: string;
  error?: string;
  agent?: string;
  depends_on?: string[];
  bead_id?: string;
}
