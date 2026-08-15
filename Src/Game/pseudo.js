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
Object wrappers can be used if they only represent state.

Self-detecting effect/event incompatibility:
- When an effect/event modifies a similar property.

*/

class EventCreator {
  static #newEvent(type, data) {
    return { type, ...data };
  }
  
  static objectCreated(id, name, params) {
    return this.#newEvent("object_created", { id, name, params });
  }
}

class State {};

State.prototype.Position = class Position {
  constructor(x, y) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }
}

State.prototype.Velocity = class Velocity {
  constructor(x, y) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }
}

State.prototype.CollisionMesh = class CollisionMesh {
  constructor(points, origin, scale) {
    this.points = points ?? [];
    this.origin = origin ?? new State.Position();
    this.scale = scale ?? 1;
  }
}

State.prototype.Sun = class Sun {
  constructor() {
    this.position = new State.Position();
    this.radius = 300;
    this.density = 1.4;
  }

  get mass() { return Math.PI * this.radius ** 2 * this.density; }
}

State.prototype.Asteroid = class Asteroid {
  constructor(position, velocity, radius) {
    this.position = position ?? new State.Position();
    this.velocity = velocity ?? new State.Velocity();
    this.radius = radius ?? 20;
    this.collisionMesh = new State.CollisionMesh();
  }
}

State.prototype.Ship = class Ship {
  constructor(position, velocity) {
    this.position = position ?? new State.Position();
    this.velocity = velocity ?? new State.Velocity();
    this.collisionMesh = new State.CollisionMesh();
  }
}

State.prototype.Player = class Player {
  constructor(ship, score) {
    this.ship = ship ?? new State.Ship();
    this.score = score ?? 0;
  }
}

State.prototype.Enemy = class Enemy {
  constructor(ship) {
    this.ship = ship ?? new State.Ship();
  }
}

State.prototype.Bullet = class Bullet {
  constructor(position, velocity) {
    this.position = position ?? new State.Position();
    this.velocity = velocity ?? new State.Velocity();
  }
}