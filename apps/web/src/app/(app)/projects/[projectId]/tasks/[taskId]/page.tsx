import { TaskView } from '@/features/tasks/components/task-view';

export default async function TaskPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>;
}) {
  const { projectId, taskId } = await params;

  return <TaskView projectId={projectId} taskId={taskId} />;
}
