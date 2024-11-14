
class CollisionMesh {
  constructor(points) {
    this.points = points || [];
    this.tris = [];
    this.boundingRadius = 0;

    // Transform
    this.transformedTris = [];
    this.transformUpdated = false;
    this.rotation = 0;
    this.scl = 1;
    this.pos = { x: 0, y: 0 };
    this.origin = { x: 0, y: 0 };

    this.setOrigin(...Object.values(this.getMidPoint()));
    this.updateMesh();
  }

  setPoints(points) {
    this.points = points;
    this.transformUpdated = false;
    this.setOrigin(...Object.values(this.getMidPoint()));
    this.updateMesh();
  }

  setPosition(x, y) {
    this.pos.x = x;
    this.pos.y = y;
    this.transformUpdated = false;
  }

  setScale(scl) {
    this.scl = scl;
    this.transformUpdated = false;
  }

  setRotation(rotation) {
    this.rotation = rotation;
    this.transformUpdated = false;
  }

  setOrigin(x, y) {
    this.origin.x = x;
    this.origin.y = y;
    this.generateBoundingCircle();
    this.transformUpdated = false;
  }

  getMidPoint() {
    let mx = 0;
    let my = 0;

    if (this.points.length == 0) {
      return { x: 0, y: 0 };
    }

    for (let pt of this.points) {
      mx += pt.x;
      my += pt.y;
    }

    mx /= this.points.length;
    my /= this.points.length;

    return { x: mx, y: my };
  }

  getTransformedConvexPolygons() {
    if (!this.transformUpdated) {
      this.generateTransformedConvexPolygons();
    }

    return this.transformedTris;
  }

  getBoundingRadius() {
    return this.boundingRadius * this.scl;
  }

  generateTransformedConvexPolygons() {
    this.transformedTris = [];

    for (let p of this.tris) {
      this.transformedTris.push(SATCollision.transformPolygon(p, this.rotation, this.origin, this.pos, this.scl));
    }

    this.transformUpdated = true;
  }

  generateBoundingCircle() {
    const origin = this.origin;
    let maxRadius = 0;

    for (let i = 0; i < this.points.length; i++) {
      const pt = this.points[i];
      const radius = Math.hypot(origin.x - pt.x, origin.y - pt.y);
      maxRadius = Math.max(maxRadius, radius);
    }

    this.boundingRadius = maxRadius;
  }

  generateConvexPolygons() {
    if (this.points.length < 3) {
      this.tris = [];
      return;
    }

    this.tris = PolygonTriangulator.triangulate(this.points);
  }

  updateMesh() {
    this.generateConvexPolygons();
    this.updateTransform();
  }

  updateTransform() {
    this.getTransformedConvexPolygons();
  }

  collidesBoundarys(otherMesh) {
    const sumRadii = this.boundingRadius * this.scl + otherMesh.boundingRadius * otherMesh.scl;
    const x1 = this.pos.x;
    const y1 = this.pos.y;
    const x2 = otherMesh.pos.x;
    const y2 = otherMesh.pos.y;
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy < sumRadii * sumRadii;
  }

  collides(collisionMesh) {
    if (!this.collidesBoundarys(collisionMesh)) return false;

    const convexPolysA = this.getTransformedConvexPolygons();
    const convexPolysB = collisionMesh.getTransformedConvexPolygons();

    for (let p1 of convexPolysA) {
      for (let p2 of convexPolysB) {
        if (SATCollision.isColliding(p1, p2)) return true;
      }
    }

    return false;
  }

  boundaryContainsCircle(x, y, r) {
    const sumRadii = this.boundingRadius * this.scl + r;
    const dx = x - this.pos.x;
    const dy = y - this.pos.y;
    return dx * dx + dy * dy < sumRadii * sumRadii;
  }

  boundaryContainsPoint(x, y) {
    const sumRadii = this.boundingRadius * this.scl;
    const x1 = this.pos.x;
    const y1 = this.pos.y;
    const dx = x1 - x;
    const dy = y1 - y;
    return dx * dx + dy * dy < sumRadii * sumRadii;
  }

  containsPoint(x, y) {
    if (!this.boundaryContainsPoint(x, y)) return false;

    const convexPolys = this.getTransformedConvexPolygons();

    for (let poly of convexPolys) {
      if (SATCollision.isPointInPolygon({ x, y }, poly)) return true;
    }

    return false;
  }

  intersectsLine(x1, y1, x2, y2) {
    const r = Math.hypot(x1 - x2, y1 - y2) * 0.5;
    const midpointX = (x1 + x2) * 0.5;
    const midpointY = (y1 + y2) * 0.5;

    if (!this.boundaryContainsCircle(midpointX, midpointY, r)) return false;

    const convexPolys = this.getTransformedConvexPolygons();

    for (let poly of convexPolys) {
      if (SATCollision.doesLineIntersectPolygon({ x: x1, y: y1 }, { x: x2, y: y2 }, poly)) return true;
    }

    return false;
  }

