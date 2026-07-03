/**
 * Domain Entity — Permission
 *
 * Granular permission following resource.action pattern.
 * Framework-independent.
 */

export interface Permission {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly module: string;
}
