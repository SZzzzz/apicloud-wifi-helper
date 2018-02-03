import hasha = require('hasha');
class SyncRecord {
  private _record: Map<string, string>[] = [];

  push(fileList: string[]) {
    const hashMap = fileList.map(path => [path, hasha.fromFileSync(path, {algorithm: 'md5'})] as [string, string]);
    this._record.push(new Map(hashMap));
  }

  // 只做
  diff(index?: number): string[] {
    if (this._record.length === 0) {
      throw new Error('no record in SyncRecord, can not call diff method');
    }
    if (typeof index !== 'undefined' && !Number.isInteger(index)) {
      throw new Error('index must be a integer or does not pass index');      
    }
    const latestIndex = this._record.length - 1;   
    if (index === latestIndex) {
      return [];
    }     
    if (typeof index === 'undefined') {
      return [...this._record[latestIndex].keys()];      
    }
    
    const outdated = this._record[index];
    const latest = this._record[latestIndex];
    const needToUpdate: string[] = [];
    for (let [k, v] of latest.entries()) {
      // 如果是新文件或者是 md5 跟之前的不一致, 则是需要更新的
      if (!outdated.has(k) || outdated.get(k) !== v) {
        needToUpdate.push(k);
      }
    }
    return needToUpdate;
  }

  get length() {
    return this._record.length;
  }
}

export = SyncRecord;