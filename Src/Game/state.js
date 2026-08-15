
const CLASS_PROPERTIES = {
  physicalObject: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    mass: 0,
    destroyed: false,
    destroyerId: null,
  },
  effectableObject: {
    inactiveEffects: [],
    activeEffects: [],
    rewardedEffects: [],
  },
  collidableObject: {
    collision: {
      get points() { throw "Collision points not implemented" },
      get origin() { throw "Collision origin not implemented" },
      get scale() { throw "Collision scale not implemented" },
    }
  },
  effect: {
    type: "none",
    group: "none",
    amount: 0,
    totalAmount: 0,
  },
  asteroid: {
    inherits: ["physicalObject", "collidableObject"],
    type: "normal",
    angularVelocity: 0,
    radius: 20,
    health: 15,
    maxHealth: 15,
    isSplit: false,
    get split() {
      if (this.radius > 70) return 2;
      if (this.radius > 30) return 1;
      return 0;
    },
    get sprite() {
      switch (this.type) {
      case "normal": return asteroidSprite;
      case "fuel": return fuelAsteroidSprite;
      case "ammo": return ammoAsteroidSprite;
      case "health": return healthAsteroidSprite;
      default: throw "Unknown asteroid type";
      }
    }
  },
  ship: {
    inherits: ["physicalObject", "effectableObject", "collidableObject"],
    controls: { boost: false, fire: false, steer: 0 },
    timers: { solarDamage: 0, firing: 0 },
    colliding: false,
    steering: { angle: 0, velocity: 0, speed: 2.4 },
    alpha: 255,
    mass: 50000,
    size: 12,
    drag: 0.012,
    speed: 8,
    maxSpeed: 100,
    maneauverability: 1,
    bullet: {
      type: "normal",
      level: 1,
      color: { r: 60, g: 255, b: 80 },
      delay: 1,
      speed: 1,
    }
  },
  player: {
    inherits: ["ship"],
    timers: { gameOver: 1 },
    health: 60,
    maxHealth: 100,
    fuel: 10,
    maxFuel: 50,
    ammo: 100,
    maxAmmo: 200,
    score: 0,
  },
  enemy: {
    inherits: ["ship"],
    health: 15,
    maxHealth: 15,
    bullet: {
      delay: 2,
    }
  },
  sun: {
    inherits: ["physicalObject"],
    radius: 300,
    density: 1.4,
    get mass() { return Math.PI * 300 ** 2 * 1.4 },
  },
  event: {
    type: "none",
    group: "none",
    timeRemaining: 0,
  },
  bullet: {
    inherits: ["physicalObject"],
    ownerId: null,
    type: "normal",
    level: 1,
    mass: 2000,
    color: { r: 255, g: 255, b: 255 },
    timeRemaining: 4,
    duration: 4,
    damage: 5,
    consumes: 1,
    speed: 120,
    delay: 0.4,
    radius: 0.5,
    impactForce: 1,
    px: 0,
    py: 0,
    gravity: true,
  },
  explosion: {
    inherits: ["physicalObject"],
    targetId: null,
    radius: 20,
    timeRemaining: 5,
    duration: 5,
    get volume() { return Math.min(1, 1 - 10 / this.radius); }
  }
};

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

function randomId() {
  const size = 16;
  return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function createGameObject(name) {
  function createObject(name) {
    let object = CLASS_PROPERTIES[name];
    let parent = object.hasOwnProperty("inherits") ? object.inherits.reduce((a, b) => {
      return merge(a, createObject(b));
    }, {}) : {};
    return merge(parent, object);
  }

  let object = createObject(name);
  object.name = name;
  object.id = randomId();
  object.inherits.push(name);
  return object;
}

function createGameState() {
  let state = {
    sun: createGameObject("sun"),
    player: createGameObject("player"),
    asteroids: [],
    enemies: [],
    bullets: [],
    events: [],
    explosions: [],
  };

  // Player starting position
  const PLAYER_INITIAL_VELOCITY = 40;
  let { pos, angle } = getRandomSpawn(state, 200, 200, -1, 0);
  angle += PI * 0.3;
  state.player.x = pos.x;
  state.player.y = pos.y;
  state.player.vx = cos(angle) * PLAYER_INITIAL_VELOCITY;
  state.player.vy = sin(angle) * PLAYER_INITIAL_VELOCITY;
  state.player.angle = angle;

  // Asteroids
  const SPAWN_RADIUS = 200;
  for (let i = 0; i < 1; ++i) {
    for (let i = 0; i < 28; ++i)
      spawnAsteroidObject(state, "normal", SPAWN_RADIUS);
    for (let i = 0; i < 8; ++i)
      spawnAsteroidObject(state, "fuel", SPAWN_RADIUS);
    for (let i = 0; i < 3; ++i)
      spawnAsteroidObject(state, "health", SPAWN_RADIUS);
    for (let i = 0; i < 6; ++i)
      spawnAsteroidObject(state, "ammo", SPAWN_RADIUS);
  }

  return state;
}

function getRunningEffects(object) {
  if (!object.hasOwnProperty("activeEffects")) return [];
  
  // Only the first active effect of each group is considered "running"
  let runningEffects = [];
  let effectGroups = new Set();
  for (effect of object.activeEffects) {
    if (effectGroups.has(effect.group)) continue;
    effectGroups.add(effect.group);
    runningEffects.push(effect);
  }
  
  return runningEffects;
}

function getRunningEffect(object, effectType) {
  const runningEffects = getRunningEffects(object);
  for (effect of runningEffects) {
    if (effect.type === effectType) return effect;
  }
  return null;
}

function getAllGameObjects(object) {
  if (typeof object !== "object") return [];
  if (object.hasOwnProperty("id")) return [object];
  if (Array.isArray(object)) return object.map(getAllGameObjects).flat();
  return Object.values(object).map(getAllGameObjects).flat();
}

function getGameObjectById(gameState, id) {
  let objects = getAllGameObjects(gameState);
  
  for (let object of objects) {
    if (object.id === id) return object;
  }

  return null;
}
