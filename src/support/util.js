function inherit(clas, base, proto) {

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


// Math Utility ---------------------------------------------------------------
function round(v) {
    var d = (v - (v | 0));
    return ~~(v + d);
}


// Public Exports -------------------------------------------------------------
Box.round = round;

