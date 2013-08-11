// Class ----------------------------------------------------------------------

/**
  * {Double}: x component of the vector;
  * {Double}: y component of the vector;
  *
  * -> {Vec2}: Representation of a two dimensional vector
  */
function Vec2(x, y) {

    /** {Double}: x component of the vector */
    this.x = x;

    /** {Double}: y component of the vector */
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

