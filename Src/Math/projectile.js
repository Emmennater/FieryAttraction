
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
