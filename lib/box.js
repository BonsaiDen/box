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
    this.shapeId = shapeId;
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

/** {Integer}: Unique ID counter identifying each {Body} */
Body.id = 0;


// Methods --------------------------------------------------------------------
inherit(Body, null, {

    /** {Vec2}: Velocity to apply; {Vec2}: Angular velocity to apply */
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



// ============================================================================
// Box/src/base/Manifold.js --------------------------------------------------- 
// ============================================================================

// Class ----------------------------------------------------------------------

/** -> {Manifold}: Wrapper construct for a collision between two bodies */
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

    initializeWithBodies: function(a, b) {
        this.a = a;
        this.b = b;
        return resolveCollision(this, a, b);
    },

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

    resolveAllContacts: function() {
        for(var i = 0; i < this.contactCount; i++) {
            this.resolveContactPoint(this.contacts[i], this.a, this.b);
        }
    },

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

    getMassSum: function(a, b, rax, ray, rbx, rby) {
        var raCrossN = rax * this.normal.y - ray * this.normal.x,
            rbCrossN = rbx * this.normal.y - rby * this.normal.x;

        return a.im + b.im + raCrossN * raCrossN * a.iI
                           + rbCrossN * rbCrossN * b.iI;
    },

    getRelativeVelocityX: function(contact, a, b) {
        return b.velocity.x + (-b.angularVelocity * (contact.y - b.position.y))
             - a.velocity.x - (-a.angularVelocity * (contact.y - a.position.y));
    },

    getRelativeVelocityY: function(contact, a, b) {
        return b.velocity.y + (b.angularVelocity * (contact.x - b.position.x))
             - a.velocity.y - (a.angularVelocity * (contact.x - a.position.x));
    }

};



// ============================================================================
// Box/src/base/World.js ------------------------------------------------------ 
// ============================================================================

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



// ============================================================================
// Box/src/shape/AABB.js ------------------------------------------------------ 
// ============================================================================

// Class ----------------------------------------------------------------------

/**
  * {Vec2}: Initial position of the AABB;
  * {Vec2}: Extends of the AABB, the AABB will extend from its center in all directions based on the components of the vector;
  * {Double} (0.0): Mass of the AABB;
  * {Double} (0.0): Inertia of the AABB;
  *
  * -> {AABB} (Body): Representation of a Axis Aligned Bounding Box collision shape
  */
function AABB(position, extend, mass, inertia) {
    this.extend = new Vec2(extend.x, extend.y);
    this.min = new Vec2(0.0, 0.0);
    this.max = new Vec2(0.0, 0.0);
    Body.call(this, AABB.ShapeID, position, mass, inertia);
}

// Statics --------------------------------------------------------------------

/** {Integer}: Unique ID identifying the {AABB} collision shape */
AABB.ShapeID = 0;


// Methods --------------------------------------------------------------------
inherit(AABB, Body, {

    /** {Double} -> Computes the mass and inertia of the AABB based on its area and the given density */
    computeMass: function(density) {
        var m = density * (this.extend.x * this.extend.y) * 4;
        this.im = m ? 1.0 / m : 0.0;
    },


    // Internal ---------------------------------------------------------------
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
// Box/src/shape/Circle.js ---------------------------------------------------- 
// ============================================================================

// Class ----------------------------------------------------------------------

/**
  * {Vec2}: Initial position of the Circle;
  * {Double}: Radius of the Cirlce;
  * {Double} (0.0): Mass of the Circle;
  * {Double} (0.0): Inertia of the Circle;
  *
  * -> {Circle} (Body): Representation of a Circle collision shape
  */
function Circle(position, radius, mass, inertia) {
    Body.call(this, Circle.ShapeID, position, mass, inertia);
    this.radius = radius;
}

// Statics --------------------------------------------------------------------

/** {Integer}: Unique ID identifying the {Circle} collision shape */
Circle.ShapeID = 1;


// Methods --------------------------------------------------------------------
inherit(Circle, Body, {

    /** {Double} -> Computes the mass and inertia of the circle based on its radius and the given density */
    computeMass: function(density) {

        var m = Math.PI * this.radius * this.radius * density,
            i = m * this.radius * this.radius;

        this.im = m ? 1.0 / m : 0.0;
        this.iI = i ? 1.0 / i : 0.0;

    }

});


// Public Exports -------------------------------------------------------------
Box.Circle = Circle;



// ============================================================================
// Box/src/shape/Collision.js ------------------------------------------------- 
// ============================================================================

// AABB / AABB ----------------------------------------------------------------
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

    // Overlap on x axis
    var xoverlap = a.extend.x + b.extend.x - Math.abs(nx);
    if (xoverlap > 0) {

        // Overlap on x axis
        var yoverlap = a.extend.y + b.extend.y - Math.abs(ny);
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

                m.contacts[0].y = Math.max(b.min.y, a.min.y);
                m.contacts[1].y = Math.min(b.max.y, a.max.y);
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
                m.contacts[0].x = Math.max(b.min.x, a.min.x);
                m.contacts[1].x = Math.min(b.max.x, a.max.x);
                m.contactCount = 2;

                return true;

            }

        }

    }

    m.contactCount = 0;

    return false;

}

