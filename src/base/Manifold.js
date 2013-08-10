// Class ----------------------------------------------------------------------
/** @private */
function Manifold() {

    // Bodies
    this.a = null;
    this.b = null;

    // Response information
    this.normal = new Vec2(0.0, 0.0);
    this.penetration = 0.0;

    this.minRestitution = 0.0;
    this.staticFriction = 0.0;
    this.kineticFriction = 0.0;

    // TODO extend list to support N sided polygongs
    this.contactCount = 0;
    this.contacts = [
        new Vec2(0.0, 0.0),
        new Vec2(0.0, 0.0)
    ];

    // Prevent extensions
    Object.seal(this);

}


// Methods --------------------------------------------------------------------
Manifold.prototype = {

    /** @private **/
    initializeWithBodies: function(a, b) {
        this.a = a;
        this.b = b;
        return resolveCollision(this, a, b);
    },

    /** @private **/
    setup: function(dt, gravity) {

        this.minRestitution = Math.min(this.a.restitution, this.b.restitution);

        // TODO is this correct?
        this.staticFriction = Math.sqrt(this.a.staticFriction * this.b.staticFriction);
        this.kineticFriction = Math.sqrt(this.a.kineticFriction * this.b.kineticFriction);

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

        var rvx = this.getRelativeVelocityX(contact, a, b),
            rvy = this.getRelativeVelocityY(contact, a, b),
            velAlongNormal = rvx * this.normal.x + rvy * this.normal.y;

        // Only resolve collisions if the velocities aren't separating
        if (velAlongNormal <= 0) {
            this.applyResponseImpulse(contact, a, b, velAlongNormal);
        }

    },

    applyResponseImpulse: function(contact, a, b, velAlongNormal) {

        var rax = contact.x - a.position.x,
            ray = contact.y - a.position.y,
            rbx = contact.x - b.position.x,
            rby = contact.y - b.position.y;

        var imSum = this.getMassSum(a, b, rax, ray, rbx, rby);

        // Calculate impulse scalar
        var j = -(1.0 + this.minRestitution) * velAlongNormal;
        j /= imSum;
        j /= this.contactCount;

        // Apply separation impulse
        a.applyRawImpulse(-j * this.normal.x, -j * this.normal.y, rax, ray);
        b.applyRawImpulse(j * this.normal.x, j * this.normal.y, rbx, rby);

        // Handle friction
        if (a.hasFriction) {
            this.applyFrictionImpulse(contact, a, b, j, imSum, rax, ray, rbx, rby);
        }

    },

    applyFrictionImpulse: function(contact, a, b, j, imSum, rax, ray, rbx, rby) {

        var rvx = this.getRelativeVelocityX(contact, a, b),
            rvy = this.getRelativeVelocityY(contact, a, b),
            velAlongNormal = rvx * this.normal.x + rvy * this.normal.y;

        // Calculate friction impule scalar
        var tx = rvx - (this.normal.x * velAlongNormal),
            ty = rvy - (this.normal.y * velAlongNormal),
            tl = Math.sqrt(tx * tx + ty * ty);

        // Normalize
        if (tl > EPSILON) {
            tx /= tl;
            ty /= tl;
        }

        // Tangent magnitude
        var jt = -(rvx * tx + rvy * ty);
        jt /= imSum;
        jt /= this.contactCount;

        // Don't apply tiny friction impulses
        if (Math.abs(jt) >= EPSILON) {

            // Coulumb's law
            if (Math.abs(jt) < j * this.staticFriction) {
                tx = tx * jt;
                ty = ty * jt;

            } else {
                tx = tx * -j * this.kineticFriction;
                ty = ty * -j * this.kineticFriction;
            }

            a.applyRawImpulse(-tx, -ty, rax, ray);
            b.applyRawImpulse(tx, ty, rbx, rby);

        }

    },

    /** @private */
    correctPositions: function() {

        var a = this.a,
            b = this.b;

        var percent = 0.8, // 0.2 - 1
            slop = 0.02, // 0.01 - 0.1
            m = Math.max(this.penetration - slop, 0.0) / (a.im + b.im);

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
    getMassSum: function(a, b, rax, ray, rbx, rby) {
        var raCrossN = rax * this.normal.y - ray * this.normal.x,
            rbCrossN = rbx * this.normal.y - rby * this.normal.x;

        return a.im + b.im + raCrossN * raCrossN * a.iI
                           + rbCrossN * rbCrossN * b.iI;
    },

    /** @private */
    getRelativeVelocityX: function(contact, a, b) {
        return b.velocity.x + (-b.angularVelocity * (contact.y - b.position.y))
             - a.velocity.x - (-a.angularVelocity * (contact.y - a.position.y));
    },

    /** @private */
    getRelativeVelocityY: function(contact, a, b) {
        return b.velocity.y + (b.angularVelocity * (contact.x - b.position.x))
             - a.velocity.y - (a.angularVelocity * (contact.x - a.position.x));
    }

};

