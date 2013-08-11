// Class ----------------------------------------------------------------------

/**
  * @desc Abstract type representing a basic {World} entity.
  * @constructor
  * @abstract
  */
function Body(shape, position, mass, inertia) {

    // Defaults
    mass = mass !== undefined ? mass : 0.0;
    inertia = inertia !== undefined ? inertia : 0.0;

    // Inverse mass. 0 is used as a placeholder for infinite mass
    this.im = mass === 0.0 ? 0.0 : 1.0 / mass;

    // Inverse inertia. 0 is used as a placeholder for infinite inertia
    this.iI = inertia === 0.0 ? 0.0 : 1.0 / inertia;

    // Dimensions
    this.position = new Vec2(position.x, position.y);
    this.pixelPosition = new Vec2(position.x, position.y);

    // Internal, temporary values only used during the collision phase
    this.force = new Vec2(0.0, 0.0);

    // Velocities and rotation
    this.velocity = new Vec2(0.0, 0.0);
    this.angularVelocity = 0.0; // rate of rotation
    this.torque = 0.0; // constant rate of rotation being applied
    this.orientation = 0.0; // PI - PI * 2

    // Indentity
    this.id = ++Body.id;
    this.shapeId = shape.ShapeID;
    this.group = 0;
    this.layer = 0;

    // How "bouncy" this box is. The higher the value, the more the box will
    // bounce of in case of a collision
    this.restitution = 0.0;
    this.staticFriction = 0.4;
    this.kineticFriction = 0.2;
    this.hasFriction = true;

    // User data
    this.user = null;

    // Prevent extensions
    Object.seal(this);

    // Initial position update
    this.update();

}


// Statics --------------------------------------------------------------------
Body.id = 0;


// Methods --------------------------------------------------------------------
inherit(Body, null, {

    applyImpulse: function(v, a) {
        this.applyRawImpulse(v.x, v.y, a.x, a.y);
    },

    /** @private */
    update: function() {
        this.pixelPosition.x = round(this.position.x);
        this.pixelPosition.y = round(this.position.y);
    },

    /** @private */
    integrateForces: function(dt, gravity) {
        if (this.im !== 0) {
            this.velocity.x += (this.force.x * this.im + gravity.x) * (dt / 2.0);
            this.velocity.y += (this.force.y * this.im + gravity.y) * (dt / 2.0);
            this.angularVelocity += this.torque * this.iI * (dt / 2.0);
        }
    },

    /** @private */
    integrateVelocity: function(dt, gravity) {
        if (this.im !== 0) {
            this.position.x += this.velocity.x * dt;
            this.position.y += this.velocity.y * dt;
            // TODO this doesn't look right when rolling across a flat surface
            this.orientation += this.angularVelocity * dt;
            this.integrateForces(dt, gravity);
        }
    },

    /** @private */
    applyRawImpulse: function(x, y, rx, ry) {
        this.velocity.x += this.im * x;
        this.velocity.y += this.im * y;
        this.angularVelocity += this.iI * (rx * y - ry * x);
    },

    /** @private */
    applyRawForce: function(x, y) {
        this.force.x += x;
        this.force.y += y;
    },

    /** @abstract */
    computeMass: function() {

    },

    /** @private */
    clearForces: function() {
        this.force.x = 0.0;
        this.force.y = 0.0;
    }

});

