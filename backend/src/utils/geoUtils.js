/**
 * Spatial calculations for Pench Tiger Reserve coordinates.
 * Haversine distance, centroid, Convex Hull, and Polygon area in km².
 */

// Earth radius in km
const EARTH_RADIUS_KM = 6371.0;

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Calculates Haversine distance between two GPS coordinates in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Computes arithmetic centroid of points.
 */
function computeCentroid(points) {
  if (!points || points.length === 0) {
    return { latitude: 21.6840, longitude: 79.3250 };
  }
  
  const sum = points.reduce((acc, pt) => ({
    lat: acc.lat + (pt.latitude || pt.lat || 0),
    lon: acc.lon + (pt.longitude || pt.lon || 0)
  }), { lat: 0, lon: 0 });
  
  return {
    latitude: sum.lat / points.length,
    longitude: sum.lon / points.length
  };
}

/**
 * Computes 2D Convex Hull of coordinates using Monotone Chain Algorithm.
 * Returns array of [lon, lat] coordinates forming closed polygon.
 */
function computeConvexHull(points) {
  if (!points || points.length === 0) return [];
  if (points.length === 1) {
    const p = points[0];
    const lon = p.longitude || p.lon || p[0];
    const lat = p.latitude || p.lat || p[1];
    // Create subtle buffer circle for single point
    return createPointBuffer(lat, lon, 1.0);
  }
  if (points.length === 2) {
    const p1 = points[0], p2 = points[1];
    const lat1 = p1.latitude || p1.lat || p1[1], lon1 = p1.longitude || p1.lon || p1[0];
    const lat2 = p2.latitude || p2.lat || p2[1], lon2 = p2.longitude || p2.lon || p2[0];
    return createLineBuffer(lat1, lon1, lat2, lon2, 1.0);
  }
  
  // Format as [[lon, lat], ...]
  const pts = points.map(p => [
    p.longitude || p.lon || (Array.isArray(p) ? p[0] : 0),
    p.latitude || p.lat || (Array.isArray(p) ? p[1] : 0)
  ]);
  
  // Sort lexicographically
  pts.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
  
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  
  // Lower hull
  const lower = [];
  for (let p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  
  // Upper hull
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  
  upper.pop();
  lower.pop();
  const hull = lower.concat(upper);
  
  // Close polygon loop
  if (hull.length > 0 && (hull[0][0] !== hull[hull.length - 1][0] || hull[0][1] !== hull[hull.length - 1][1])) {
    hull.push(hull[0]);
  }
  
  return hull;
}

function createPointBuffer(lat, lon, radiusKm = 1.0) {
  const coords = [];
  const numSteps = 16;
  const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const dLon = dLat / Math.cos(toRadians(lat));
  
  for (let i = 0; i <= numSteps; i++) {
    const angle = (i / numSteps) * 2 * Math.PI;
    const pLat = lat + Math.sin(angle) * dLat;
    const pLon = lon + Math.cos(angle) * dLon;
    coords.push([pLon, pLat]);
  }
  return coords;
}

function createLineBuffer(lat1, lon1, lat2, lon2, radiusKm = 1.0) {
  const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const dLon = dLat / Math.cos(toRadians((lat1 + lat2) / 2));
  
  return [
    [lon1 - dLon, lat1 - dLat],
    [lon2 - dLon, lat2 - dLat],
    [lon2 + dLon, lat2 + dLat],
    [lon1 + dLon, lat1 + dLat],
    [lon1 - dLon, lat1 - dLat]
  ];
}

/**
 * Computes approximate area of GeoJSON polygon in square kilometers.
 */
function computePolygonAreaKm2(coordinates) {
  if (!coordinates || coordinates.length < 3) return 0.0;
  
  // Shoelace formula scaled by equatorial & meridional km/degree at mean latitude
  const meanLat = coordinates.reduce((sum, pt) => sum + (pt[1] || pt.lat || 0), 0) / coordinates.length;
  const kmPerLat = 111.0;
  const kmPerLon = 111.0 * Math.cos(toRadians(meanLat));
  
  let area = 0.0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const x1 = (p1[0] !== undefined ? p1[0] : p1.longitude) * kmPerLon;
    const y1 = (p1[1] !== undefined ? p1[1] : p1.latitude) * kmPerLat;
    const x2 = (p2[0] !== undefined ? p2[0] : p2.longitude) * kmPerLon;
    const y2 = (p2[1] !== undefined ? p2[1] : p2.latitude) * kmPerLat;
    area += (x1 * y2 - x2 * y1);
  }
  
  return Math.abs(area / 2.0);
}

