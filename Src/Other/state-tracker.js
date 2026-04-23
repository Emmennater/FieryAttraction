
/**
 * Tracks the state of an object
 * @param {Object} object The object to track
 * @param {Object} tree The tree of keys to track
 * 
 * Example:
 * 
 * const tracker = new StateTracker(object, { health: {}, ammo: {}, fuel: {} });
 */
class StateTracker {
  constructor(object, tree = {}) {
    this.object = object;
    this.lastState = {};
    this.tree = tree;
  }

  getChanges() {
    // If you allow an array to be tracked, all of the elements will be tracked
    const WHITELIST = new Set(['Array', 'Number', 'String', 'Boolean', undefined]);
    let changes = {};

    function getNodeChanges(currentState, lastState, tree, changes, key) {
      changes[key] = {};
      
      const currentValue = currentState[key];
      const lastValue = lastState[key];
      const tracked = WHITELIST.has(currentValue?.constructor.name) ||
        key in tree || currentState instanceof Array;

      if (tracked && currentValue !== lastValue) {
        if (currentValue instanceof Array) {
          lastState[key] = lastState[key] ?? [];
          for (let i = 0; i < currentValue.length; i++) {
            getNodeChanges(currentValue ?? {}, lastState[key], tree[key] ?? {}, changes[key], i);
          }
        } else if (currentValue instanceof Object) {
          lastState[key] = lastState[key] ?? {};
          for (let key2 in currentValue) {
            getNodeChanges(currentValue ?? {}, lastState[key], tree[key] ?? {}, changes[key], key2);
          }
        } else {
          changes[key] = currentValue;
          lastState[key] = currentValue;
        }
      }
    }

    function removeEmptyObjects(changes) {
      if (!(changes instanceof Object)) return;
      for (let key in changes) {
        if (changes[key] instanceof Object) {
          removeEmptyObjects(changes[key]);
          if (Object.keys(changes[key]).length == 0) {
            delete changes[key];
          }
        }
      }
    }

    getNodeChanges([this.object], [this.lastState], this.tree, changes, 0);
    removeEmptyObjects(changes);

    return changes[0];
  }
}
