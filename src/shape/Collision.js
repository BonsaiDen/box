
// AABB / AABB ----------------------------------------------------------------
function testAABBvsAABB(a, b) {
    if (a.max.x < b.min.x || a.min.x > b.max.x) {
        return false;

    } else if (a.max.y < b.min.y || a.min.y > b.max.y) {
        return false;

    } else {
        return true;
    }
}

function resolveAABBvsAABB(m, a, b) {

    // Vector from A to B
    var nx = a.position.x - b.position.x,
        ny = a.position.y - b.position.y;

    // Overlap on x axis
    var xoverlap = a.extend.x + b.extend.x - Math.abs(nx);
    if (xoverlap > 0) {

        // Overlap on x axis
        var yoverlap = a.extend.y + b.extend.y - Math.abs(ny);
        if (yoverlap) {

            // Find out which axis is the axis of least penetration
            if (xoverlap < yoverlap) {

                // Point towards B knowing that n points from A to B
                m.normal.x = nx < 0.0 ? 1.0 : -1.0;
                m.normal.y = 0.0;
                m.penetration = xoverlap;

                // Contact Information
                var x = m.normal.x > 0.0 ? b.min.x : b.max.x;
                m.contacts[0].x = x;
                m.contacts[1].x = x;

                m.contacts[0].y = Math.max(b.min.y, a.min.y);
                m.contacts[1].y = Math.min(b.max.y, a.max.y);
                m.contactCount = 2;

                return true;

            } else {

                // Point towards B knowing that n points from A to B
                m.normal.x = 0.0;
                m.normal.y = ny < 0.0 ? 1.0 : -1.0;
                m.penetration = yoverlap;

                // Contact Information
                var y = m.normal.y > 0.0 ? b.min.y : b.max.y;
                m.contacts[0].y = y;
                m.contacts[1].y = y;
                m.contacts[0].x = Math.max(b.min.x, a.min.x);
                m.contacts[1].x = Math.min(b.max.x, a.max.x);
                m.contactCount = 2;

                return true;

            }

        }

    }

    m.contactCount = 0;

    return false;

}

// Circle / Circle ------------------------------------------------------------
function testCircleVsCircle(a, b) {

    var nx = b.position.x - a.position.x,
        ny = b.position.y - a.position.y,
        radius = a.radius + b.radius;

    return nx * nx + ny * ny < radius * radius;

}

function resolveCircleVsCircle(m, a, b) {

    var nx = b.position.x - a.position.x,
        ny = b.position.y - a.position.y,
        distance = Math.sqrt(nx * nx + ny * ny),
        radius = a.radius + b.radius;

    m.contactCount = 1;

    // Circles overlap completely so we need to avoid creating NaN values
    if (distance === 0.0) {
        m.penetration = a.radius;
        m.normal.x = 1;
        m.normal.y = 0;
        m.contacts[0].x = a.position.x;
        m.contacts[0].y = a.position.y;
        return true;

    // Partial overlap
    } else {
        m.penetration = radius - distance;
        m.normal.x = nx / distance;
        m.normal.y = ny / distance;
        m.contacts[0].x = m.normal.x * a.radius + a.position.x;
        m.contacts[0].y = m.normal.y * a.radius + a.position.y;
        return true;
    }

}

// Circle / AABB --------------------------------------------------------------
function testCircleVsAABB(a, b) {

    // Treat both as a AABB
    var nx = a.position.x - b.position.x,
        ny = a.position.y - b.position.y;

    var xoverlap = a.radius + b.extend.x - Math.abs(nx),
        yoverlap = a.radius + b.extend.y - Math.abs(ny);

    return xoverlap > 0.0 && yoverlap > 0.0;

}

function resolveCircleVsAABB(m, a, b) {

    var dx = a.position.x - b.position.x,
        dy = a.position.y - b.position.y,
        ox = dx > 0.0 ? b.extend.x : -b.extend.x,
        oy = dy > 0.0 ? b.extend.y : -b.extend.y,
        cx = 0.0,
        cy = 0.0;

    // Find closest the point of contact, either one of the corners...
    if (Math.abs(dx) > b.extend.x && Math.abs(dy) > b.extend.y) {
        cx = b.position.x + ox;
        cy = b.position.y + oy;

    // ...top or bottom edge....
    } else if ((dy < -b.extend.y || dy > b.extend.y)
             && dx < b.extend.x && dx > -b.extend.x) {

        cx = b.position.x + dx;
        cy = b.position.y + oy;

    // ...left or right edge...
    } else {
        cx = b.position.x + ox;
        cy = b.position.y + dy;
    }

    // Check if we actually do overlap with the contact point
    var cdx = cx - a.position.x,
        cdy = cy - a.position.y;

    if (cdx * cdx + cdy * cdy <= a.radius * a.radius) {

        var dist = Math.sqrt(cdx * cdx + cdy * cdy);

        // Contact Information
        m.normal.x = cdx / dist;
        m.normal.y = cdy / dist;
        m.contacts[0].x = cx;
        m.contacts[0].y = cy;
        m.penetration = a.radius - dist;

        m.contactCount = 1;
        return true;

    } else {
        m.contactCount = 0;
        return false;
    }

}


// Callbacks ------------------------------------------------------------------
function CollisionHandler(func, inverted) {
    this.func = func;
    this.inverted = !!inverted;
}

// [Shape ID A][Shape ID B] -> Callback, Invert operands
var TEST_HANDLER = [
    [
        // AABB vs ...
        new CollisionHandler(testAABBvsAABB, false),     // AABB
        new CollisionHandler(testCircleVsAABB, true)     // Circle

    ], [
        // Circle vs ...
        new CollisionHandler(testCircleVsAABB, false),   // AABB
        new CollisionHandler(testCircleVsCircle, false), // Circle
    ]
];

// Shape A ID, Shape B ID -> Callback, Invert operands and result normal
var RESOLVE_HANDLER = [
    [
        // AABB vs ...
        new CollisionHandler(resolveAABBvsAABB, false),     // AABB
        new CollisionHandler(resolveCircleVsAABB, true)     // Circle

    ], [
        // Circle vs ...
        new CollisionHandler(resolveCircleVsAABB, false),   // AABB
        new CollisionHandler(resolveCircleVsCircle, false), // Circle
    ]
];


// Statics --------------------------------------------------------------------
function testCollision(a, b) {

    var handler = TEST_HANDLER[a.shapeId][b.shapeId];
    if (handler.inverted) {
        return handler.func(b, a);

    } else {
        return handler.func(a, b);
    }

}

function resolveCollision(manifold, a, b) {

    var handler = RESOLVE_HANDLER[a.shapeId][b.shapeId],
        result;

    if (handler.inverted) {

        result = handler.func(manifold, b, a);

        if (result) {
            manifold.normal.x = -manifold.normal.x;
            manifold.normal.y = -manifold.normal.y;
        }

    } else {
        result = handler.func(manifold, a, b);
    }

    return result;

}

