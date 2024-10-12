
class GameObject {
  constructor() {
    this.effects = [];
    this.makeCollisionMesh();
  }

  // Points must be defined in a counterclockwise order
  makeCollisionMesh(...pointArrays) {
    const pointObjects = pointArrays.map((points) => {
      return { x: points[0], y: points[1] };
    })

    this.collisionMesh = new CollisionMesh(pointObjects);
  }

  drawMesh(ctx) {
    this.collisionMesh.draw(ctx, color(0, 0), color(255, 0, 0));
  }

  collides(other) {
    return this.collisionMesh.collides(other.collisionMesh);
  }

  containsPoint(x, y) {
    return this.collisionMesh.boundaryContainsPoint(x, y);
  }

  applyEffect(Effect, dat = {}, sender = null) {
    const effect = addEffect(Effect, this, dat, sender);
    return effect;
  }

  removeEffect(effect) {
    this.effects.remove(effect);
  }
}
