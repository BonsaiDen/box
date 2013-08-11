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

