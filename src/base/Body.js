// Class ----------------------------------------------------------------------

/**
  * {Integer}: Unique ID used identifying the bodies type;
  * {Vec2}: Initial position of the body;
  * {Double} (0.0): Mass of the body;
  * {Double} (0.0): Inertia of the body;
  *
  * -> {Body}: Abstract representation of a phyiscal body within a World
  */
function Body(shapeId, position, mass, inertia) {

    // Defaults
    mass = mass !== undefined ? mass : 0.0;
    inertia = inertia !== undefined ? inertia : 0.0;

    // Physics ----------------------------------------------------------------

    /** {Double}: Inverse mass of the body. A value of 0 specifies infinite mass */
    this.im = mass === 0.0 ? 0.0 : 1.0 / mass;

    /** {Double}: Inverse inertia of the body. A value of 0 specifies infinite inertia */
    this.iI = inertia === 0.0 ? 0.0 : 1.0 / inertia;

    /** {Vec2}: Position */
    this.position = new Vec2(position.x, position.y);

    /** {Vec2}: Position, rounded to the nearest full pixel value */
    this.pixelPosition = new Vec2(position.x, position.y);

    /** {Vec2}: Velocity of the body */
    this.velocity = new Vec2(0.0, 0.0);

    /** {Double}: Angular velocity in radians */
    this.angularVelocity = 0.0;

    /** {Double}: Torque in radians */
    this.torque = 0.0;

    /** {Double}: Orientation in radians */
    this.orientation = 0.0;

    /** {Double}: "Bounciness" of the object's surface */
    this.restitution = 0.4;

    /** {Double}: Friction when the body is at rest */
    this.staticFriction = 0.4;

    /** {Double}: Friction when the body is in motion */
    this.kineticFriction = 0.2;

    /** {Integer}: Unique ID of this body */
    this.id = ++Body.id;

    /** {Any}: Reference to custom user data attached to the body */
    this.user = null;

    // Internals
    this.force = new Vec2(0.0, 0.0);
    this.group = 0;
    this.layer = 0;
    this.shapeId = shapeId;
    this.hasFriction = true;

    // Prevent extensions
    Object.seal(this);

    // Initial position update
    this.update();

}


// Statics --------------------------------------------------------------------

/** {Integer}: Unique ID counter identifying each {Body} */
Body.id = 0;


// Methods --------------------------------------------------------------------
inherit(Body, null, {

    /**
      * {Vec2}: Velocity to apply;
      * {Vec2}: Angular velocity to apply;
      * -> Applies the specified impulse to the body.
      */
    applyImpulse: function(velocity, angularVelocity) {
        this.applyRawImpulse(
            velocity.x, velocity.y,
            angularVelocity.x, angularVelocity.y
        );
    },


    // Internal ---------------------------------------------------------------
    update: function() {
        this.pixelPosition.x = round(this.position.x);
        this.pixelPosition.y = round(this.position.y);
    },

    integrateForces: function(dt, gravity) {
        if (this.im !== 0) {
            this.velocity.x += (this.force.x * this.im + gravity.x) * (dt / 2.0);
            this.velocity.y += (this.force.y * this.im + gravity.y) * (dt / 2.0);
            this.angularVelocity += this.torque * this.iI * (dt / 2.0);
        }
    },

    integrateVelocity: function(dt, gravity) {
        if (this.im !== 0) {
            this.position.x += this.velocity.x * dt;
            this.position.y += this.velocity.y * dt;
            // TODO this doesn't look right when rolling across a flat surface
            this.orientation += this.angularVelocity * dt;
            this.integrateForces(dt, gravity);
        }
    },

    applyRawImpulse: function(x, y, rx, ry) {
        this.velocity.x += this.im * x;
        this.velocity.y += this.im * y;
        this.angularVelocity += this.iI * (rx * y - ry * x);
    },

    applyRawForce: function(x, y) {
        this.force.x += x;
        this.force.y += y;
    },

    computeMass: function() {

    },

    clearForces: function() {
        this.force.x = 0.0;
        this.force.y = 0.0;
    }

});

