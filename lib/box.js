/**
  * Copyright (c) 2013 Ivo Wetzel.
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy
  * of this software and associated documentation files (the "Software"), to deal
  * in the Software without restriction, including without limitation the rights
  * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the Software is
  * furnished to do so, subject to the following conditions:
  *
  * The above copyright notice and this permission notice shall be included in
  * all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  * THE SOFTWARE.
  */
(function(Box, undefined) {

"use strict";

// ============================================================================
// Box/src/base/Body.js ------------------------------------------------------- 
// ============================================================================

// Class ----------------------------------------------------------------------
function Body(shape, position, mass, inertia) {

    // Defaults
    mass = mass !== undefined ? mass : 0.0;
    inertia = inertia !== undefined ? inertia : 0.0;

    // Indentity
    this.id = ++Body.id;
    this.shapeId = shape.ShapeID;
    this.group = 0;
    this.layers = 0;

    // Inverse mass. 0 is used as a placeholder for infinite mass
    this.im = mass === 0.0 ? 0.0 : 1.0 / mass;

    // Inverse inertia. 0 is used as a placeholder for infinite inertia
    this.iI = inertia === 0.0 ? 0.0 : 1.0 / inertia;

    // How "bouncy" this box is. The higher the value, the more the box will
    // bounce of in case of a collision
    this.restitution = 0.0; // 0 - 1
    this.staticFriction = 0.5;
    this.kineticFriction = 0.3;
    this.noFriction = false;

    // Dimensions
    this.position = new Vector2(position.x, position.y);
    this.pixelPosition = new Vector2(position.x, position.y);

    // Velocities and rotation
    this.velocity = new Vector2(0.0, 0.0);
    this.angularVelocity = 0.0; // -PI - PI
    this.torque = 0.0; //
    this.orientation = 0.0; // PI - PI * 2

    // Internal, temporary values only used during the collision phase
    this.force = new Vector2(0.0, 0.0);

    // User data
    this.user = null;

    // Initial position update
    this.update();

}


// Statics --------------------------------------------------------------------
Body.id = 0;


// Methods --------------------------------------------------------------------
extend(Body, null, {

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
            this.orientation += this.angularVelocity * dt;
            this.integrateForces(dt, gravity);
        }
    },

    applyImpulse: function(x, y, rx, ry) {
        this.velocity.x += this.im * x;
        this.velocity.y += this.im * y;
        this.angularVelocity += this.iI * (rx * y - ry * x);
    },

    applyForce: function(x, y) {
        this.force.x += x;
        this.force.y += y;
    },

    clearForces: function() {
        this.force.x = 0.0;
        this.force.y = 0.0;
    },

    clearContacts: function() {
        this.contactCount = 0;
    }

});



// ============================================================================
// Box/src/base/Manifold.js --------------------------------------------------- 
// ============================================================================

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

        // Collision ------------------------------------------------------
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

        var tx = rvx - (this.normal.x * velAlongNormal),
            ty = rvy - (this.normal.y * velAlongNormal),
            tl = sqrt(tx * tx + ty * ty);

        // Normalize
        if (tl > EPSILON) {
            tx /= tl;
            ty /= tl;
        }

        // tangent magnitude
        var jt = -(rvx * tx + rvy * ty); // load fixes slot, int32ToDouble, type barrier, unbox double
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
            ty = ty * -j * this.kineticFriction; // TODO type barrier, unbox
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
        var rax = contact.x - a.velocity.x,
            rbx = contact.x - b.velocity.x;

        return b.velocity.x + (-b.angularVelocity * rbx)
             - a.velocity.x - (-a.angularVelocity * rax);
    },

    /** @private */
    getRelativeVelocityY: function(contact, a, b) {
        var ray = contact.y - a.velocity.y,
            rby = contact.y - b.velocity.y;

        return b.velocity.y + (b.angularVelocity * rby)
             - a.velocity.y - (a.angularVelocity * ray);
    }

};



// ============================================================================
// Box/src/base/World.js ------------------------------------------------------ 
// ============================================================================

// Constants ----------------------------------------------------------------------
var EPSILON = 0.0001;


// Class ----------------------------------------------------------------------
function World(gravity, steps, iterations) {

    this.gravity = gravity || new Vector2(0.0, 50.0);
    this.steps = steps || 10;
    this.iterations = iterations || 10;

    this.interp = 1 / this.steps;

    // Active contacts between bodies
    this.contactCount = 0;
    this.contacts = [];

    // Object lists
    this.statics = [];
    this.dynamics = [];

}


// Statics --------------------------------------------------------------------
World.EPSILON = EPSILON;


