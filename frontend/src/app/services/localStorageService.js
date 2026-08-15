class localStorageService {
  ls = window.localStorage;

  setItem(key, value) {
    value = JSON.stringify(value);
    this.ls.setItem(key, value);
    return true;
  }

  getItem(key) {
    let value = this.ls.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}

const service = new localStorageService();
export default service;