  draw(ctx, fcol = color(0, 0), scol = color(255), transformed = true) {
    const polygons = this.transformUpdated && transformed ? this.transformedTris : this.tris;
    const scalar = transformed ? this.scl : 1;
    const sWeight = 1 / panzoom.zoom;

    // Polygon edges
    ctx.fill(fcol);
    ctx.stroke(scol);
    ctx.strokeWeight(sWeight);
    for (let p of polygons) {
      ctx.beginShape();
      for (let pt of p) {
        ctx.vertex(pt.x, pt.y);
      }
      ctx.endShape(CLOSE);
    }

    // Bounding circle
    ctx.noFill();
    ctx.strokeWeight(sWeight * 0.2);
    ctx.circle(this.pos.x, this.pos.y, this.boundingRadius * 2 * scalar);

    // Origin
    // ctx.strokeWeight(sweight * 6);
    // ctx.point(this.origin.x + this.pos.x, this.origin.y + this.pos.y);

    // Points
    // for (let p of this.points) {
    //   ctx.point(p.x, p.y);
    // }
  }
}

class SATCollision {
  static dotProduct(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  static subtract(v1, v2) {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
  }

  static cross(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
  }

  static perpendicular(edge) {
    return { x: -edge.y, y: edge.x };
  }

  static projectPolygon(polygon, axis) {
    let min = SATCollision.dotProduct(polygon[0], axis);
    let max = min;

    for (let i = 1; i < polygon.length; i++) {
      let projection = SATCollision.dotProduct(polygon[i], axis);
      if (projection < min) {
        min = projection;
      } else if (projection > max) {
        max = projection;
      }
    }

    return { min, max };
  }

  static overlap(projection1, projection2) {
    return projection1.max >= projection2.min && projection2.max >= projection1.min;
  }

  static transformPoint(point, angle, origin = { x: 0, y: 0 }, offset = { x: 0, y: 0 }, scl = 1) {
    let px = (point.x - origin.x) * scl;
    let py = (point.y - origin.y) * scl;
    let cos = Math.cos(angle);
    let sin = Math.sin(angle);
    return {
      x: px * cos - py * sin + offset.x,
      y: px * sin + py * cos + offset.y
    };
  }

  static transformPolygon(polygon, angle, origin = { x: 0, y: 0 }, offset = { x: 0, y: 0 }, scl = 1) {
    return polygon.map(vertex => SATCollision.transformPoint(vertex, angle, origin, offset, scl));
  }

  static isColliding(polygon1, polygon2) {
    let polygons = [polygon1, polygon2];

    for (let i = 0; i < polygons.length; i++) {
      let polygon = polygons[i];

      for (let j = 0; j < polygon.length; j++) {
        // Get the current edge of the polygon
        let vertex1 = polygon[j];
        let vertex2 = polygon[(j + 1) % polygon.length];

        // Calculate the edge and its perpendicular axis
        let edge = SATCollision.subtract(vertex2, vertex1);
        let axis = SATCollision.perpendicular(edge);

        // Project both polygons onto the axis
        let projection1 = SATCollision.projectPolygon(polygon1, axis);
        let projection2 = SATCollision.projectPolygon(polygon2, axis);

        // Check for overlap along this axis
        if (!SATCollision.overlap(projection1, projection2)) {
          // If there's no overlap, polygons are not colliding
          return false;
        }
      }
    }

    // If all axes have overlaps, the polygons are colliding
    return true;
  }

  static isPointInPolygon(point, polygon) {
    // Iterate through each edge of the polygon
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        
        // Vector representing the edge
        const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
        
        // Vector from the polygon vertex to the point
        const pointVector = { x: point.x - p1.x, y: point.y - p1.y };
        
        // Calculate the cross product of the edge and point vector
        const crossProduct = edge.x * pointVector.y - edge.y * pointVector.x;
        
        // If the cross product is negative, the point is outside this edge
        if (crossProduct > 0) {
            return false;
        }
    }
    
    // If the point is on the correct side of all edges, it's inside the polygon
    return true;
  }

  static doesLineIntersectPolygon(lineStart, lineEnd, polygon) {
    // Helper function to check if two line segments intersect
    const doLinesIntersect = (p1, p2, q1, q2) => {
      // Calculate vectors
      const r = { x: p2.x - p1.x, y: p2.y - p1.y };
      const s = { x: q2.x - q1.x, y: q2.y - q1.y };
      const qp = { x: q1.x - p1.x, y: q1.y - p1.y };
      
      const rxs = SATCollision.cross(r, s);
      const t = SATCollision.cross(qp, s) / rxs;
      const u = SATCollision.cross(qp, r) / rxs;
      
      // Check if t and u are within [0, 1] range
      return rxs !== 0 && t >= 0 && t <= 1 && u >= 0 && u <= 1;
    };
    
    // Check if line intersects any edge of the polygon
    for (let i = 0; i < polygon.length; i++) {
      const polyStart = polygon[i];
      const polyEnd = polygon[(i + 1) % polygon.length];
      
      if (doLinesIntersect(lineStart, lineEnd, polyStart, polyEnd)) {
        return true;
      }
    }
    
    // Check if the line's start or end point is inside the polygon
    if (this.isPointInPolygon(lineStart, polygon) || this.isPointInPolygon(lineEnd, polygon)) {
      return true;
    }
    
    return false;
  }
}

