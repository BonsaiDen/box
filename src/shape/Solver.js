// Class ----------------------------------------------------------------------
function Solver() {
}


// Statics --------------------------------------------------------------------
Solver.AABBvsAABB = function(manifold, a, b) {

    // Vector from A to B
    var nx = a.position.x - b.position.x,
        ny = a.position.y - b.position.y;

    // Calculate half extends along x axis
    var aex = (a.max.x - a.min.x) / 2,
        bex = (b.max.x - b.min.x) / 2;

    // Overlap on x axis
    var xoverlap = aex + bex - Math.abs(nx);
    if (xoverlap > 0) {

        // Calculate half extends along y axis
        var aey = (a.max.y - a.min.y) / 2,
            bey = (b.max.y - b.min.y) / 2;

        // Overlap on x axis
        var yoverlap = aey + bey - Math.abs(ny);
        if (yoverlap) {

            // Find out which axis is the axis of least penetration
            if (xoverlap < yoverlap) {

                // Point towards B knowing that n points from A to B
                manifold.normal.x = nx < 0 ? 1 : -1;
                manifold.normal.y = 0;
                manifold.penetration = xoverlap;

                // Contact Information
                var x = manifold.normal.x > 0.0 ? b.min.x : b.max.x;
                manifold.contacts[0].x = x;
                manifold.contacts[1].x = x;

                manifold.contacts[0].y = Math.max(b.min.y, a.min.y);
                manifold.contacts[1].y = Math.min(b.max.y, a.max.y);
                manifold.contactCount = 2;

                return true;

            } else {

                // Point towards B knowing that n points from A to B
                manifold.normal.x = 0;
                manifold.normal.y = ny < 0 ? 1 : -1;
                manifold.penetration = yoverlap;

                // Contact Information
                var y = manifold.normal.y > 0.0 ? b.min.y : b.max.y;
                manifold.contacts[0].y = y;
                manifold.contacts[1].y = y;
                manifold.contacts[0].x = Math.max(b.min.x, a.min.x);
                manifold.contacts[1].x = Math.min(b.max.x, a.max.x);
                manifold.contactCount = 2;

                return true;

            }

        }

    }

    manifold.contactCount = 0;

    return false;

};

