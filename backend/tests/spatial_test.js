const assert = require('assert');
const { 
  computeCentroid, 
  computeConvexHull, 
  computePolygonAreaKm2, 
  computePolygonIntersection, 
  haversineDistance 
} = require('../src/utils/geoUtils');

console.log('--- Starting Spatial Intelligence Engine Unit Tests ---');

// 1. Centroid Test
const samplePoints = [
  { latitude: 21.684, longitude: 79.325 },
  { latitude: 21.691, longitude: 79.310 },
  { latitude: 21.652, longitude: 79.341 }
];
const centroid = computeCentroid(samplePoints);
console.log('Computed Centroid:', centroid);
assert(Math.abs(centroid.latitude - 21.67566) < 0.01, 'Centroid latitude should match mean');
assert(Math.abs(centroid.longitude - 79.32533) < 0.01, 'Centroid longitude should match mean');
console.log('✓ Centroid calculation verified.');

// 2. Convex Hull & Area Test
const hull = computeConvexHull(samplePoints);
console.log(`Convex Hull (${hull.length} vertices):`, hull);
assert(hull.length >= 4, 'Convex hull of 3 points should have 4 coordinates with closed ring');
const area = computePolygonAreaKm2(hull);
console.log(`Computed MCP Area: ${area.toFixed(2)} km²`);
assert(area > 0 && area < 100, 'MCP Area should be in valid physical range for tiger territory');
console.log('✓ Convex Hull & Metric Area calculation verified.');

// 3. Single Point Radial Buffer Test
const singlePt = [{ latitude: 21.684, longitude: 79.325 }];
const singleHull = computeConvexHull(singlePt);
assert(singleHull.length > 5, 'Single point should generate radial buffer polygon');
const singleArea = computePolygonAreaKm2(singleHull);
console.log(`Single point buffer area: ${singleArea.toFixed(2)} km²`);
assert(singleArea > 2.5 && singleArea < 4.0, '1km radius circle area should be ~pi*r^2 = 3.14 km²');
console.log('✓ Single-point buffer generation verified.');

// 4. Polygon Intersection & Overlap Test
const polyA = [
  [79.30, 21.60],
  [79.35, 21.60],
  [79.35, 21.65],
  [79.30, 21.65],
  [79.30, 21.60]
];

const polyB = [
  [79.32, 21.62],
  [79.38, 21.62],
  [79.38, 21.68],
  [79.32, 21.68],
  [79.32, 21.62]
];

const intersection = computePolygonIntersection(polyA, polyB);
console.log('Polygon Intersection Result:', intersection);
assert(intersection !== null, 'Overlapping polygons must produce intersection geometry');
const overlapArea = computePolygonAreaKm2(intersection);
console.log(`Overlap Area: ${overlapArea.toFixed(2)} km²`);
assert(overlapArea > 0, 'Overlap area must be strictly positive');
console.log('✓ Sutherland-Hodgman Polygon Intersection verified.');

// 5. Non-overlapping Polygons Test
const polyC = [
  [79.50, 21.80],
  [79.55, 21.80],
  [79.55, 21.85],
  [79.50, 21.85],
  [79.50, 21.80]
];
const noIntersection = computePolygonIntersection(polyA, polyC);
assert(noIntersection === null, 'Disjoint polygons must return null intersection');
console.log('✓ Disjoint polygon isolation verified.');

console.log('====================================================');
console.log('ALL SPATIAL TESTS PASSED SUCCESSFULLY! ✓');
console.log('====================================================');
