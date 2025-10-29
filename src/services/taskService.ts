import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';
import { Database } from '../db/database';

export class TaskService {
  constructor(private db: Database) {}

  async createTask(taskData: Partial<Task>): Promise<Task> {
    // TODO: Implement task creation
    // 1. Generate UUID for the task
    // 2. Set default values (completed: false, is_deleted: false)
    // 3. Set sync_status to 'pending'
    // 4. Insert into database
    // 5. Add to sync queue
    const id = uuidv4();
    const date = new Date();

    const task: Task = {
      id,
      title: taskData.title ?? 'untitled task',
      description: taskData.description || '',
      completed: taskData.completed || false,
      created_at: date,
      updated_at: date,
      is_deleted: false,
      sync_status: 'pending',
      server_id:undefined,
      last_synced_at:date,
    };

    try{
       await this.db.run(
        `INSERT INTO tasks (id, title, description, completed, created_at, updated_at, is_deleted, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.title,
          task.description,
          task.completed ? 1 : 0,
          task.created_at,
          task.updated_at,
          task.is_deleted ? 1 : 0,
          task.sync_status,
        
        ]
      );  
      // After inserting the task, add to sync queue
      await this.db.run(
        `INSERT INTO sync_queue (id, task_id, operation, data)
         VALUES (?, ?, ?, ?)`,
        [
          uuidv4(),
          task.id,
          'create',
          JSON.stringify(task),
        ]
      );
      return task;
    }catch(error){
    console.error('Error creating task:', error);
    throw new Error('Not implemented');
  }
}

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    // TODO: Implement task update
    // 1. Check if task exists
    // 2. Update task in database
    // 3. Update updated_at timestamp
    // 4. Set sync_status to 'pending'
    // 5. Add to sync queue
    throw new Error('Not implemented');
  }

  async deleteTask(id: string): Promise<boolean> {
    // TODO: Implement soft delete
    // 1. Check if task exists
    // 2. Set is_deleted to true
    // 3. Update updated_at timestamp
    // 4. Set sync_status to 'pending'
    // 5. Add to sync queue
    throw new Error('Not implemented');
  }

  async getTask(id: string): Promise<Task | null> {
    // TODO: Implement get single task
    // 1. Query database for task by id
    // 2. Return null if not found or is_deleted is true
    throw new Error('Not implemented');
  }

  async getAllTasks(): Promise<Task[]> {
    // TODO: Implement get all non-deleted tasks
    // 1. Query database for all tasks where is_deleted = false
    // 2. Return array of tasks
    try{
      const rows = await this.db.all(`SELECT * FROM tasks WHERE is_deleted = false`);
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        completed: !!row.completed,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        is_deleted: !!row.is_deleted,
        sync_status: row.sync_status,
        server_id: row.server_id,
        last_synced_at: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
      }));
    }catch(error){
      throw new Error('Not implemented');
    }
  }


  async getTasksNeedingSync(): Promise<Task[]> {
    // TODO: Get all tasks with sync_status = 'pending' or 'error'
    throw new Error('Not implemented');
  }
}