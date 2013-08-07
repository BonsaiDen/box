// Class ----------------------------------------------------------------------
function AABB(position, size, mass, inertia) {

    this.size = new Vector2(size.x, size.y);
    this.min = new Vector2(0.0, 0.0);
    this.max = new Vector2(0.0, 0.0);

    Body.call(this, position, size, mass, inertia);

}


// Methods --------------------------------------------------------------------
extend(AABB, Body, {

    update: function() {

        this.min.x = this.position.x - this.size.x;
        this.max.x = this.position.x + this.size.x;
        this.min.y = this.position.y - this.size.y;
        this.max.y = this.position.y + this.size.y;

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