// Methods --------------------------------------------------------------------
World.prototype = {

    update: function(dt) {

        // Perform the world update in smaller steps
        // This will reduce the amount of jitter when multiple objects
        // are stacked on top of each other
        var i, l;
        for(i = 0; i < this.steps; i++) {
            this.step(dt * this.interp);
        }

        // Reset the forces after all steps are done
        for(i = 0, l = this.dynamics.length; i < l; i++) {
            this.dynamics[i].clearForces();
        }

    },

    add: function(box) {
        if (box.im !== 0) {
            this.dynamics.push(box);

        } else {
            this.statics.push(box);
        }
    },

    remove: function(box) {
        this.statics.splice(this.statics.indexOf(box), 1);
        this.dynamics.splice(this.dynamics.indexOf(box), 1);
    },


    // Collision detection and resolution -------------------------------------

    /** @private */
    step: function(dt) {

        // Temporary variables
        var i, c,
            l = this.dynamics.length;

        // Find all collisions contacts for the current frame
        this.findContacts();

        // Integrate static forces into velocities and reset contacts
        for(i = 0; i < l; i++) {
            this.dynamics[i].integrateForces(dt, this.gravity);
            this.dynamics[i].clearContacts();
        }

        // Setup collision manifolds
        for(c = 0; c < this.contactCount; c++) {
            this.contacts[c].setup(dt, this.gravity);
        }

        // Resolve the collisions based on the manifolds
        for(i = 0; i < this.iterations; i++) {
            for(c = 0; c < this.contactCount; c++) {
                this.contacts[c].resolveAllContacts();
            }
        }

        // Integrate the new velocities
        for(i = 0; i < l; i++) {
            this.dynamics[i].integrateVelocity(dt, this.gravity);
        }

        // Correct positions to prevent resting objects from sinking
        for(c = 0; c < this.contactCount; c++) {
            this.contacts[c].correctPositions();
        }

        // Update all objects with required information for rendering etc.
        for(i = 0; i < l; i++) {
            this.dynamics[i].update();
        }

    },

    /** @private */
    findContacts: function() {

        var dl = this.dynamics.length,
            sl = this.statics.length;

        // Manifolds are pooled, so we need to reset the length indicator
        this.contactCount = 0;

        // Go through all dynamics...
        for(var i = 0; i < dl; i++) {

            var a = this.dynamics[i];
            for(var j = 0; j < sl; j++) {
                this.checkAndSolveCollision(a, this.statics[j]);
            }

            for(j = i + 1; j < dl; j++) {
                this.checkAndSolveCollision(a, this.dynamics[j]);
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



// ============================================================================
// Box/src/shape/AABB.js ------------------------------------------------------ 
// ============================================================================

// Class ----------------------------------------------------------------------

/**
  * Shape describing a Axis Aligned Bounding Box.
  *
  * @constructor
  * @param {Vector2} position - The center position of the AAAB
  * @param {Vector2} extend - Extends of the AABB around its center position. The full dimensions of the AABB are twice the extends.
  * @param {float} mass - The mass of the AABB. Can be any positive value greater than zero. Zero is special and gives the AABB infinite mass.
  * @augments Body
  *
  * @api public
  */
function AABB(position, extend, mass, inertia) {

    this.extend = new Vector2(extend.x, extend.y);
    this.min = new Vector2(0.0, 0.0);
    this.max = new Vector2(0.0, 0.0);

    Body.call(this, AABB, position, mass, inertia);

}

// Statics --------------------------------------------------------------------
AABB.ShapeID = 0;


// Methods --------------------------------------------------------------------
extend(AABB, Body, {

    update: function() {

        this.min.x = this.position.x - this.extend.x;
        this.max.x = this.position.x + this.extend.x;
        this.min.y = this.position.y - this.extend.y;
        this.max.y = this.position.y + this.extend.y;

        Body.prototype.update.call(this);

    },

    containsAABB: function(other) {
        return this.min.x <= other.min.x && this.max.x >= other.max.x
            && this.min.y <= other.min.y && this.max.y >= other.max.y;
    },

    containsVector: function(v) {
        return this.min.x <= v.x && this.max.x >= v.x
            && this.min.y <= v.y && this.max.y >= v.y;
    }

});


// Public Exports -------------------------------------------------------------
Box.AABB = AABB;



// ============================================================================
// Box/src/shape/Collision.js ------------------------------------------------- 
// ============================================================================

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

    // Check if circles are overlapping
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



// ============================================================================
// Box/src/support/Vector2.js ------------------------------------------------- 
// ============================================================================

// Class ----------------------------------------------------------------------
function Vector2(x, y) {
    this.x = x;
    this.y = y;
}


// Methods --------------------------------------------------------------------
Vector2.prototype = {

    add: function(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    },

    sub: function(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    },

    dot: function(v) {
        return this.x * v.x + this.y * v.y;
    },

    cross: function(v) {
        return this.x * v.y - this.y * v.x;
    },

    div: function(s) {
        this.x /= s;
        this.y /= s;
        return this;
    },

    mul: function(s) {
        this.x *= s;
        this.y *= s;
        return this;
    },

    unit: function() {

        var len = this.length();
        if (len > 0.0001) {
            var invLen = 1.0 / len;
            return new Vector2(this.x * invLen, this.y * invLen);

        } else {
            return new Vector2(this.x, this.y);
        }

    },

    normalize: function() {

        var len = this.length();
        if (len> 0.0001) {
            var invLen = 1.0 / len;
            this.x *= invLen;
            this.y *= invLen;
        }

    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    // Length
    lengthSqr: function() {
        return this.x * this.x + this.y * this.y;
    },

    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

};


// Public Exports -------------------------------------------------------------
Box.Vector2 = Vector2;



// ============================================================================
// Box/src/support/util.js ---------------------------------------------------- 
// ============================================================================

function extend(clas, base, proto) {

    if (base) {
        clas.prototype = Object.create(base.prototype);
    }

    if (proto) {
        for(var i in proto) {
            if (proto.hasOwnProperty(i)) {
                clas.prototype[i] = proto[i];
            }
        }
    }

}


// Math -----------------------------------------------------------------------
var abs = Math.abs,
    sqrt = Math.sqrt;

function round(v) {
    var d = (v - (v | 0));
    return ~~(v + d);
}

function min(a, b) {
    return a < b ? a : b;
}

function max(a, b) {
    return a > b ? a : b;
}


// Public Exports -------------------------------------------------------------
Box.round = round;

})(typeof module === 'undefined' ? (window.Box = {}) : module.exports);

