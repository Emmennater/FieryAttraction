/*

For each object, there is data that is:
- Local to the client.
- Local to the server.
- Shared from the server to the client.
- Shared from the client to the server.
- Shared from the client to other clients.

There are two ways an object can be created:
- A new object is received from the server.
- A new object is created on the client and sent to the server.

Get/set attribute function:
- Allow attributes to be modified indirectly by effects or events.

Object wrappers should not be used to represent game objects:
- Keep simulation, rendering, and audio separate.

Self-detecting effect/event incompatibility:
- When an effect/event modifies a similar property.

*/

function deepCopy(object) {
  if (Array.isArray(object)) return object.map(deepCopy);
  if (typeof object === "object") return merge({}, object);
  return object;
}

function merge(current, updates) {
  if (Array.isArray(current) && Array.isArray(updates)) {
    return deepCopy([...current, ...updates]);
  }

  if (Array.isArray(updates)) {
    return deepCopy(updates);
  }

  const result = Object.create(
    Object.getPrototypeOf(current),
    Object.getOwnPropertyDescriptors(current)
  );

  for (const key of Object.keys(updates)) {
    const updateValue = updates[key];
    const currentValue = result[key];

    if (Array.isArray(updateValue)) {
      result[key] = merge(currentValue, updateValue);
    } else if (
      !Object.prototype.hasOwnProperty.call(result, key) ||
      updateValue === null ||
      typeof updateValue !== "object" ||
      currentValue === null ||
      typeof currentValue !== "object"
    ) {
      const descriptor = Object.getOwnPropertyDescriptor(updates, key);

      Object.defineProperty(result, key, descriptor);
    } else {
      result[key] = merge(currentValue, updateValue);
    }
  }

  return result;
}

class Entity {
  static get properties() {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mass: 0,
      destroyed: false,
    };
  }

  static create() {
    // In a static method, "this" refers to the class, not the instance.
    const Parent = Object.getPrototypeOf(this);
    
    let properties = this === Entity ?
      deepCopy(this.properties) :
      merge(Parent.properties, this.properties);

    return {
      get(...keys) {
        const value = keys.reduce((a, b) => a[b], properties);
        if (typeof value === "object" && value !== null)
          throw "Cannot get object";
        return value;
      },
      set(value, ...keys) {
        const key = keys.pop();
        const obj = keys.reduce((a, b) => a[b], properties);
        if (typeof obj[key] === "object" && obj[key] !== null)
          throw "Cannot set object";
        if (typeof value === "object" && value !== null)
          throw "Value cannot be object";
        value[key] = value;
      },
      has(...keys) {
        const key = keys.pop();
        const obj = keys.reduce((a, b) => a[b], properties);
        return key in obj;
      },
      keys() {
        const keys = [];

        (function addKeys(obj, keyList) {
          for (const key of Object.keys(obj)) {
            if (typeof obj[key] === "object" && obj[key] !== null) {
              addKeys(obj[key], [...keyList, key]);
            } else {
              keys.push([...keyList, key]);
            }
          }
        })(properties, []);

        return keys;
      }
    };
  }
}

class PlayerEntity extends Entity {
  static get properties() {
    return {
      controls: {
        boost: false,
        fire: false,
        steer: 0,
      }
    };
  }
}

function newState() {
  return {
    objects: {
      players: [],
      asteroids: [],
      bullets: [],
      enemies: [],
    }
  };
}

function processEvents(state, events) {

}

function tick(state) {
  let events = [];


}



class EventCreator {
  static #newEvent(type, data) {
    return { type, ...data };
  }
  
  static objectCreated(id, name, params) {
    return this.#newEvent("object_created", { id, name, params });
  }
}
