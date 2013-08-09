/*global Class*/
(function(global) {

    global.animationFrame = (function() {
        return window.requestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function FRAF(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    var Engine = Class(function(canvasId, width, height) {

        this.canvas = document.getElementById(canvasId);
        this.context = this.canvas.getContext('2d');
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;

        this.accTime = 0;
        this.lastTime = 0;
        this.time = 0;

    }, {

        start: function(fps) {
            this.step = 1000 / fps;
            this.dt = 1 / fps;
            this.lastTime = Date.now();
            this.next();
        },

        next: function() {
            var that = this;
            global.animationFrame(function() {
                that.loop();
            });
        },

        loop: function() {

            this.next();

            var now = Date.now();
            this.accTime += Math.min(now - this.lastTime, 1000);
            this.lastTime = now;

            while(this.accTime - this.step >= 0) {
                this.update(this.time, this.dt);
                this.accTime -= this.step;
                this.time += this.dt;
            }

            this.render(this.context, this.time, this.dt);

        },

        update: function() {

        },

        getTime: function() {
            return this.time;
        },

        render: function() {

        },

        getContext: function() {
            return this.context;
        }

    });

    global.Engine = Engine;

})(window);

