// Constants ----------------------------------------------------------------------
var EPSILON = 0.0001;


// Class ----------------------------------------------------------------------


/**
  * {Vec2} (Vec2(0.0, 50.0)): Gravity applied to all bodies;
  * {Integer} (10):     Number of simulation steps to perform on each world update;
  * {Integer} (10):     Number of iterations to perform for each collision contact;
  *
  * -> {World}: Two dimensional world for physics simulation.
  */
function World(gravity, steps, iterations) {

    // Public
    this.gravity = gravity || new Vec2(0.0, 50.0);
    this.contactCount = 0;
    this.contacts = [];

    // Private
    this._steps = steps || 10;
    this._iterations = iterations || 10;
    this._interp = 1 / this._steps;
    this._statics = [];
    this._dynamics = [];

    // Prevent extensions
    Object.seal(this);

}


// Statics --------------------------------------------------------------------

/** {Double} (0.0001): Value used as a threshold for friction and resting of bodies */
World.EPSILON = EPSILON;


// Methods --------------------------------------------------------------------
World.prototype = {

    /** {Double}: Seconds -> Advances the simulation by the given number of seconds */
    update: function(dt) {

        // Perform the world update in smaller steps
        // This will reduce the amount of jitter when multiple objects
        // are stacked on top of each other
        var i, l;
        for(i = 0; i < this._steps; i++) {
            this.step(dt * this._interp);
        }

        // Reset the forces after all steps are done
        for(i = 0, l = this._dynamics.length; i < l; i++) {
            this._dynamics[i].clearForces();
        }

    },

    /** {Body}: Body to add; -> {Boolean}: Adds a body to the world */
    addBody: function(body) {

        if (this.containsBody(body)) {
            return false;

        } else {
            if (body.im !== 0) {
                this._dynamics.push(body);

            } else {
                this._statics.push(body);
            }
        }

    },

    /** {Body}: Body to remove; -> {Boolean}: Removes a body from the world */
    removeBody: function(body) {

        if (this.containsBody(body)) {
            this._statics.splice(this._statics.indexOf(body), 1);
            this._dynamics.splice(this._dynamics.indexOf(body), 1);
            return true;

        } else {
            return false;
        }

    },

    /** {Body} -> {Boolean}: Checks whether a body is part of the world */
    containsBody: function(body) {
        return this._statics.indexOf(body) !== -1
            || this._dynamics.indexOf(body) !== -1;
    },


    // Internal ---------------------------------------------------------------
    step: function(dt) {

        // Temporary variables
        var i, c,
            l = this._dynamics.length;

        // Find all collisions contacts for the current frame
        this.findContacts();

        // Integrate static forces into velocities and reset contacts
        for(i = 0; i < l; i++) {
            this._dynamics[i].integrateForces(dt, this.gravity);
        }

        // Setup collision manifolds
        for(c = 0; c < this.contactCount; c++) {
            this.contacts[c].setup(dt, this.gravity);
        }

        // Resolve the collisions based on the manifolds
        for(i = 0; i < this._iterations; i++) {
            for(c = 0; c < this.contactCount; c++) {
                this.contacts[c].resolveAllContacts();
            }
        }

        // Integrate the new velocities
        for(i = 0; i < l; i++) {
            this._dynamics[i].integrateVelocity(dt, this.gravity);
        }

        // Correct positions to prevent resting objects from sinking
        for(c = 0; c < this.contactCount; c++) {
            this.contacts[c].correctPositions();
        }

        // Update all objects with required information for rendering etc.
        for(i = 0; i < l; i++) {
            this._dynamics[i].update();
        }

    },

    findContacts: function() {

        var dl = this._dynamics.length,
            sl = this._statics.length;

        // Manifolds are pooled, so we need to reset the length indicator
        this.contactCount = 0;

        // Go through all _dynamics...
        for(var i = 0; i < dl; i++) {

            var a = this._dynamics[i];
            for(var j = 0; j < sl; j++) {
                this.checkAndSolveCollision(a, this._statics[j]);
            }

            for(j = i + 1; j < dl; j++) {
                this.checkAndSolveCollision(a, this._dynamics[j]);
            }

        }

    },

    checkAndSolveCollision: function(a, b) {

        var m;
        if (testCollision(a, b)) {

            // Add a new manifold to the pool if required
            if (this.contacts.length === this.contactCount) {
                this.contacts.push((m = new Manifold()));

            // Otherwise use an existing one
            } else {
                m = this.contacts[this.contactCount];
            }

            // Validate the collision and response
            if (m.initializeWithBodies(a, b)) {
                this.contactCount++;
            }

        }

    }

};


// Public Exports -------------------------------------------------------------
Box.World = World;

