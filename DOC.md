## Body( *Integer shapeId*, *Vec2 position*, *Double mass = 0.0*, *Double inertia = 0.0* )

Abstract representation of a phyiscal body within a World.

#### Instance Fields

 - __im__ *Double*: Inverse mass of the body. A value of 0 specifies infinite mass.

 - __iI__ *Double*: Inverse inertia of the body. A value of 0 specifies infinite inertia.

 - __position__ *Vec2*: Position.

 - __pixelPosition__ *Vec2*: Position, rounded to the nearest full pixel value.

 - __velocity__ *Vec2*: Velocity of the body.

 - __angularVelocity__ *Double*: Angular velocity in radians.

 - __torque__ *Double*: Torque in radians.

 - __orientation__ *Double*: Orientation in radians.

 - __restitution__ *Double*: "Bounciness" of the object's surface.

 - __staticFriction__ *Double*: Friction when the body is at rest.

 - __kineticFriction__ *Double*: Friction when the body is in motion.

 - __id__ *Integer*: Unique ID of this body.

 - __user__ *Any*: Reference to custom user data attached to the body.

#### Static Fields

 - __id__ *Integer* 

#### Methods

 - __applyImpulse__( *Vec2 velocity*, *Vec2 angularVelocity* )

    Applies the specified impulse to the body.

----------------

## Manifold(  )

Wrapper construct for a collision between two bodies.

#### Instance Fields

 - __normal__ *Vec2*: The normal of the collision.

 - __penetration__ *Double*: The penetration depth of the collision.

 - __contactCount__ *Integer*: Number of contacts between the two bodies in the manifold *.

 - __contacts__ *Vec2[]*: List of contacts points. Contacts are only valid until the next world update and indicies are only valid up to the contactCount of the manifold.

#### Static Fields

*None*


#### Methods

*None*


----------------

## World( *Vec2 gravity = Vec2(0.0, 50.0)*, *Integer steps = 10*, *Integer iterations = 10* )

Two dimensional world for physics simulation.

#### Instance Fields

 - __gravity__ *Vec2*: The gravity applied to all bodies contained by the world.

 - __contactCount__ *Integer*: Number of contacts between the two bodies in the manifold *.

 - __contacts__ *Manifold[]*: List of contacts manifold that resulted from the last world update.

#### Static Fields

 - __EPSILON__ *Double*  = 0.0001

#### Methods

 - __update__( *Double dt* )

    Advances the simulation by the given number of seconds.

 - __addBody__( *Body body* ) -> *Boolean*

    Adds a body to the world.

 - __removeBody__( *Body body* ) -> *Boolean*

    Removes a body from the world.

 - __containsBody__( *Body body* ) -> *Boolean*

    Checks whether a body is part of the world.

----------------

## AABB( *Vec2 position*, *Vec2 extend*, *Double mass = 0.0*, *Double inertia = 0.0* ) < Body

Representation of a Axis Aligned Bounding Box collision shape.

#### Instance Fields

 - __extend__ *Vec2*: Extends of the object, each half.

#### Static Fields

 - __ShapeID__ *Integer* 

#### Methods

 - __computeMass__( *null density* )

    Computes the mass and inertia of the AABB based on its area and the given density.

----------------

## Circle( *Vec2 position*, *Double radius*, *Double mass = 0.0*, *Double inertia = 0.0* ) < Body

Representation of a Circle collision shape.

#### Instance Fields

 - __radius__ *Double*: Radius of the circle.

#### Static Fields

 - __ShapeID__ *Integer* 

#### Methods

 - __computeMass__( *null density* )

    Computes the mass and inertia of the circle based on its radius and the given density.

----------------

## Vec2( *Double x*, *Double y* )

Representation of a two dimensional vector.

#### Instance Fields

 - __x__ *Double*: x component of the vector.

 - __y__ *Double*: y component of the vector.

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