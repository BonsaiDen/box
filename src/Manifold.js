// Class ----------------------------------------------------------------------
function Manifold() {

    this.a = null;
    this.b = null;
    this.e = 0.0;
    this.sf = 0.0;
    this.df = 0.0;

    this.normal = new Vector2(0, 0);
    this.penetration = 0.0;

    this.contacts = [
        new Vector2(0.0, 0.0),
        new Vector2(0.0, 0.0)
    ];

    this.contactCount = 0;

}


// Collision Solvers ----------------------------------------------------------
Manifold.solve = {

    AABBvsAABB: function(manifold, a, b) {

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

    }

};


// Methods --------------------------------------------------------------------
Manifold.prototype = {

    /**
      * Initialize the manifold by solving the collision between its two shapes.
      */
    init: function(a, b) {
        this.a = a;
        this.b = b;
        return Manifold.solve.AABBvsAABB(this, a, b);
    },

    /**
      * Setup the manifold for the collision phase.
      */
    setup: function(dt, gravity) {

        this.e = Math.min(this.a.restitution, this.b.restitution);
        this.sf = Math.sqrt(this.a.staticFriction * this.b.staticFriction);
        this.df = Math.sqrt(this.a.dynamicFriction * this.b.dynamicFriction);

        for(var i = 0; i < this.contactCount; i++) {

            var rvx = this.getRelativeVelocityX(this.contacts[i], this.a, this.b),
                rvy = this.getRelativeVelocityY(this.contacts[i], this.a, this.b);

            // Figure out whether this is a resting collision, if so do not apply
            // any restitution
            var g = (dt * gravity.x * gravity.x) + (dt * gravity.y * gravity.y);
            if ((rvx * rvx + rvy * rvy) < g + EPSILON) {
                this.e = 0.0;
            }

        }

    },

    /**
      * Resolve the collision of all contacts
      */
    resolve: function() {
        for(var i = 0; i < this.contactCount; i++) {
            this.resolveContact(this.contacts[i], this.a, this.b);
        }
    },

    /**
      * Resolve a single contact point
      */
    resolveContact: function(contact, a, b) {

        var rax = contact.x - a.position.x,
            ray = contact.y - a.position.y,
            rbx = contact.x - b.position.x,
            rby = contact.y - b.position.y;

        var rvx = this.getRelativeVelocityX(contact, a, b),
            rvy = this.getRelativeVelocityY(contact, a, b),
            velAlongNormal = rvx * this.normal.x + rvy * this.normal.y;

        // If the velocities are separating do nothing
        if (velAlongNormal > 0 ) {
            return;
        }

        // Collision ------------------------------------------------------
        var raCrossN = rax * this.normal.y - ray * this.normal.x,
            rbCrossN = rbx * this.normal.y - rby * this.normal.x,
            imSum = a.im + b.im + (raCrossN * raCrossN) * a.iI
                                + (rbCrossN * rbCrossN) * b.iI;

        // Calculate impulse scalar
        var j = -(1.0 + this.e) * velAlongNormal;
        j /= imSum;
        j /= this.contactCount;

        // Apply Impulse
        a.applyImpulse(-j * this.normal.x, -j * this.normal.y, rax, ray);
        b.applyImpulse(j * this.normal.x, j * this.normal.y, rbx, rby);


        // Friction -------------------------------------------------------
        if (this.noFriction) {
            return;
        }

        var tx = rvx - (this.normal.x * velAlongNormal),
            ty = rvy - (this.normal.y * velAlongNormal),
            tl = Math.sqrt(tx * tx + ty * ty);

        // Normalize
        if (tl > EPSILON) {
            tx /= tl;
            ty /= tl;
        }

        // tangent magnitude
        var jt = -(rvx * tx + rvy * ty);
        jt /= imSum;
        jt /= this.contactCount;

        // Don't apply tiny friction impulses
        if (Math.abs(jt) < EPSILON) {
            return;
        }

        // Coulumb's law
        if (Math.abs(jt) < j * this.sf) {
            tx = tx * jt;
            ty = ty * jt;

        } else {
            tx = tx * -j * this.df;
            ty = ty * -j * this.df;
        }

        a.applyImpulse(-tx, -ty, rax, ray);
        b.applyImpulse(tx, ty, rbx, rby);

    },

    /**
      * This will prevent objects from sinking into each other when they're
      * resting.
      */
    positionalCorrection: function() {

        var a = this.a,
            b = this.b;

        var percent = 0.8,
            slop = 0.02,
            m = Math.max(this.penetration - slop, 0.0) / (a.im + b.im);

        // Apply correctional impulse
        var cx = m * this.normal.x * percent,
            cy = m * this.normal.y * percent;

        a.position.x -= cx * a.im;
        a.position.y -= cy * a.im;

        b.position.x += cx * b.im;
        b.position.y += cy * b.im;

    },


    // Helpers ------------------------------------------------------------
    getRelativeVelocityX: function(contact, a, b) {
        var rax = contact.x - a.velocity.x,
            rbx = contact.x - b.velocity.x;

        return b.velocity.x + (-b.angularVelocity * rbx)
             - a.velocity.x - (-a.angularVelocity * rax);
    },

    getRelativeVelocityY: function(contact, a, b) {
        var ray = contact.y - a.velocity.y,
            rby = contact.y - b.velocity.y;

        return b.velocity.y + (b.angularVelocity * rby)
             - a.velocity.y - (a.angularVelocity * ray);
    }

};

