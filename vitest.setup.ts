
class LocalStorageMock {
  store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }
  
  get length() {
    return Object.keys(this.store).length;
  }
  
  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
}

Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true,
});
