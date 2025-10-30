import axios from 'axios';
import { Task, SyncQueueItem, SyncResult, BatchSyncRequest, BatchSyncResponse } from '../types/index';
import { Database } from '../db/database';
import { TaskService } from './taskService';

export class SyncService {
  private apiUrl: string;
  
  constructor(
    private db: Database,
    private taskService: TaskService,
    apiUrl: string = process.env.API_BASE_URL || 'http://localhost:3000/api'
  ) {
    this.apiUrl = apiUrl;
  }

  async sync(): Promise<SyncResult> {
    // TODO: Main sync orchestration method
    // 1. Get all items from sync queue
    // 2. Group items by batch (use SYNC_BATCH_SIZE from env)
    // 3. Process each batch
    // 4. Handle success/failure for each item
    // 5. Update sync status in database
    // 6. Return sync result summary
    const batchSize = parseInt(process.env.SYNC_BATCH_SIZE || '50');
    const retryLimit = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');

  const items: SyncQueueItem[] = await this.db.all(
    `SELECT * FROM sync_queue WHERE retry_count < ? ORDER BY created_at ASC`,
    [retryLimit]
  );

  if (!items.length) {
    return { success: true, synced_items: 0, failed_items: 0, errors: [] };
  }

  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  let synced = 0;
  let failed = 0;
  const errors: any[] = [];

  for (const batch of batches) {
    try {
      const response = await this.processBatch(batch);

      for (const result of response.processed_items) {
        if (result.status === 'success') {
          await this.updateSyncStatus(result.client_id, 'synced', result.resolved_data);
          synced++;
        } else {
          failed++;
          errors.push(result);
        }
      }
    } catch (err: any) {
      failed += batch.length;
      for (const item of batch) {
        await this.handleSyncError(item, err);
        errors.push({
          task_id: item.task_id,
          operation: item.operation,
          error: err.message,
        });
      }
    }
  }

  return { success: failed === 0, synced_items: synced, failed_items: failed, errors };
  }

  async addToSyncQueue(taskId: string, operation: 'create' | 'update' | 'delete', data: Partial<Task>): Promise<void> {
    // TODO: Add operation to sync queue
    // 1. Create sync queue item
    // 2. Store serialized task data
    // 3. Insert into sync_queue table
    const now = new Date().toISOString();
  await this.db.run(
    `INSERT INTO sync_queue (operation, task_id, data, retry_count, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [operation, taskId, JSON.stringify(data), 0, now]
  );
  }

  private async processBatch(items: SyncQueueItem[]): Promise<BatchSyncResponse> {
    // TODO: Process a batch of sync items
    // 1. Prepare batch request
    // 2. Send to server
    // 3. Handle response
    // 4. Apply conflict resolution if needed
    const payload: BatchSyncRequest = {
    items: items.map((i) => ({
      id: i.id,
      task_id: i.task_id,
      operation: i.operation,
      data:i.data,
      retry_count: i.retry_count,
      created_at: i.created_at,
    })),
    client_timestamp: new Date(),
  };

  const response = await axios.post(`${this.apiUrl}/batch`, payload, { timeout: 8000 });
  const batchResponse: BatchSyncResponse = response.data;

  // ✅ Conflict Handling
  for (const result of batchResponse.processed_items) {
      if (result.status === 'conflict' && result.server_id && result.client_id) {
      const resolvedTask = await this.resolveConflict(
        result.client_id,
        result.server_id
      );

      // Update local DB with resolved version
      await this.taskService.updateTask(resolvedTask.id, resolvedTask);
      result.resolved_data = resolvedTask;
      result.status = 'success';
    }
  }

  return batchResponse;
  }

  private async resolveConflict(clientId: string, serverId: string): Promise<Task> {
    // Implement last-write-wins conflict resolution by loading both versions
    // 1. Load local task from local DB
    // 2. Load server task from remote API
    // 3. Compare updated_at timestamps and return the most recent version
    const localTask: Task = await this.db.get(`SELECT * FROM tasks WHERE id = ?`, [clientId]);
    const resp = await axios.get(`${this.apiUrl}/tasks/${serverId}`, { timeout: 5000 });
    const serverTask: Task = resp.data;

    const localTime = new Date(localTask.updated_at).getTime();
    const serverTime = new Date(serverTask.updated_at).getTime();

    if (localTime >= serverTime) {
      console.log(`Conflict resolved: local (${localTask.id}) wins.`);
      return localTask;
    } else {
      console.log(`Conflict resolved: server (${serverTask.id}) wins.`);
      await this.taskService.updateTask(localTask.id, serverTask);
      return serverTask;
    }
  }

  private async updateSyncStatus(taskId: string, status: 'synced' | 'error', serverData?: Partial<Task>): Promise<void> {
    // TODO: Update task sync status
    // 1. Update sync_status field
    // 2. Update server_id if provided
    // 3. Update last_synced_at timestamp
    // 4. Remove from sync queue if successful
    const now = new Date();

      if (status === 'synced') {
        await this.db.run(
          `UPDATE tasks SET sync_status = ?, server_id = ?, last_synced_at = ? WHERE id = ?`,
          ['synced', serverData?.server_id ?? null, now, taskId]
        );

        await this.db.run(`DELETE FROM sync_queue WHERE task_id = ?`, [taskId]);
      } else {
        await this.db.run(`UPDATE tasks SET sync_status = ? WHERE id = ?`, ['error', taskId]);
      }
  }

  private async handleSyncError(item: SyncQueueItem, error: Error): Promise<void> {
    // TODO: Handle sync errors
    // 1. Increment retry count
    // 2. Store error message
    // 3. If retry count exceeds limit, mark as permanent failure
     const retryLimit = parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3');
  const newCount = item.retry_count + 1;

  if (newCount >= retryLimit) {
    await this.db.run(
      `UPDATE tasks SET sync_status = 'error' WHERE id = ?`,
      [item.task_id]
    );
    console.warn(`Sync permanently failed for ${item.task_id}: ${error.message}`);
  }

  await this.db.run(
    `UPDATE sync_queue SET retry_count = ?, last_error = ? WHERE id = ?`,
    [newCount, error.message, item.id]
  );
  }

  async checkConnectivity(): Promise<boolean> {
    // TODO: Check if server is reachable
    // 1. Make a simple health check request
    // 2. Return true if successful, false otherwise
    try {
      await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}