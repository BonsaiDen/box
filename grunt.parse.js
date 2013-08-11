var esprima = require('esprima'),
    escodegen = require('escodegen'),
    doc = require('./grunt.doc');

// Parsing --------------------------------------------------------------------
// ----------------------------------------------------------------------------
function traverse(node, check, func, parent, data) {

    data = data || [];

    for(var n in node) {
        if (node.hasOwnProperty(n)) {

            var prop = node[n];
            if (!prop) {
                continue;

            } else if (prop.type) {
                traverse(prop, check, func, node.type ? node : parent, data);

            } else if (prop instanceof Array) {
                traverse(prop, check, func, node.type ? node : parent, data);
            }

        }
    }

    if (node.type) {
        if (!check || check(node, parent)) {
            var result = func(node, parent || { type: 'File' });
            if (result) {
                data.push(result);
            }
        }
    }

    return data;

}

// Convert a MemberExpression into a string representing the full name
function memberToName(expr, post) {

    if (expr.type === 'Identifier') {
        return expr.name;
    }

    var name;
    if (expr.object.type === 'Identifier') {
        name = expr.object.name;

    } else if (expr.object.type === 'ThisExpression') {
        name = 'this';

    } else {
        name = memberToName(expr.object, name);
    }

    if (name) {
        if (post) {
            return name + '.' + expr.property.name + '.' + post;

        } else {
            return name + '.' + expr.property.name;
        }

    } else {
        return expr.property.name + '.' + post;
    }

}


// Type Validation ------------------------------------------------------------
function isConstructorFunction(node) {
    if (node.type === 'FunctionDeclaration') {
        var name = node.id.name;
        return name[0] === name[0].toUpperCase();
    }
}

function isPrototypeExtension(node) {
    if (node.type === 'AssignmentExpression'
        && node.left.type === 'MemberExpression'
        && node.right.type === 'ObjectExpression') {

        var name = memberToName(node.left);
        return (/\.prototype$/).test(name);
    }
}

function isInheritCall(node) {
    if (node.type === 'CallExpression'
        && (node.callee.type === 'Identifier'
            || node.callee.type === 'MemberExpression')) {

        return memberToName(node.callee) === 'inherit';

    }
}

function isProperty(node) {

    if (node.type === 'AssignmentExpression'
        && node.left.type === 'MemberExpression'
        && node.left.object.type === 'ThisExpression'
        && node.left.property.type === 'Identifier') {

        return true;

    }

}

function isStaticProperty(node, parent) {
    if (node.type === 'AssignmentExpression'
        && node.left.type === 'MemberExpression') {

        var name = memberToName(node.left),
            parts = name.split('.');

        if (parts.length === 2 && node.right && parts[1] !== 'prototype') {
            return name[0] === name[0].toUpperCase();
        }

    }
}


// Type Extraction ------------------------------------------------------------
function extractMethods(properties) {
    return properties.map(function(method) {
        return {
            name: method.key.name,
            params: method.value.params.map(function(p) {
                return p.name;
            }),
            doc: method.leadingComments
        };
    });
}

function extracProperty(node, parent) {
    return {
        name: node.left.property.name,
        doc: parent.leadingComments
    };
}

function extractConstructor(node) {
    return {
        name: node.id.name,
        base: null,
        doc: node.leadingComments,
        params: node.params.map(function(p) {
            return p.name;
        }),
        properties: traverse(node, isProperty, extracProperty),
        statics: [],
        methods: []
    };
}

function extractStaticProperty(node, parent) {
    var name = memberToName(node.left).split('.');
    return {
        doc: parent.leadingComments,
        base: name[0],
        property: name[1],
        value: node.right.value
    };
}

function extractPrototypeMethods(node) {
    var name = memberToName(node.left).split('.')[0];
    return {
        name: name,
        methods: extractMethods(node.right.properties)
    };
}

function extractInheritMethods(node) {

    var params = node.arguments.map(function(value) {

        if (value.type === 'ObjectExpression') {
            return extractMethods(value.properties);

        } else if (value.type === 'Literal') {
            return value.value;

        } else {
            return value.name;
        }

    });

    return {
        name: params[0],
        parent: params[1],
        methods: params[2]
    };

}


// Exports --------------------------------------------------------------------
// ----------------------------------------------------------------------------
exports.parse = function(source) {

    // Parse source
    var ast = esprima.parse(source, {
        range: true,
        tokens: true,
        comment: true
    });

    // Attach comments to nodes
    ast = escodegen.attachComments(ast, ast.comments, ast.tokens);

    // Find all constructors
    var constructors = traverse(ast, isConstructorFunction, extractConstructor),
        statics = traverse(ast, isStaticProperty, extractStaticProperty),
        protoExtensions = traverse(ast, isPrototypeExtension, extractPrototypeMethods),
        inheritCalls = traverse(ast, isInheritCall, extractInheritMethods);

    // Push all methods into one array and parse their documentation and
    // set their base class
    var methods = [];
    protoExtensions.concat(inheritCalls).forEach(function(ext) {
        methods.push.apply(methods, ext.methods.map(function(m) {
            doc.parse(m);
            m.base = ext.name;
            return m;
        }));
    });

    var map = {};
    var list = constructors.map(function(ctor) {

        // Check if the constructor has documentation
        doc.parse(ctor, true);
        if (ctor.doc) {

            map[ctor.name] = {

                name: ctor.name,
                base: ctor.doc.returns ? ctor.doc.returns.base : null,
                description: ctor.doc.returns.description,
                params: ctor.doc.params,

                // Parse all fields
                fields: ctor.properties.filter(function(member) {
                        doc.parse(member);
                        return member.doc;

                    }).map(function(member) {
                        var returns = member.doc.returns || {};
                        return {
                            name: member.name,
                            type: returns.type || null,
                            description: returns.description || null
                        };
                    }),

                // Find all methods belonging to this ctor and filter non public methods
                methods: methods.filter(function(method) {
                        return method.base === ctor.name && method.doc;

                    }).map(function(method) {
                        var returns = method.doc.returns || {};
                        return {
                            name: method.name,
                            base: method.base,
                            params: method.doc.params,
                            type: returns.type || null,
                            description: returns.description || ''
                        };
                    }),

                // Find all statics belonging to this ctor and filter non public statics
                statics: statics.filter(function(st) {
                        doc.parse(st);
                        return st.base === ctor.name && st.doc;

                    }).map(function(st) {
                        var returns = st.doc.returns || {};
                        return {
                            name: st.property,
                            type: returns.type || null,
                            value: returns.defaultValue || null,
                            description: returns.description || null
                        };
                    })

            };

            return map[ctor.name];

        } else {
            return null;
        }

    }).filter(function(c) {
        return c !== null;
    });

    return {
        map: map,
        list: list
    };

};