// Circle / Circle ------------------------------------------------------------
function testCircleVsCircle(a, b) {

    var nx = b.position.x - a.position.x,
        ny = b.position.y - a.position.y,
        radius = a.radius + b.radius;

    return nx * nx + ny * ny < radius * radius;

}

function resolveCircleVsCircle(m, a, b) {

    var nx = b.position.x - a.position.x,
        ny = b.position.y - a.position.y,
        distance = Math.sqrt(nx * nx + ny * ny),
        radius = a.radius + b.radius;

    m.contactCount = 1;

    // Circles overlap completely so we need to avoid creating NaN values
    if (distance === 0.0) {
        m.penetration = a.radius;
        m.normal.x = 1;
        m.normal.y = 0;
        m.contacts[0].x = a.position.x;
        m.contacts[0].y = a.position.y;
        return true;

    // Partial overlap
    } else {
        m.penetration = radius - distance;
        m.normal.x = nx / distance;
        m.normal.y = ny / distance;
        m.contacts[0].x = m.normal.x * a.radius + a.position.x;
        m.contacts[0].y = m.normal.y * a.radius + a.position.y;
        return true;
    }

}

// Circle / AABB --------------------------------------------------------------
function testCircleVsAABB(a, b) {

    // Treat both as a AABB
    var nx = a.position.x - b.position.x,
        ny = a.position.y - b.position.y;

    var xoverlap = a.radius + b.extend.x - Math.abs(nx),
        yoverlap = a.radius + b.extend.y - Math.abs(ny);

    return xoverlap > 0.0 && yoverlap > 0.0;

}

function resolveCircleVsAABB(m, a, b) {

    var dx = a.position.x - b.position.x,
        dy = a.position.y - b.position.y,
        ox = dx > 0.0 ? b.extend.x : -b.extend.x,
        oy = dy > 0.0 ? b.extend.y : -b.extend.y,
        cx = 0.0,
        cy = 0.0;

    // Find closest the point of contact, either one of the corners...
    if (Math.abs(dx) > b.extend.x && Math.abs(dy) > b.extend.y) {
        cx = b.position.x + ox;
        cy = b.position.y + oy;

    // ...top or bottom edge....
    } else if ((dy < -b.extend.y || dy > b.extend.y)
             && dx < b.extend.x && dx > -b.extend.x) {

        cx = b.position.x + dx;
        cy = b.position.y + oy;

    // ...left or right edge...
    } else {
        cx = b.position.x + ox;
        cy = b.position.y + dy;
    }

    // Check if we actually do overlap with the contact point
    var cdx = cx - a.position.x,
        cdy = cy - a.position.y;

    if (cdx * cdx + cdy * cdy <= a.radius * a.radius) {

        var dist = Math.sqrt(cdx * cdx + cdy * cdy);

        // Contact Information
        m.normal.x = cdx / dist;
        m.normal.y = cdy / dist;
        m.contacts[0].x = cx;
        m.contacts[0].y = cy;
        m.penetration = a.radius - dist;

        m.contactCount = 1;
        return true;

    } else {
        m.contactCount = 0;
        return false;
    }

}


// Callbacks ------------------------------------------------------------------
function CollisionHandler(func, inverted) {
    this.func = func;
    this.inverted = !!inverted;
}

