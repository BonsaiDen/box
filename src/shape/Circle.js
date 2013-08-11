// Class ----------------------------------------------------------------------

/**
  * {Vec2}: Initial position of the Circle;
  * {Double}: Radius of the Cirlce;
  * {Double} (0.0): Mass of the Circle;
  * {Double} (0.0): Inertia of the Circle;
  *
  * -> {Circle} (Body): Logical representation of a Circle collision shape
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

