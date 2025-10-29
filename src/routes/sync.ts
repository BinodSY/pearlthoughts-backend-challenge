import { Router, Request, Response } from 'express';
import { SyncService } from '../services/syncService';
import { TaskService } from '../services/taskService';
import { Database } from '../db/database';
import { sendErrorResponse } from '../utils/errorResponse';

export function createSyncRouter(db: Database): Router {
  const router = Router();
  const taskService = new TaskService(db);
  const syncService = new SyncService(db, taskService);

  // Trigger manual sync
  router.post('/sync', async (req: Request, res: Response) => {
    // TODO: Implement sync endpoint
    // 1. Check connectivity first
    // 2. Call syncService.sync()
    try {
    const online = await syncService.checkConnectivity();
    if (!online) {
      return sendErrorResponse(res, req, 503, 'Server unavailable');
    }

    const result = await syncService.sync();
    return res.json(result);
  } catch (error) {
    console.error('Sync error:', error);
    return sendErrorResponse(res, req, 500, 'Sync process failed');
  }
  });

  // Check sync status
  router.get('/status', async (req: Request, res: Response) => {
    // TODO: Implement sync status endpoint
    // 1. Get pending sync count
    // 2. Get last sync timestamp
    // 3. Check connectivity
    // 4. Return status summary
    try {
    const pending = await db.get(
      `SELECT COUNT(*) as count FROM sync_queue`
    );
    const lastSync = await db.get(
      `SELECT MAX(last_synced_at) as last FROM tasks`
    );
    const online = await syncService.checkConnectivity();

    return res.json({
      pending_sync_count: pending.count,
      last_sync_timestamp: lastSync.last,
      is_online: online,
      sync_queue_size: pending.count,
    });
  } catch (error) {
    console.error('Status error:', error);
    return sendErrorResponse(res, req, 500, 'Failed to get sync status');
  }
  });

  // Batch sync endpoint (for server-side)
  router.post('/batch', async (req: Request, res: Response) => {
    // TODO: Implement batch sync endpoint
    // This would be implemented on the server side
    // to handle batch sync requests from clients
    try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return sendErrorResponse(res, req, 400, 'Invalid batch format');
    }

    const results = [];

    for (const item of items) {
      try {
        const { operation, task_id, data } = item;

        switch (operation) {
          case 'create':
            // Pretend the "server" saves it and assigns a server_id
            results.push({
              client_id: task_id,
              status: 'success',
              resolved_data: {
                ...data,
                server_id: task_id, // mimic remote id assignment
                updated_at: new Date().toISOString(),
              },
            });
            break;

          case 'update':
            results.push({
              client_id: task_id,
              status: 'success',
              resolved_data: {
                ...data,
                updated_at: new Date().toISOString(),
              },
            });
            break;

          case 'delete':
            results.push({
              client_id: task_id,
              status: 'success',
              resolved_data: {
                id: task_id,
                deleted: true,
              },
            });
            break;

          default:
            results.push({
              client_id: task_id,
              status: 'error',
              error: `Unknown operation: ${operation}`,
            });
        }
      } catch (error: any) {
        results.push({
          client_id: item.task_id,
          status: 'error',
          error: error.message || 'Failed to process item',
        });
      }
    }

    return res.json({
      processed_items: results,
      server_timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Batch sync error:', error);
    return sendErrorResponse(res, req, 500, 'Batch sync failed');
  }
  });

  // Health check endpoint
  router.get('/health', async (_: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  return router;
}