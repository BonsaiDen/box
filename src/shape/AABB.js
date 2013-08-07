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

    Body.call(this, position, mass, inertia);

}


// Methods --------------------------------------------------------------------
extend(AABB, Body, {

    update: function() {

        this.min.x = this.position.x - this.extend.x;
        this.max.x = this.position.x + this.extend.x;
        this.min.y = this.position.y - this.extend.y;
        this.max.y = this.position.y + this.extend.y;

        Body.prototype.update.call(this);

    },

    isOverlapping: function(other) {
        if (this.max.x < other.min.x || this.min.x > other.max.x) {
            return false;

        } else if (this.max.y < other.min.y || this.min.y > other.max.y) {
            return false;

        } else {
            return true;
        }
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

