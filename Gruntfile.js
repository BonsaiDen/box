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

