class BiMap<K, V> {

  private _kMap: Map<K, V> = new Map<K, V>();

  private _vMap: Map<V, K> = new Map<V, K>();
  
  val(val: V): K | undefined {
    return this._vMap.get(val);
  }

  key(key: K): V | undefined {
    return this._kMap.get(key);
  }

  hasKey(key: K): boolean {
    return this._kMap.has(key);    
  }

  hasVal(val: V): boolean {
    return this._vMap.has(val);
  }

  push(key: K, val: V): void {
    this._kMap.set(key, val);
    this._vMap.set(val, key);
  }

  delKey(key: K) {
    if (this.hasKey(key)) {
      const val = this.key(key);
      this._vMap.delete(val!);
    }
  }

  delVal(val: V) {
    if (this.hasVal(val)) {
      const key = this.val(val);
      this._kMap.delete(key!);
    }
  }

  keyList(): K[]{
    return [...this._kMap.keys()];
  }

  valList(): V[] {
    return [...this._vMap.keys()];
  }

  constructor(data?: Map<K, V> | Array<[K, V]>) {
    if (data) {
      [...data].forEach((item) => {
            const [k, v] = item;      
            this._kMap.set(k, v);
            this._vMap.set(v, k);
      });
    }
  }
}

export = BiMap;