class PolygonTriangulator {
  static isConvex(p1, p2, p3) {
    // Cross product to determine if the angle is convex
    const crossProduct = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return crossProduct < 0;
  }

  static areaOfTriangle(p1, p2, p3) {
    return 0.5 * Math.abs(p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y));
  }

  static isPointInTriangle(p, p1, p2, p3) {
    const areaOrig = PolygonTriangulator.areaOfTriangle(p1, p2, p3);
    const area1 = PolygonTriangulator.areaOfTriangle(p, p2, p3);
    const area2 = PolygonTriangulator.areaOfTriangle(p1, p, p3);
    const area3 = PolygonTriangulator.areaOfTriangle(p1, p2, p);

    return Math.abs(areaOrig - (area1 + area2 + area3)) < 1e-10;
  }

  static isPointInTriangles(p, ...triangles) {
    for (let triangle of triangles) {
      if (PolygonTriangulator.isPointInTriangle(p, triangle[0], triangle[1], triangle[2])) {
        return true;
      }
    }

    return false;
  }

  static isEar(polygon, i) {
    const prev = polygon[(i - 1 + polygon.length) % polygon.length];
    const curr = polygon[i];
    const next = polygon[(i + 1) % polygon.length];

    // Check if the triangle formed by prev, curr, and next is convex
    if (!PolygonTriangulator.isConvex(prev, curr, next)) return false;

    // Check if any other point lies inside the triangle
    for (let j = 0; j < polygon.length; j++) {
      if (j !== i && j !== (i - 1 + polygon.length) % polygon.length && j !== (i + 1) % polygon.length) {
        if (PolygonTriangulator.isPointInTriangle(polygon[j], prev, curr, next)) return false;
      }
    }

    return true;
  }

  static shareEdge(polygon1, polygon2) {
    let sharedVertices = [];
    for (let i = 0; i < polygon1.length; i++) {
      for (let j = 0; j < polygon2.length; j++) {
        if (polygon1[i].x === polygon2[j].x && polygon1[i].y === polygon2[j].y) {
          sharedVertices.push(polygon1[i]);
        }
      }
    }
    return sharedVertices.length === 2 ? sharedVertices : null;
  }

  static mergeIfConvex(polygon1, polygon2, sharedEdge) {
    const combined = polygon1.concat(polygon2.filter(pt => !sharedEdge.includes(pt)));

    for (let i = 0; i < combined.length; i++) {
      const p1 = combined[i];
      const p2 = combined[(i + 1) % combined.length];
      const p3 = combined[(i + 2) % combined.length];
      if (!PolygonTriangulator.isConvex(p1, p2, p3)) return null;
    }

    return combined; // Return the combined polygon if convex
  }

  static mergeConvexPolygons(polygons) {
    let mergedPolygons = [...polygons];
    let hasMerged = true;

    while (hasMerged) {
      hasMerged = false;
      let newPolygons = [];

      for (let i = 0; i < mergedPolygons.length; i++) {
        let merged = false;

        for (let j = i + 1; j < mergedPolygons.length; j++) {
          const sharedEdge = PolygonTriangulator.shareEdge(mergedPolygons[i], mergedPolygons[j]);

          if (sharedEdge) {
            const mergedPolygon = PolygonTriangulator.mergeIfConvex(mergedPolygons[i], mergedPolygons[j], sharedEdge);

            if (mergedPolygon) {
              newPolygons.push(mergedPolygon);
              mergedPolygons.splice(j, 1); // Remove the merged polygon
              merged = true;
              hasMerged = true;
              break;
            }
          }
        }

        if (!merged) {
          newPolygons.push(mergedPolygons[i]);
        }
      }

      mergedPolygons = newPolygons;
    }

    return mergedPolygons;
  }

  static triangulate(polygon) {
    if (polygon.length < 3) return [];

    const triangles = [];
    const remainingPoints = polygon.slice();

    while (remainingPoints.length > 3) {
      let earFound = false;
      for (let i = 0; i < remainingPoints.length; i++) {
        if (PolygonTriangulator.isEar(remainingPoints, i)) {
          const prev = remainingPoints[(i - 1 + remainingPoints.length) % remainingPoints.length];
          const curr = remainingPoints[i];
          const next = remainingPoints[(i + 1) % remainingPoints.length];

          triangles.push([prev, curr, next]);

          remainingPoints.splice(i, 1);
          earFound = true;
          break;
        }
      }

      if (!earFound) {
        throw new Error("Polygon is not simple or is malformed.");
      }
    }

    // Add the last remaining triangle
    triangles.push([remainingPoints[0], remainingPoints[1], remainingPoints[2]]);

    return PolygonTriangulator.mergeConvexPolygons(triangles);
  }
}
