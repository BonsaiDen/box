// Class ----------------------------------------------------------------------
/** @private */
function Manifold() {

    // Bodies
    this.a = null;
    this.b = null;

    // Response information
    this.normal = new Vector2(0.0, 0.0);
    this.penetration = 0.0;

    this.minRestitution = 0.0;
    this.staticFriction = 0.0;
    this.kineticFriction = 0.0;

    // TODO extend list to support N sided polygongs
    this.contactCount = 0;
    this.contacts = [
        new Vector2(0.0, 0.0),
        new Vector2(0.0, 0.0)
    ];

}


// Methods --------------------------------------------------------------------
Manifold.prototype = {

    /**
      * Initialize the manifold by solving the collision between its two shapes.
      */
    initializeWithBodies: function(a, b) {
        this.a = a;
        this.b = b;
        return resolveCollision(this, a, b);
    },

    /**
      * Setup the manifold for the collision phase.
      */
    setup: function(dt, gravity) {

        this.minRestitution = min(this.a.restitution, this.b.restitution);

        // TODO is this correct?
        this.staticFriction = sqrt(this.a.staticFriction * this.b.staticFriction);
        this.kineticFriction = sqrt(this.a.kineticFriction * this.b.kineticFriction);

        // Figure out whether this is a resting collision.
        // In the case it is, we ignore restitution altogether.
        for(var i = 0; i < this.contactCount; i++) {

            var rvx = this.getRelativeVelocityX(this.contacts[i], this.a, this.b),
                rvy = this.getRelativeVelocityY(this.contacts[i], this.a, this.b);

            var g = (dt * gravity.x * gravity.x) + (dt * gravity.y * gravity.y);
            if ((rvx * rvx + rvy * rvy) < g + EPSILON) {
                this.minRestitution = 0.0;
                break;
            }

        }

    },

    /** @private */
    resolveAllContacts: function() {
        for(var i = 0; i < this.contactCount; i++) {
            this.resolveContactPoint(this.contacts[i], this.a, this.b);
        }
    },

    /** @private */
    resolveContactPoint: function(contact, a, b) {

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


        // Collision ----------------------------------------------------------
        var raCrossN = rax * this.normal.y - ray * this.normal.x,
            rbCrossN = rbx * this.normal.y - rby * this.normal.x,
            imSum = a.im + b.im + (raCrossN * raCrossN) * a.iI
                                + (rbCrossN * rbCrossN) * b.iI;

        // Calculate impulse scalar
        var j = -(1.0 + this.minRestitution) * velAlongNormal;
        j /= imSum;
        j /= this.contactCount;

        // Apply Impulse
        a.applyImpulse(-j * this.normal.x, -j * this.normal.y, rax, ray);
        b.applyImpulse(j * this.normal.x, j * this.normal.y, rbx, rby);


        // Friction -------------------------------------------------------
        if (this.noFriction) {
            return;
        }

        // Need to calculate again due to potentially changed angular velocity
        rvx = this.getRelativeVelocityX(contact, a, b);
        rvy = this.getRelativeVelocityY(contact, a, b);
        velAlongNormal = rvx * this.normal.x + rvy * this.normal.y;

        // Friction Impulse
        var tx = rvx - (this.normal.x * velAlongNormal),
            ty = rvy - (this.normal.y * velAlongNormal),
            tl = sqrt(tx * tx + ty * ty);

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
        if (abs(jt) < EPSILON) {
            return;
        }

        // Coulumb's law
        if (abs(jt) < j * this.staticFriction) {
            tx = tx * jt;
            ty = ty * jt;

        } else {
            tx = tx * -j * this.kineticFriction;
            ty = ty * -j * this.kineticFriction;
        }

        a.applyImpulse(-tx, -ty, rax, ray);
        b.applyImpulse(tx, ty, rbx, rby);

    },

    /** @private */
    correctPositions: function() {

        var a = this.a,
            b = this.b;

        var percent = 0.8, // 0.1 - 1
            slop = 0.02, // 0.01 - 0.1
            m = max(this.penetration - slop, 0.0) / (a.im + b.im);

        // Apply correctional impulse to prevent objects from sinking into
        // each other
        var cx = m * this.normal.x * percent,
            cy = m * this.normal.y * percent;

        a.position.x -= cx * a.im;
        a.position.y -= cy * a.im;

        b.position.x += cx * b.im;
        b.position.y += cy * b.im;

    },

    /** @private */
    getRelativeVelocityX: function(contact, a, b) {
        var ray = contact.y - a.position.y,
            rby = contact.y - b.position.y;

        return b.velocity.x + (-b.angularVelocity * rby)
             - a.velocity.x - (-a.angularVelocity * ray);
    },

    /** @private */
    getRelativeVelocityY: function(contact, a, b) {
        var rax = contact.x - a.position.x,
            rbx = contact.x - b.position.x;

        return b.velocity.y + (b.angularVelocity * rbx)
             - a.velocity.y - (a.angularVelocity * rax);
    }

};

