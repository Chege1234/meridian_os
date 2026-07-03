/**
 * Domain Repository Interface — Automation
 *
 * Interface only — implementation in infrastructure layer.
 */

import type {
  Automation,
  AutomationRun,
  CreateAutomationInput,
  UpdateAutomationInput,
  CreateAutomationRunInput,
} from '@/domain/entities';

export interface AutomationRepository {
  findById(id: string): Promise<Automation | null>;
  findAll(options?: { status?: string }): Promise<Automation[]>;
  create(data: CreateAutomationInput): Promise<Automation>;
  update(id: string, data: Partial<UpdateAutomationInput>): Promise<Automation | null>;
  
  findRunById(id: string): Promise<AutomationRun | null>;
  findAllRuns(options?: { status?: string; automationId?: string }): Promise<AutomationRun[]>;
  createRun(data: CreateAutomationRunInput): Promise<AutomationRun>;
  updateRun(id: string, data: Partial<AutomationRun>): Promise<AutomationRun | null>;
}
