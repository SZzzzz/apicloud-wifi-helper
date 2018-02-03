
class TaskManager {
  private _taskContainer: Map<string, {fileList: Set<string>; cb: Function}> = new Map();

  addTask(id: string, fileList: string[], cb: Function): void {
    this._taskContainer.set(id, {
      fileList: new Set(fileList),
      cb
    });
  }

  updateTask(id: string, vPath: string): void {
    const task = this._taskContainer.get(id);
    if (!task) {
      console.log(`task: ${id}  dees not exsist`);
      return;
    }
    task.fileList.delete(vPath);
    if (task.fileList.size === 0) {
      task.cb();
    }
  }
}

export = TaskManager;