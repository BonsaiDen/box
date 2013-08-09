function extend(clas, base, proto) {

    if (base) {
        clas.prototype = Object.create(base.prototype);
    }

    if (proto) {
        for(var i in proto) {
            if (proto.hasOwnProperty(i)) {
                clas.prototype[i] = proto[i];
            }
        }
    }

}


// Math -----------------------------------------------------------------------
var abs = Math.abs,
    sqrt = Math.sqrt;

function round(v) {
    var d = (v - (v | 0));
    return ~~(v + d);
}

function min(a, b) {
    return a < b ? a : b;
}

function max(a, b) {
    return a > b ? a : b;
}


// Public Exports -------------------------------------------------------------
Box.round = round;