// [Shape ID A][Shape ID B] -> Callback, Invert operands
var TEST_HANDLER = [
    [
        // AABB vs ...
        new CollisionHandler(testAABBvsAABB, false),     // AABB
        new CollisionHandler(testCircleVsAABB, true)     // Circle

    ], [
        // Circle vs ...
        new CollisionHandler(testCircleVsAABB, false),   // AABB
        new CollisionHandler(testCircleVsCircle, false), // Circle
    ]
];

// Shape A ID, Shape B ID -> Callback, Invert operands and result normal
var RESOLVE_HANDLER = [
    [
        // AABB vs ...
        new CollisionHandler(resolveAABBvsAABB, false),     // AABB
        new CollisionHandler(resolveCircleVsAABB, true)     // Circle

    ], [
        // Circle vs ...
        new CollisionHandler(resolveCircleVsAABB, false),   // AABB
        new CollisionHandler(resolveCircleVsCircle, false), // Circle
    ]
];


// Statics --------------------------------------------------------------------
function testCollision(a, b) {

    var handler = TEST_HANDLER[a.shapeId][b.shapeId];
    if (handler.inverted) {
        return handler.func(b, a);

    } else {
        return handler.func(a, b);
    }

}

function resolveCollision(manifold, a, b) {

    var handler = RESOLVE_HANDLER[a.shapeId][b.shapeId],
        result;

    if (handler.inverted) {

        result = handler.func(manifold, b, a);

        if (result) {
            manifold.normal.x = -manifold.normal.x;
            manifold.normal.y = -manifold.normal.y;
        }

    } else {
        result = handler.func(manifold, a, b);
    }

    return result;

}



// ============================================================================
// Box/src/support/Vec2.js ---------------------------------------------------- 
// ============================================================================

// Class ----------------------------------------------------------------------

/**
  * {Double}: X component of the vector;
  * {Double}: Y component of the vector;
  *
  * -> {Vec2}: Representation of a two dimensional vector
  */
function Vec2(x, y) {
    this.x = x;
    this.y = y;
    Object.seal(this);
}


// Methods --------------------------------------------------------------------
Vec2.prototype = {

    /** Sets both components of the vector to 0 */
    zero: function() {
        this.x = 0.0;
        this.y = 0.0;
    },

    /** {Vec2}: Vector to be added -> {Vec2}: Returns the result of the adding the second vector */
    add: function(v) {
        return new Vec2(this.x + v.x, this.y + v.y);
    },

    /** {Vec2}: Vector to be subtracted -> {Vec2}: Returns a the result of the substraction of the second vector */
    sub: function(v) {
        return new Vec2(this.x - v.x, this.y - v.y);
    },

    /** {Vec2}: The second vector -> {Double}: Calculates the dot product of the two vectors */
    dot: function(v) {
        return this.x * v.x + this.y * v.y;
    },

    /** {Vec2}: The second vector -> {Double}: Calculates the dot product between the two vectors */
    cross: function(v) {
        return this.x * v.y - this.y * v.x;
    },

    /** {Double}: Scalar -> {Vec2}: Divides the vector in-place */
    div: function(s) {
        this.x /= s;
        this.y /= s;
        return this;
    },

    /** {Double}: Scalar -> {Vec2}: Multiplies the vector in-place */
    mul: function(s) {
        this.x *= s;
        this.y *= s;
        return this;
    },

    /** -> {Vec2}: Returns a unit vector with length 1 */
    normalize: function() {

        var len = this.length();
        if (len > 0.0001) {
            var invLen = 1.0 / len;
            return new Vec2(this.x * invLen, this.y * invLen);

        } else {
            return new Vec2(this.x, this.y);
        }

    },

    /** -> {Double}: Returns the direction in which the vector is pointing in radians */
    angle: function() {
        return Math.atan2(this.y, this.x);
    },


    /** -> {Double}: Returns the length of the vector by simply squaring its components */
    lengthSqr: function() {
        return this.x * this.x + this.y * this.y;
    },

    /** -> {Double}: Returns the length of the vector by using the square root of its length */
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

};


// Public Exports -------------------------------------------------------------
Box.Vec2 = Vec2;



// ============================================================================
// Box/src/support/util.js ---------------------------------------------------- 
// ============================================================================

function inherit(clas, base, proto) {

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


// Math Utility ---------------------------------------------------------------
function round(v) {
    var d = (v - (v | 0));
    return ~~(v + d);
}


// Public Exports -------------------------------------------------------------
Box.round = round;

})(typeof module === 'undefined' ? (window.Box = {}) : module.exports);

