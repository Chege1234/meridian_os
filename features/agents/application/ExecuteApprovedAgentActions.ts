import type { AgentRun, AgentExecutedAction } from '@/domain/entities';
import type {
  AgentRepository,
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
  agentRepository: AgentRepository;
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
  run?: AgentRun;
  error?: string;
}

export async function executeApprovedAgentActions(
  args: { runId: string; actorId: string },
  deps: Dependencies,
): Promise<Result> {
  try {
    // 1. Fetch agent run
    const run = await deps.agentRepository.findRunById(args.runId);
    if (!run) {
      return { success: false, error: 'Agent run not found.' };
    }

    // Resolve the actor details
    const actor = await deps.userRepository.findByIdWithRole(args.actorId);
    if (!actor || actor.status !== 'active') {
      return { success: false, error: 'Actor is inactive or unauthorized.' };
    }
    const actorRoleName = actor.role.name;

    // Find all approved actions in proposedActions
    const approvedActions = run.proposedActions.filter((a) => a.status === 'approved');
    if (approvedActions.length === 0) {
      return { success: false, error: 'No approved actions to execute in this run.' };
    }

    const executedActionsList: AgentExecutedAction[] = [];
    let hasFailure = false;

    // 2. Iterate and execute approved actions
    for (const action of approvedActions) {
      const config = action.config;
      let status: 'executed' | 'failed' = 'executed';
      let result: any = null;
      let errorMsg: string | undefined = undefined;

      try {
        switch (action.type) {
          case 'create_task': {
            const res = await createTask(
              {
                title: config.title || 'Agent Created Task',
                description: config.description || 'Created by AI agent.',
                priority: config.priority || 'medium',
                status: 'todo',
                createdBy: args.actorId,
                contactId: config.contactId || null,
                campaignId: config.campaignId || null,
              },
              {
                taskRepository: deps.taskRepository,
                activityLogRepository: deps.activityLogRepository,
              },
            );

            if (res.success && res.task) {
              result = { taskId: res.task.id };
            } else {
              status = 'failed';
              errorMsg = res.error || 'Failed to create task.';
              hasFailure = true;
            }
            break;
          }

          case 'generate_content_draft': {
            const res = await createContentItem(
              {
                campaignId: config.campaignId || null,
                platform: config.platform || 'email',
                type: config.type || 'newsletter',
                caption: config.caption || null,
                body: config.body || 'Agent proposed body content.',
                authorId: args.actorId,
                status: 'draft',
              },
              {
                contentRepository: deps.contentRepository,
                activityLogRepository: deps.activityLogRepository,
              },
            );

            if (res.success && res.contentItem) {
              result = { contentItemId: res.contentItem.id };
            } else {
              status = 'failed';
              errorMsg = res.error || 'Failed to create content item.';
              hasFailure = true;
            }
            break;
          }

          case 'update_status': {
            const targetId = config.targetId;
            const targetType = config.targetType;
            const newStatus = config.status;

            if (!targetId || !targetType || !newStatus) {
              status = 'failed';
              errorMsg = 'Missing targetId, targetType, or status in action config.';
              hasFailure = true;
              break;
            }

            if (targetType === 'campaign') {
              const res = await transitionCampaignStatus(
                {
                  id: targetId,
                  status: newStatus,
                  actorId: args.actorId,
                  actorRoleName,
                },
                {
                  campaignRepository: deps.campaignRepository,
                  activityLogRepository: deps.activityLogRepository,
                },
              );
              if (res.success && res.campaign) {
                result = { campaignId: res.campaign.id, status: res.campaign.status };
              } else {
                status = 'failed';
                errorMsg = res.error || 'Campaign status transition failed.';
                hasFailure = true;
              }
            } else if (targetType === 'content_item') {
              const res = await transitionContentStatus(
                {
                  id: targetId,
                  status: newStatus,
                  actorId: args.actorId,
                  actorRoleName,
                },
                {
                  contentRepository: deps.contentRepository,
                  activityLogRepository: deps.activityLogRepository,
                },
              );
              if (res.success && res.contentItem) {
                result = { contentItemId: res.contentItem.id, status: res.contentItem.status };
              } else {
                status = 'failed';
                errorMsg = res.error || 'Content status transition failed.';
                hasFailure = true;
              }
            } else if (targetType === 'task') {
              const res = await updateTaskStatus(
                {
                  id: targetId,
                  status: newStatus,
                  actorId: args.actorId,
                },
                {
                  taskRepository: deps.taskRepository,
                  activityLogRepository: deps.activityLogRepository,
                },
              );
              if (res.success && res.task) {
                result = { taskId: res.task.id, status: res.task.status };
              } else {
                status = 'failed';
                errorMsg = res.error || 'Task status transition failed.';
                hasFailure = true;
              }
            } else if (targetType === 'sop') {
              const res = await transitionSopStatus(
                {
                  id: targetId,
                  status: newStatus,
                  actorId: args.actorId,
                  actorRoleName,
                },
                {
                  sopRepository: deps.sopRepository,
                  activityLogRepository: deps.activityLogRepository,
                },
              );
              if (res.success && res.sop) {
                result = { sopId: res.sop.id, status: res.sop.status };
              } else {
                status = 'failed';
                errorMsg = res.error || 'SOP status transition failed.';
                hasFailure = true;
              }
            } else {
              status = 'failed';
              errorMsg = `Unsupported target type: "${targetType}"`;
              hasFailure = true;
            }
            break;
          }

          default:
            status = 'failed';
            errorMsg = `Unsupported action type: "${action.type}"`;
            hasFailure = true;
        }
      } catch (err: any) {
        status = 'failed';
        errorMsg = err.message || 'Execution error.';
        hasFailure = true;
      }

      executedActionsList.push({
        id: action.id,
        type: action.type,
        config: action.config,
        status,
        result,
        error: errorMsg,
      });
    }

    // 3. Update the run log in DB
    const finalRunStatus = hasFailure ? 'failed' : 'completed';
    const updated = await deps.agentRepository.updateRun(run.id, {
      status: finalRunStatus,
      executedActions: executedActionsList,
      completedAt: new Date(),
    });

    if (!updated) {
      return { success: false, error: 'Failed to update final agent run status.' };
    }

    // Log the activity
    await deps.activityLogRepository.create({
      userId: args.actorId,
      action: finalRunStatus === 'completed' ? 'agent.execution_complete' : 'agent.execution_failed',
      module: 'agents',
      entity: 'agent_run',
      entityId: updated.id,
      metadata: {
        successCount: executedActionsList.filter(a => a.status === 'executed').length,
        failCount: executedActionsList.filter(a => a.status === 'failed').length,
      },
    });

    return {
      success: true,
      run: updated,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute approved actions.',
    };
  }
}
