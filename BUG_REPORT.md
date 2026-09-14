# Security Bug Report: Missing Authorization on Task Status Updates

## Summary

The `PATCH /tasks/:taskId/status` endpoint allowed any authenticated user to update the status of any task across the system without verifying that the caller had access to the task's parent project.

---

## Severity

**High**

Although the endpoint required authentication (`JwtAuthGuard`), it lacked project-level authorization. An authenticated user who obtained or guessed a valid MongoDB `ObjectId` of any task could arbitrarily change its status (e.g., mark completed tasks as `TODO`, close tasks in progress, or transition tasks in organizations/projects they do not belong to).

---

## Vulnerability Details

### Location
- Controller: `apps/api/src/tasks/tasks.controller.ts` (`updateStatus` handler)
- Service: `apps/api/src/tasks/tasks.service.ts` (`updateStatus` method)

### Previous Implementation
In `tasks.controller.ts`:
```typescript
@Patch('tasks/:taskId/status')
updateStatus(
  @Param('taskId') taskId: string,
  @Body() dto: UpdateTaskStatusDto,
): Promise<TaskDetail> {
  return this.tasksService.updateStatus(toObjectId(taskId, 'task id'), dto);
}
```

In `tasks.service.ts`:
```typescript
async updateStatus(taskId: Types.ObjectId, dto: UpdateTaskStatusDto): Promise<TaskDetail> {
  const task = await this.findTaskOrFail(taskId);

  task.status = dto.status;
  await task.save();

  return this.toDetail(task);
}
```

### Flaw
1. The caller's identity (`userId`) was not extracted or passed from the controller to the service.
2. `this.projectAccessService.assertCanView(task.projectId, userId)` was never called.
3. In contrast, `update()` and `findOne()` properly guarded task access using `ProjectAccessService`.
4. `this.toDetail(task)` was called without passing `access.project`, resulting in a redundant database lookup for the project document.

---

## Fix Applied

1. **Controller**: Extracted the caller's ID using `@CurrentUser('id') userId: string` and converted it to an `ObjectId`.
2. **Service**:
   - Required `userId: Types.ObjectId` as the second argument to `updateStatus`.
   - Loaded the task and invoked `const access = await this.projectAccessService.assertCanView(task.projectId, userId);` before modifying state.
   - Passed `access.project` to `this.toDetail(task, access.project)` to optimize project resolution and maintain consistency.

### Fixed Code
In `tasks.controller.ts`:
```typescript
@Patch('tasks/:taskId/status')
updateStatus(
  @Param('taskId') taskId: string,
  @CurrentUser('id') userId: string,
  @Body() dto: UpdateTaskStatusDto,
): Promise<TaskDetail> {
  return this.tasksService.updateStatus(
    toObjectId(taskId, 'task id'),
    toObjectId(userId, 'user id'),
    dto,
  );
}
```

In `tasks.service.ts`:
```typescript
async updateStatus(
  taskId: Types.ObjectId,
  userId: Types.ObjectId,
  dto: UpdateTaskStatusDto,
): Promise<TaskDetail> {
  const task = await this.findTaskOrFail(taskId);
  const access = await this.projectAccessService.assertCanView(task.projectId, userId);

  task.status = dto.status;
  await task.save();

  return this.toDetail(task, access.project);
}
```

---

## Verification & Regression Testing

Added a regression test in `apps/api/test/tasks.e2e.spec.ts`:
```typescript
it('refuses to update task status for someone outside the project', async () => {
  const createResponse = await request(app.getHttpServer())
    .post(`/projects/${projectId}/tasks`)
    .set('Authorization', authHeader(member))
    .send({ title: 'Task for status test' })
    .expect(201);

  await request(app.getHttpServer())
    .patch(`/tasks/${createResponse.body.id}/status`)
    .set('Authorization', authHeader(outsider))
    .send({ status: TaskStatus.IN_PROGRESS })
    .expect(403);
});
```

This test ensures that any attempt by an unauthorized or outside user to mutate status yields `403 Forbidden`.
