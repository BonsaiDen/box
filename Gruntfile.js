module.exports = function(grunt) {

    function line(c, length) {
        return new Array(length + 1).join(c);
    }

    grunt.initConfig({

        // Configuration ------------------------------------------------------
        pkg: grunt.file.readJSON('package.json'),

        doc: null,

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
                banner: '/*! <%= pkg.name %> (v<%= pkg.version %> built on <%= grunt.template.today("dd-mm-yyyy @ hh:mm") %>) */\n'
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


    // Documentation ----------------------------------------------------------
    grunt.registerTask('doc', function() {

        console.log('Parsing "lib/box.js"...');
        var parser = require('./grunt.parse'),
            doc = parser.parse(grunt.file.read('lib/box.js'));

        function toType(t) {
            return t ? (' -> *' + t + '*') : '';
        }

        function toParam(p) {
            return '*' + p.type + ' ' + p.name + (p.defaultValue ? ' = ' + p.defaultValue : '') + '*';
        }

        function toSignature(params) {
            return params.map(toParam).join(', ');
        }

        function toConstructor(c) {
            return c.name + '( ' + toSignature(c.params) + ' )' + (c.base ? ' < ' + c.base : '');
        }

        function toStatic(s) {
            return ' - __' + s.name + '__ *' + s.type + '* ' + (s.value ? ' = ' + s.value : '');
        }

        function toMethod(m) {
            return ' - __' + m.name + '__( ' + toSignature(m.params) + ' )' + toType(m.type);
        }

        function toField(f) {
            return ' - __' + f.name + '__ *' + f.type + '*: ' + f.description;
        }

        function toClass(clas) {

            var text = '## ' + toConstructor(clas) + '\n\n' + clas.description;

            text += '\n\n#### Instance Fields\n\n';

            text += clas.fields.map(function(f) {
                return toField(f);

            }).join('\n\n');

            text += '\n\n#### Static Fields\n\n';

            if (clas.statics.length) {
                text += clas.statics.map(function(s) {
                    return toStatic(s);

                }).join('\n\n');

            } else {
                text += '*None*\n';
            }

            text += '\n\n#### Methods\n\n';

            if (clas.methods.length) {
                text += clas.methods.map(function(m) {
                    return toMethod(m) + '\n\n    ' + m.description;

                }).join('\n\n');

            } else {
                text += '*None*\n';
            }

            return text;

        }

        console.log('Generating documentation for "lib/box.js"...');
        var out = doc.list.map(toClass).join('\n\n----------------\n\n');
        grunt.file.write('DOC.md', out);

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
    grunt.registerTask('build', ['jshint', 'box', 'doc', 'uglify', 'test']);
    grunt.registerTask('default', 'build');

};

