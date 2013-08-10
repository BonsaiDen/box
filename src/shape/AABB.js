// Class ----------------------------------------------------------------------

/**
  * @desc Shape describing a Axis Aligned Bounding Box.
  * @constructor
  * @extends Body
  *
  * @param {Vec2} position - The center position of the AAAB
  * @param {Vec2} extend - Extends of the AABB around its center position. The full dimensions of the AABB are twice the extends.
  * @param {float} mass - The mass of the AABB. Can be any positive value greater than zero. Zero is special and gives the AABB infinite mass.
  */
function AABB(position, extend, mass, inertia) {

    this.extend = new Vec2(extend.x, extend.y);
    this.min = new Vec2(0.0, 0.0);
    this.max = new Vec2(0.0, 0.0);

    Body.call(this, AABB, position, mass, inertia);

}

// Statics --------------------------------------------------------------------
AABB.ShapeID = 0;


// Methods --------------------------------------------------------------------
inherit(AABB, Body, {

    update: function() {

        this.min.x = this.position.x - this.extend.x;
        this.max.x = this.position.x + this.extend.x;
        this.min.y = this.position.y - this.extend.y;
        this.max.y = this.position.y + this.extend.y;

        Body.prototype.update.call(this);

    },

    computeMass: function(density) {
        var m = density * (this.extend.x * this.extend.y) * 4;
        this.im = m ? 1.0 / m : 0.0;
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

