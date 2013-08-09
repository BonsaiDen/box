module.exports = function(grunt) {

    function line(c, length) {
        return new Array(length + 1).join(c);
    }

    grunt.initConfig({

        // Configuration ------------------------------------------------------
        pkg: grunt.file.readJSON('package.json'),

        dirs: {
            src: 'src',
            dist: 'lib',
            test: 'test'
        },

        files: {
            src: '<%= dirs.src %>/**/*.js',
            test: '<%= dirs.test %>/**/*.js'
        },


        // Tasks --------------------------------------------------------------
        clean: {
            dist: ['<%= dirs.dist %>/**/*.js'],
            tmp: ['<%= dirs.dist %>/**/*.tmp.js']
        },

        concat: {
            options: {
                process: function(src, filepath) {
                    return '// ' + line('=', 76) + '\n'
                         + '// Box/' + filepath + ' ' + line('-', 80 - filepath.length - 9) + ' \n'
                         + '// ' + line('=', 76) + '\n\n'
                         + src.trim() + '\n\n\n';
                }
            },

            dist: {
                src: ['<%= files.src %>'],
                dest: '<%= dirs.dist %>/<%= pkg.name %>.tmp.js'
            }
        },

        template: {
            options: {
                template: '<%= dirs.src %>/box.tjs',
                src: '<%= dirs.dist %>/<%= pkg.name %>.tmp.js',
                dest: '<%= dirs.dist %>/<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> (v<%= pkg.version %> built on <%= grunt.template.today("dd-mm-yyyy at hh:mm") %>) */\n'
            },
            dist: {
                files: {
                    '<%= dirs.dist %>/<%= pkg.name %>.min.js': ['<%= template.options.dest %>']
                }
            }
        },

        jshint: {

            grunt: {
                src: ['Gruntfile.js'],
                options: JSON.parse(grunt.file.read('.jshintrc').replace(/\/\/.*/g, ''))
            },

            src: {
                src: ['<%= files.src %>'],
                options: JSON.parse(grunt.file.read('src/.jshintrc').replace(/\/\/.*/g, ''))
            },

            test: {
                src: ['<%= files.test %>'],
                options: JSON.parse(grunt.file.read('test/.jshintrc').replace(/\/\/.*/g, ''))
            }

        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/**/*.js']
            }
        },

        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['box']
        }

    });


    // Custom Tasks -----------------------------------------------------------
    grunt.registerTask('template', function() {

        var options = this.options(),
            template = grunt.file.read(options.template);

        var source = grunt.template.process(template, {
            data: {
                source: grunt.file.read(options.src).trim()
            }
        });

        grunt.file.write(options.dest, source);

        console.log('File "%s" created.', options.dest);

    });

    grunt.registerTask('box', ['concat', 'template', 'clean:tmp']);


    grunt.registerTask('doc', function() {

        var esprima = require('esprima'),
            escodegen = require('escodegen'),
            code = grunt.file.read('lib/box.js'),
            ast = esprima.parse(code, {
                range: true,
                tokens: true,
                comment: true
            });

        ast = escodegen.attachComments(ast, ast.comments, ast.tokens);

        function walk(node, check, func, parent, data) {

            data = data || [];
            for(var n in node) {
                if (node.hasOwnProperty(n)) {

                    var prop = node[n];
                    if (!prop) {
                        continue;

                    } else if (prop.type) {
                        walk(prop, check, func, node.type ? node : parent, data);

                    } else if (prop instanceof Array) {
                        walk(prop, check, func, node.type ? node : parent, data);
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

        function memberName(expr, post) {

            if (expr.type === 'Identifier') {
                return expr.name;
            }

            var name;
            if (expr.object.type === 'Identifier') {
                name = expr.object.name;

            } else if (expr.object.type === 'ThisExpression') {
                name = 'this';

            } else {
                name = memberName(expr.object, name);
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

        function getDocComments(node) {

            if (node.leadingComments) {

                return node.leadingComments.filter(function(comment) {
                    return comment.type === 'Block';

                }).map(function(comment) {

                    return comment.value.split('\n').map(function(line) {

                        line = line.trim();
                        if (line.substring(0, 1) === '*') {
                            return line.substring(1).trim();

                        } else {
                            return line;
                        }

                    }).filter(function(line) {
                        return line.length > 0;
                    });

                });

            } else {
                return [];
            }

        }

        function getDoc(node) {

            var doc = {
                isConstructor: false,
                visibility: 'public',
                description: null,
                parent: null,
                params: [],
                properties: [],
                type: null,
                returns: null
            };

            function getDescription(line) {

                if (line.indexOf('-') !== -1) {
                    return line.substring(line.indexOf('-') + 1).trim();

                } else {
                    return null;
                }

            }

            getDocComments(node).forEach(function(comment) {

                comment.forEach(function(line) {

                    if ((/^@/).test(line)) {

                        var params = line.substring(1).split(' '),
                            type = params[0].toLowerCase();

                        switch(type) {
                            case 'desc':
                            case 'description':
                                doc.description = params.slice(1).join(' ');
                                break;

                            case 'public':
                            case 'private':
                                doc.visibility = type;
                                break;

                            case 'param':
                                doc.params.push({
                                    type: params[1],
                                    name: params[2],
                                    comment: getDescription(line)
                                });
                                break;

                            case 'prop':
                                doc.properties.push({
                                    type: params[1],
                                    name: params[2],
                                    comment: getDescription(line)
                                });
                                break;

                            case 'type':
                                doc.type = {
                                    name: params[1],
                                    value: params[2] || null,
                                    comment: getDescription(line)
                                };
                                break;

                            case 'return':
                            case 'returns':
                                doc.returns = {
                                    type: params[1],
                                    comment: getDescription(line)
                                };
                                break;

                            case 'augments':
                                doc.parent = params[1];
                                break;

                            case 'constructor':
                                doc.isConstructor = true;
                                break;

                            default:
                                break;

                        }

                    }

                });

            });

            return doc;

        }

        function isConstructor(node, parent) {
            if (node.type === 'FunctionDeclaration') {
                node.doc = getDoc(node);
                return node.doc.isConstructor;
            }
        }

        function isPrototype(node, parent) {
            if (node.type === 'AssignmentExpression'
                && node.left.type === 'MemberExpression'
                && node.right.type === 'ObjectExpression') {

                var name = memberName(node.left);
                return (/\.prototype$/).test(name);
            }
        }

        function isExtend(node, parent) {
            if (node.type === 'CallExpression'
                && (node.callee.type === 'Identifier'
                    || node.callee.type === 'MemberExpression')) {

                return memberName(node.callee) === 'extend';

            }
        }

        function isStatic(node, parent) {
            if (node.type === 'AssignmentExpression'
                && node.left.type === 'MemberExpression') {

                var name = memberName(node.left);
                if (name.split('.').length === 2 && node.right) {
                    return name[0] === name[0].toUpperCase();
                }

            }
        }

        function methods(props) {
            return props.map(function(m) {
                return {
                    doc: getDoc(m),
                    name: m.key.name
                };
            });
        }

        var ctors = walk(ast, isConstructor, function(node, parent) {
            return {
                name: node.id.name,
                parent: null,
                doc: node.doc,
                statics: [],
                methods: [],
                namespace: false
            };
        });

        var statics = walk(ast, isStatic, function(node, parent) {
            var name = memberName(node.left).split('.');
            return {
                base: name[0],
                doc: getDoc(node),
                property: name[1],
                value: node.right.value
            };
        });

        var protos = walk(ast, isPrototype, function(node, parent) {
            var name = memberName(node.left).split('.')[0];
            return {
                name: name,
                methods: methods(node.right.properties)
            };
        });

        var extend = walk(ast, isExtend, function(node, parent) {

            var data = node.arguments.map(function(value) {

                if (value.type === 'ObjectExpression') {
                    return methods(value.properties);

                } else if (value.type === 'Literal') {
                    return value.value;

                } else {
                    return value.name;
                }

            });

            return {
                name: data[0],
                parent: data[1],
                methods: data[2]
            };

        });

        var classes = ctors.map(function(clas) {

            var methods = clas.methods;

            protos.filter(function(p) {
                return p.name === clas.name;

            }).map(function(p) {
                methods.push.apply(methods, p.methods);
            });

            extend.filter(function(p) {
                return p.name === clas.name;

            }).map(function(p) {
                methods.push.apply(methods, p.methods);
            });

            statics.filter(function(s) {
                return s.base === clas.name && s.property !== 'prototype';

            }).map(function(s) {
                clas.statics.push(s);
            });

            return clas;

        });

        grunt.file.write('doc.json', JSON.stringify(classes));

    });


    // Dependencies -----------------------------------------------------------
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-mocha-test');


    // Public Tasks -----------------------------------------------------------
    grunt.registerTask('test', ['mochaTest']);
    grunt.registerTask('build', ['jshint', 'box', 'uglify', 'test']);
    grunt.registerTask('default', 'build');

};

