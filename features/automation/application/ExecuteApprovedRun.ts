import type { AutomationRun } from '@/domain/entities';
import type {
  AutomationRepository,
  UserRepository,
  ActivityLogRepository,
  TaskRepository,
  ContentRepository,
  CampaignRepository,
  SopRepository,
} from '@/domain/repositories';

// Import target use cases
import { createTask } from '@/features/tasks/application/CreateTask';
import { createContentItem } from '@/features/content-studio/application/CreateContentItem';
import { transitionCampaignStatus } from '@/features/campaigns/application/TransitionCampaignStatus';
import { transitionContentStatus } from '@/features/content-studio/application/TransitionContentStatus';
import { updateTaskStatus } from '@/features/tasks/application/UpdateTaskStatus';
import { transitionSopStatus } from '@/features/sops/application/TransitionSopStatus';

interface Dependencies {
  automationRepository: AutomationRepository;
  userRepository: UserRepository;
  activityLogRepository: ActivityLogRepository;
  taskRepository: TaskRepository;
  contentRepository: ContentRepository;
  campaignRepository: CampaignRepository;
  sopRepository: SopRepository;
  [key: string]: any;
}

interface Result {
  success: boolean;
  error?: string;
}

export async function executeApprovedRun(
  input: { runId: string },
  deps: Dependencies,
): Promise<Result> {
  let run: AutomationRun | null = null;
  try {
    // 1. Fetch the run log
    run = await deps.automationRepository.findRunById(input.runId);
    if (!run) {
      return { success: false, error: 'Automation run not found.' };
    }

    if (run.status !== 'approved') {
      return { success: false, error: `Run status is "${run.status}". Only approved runs can be executed.` };
    }

    // Fetch the automation template
    const automation = await deps.automationRepository.findById(run.automationId);
    if (!automation) {
      await deps.automationRepository.updateRun(run.id, {
        status: 'failed',
        error: 'Automation template not found.',
      });
      return { success: false, error: 'Automation template not found.' };
    }

    // 2. Resolve the actor (for permissions)
    const actorId = run.approvedBy || automation.createdBy;
    const actor = await deps.userRepository.findByIdWithRole(actorId);
    if (!actor || actor.status !== 'active') {
      const errMsg = 'Actor for this run is not active or unauthorized.';
      await deps.automationRepository.updateRun(run.id, {
        status: 'failed',
        error: errMsg,
      });
      return { success: false, error: errMsg };
    }

    const actorRoleName = actor.role.name;
    let output: any = null;
    let error: string | null = null;

    // 3. Dispatch action based on actionType
    const config = automation.actionConfig;

    switch (automation.actionType) {
      case 'create_task': {
        const result = await createTask(
          {
            title: config.title || 'Automated Task',
            description: config.description || 'Created automatically by automation.',
            priority: config.priority || 'medium',
            status: 'todo',
            createdBy: actorId,
            contactId: config.contactId || null,
            campaignId: config.campaignId || null,
          },
          {
            taskRepository: deps.taskRepository,
            activityLogRepository: deps.activityLogRepository,
          },
        );

        if (result.success && result.task) {
          output = { taskId: result.task.id };
        } else {
          error = result.error || 'Failed to create task.';
        }
        break;
      }

      case 'generate_content_draft': {
        const result = await createContentItem(
          {
            campaignId: config.campaignId || null,
            platform: config.platform || 'email',
            type: config.type || 'newsletter',
            caption: config.caption || null,
            body: config.body || 'Draft body content.',
            authorId: actorId,
            status: 'draft',
          },
          {
            contentRepository: deps.contentRepository,
            activityLogRepository: deps.activityLogRepository,
          },
        );

        if (result.success && result.contentItem) {
          output = { contentItemId: result.contentItem.id };
        } else {
          error = result.error || 'Failed to generate content draft.';
        }
        break;
      }

      case 'update_status': {
        const targetId = config.targetId;
        const targetType = config.targetType;
        const newStatus = config.status;

        if (!targetId || !targetType || !newStatus) {
          error = 'Missing targetId, targetType, or status in action config.';
          break;
        }

        if (targetType === 'campaign') {
          const result = await transitionCampaignStatus(
            {
              id: targetId,
              status: newStatus as any,
              actorId,
              actorRoleName,
            },
            {
              campaignRepository: deps.campaignRepository,
              activityLogRepository: deps.activityLogRepository,
            },
          );
          if (result.success && result.campaign) {
            output = { campaignId: result.campaign.id, status: result.campaign.status };
          } else {
            error = result.error || 'Failed to transition campaign status.';
          }
        } else if (targetType === 'content_item') {
          const result = await transitionContentStatus(
            {
              id: targetId,
              status: newStatus as any,
              actorId,
              actorRoleName,
            },
            {
              contentRepository: deps.contentRepository,
              activityLogRepository: deps.activityLogRepository,
            },
          );
          if (result.success && result.contentItem) {
            output = { contentItemId: result.contentItem.id, status: result.contentItem.status };
          } else {
            error = result.error || 'Failed to transition content status.';
          }
        } else if (targetType === 'task') {
          const result = await updateTaskStatus(
            {
              id: targetId,
              status: newStatus as any,
              actorId,
            },
            {
              taskRepository: deps.taskRepository,
              activityLogRepository: deps.activityLogRepository,
            },
          );
          if (result.success && result.task) {
            output = { taskId: result.task.id, status: result.task.status };
          } else {
            error = result.error || 'Failed to update task status.';
          }
        } else if (targetType === 'sop') {
          const result = await transitionSopStatus(
            {
              id: targetId,
              status: newStatus as any,
              actorId,
              actorRoleName,
            },
            {
              sopRepository: deps.sopRepository,
              activityLogRepository: deps.activityLogRepository,
            },
          );
          if (result.success && result.sop) {
            output = { sopId: result.sop.id, status: result.sop.status };
          } else {
            error = result.error || 'Failed to transition SOP status.';
          }
        } else {
          error = `Unsupported target type: "${targetType}" for update_status action.`;
        }
        break;
      }

      case 'send_notification': {
        // Notification system mock (no DB table)
        // Log to activity log to register notification event (BR-1202)
        await deps.activityLogRepository.create({
          userId: actorId,
          action: 'notification.send',
          module: 'automation',
          entity: 'automation_run',
          entityId: run.id,
          metadata: {
            recipient: config.recipient || 'system',
            message: config.message || 'Notification triggered.',
          },
        });
        output = { status: 'sent', recipient: config.recipient || 'system' };
        break;
      }

      case 'run_report': {
        // Run report mock
        await deps.activityLogRepository.create({
          userId: actorId,
          action: 'report.run',
          module: 'automation',
          entity: 'automation_run',
          entityId: run.id,
          metadata: {
            reportType: config.reportType || 'performance',
            parameters: config.parameters || {},
          },
        });
        output = { status: 'completed', reportUrl: '/reports/performance-summary.pdf' };
        break;
      }

      default:
        error = `Unsupported action type: "${automation.actionType}"`;
    }

    // 4. Update the run log with execution result
    if (error) {
      await deps.automationRepository.updateRun(run.id, {
        status: 'failed',
        error,
        executedAt: new Date(),
      });
      return { success: false, error };
    } else {
      await deps.automationRepository.updateRun(run.id, {
        status: 'executed',
        output,
        executedAt: new Date(),
      });
      return { success: true };
    }
  } catch (err: any) {
    const errorMsg = err.message || 'An unexpected error occurred during execution.';
    if (run) {
      await deps.automationRepository.updateRun(run.id, {
        status: 'failed',
        error: errorMsg,
        executedAt: new Date(),
      });
    }
    return { success: false, error: errorMsg };
  }
}
