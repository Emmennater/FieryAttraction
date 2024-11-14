
/**
 * Calculates the angle that a turret must lead a target by to intercept it with a projectile.
 * The projectile is assumed to be traveling at a constant speed.
 * 
 * @param {Object} turret - The turret doing the firing. Must have x, y, vx, vy properties.
 * @param {Object} target - The target to intercept. Must have x, y, vx, vy properties.
 * @param {number} bulletSpeed - The speed of the projectile in the turret's local frame.
 * @returns {number} The angle that the turret must lead the target by to intercept it. (NaN means no intercept)
 */
function getInterceptAngle(turret, target, bulletSpeed) {
    if (bulletSpeed === 0) return NaN;

    // Turret velocity
    const turretVx = turret.vx || 0;
    const turretVy = turret.vy || 0;

    // Target velocity
    const targetVx = target.vx;
    const targetVy = target.vy;

    // Relative velocities and positions
    const relVx = targetVx - turretVx;
    const relVy = targetVy - turretVy;
    const relPx = target.x - turret.x;
    const relPy = target.y - turret.y;

    // Quadratic coefficients
    const a = relVx ** 2 + relVy ** 2 - bulletSpeed ** 2;
    const b = 2 * (relVx * relPx + relVy * relPy);
    const c = relPx ** 2 + relPy ** 2;

    // Solve the quadratic equation for t
    const discriminant = b ** 2 - 4 * a * c;
    if (discriminant < 0) return NaN; // No solution: target cannot be intercepted

    // Choose the smallest positive t (intercept time)
    const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t = Math.min(t1, t2) > 0 ? Math.min(t1, t2) : Math.max(t1, t2);

    if (t <= 0) return NaN; // No valid intercept time

    // Calculate the lead angle
    const interceptX = relPx + relVx * t;
    const interceptY = relPy + relVy * t;
    return Math.atan2(interceptY, interceptX);
}

function elasticCollision(objectA, objectB) {
    const objectAVel = objectA.getVelocity();
    const objectBVel = objectB.getVelocity();

    // Calculate the direction between player and object
    const playerToObject = [objectB.x - objectA.x, objectB.y - objectA.y];
    const playerToObjectMag = Math.hypot(playerToObject[0], playerToObject[1]);
    const playerToObjectNorm = [playerToObject[0] / playerToObjectMag, playerToObject[1] / playerToObjectMag];

    // Project the velocities onto the collision normal
    const playerNorm = objectAVel.x * playerToObjectNorm[0] + objectAVel.y * playerToObjectNorm[1];
    const objectNorm = objectBVel.x * playerToObjectNorm[0] + objectBVel.y * playerToObjectNorm[1];

    // Apply the conservation of momentum (elastic collision)
    const combinedMass = objectA.m + objectB.m;
    const playerNewNormX = (playerNorm * (objectA.m - objectB.m) + 2 * objectB.m * objectNorm) / combinedMass;
    const objectNewNormX = (objectNorm * (objectB.m - objectA.m) + 2 * objectA.m * playerNorm) / combinedMass;

    // Update velocities based on the new projected velocity in the normal direction
    const avx = playerNewNormX * playerToObjectNorm[0];
    const avy = playerNewNormX * playerToObjectNorm[1];

    const bvx = objectNewNormX * playerToObjectNorm[0];
    const bvy = objectNewNormX * playerToObjectNorm[1];

    objectA.setVelocity(avx, avy);
    objectB.setVelocity(bvx, bvy);
}
