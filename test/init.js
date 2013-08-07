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

        var world = new Box.World(new Box.Vector2(0, 100));
        world.add(new Box.AABB(0, 0, 100, 10));
        world.add(new Box.AABB(0, -30, 10, 10, 1));

        var i = 0;
        while(i < 100) {
            world.update(0.016);
            i++;
        }

        assert.ok(true);

    });

});

