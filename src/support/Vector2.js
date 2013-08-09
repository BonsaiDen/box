// Class ----------------------------------------------------------------------

/**
  * @desc Generic two dimensional vector class.
  * @constructor
  *
  * @param {float} x - The X coordinate of the vector
  * @param {float} y - The Y coordinate of the vector
  */
function Vector2(x, y) {
    this.x = x;
    this.y = y;
}


// Methods --------------------------------------------------------------------
Vector2.prototype = {

    zero: function() {
        this.x = 0;
        this.y = 0;
    },

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

