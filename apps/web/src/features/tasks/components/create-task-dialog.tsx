'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  TASK_TITLE_MAX_LENGTH,
  TaskPriority,
  TaskStatus,
} from '@projectflow/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTask } from '../hooks';

const createTaskSchema = z.object({
  title: z.string().trim().min(3, 'Give the task a title').max(TASK_TITLE_MAX_LENGTH),
  description: z.string().trim().max(TASK_DESCRIPTION_MAX_LENGTH).optional(),
  status: z.enum(TaskStatus),
  priority: z.enum(TaskPriority),
});

type CreateTaskValues = z.infer<typeof createTaskSchema>;

export function CreateTaskDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask(projectId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    },
  });

  const onSubmit = handleSubmit((values) => {
    createTask.mutate(
      {
        title: values.title,
        description: values.description ? values.description : undefined,
        status: values.status,
        priority: values.priority,
      },
      {
        onSuccess: (task) => {
          toast.success(`${task.key} created`);
          reset();
          setOpen(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon size={14} weight="bold" />
          New task
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Tasks are numbered automatically using the project key.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Field label="Title" htmlFor="task-title" error={errors.title?.message}>
            <Input
              id="task-title"
              placeholder="Short summary of the work"
              aria-invalid={Boolean(errors.title)}
              {...register('title')}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="task-description"
            error={errors.description?.message}
            hint="Optional. Add context, links or acceptance criteria."
          >
            <Textarea
              id="task-description"
              rows={4}
              placeholder="What needs to happen?"
              {...register('description')}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Status" htmlFor="task-status">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUS_ORDER.map((status) => (
                        <SelectItem key={status} value={status}>
                          {TASK_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Priority" htmlFor="task-priority">
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {TASK_PRIORITY_LABELS[priority]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createTask.isPending}>
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
