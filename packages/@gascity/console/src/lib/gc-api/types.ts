/**
 * Gas City API Types
 * Type definitions for Gas City API responses
 */

export interface FormulaStep {
  id: string;
  name: string;
  description?: string;
  status?: "idle" | "running" | "completed" | "error";
  output?: string;
  error?: string;
}
