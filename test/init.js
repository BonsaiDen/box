var assert = require('assert');

describe('Box', function() {

    describe('box.js', function() {

        it('should load successfully', function() {
            var Box = require('../lib/box.js');
            assert.ok(Box instanceof Object);
        });

    });

    describe('box.min.js', function() {

        it('should load successfully', function() {
            var Box = require('../lib/box.min.js');
            assert.ok(Box instanceof Object);
        });

    });

    it('should work', function() {

        var Box = require('../lib/box.js');

        var world = new Box.World(new Box.Vec2(0, 100));
        world.addBody(new Box.AABB(new Box.Vec2(0, 0), new Box.Vec2(100, 20)));
        world.addBody(new Box.AABB(new Box.Vec2(0, -30), new Box.Vec2(20, 20), 1));

        var i = 0;
        while(i < 100) {
            world.update(0.016);
            i++;
        }

        assert.ok(true);

    });

});

