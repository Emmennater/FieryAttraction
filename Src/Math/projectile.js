
/**
 * Calculates the angle that a turret must lead a target by to intercept it with a projectile.
 * The projectile is assumed to be traveling at a constant speed.
 * 
 * @param {Object} turret - The turret doing the firing. Must have x, y, and a (angle) properties.
 * @param {Object} target - The target to intercept. Must have x, y, vx, and vy properties.
 * @param {number} bulletSpeed - The speed of the projectile.
 * @returns {number} The angle that the turret must lead the target by to intercept it. (NaN means no intercept)
 */
function getInterceptAngle(turret, target, bulletSpeed) {
    if (bulletSpeed == 0) return 0;

    // Calculating projectile info
    let angleToTarget = fixAngle(atan2(target.y - turret.y, target.x - turret.x));
    let angleOfTarget = fixAngle(atan2(target.vy, target.vx));
    let targetSpeed = Math.hypot(target.vx, target.vy);
    
    // Calculating target angle
    let B = angleOfTarget - angleToTarget;
    let ratio = sin(B) * targetSpeed / bulletSpeed;
    
    // Handle no intercept
    if (Math.abs(ratio) > 1) return NaN;
    
    let A = asin(ratio);
    
    return A + angleToTarget;
}

function elasticCollision(objectA, objectB) {
    // Conservation of momentum
    const playerOldVx = objectA.vx;
    const playerOldVy = objectA.vy;
    const objectOldVx = objectB.vx;
    const objectOldVy = objectB.vy;

    // Calculate the direction between player and object
    const playerToObject = [objectB.x - objectA.x, objectB.y - objectA.y];
    const playerToObjectMag = Math.hypot(playerToObject[0], playerToObject[1]);
    const playerToObjectNorm = [playerToObject[0] / playerToObjectMag, playerToObject[1] / playerToObjectMag];

    // Project the velocities onto the collision normal
    const playerNorm = objectA.vx * playerToObjectNorm[0] + objectA.vy * playerToObjectNorm[1];
    const objectNorm = objectB.vx * playerToObjectNorm[0] + objectB.vy * playerToObjectNorm[1];

    // Apply the conservation of momentum (elastic collision)
    const combinedMass = objectA.m + objectB.m;
    const playerNewNormX = (playerNorm * (objectA.m - objectB.m) + 2 * objectB.m * objectNorm) / combinedMass;
    const objectNewNormX = (objectNorm * (objectB.m - objectA.m) + 2 * objectA.m * playerNorm) / combinedMass;

    // Update velocities based on the new projected velocity in the normal direction
    objectA.vx = playerNewNormX * playerToObjectNorm[0];
    objectA.vy = playerNewNormX * playerToObjectNorm[1];

    objectB.vx = objectNewNormX * playerToObjectNorm[0];
    objectB.vy = objectNewNormX * playerToObjectNorm[1];
}
