## Box - Simple Physics

Not much to read here, everything's still work in progress.

__Feature Set__

- AABB collision detection
- Contact point information


## Build it

    $ npm install .
    $ grunt


### Use it

```javascript
var world = new Box.World(new Box.Vector2(0, 100));
world.add(new Box.AABB(0, 0, 100, 10));
world.add(new Box.AABB(0, -30, 10, 10, 1));

setInterval(function() {
    world.update(1 / 60);

}, 1000 / 60);

```

## License

**Box** is licenses under MIT.

