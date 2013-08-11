// Constants ----------------------------------------------------------------------
var EPSILON = 0.0001;


// Class ----------------------------------------------------------------------

/**
  * @desc Box World
  * @constructor
  *
  * @param gravity {Vec2}
  * @param steps {Integer}
  * @param iterations {Integer}
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

/**
 * @desc Epsilion value used to cut off certain calculations.
 * @type {float} 0.0001
 */
World.EPSILON = EPSILON;


// Methods --------------------------------------------------------------------
World.prototype = {

    /**
      * @desc Performs an update on all bodies in the world, advancing each of them by `dt` seconds.
      * @param dt {Double} - Number of seconds to advance the world
      */
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

    /**
      * @desc Adds a {Body} to the world
      * @param {Body} body
      *
      * @returns {Boolean} Whether or not the body was actually added.
      */
    addBody: function(body) {
        if (body.im !== 0) {
            this._dynamics.push(body);

        } else {
            this._statics.push(body);
        }
    },

    /**
      * @desc Removes a {Body} from the world
      * @param {Body} body
      *
      * @returns {Boolean} Whether or not the body was actually removed
      */
    removeBody: function(body) {
        this._statics.splice(this._statics.indexOf(body), 1);
        this._dynamics.splice(this._dynamics.indexOf(body), 1);
    },

    /**
      * @desc Returns whether or not a {Body} is contained by this world
      * @returns {Boolean}
      */
    containsBody: function(body) {
        return this._statics.indexOf(body) !== -1
            || this._dynamics.indexOf(body) !== -1;
    },


    // Collision detection and resolution -------------------------------------

    /** @private */
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

    /** @private */
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

    /** @private */
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

