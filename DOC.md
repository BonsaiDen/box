## Body( *Integer shapeId*, *Vec2 position*, *Double mass = 0.0*, *Double inertia = 0.0* )

Abstract representation of a phyiscal body within a World.

#### Static Fields

 - __id__ *Integer* 

#### Methods

 - __applyImpulse__( *Vec2 velocity*, *Vec2 angularVelocity* )

    

----------------

## Manifold(  )

Wrapper construct for a collision between two bodies.

#### Static Fields

*None*


#### Methods

*None*


----------------

## World( *Vec2 gravity = Vec2(0.0, 50.0)*, *Integer steps = 10*, *Integer iterations = 10* )

Two dimensional world for physics simulation.

#### Static Fields

 - __EPSILON__ *Double*  = 0.0001

#### Methods

 - __update__( *Double dt* )

    Advances the simulation by the given number of seconds.

 - __addBody__( *Body body* ) -> *Boolean*

    Adds a body to the world.

 - __removeBody__( *Body body* ) -> *Boolean*

    Removes a body from the world.

 - __containsBody__( *null body* ) -> *Boolean*

    Checks whether a body is part of the world.

----------------

## AABB( *Vec2 position*, *Vec2 extend*, *Double mass = 0.0*, *Double inertia = 0.0* ) < Body

Representation of a Axis Aligned Bounding Box collision shape.

#### Static Fields

 - __ShapeID__ *Integer* 

#### Methods

 - __computeMass__( *null density* )

    Computes the mass and inertia of the AABB based on its area and the given density.

----------------

## Circle( *Vec2 position*, *Double radius*, *Double mass = 0.0*, *Double inertia = 0.0* ) < Body

Representation of a Circle collision shape.

#### Static Fields

 - __ShapeID__ *Integer* 

#### Methods

 - __computeMass__( *null density* )

    Computes the mass and inertia of the circle based on its radius and the given density.

----------------

## Vec2( *Double x*, *Double y* )

Representation of a two dimensional vector.

#### Static Fields

*None*


#### Methods

 - __zero__(  )

    Sets both components of the vector to 0.

 - __add__( *Vec2 v* ) -> *Vec2*

    Returns the result of the adding the second vector.

 - __sub__( *Vec2 v* ) -> *Vec2*

    Returns a the result of the substraction of the second vector.

 - __dot__( *Vec2 v* ) -> *Double*

    Calculates the dot product of the two vectors.

 - __cross__( *Vec2 v* ) -> *Double*

    Calculates the dot product between the two vectors.

 - __div__( *Double s* ) -> *Vec2*

    Divides the vector in-place.

 - __mul__( *Double s* ) -> *Vec2*

    Multiplies the vector in-place.

 - __normalize__(  ) -> *Vec2*

    Returns a unit vector with length 1.

 - __angle__(  ) -> *Double*

    Returns the direction in which the vector is pointing in radians.

 - __lengthSqr__(  ) -> *Double*

    Returns the length of the vector by simply squaring its components.

 - __length__(  ) -> *Double*

    Returns the length of the vector by using the square root of its length.