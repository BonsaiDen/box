// AABB -----------------------------------------------------------------------
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

    // Calculate half extends along x axis
    var aex = (a.max.x - a.min.x) / 2,
        bex = (b.max.x - b.min.x) / 2;

    // Overlap on x axis
    var xoverlap = aex + bex - abs(nx);
    if (xoverlap > 0) {

        // Calculate half extends along y axis
        var aey = (a.max.y - a.min.y) / 2,
            bey = (b.max.y - b.min.y) / 2;

        // Overlap on x axis
        var yoverlap = aey + bey - abs(ny);
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

                m.contacts[0].y = max(b.min.y, a.min.y);
                m.contacts[1].y = min(b.max.y, a.max.y);
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
                m.contacts[0].x = max(b.min.x, a.min.x);
                m.contacts[1].x = min(b.max.x, a.max.x);
                m.contactCount = 2;

                return true;

            }

        }

    }

    m.contactCount = 0;

    return false;

}

// Circle ---------------------------------------------------------------------
function testCircleVsCircle(a, b) {

    var nx = b.position.x - a.position.x,
        ny = b.position.y - a.position.y,
        radius = a.radius + b.radius;

    return nx * nx + ny * ny < radius * radius;

}

function resolveCircleVsCircle(m, a, b) {

    var nx = b.position.x - a.position.x,
        ny = b.position.y - a.position.y,
        distance = sqrt(nx * nx + ny * ny),
        radius = a.radius + b.radius;

    m.contactCount = 1;

    // Circles overlap completely so we need to avoid creating NaN values
    if (distance === 0.0) {
        m.penetration = a.radius;
        m.normal.x = 1;
        m.normal.y = 0;
        m.contacts[0].x = a.position.x;
        m.contacts[1].y = a.position.y;

    // Partial overlap
    } else {
        m.penetration = radius - distance;
        m.normal.x = nx / distance;
        m.normal.y = ny / distance;
        m.contacts[0].x = m.normal.x * a.radius + a.position.x;
        m.contacts[0].y = m.normal.y * a.radius + a.position.y;
    }

}


// Callbacks ------------------------------------------------------------------
// [Shape ID A][Shape ID B] -> Callback
var testCallbacks = [
    [testAABBvsAABB],
    [testCircleVsCircle]
];

// Shape A ID, Shape B ID -> Callback, Invert Normal
var resolveCallbacks = [
    [
        [resolveAABBvsAABB, false]
    ], [
        [resolveCircleVsCircle, false]
    ]
];


// Statics --------------------------------------------------------------------
function testCollision(a, b) {
    return testCallbacks[a.shapeId][b.shapeId](a, b);
}

function resolveCollision(manifold, a, b) {

    var response = resolveCallbacks[a.shapeId][b.shapeId],
        result;

    if ((result = response[0](manifold, a, b))) {

        // Invert the normal if required
        if (response[1]) {
            manifold.normal.x = -manifold.normal.x;
            manifold.normal.y = -manifold.normal.y;
        }

    }

    return result;

}

