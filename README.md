## Box - Simple Physics

**Box** is a simple 2D physics engine written in JavaScript. 
It's primary focus is to be used in very simple games where only basic collisions features are needed, although it will probably get extend with advanced features in the future.

__Highlights__

- Low memory footprint with no objects being created at runtime
- Simple structure with commented code that's easy to grasp 
- Provides a simple and direct way to access contact point information 
- Runs in strict mode with sealed internal objects 

__Current Features__

- **AABB** and **Circle** shapes
- Contact point information
- Angular/Velocity
- Static and Dynamic Friction
- Comes with a 2D Vector class



### Building / Including

You can either use the pre-built version directly from the `lib` folder or do a custom build:

```
$ npm install .
$ grunt
```


### Documentation

Auto generated API documentation is available [here](https://github.com/BonsaiDen/box/blob/master/DOC.md).



### Upcoming Features

- Finalized public API
- Collision groups and layers
- **OBB** and **Polygon** shapes
- Additional contact point information
- Speed ups for huge scenes by applying spacial partioning



## Tutorial

__Setting up your World__

The constant force applied to all objects is called `gravity` and is defined as a `Box.Vec2`.


```javascript
var gravity = new Box.Vec2(0, 50); 
```

The *resolution* of the simulation is determined by **2** values. 
The first one is the number of `steps` each call to `World.update(dt)` will perform. 
A `step` is basically a full iteration over all objects and contacts. 
The `dt` delta time will be split by the number of `steps` defined. 

```javascript
var steps = 10;
```
> For example `dt` of `20ms` with `5 steps` will advance the simulation by `4ms` on each step.


The second value that's responsible for the resolution is the number of `iterations`.
If two bodies overlap, the will get separated by the engine. 
Now as one can already imagine, this might lead to new overlaps with other bodies. 
An increased number of iterations will therefore give more precise results and less visual overlap.

```javascript
var iterations = 10;
```

Now you can create your `Box.World` which will simply be empty and resting at first.

```javascript
var world = new Box.World(gravity, steps, iterations);
```


__Adding bodies__

Coming soon.


__Updating your world__

Coming soon.


__Rendering bodies__

Coming soon.


__Dealing with contacts__

Coming soon.


## License

**Box** is licenses under MIT.