/**
 * Checks if a point [lon, lat] is inside a polygon [[lon, lat], ...].
 */
function isPointInsidePolygon(point, polygon) {
  const x = point[0] !== undefined ? point[0] : point.longitude;
  const y = point[1] !== undefined ? point[1] : point.latitude;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculates geometric intersection of two convex or simple polygons using Sutherland-Hodgman.
 * Returns array of [lon, lat] coordinates forming closed intersection polygon, or null if no overlap.
 */
function computePolygonIntersection(polyA, polyB) {
  if (!polyA || polyA.length < 3 || !polyB || polyB.length < 3) return null;

  // Clean closed rings
  const cleanA = polyA[0][0] === polyA[polyA.length - 1][0] && polyA[0][1] === polyA[polyA.length - 1][1]
    ? polyA.slice(0, -1) : [...polyA];
  const cleanB = polyB[0][0] === polyB[polyB.length - 1][0] && polyB[0][1] === polyB[polyB.length - 1][1]
    ? polyB.slice(0, -1) : [...polyB];

  // Helper: line intersection
  function lineIntersection(p1, p2, p3, p4) {
    const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
    if (Math.abs(d) < 1e-9) return null;
    const xi = ((p3[0] - p4[0]) * (p1[0] * p2[1] - p1[1] * p2[0]) - (p1[0] - p2[0]) * (p3[0] * p4[1] - p3[1] * p4[0])) / d;
    const yi = ((p3[1] - p4[1]) * (p1[0] * p2[1] - p1[1] * p2[0]) - (p1[1] - p2[1]) * (p3[0] * p4[1] - p3[1] * p4[0])) / d;
    return [xi, yi];
  }

  // Ensure clip polygon is oriented counter-clockwise
  let signedArea = 0;
  for (let i = 0; i < cleanB.length; i++) {
    const next = (i + 1) % cleanB.length;
    signedArea += (cleanB[next][0] - cleanB[i][0]) * (cleanB[next][1] + cleanB[i][1]);
  }
  const clipPoly = signedArea > 0 ? cleanB.slice().reverse() : cleanB;

  let outputList = cleanA;

  for (let j = 0; j < clipPoly.length; j++) {
    const cp1 = clipPoly[j];
    const cp2 = clipPoly[(j + 1) % clipPoly.length];
    const inputList = outputList;
    outputList = [];
    if (inputList.length === 0) break;

    let s = inputList[inputList.length - 1];

    const isInside = (p) => (cp2[0] - cp1[0]) * (p[1] - cp1[1]) - (cp2[1] - cp1[1]) * (p[0] - cp1[0]) >= -1e-9;

    for (let i = 0; i < inputList.length; i++) {
      const e = inputList[i];
      if (isInside(e)) {
        if (!isInside(s)) {
          const pt = lineIntersection(s, e, cp1, cp2);
          if (pt) outputList.push(pt);
        }
        outputList.push(e);
      } else if (isInside(s)) {
        const pt = lineIntersection(s, e, cp1, cp2);
        if (pt) outputList.push(pt);
      }
      s = e;
    }
  }

  if (outputList.length < 3) {
    // Check if one polygon is completely contained inside the other
    const aInB = cleanA.every(pt => isPointInsidePolygon(pt, cleanB));
    if (aInB) {
      const res = [...cleanA, cleanA[0]];
      return res;
    }
    const bInA = cleanB.every(pt => isPointInsidePolygon(pt, cleanA));
    if (bInA) {
      const res = [...cleanB, cleanB[0]];
      return res;
    }
    return null;
  }

  // Close ring
  const result = [...outputList, outputList[0]];
  const area = computePolygonAreaKm2(result);
  return area > 0.01 ? result : null;
}

module.exports = {
  haversineDistance,
  computeCentroid,
  computeConvexHull,
  computePolygonAreaKm2,
  isPointInsidePolygon,
  computePolygonIntersection
};

