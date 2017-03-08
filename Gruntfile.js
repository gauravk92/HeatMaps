'use strict()';

// not used
var config = {
    port: 3000
};

var path = require('path'),
    S = require('string');

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    //    trimtrailingspaces: {
    //    main: {
    //      src: ['public_html/js/**/*.js'],
    //      options: {
    //        filter: 'isFile',
    //        encoding: 'utf8',
    //        failIfTrimmed: false
    //      }
    //    }
    //  }

    var PROJECT = grunt.option('project');
    var PROD = grunt.option('prod');
    var STAGING = grunt.option('staging');
    var FAST = grunt.option('fast');
    var SURVEY = grunt.option('survey');
    var NOINLINE = grunt.option('noinline');
    var LOCALNET = grunt.option('localnet');
    var DEBUG = grunt.option('debug');



    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        express: {
            options: {
                port: config.port
            },
            dev: {
                options: {
                    script: 'index.js',
                    debug: true
                }
            }
        },
        jshint: {
            options: {
                reporter: require('jshint-stylish'),
                force: true
            },
            all: ['routes/**/*.js',
                'models/**/*.js'
            ],
            server: [
                './index.js'
            ]
        },
        concurrent: {
            fast: {
                tasks: ['watch'], // 'node-inspector',
                options: {
                    logConcurrentOutput: true
                }
            },
            dev: {
                tasks: ['nodemon', 'watch'], // 'node-inspector',
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        'node-inspector': {
            custom: {
                options: {
                    'web-host': 'localhost'
                }
            }
        },
        nodemon: {
            debug: {
                script: 'index.js',
                options: {
                    nodeArgs: [''],
                    env: {
                        port: config.port
                    }
                }
            }
        },
        jsbeautifier: {
            files: ["*.js", "public/**/*.js"],
            options: {
                html: {
                    fileTypes: ['.html', '.ejs', '.hbs'],
                    braceStyle: "collapse",
                    indentChar: " ",
                    indentScripts: "keep",
                    indentSize: 4,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    unformatted: ["a", "sub", "sup", "b", "i", "u"],
                    wrapLineLength: 0
                },
                css: {
                    fileTypes: '.css',
                    indentChar: " ",
                    indentSize: 4
                },
                js: {
                    fileTypes: ['.js'],
                    braceStyle: "collapse",
                    breakChainedMethods: false,
                    e4x: false,
                    evalCode: false,
                    indentChar: " ",
                    indentLevel: 0,
                    indentSize: 4,
                    indentWithTabs: false,
                    jslintHappy: false,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    maxPreserveNewlines: 10,
                    preserveNewlines: true,
                    spaceBeforeConditional: true,
                    spaceInParen: false,
                    unescapeStrings: false,
                    wrapLineLength: 0
                }
            }
        },
        exec: {
            deploy: './deploy.sh'
        },
        lineending: {
            dist: {
                options: {
                    overwrite: true
                },
                files: {
                    '': ['./*']
                }
            }
        }
    });

    var projectPath = 'projects/' + PROJECT + '/';
    if (!grunt.file.exists(projectPath) && !grunt.file.isDir(projectPath)) {
        grunt.fail.fatal('project directory not found');
    }

    var execTask = grunt.config.get('exec');
    var execTemplateData = "node buildscripts/inline_ext_deps.js '" + PROJECT + "'";
    var execProcessEnvVars = "node buildscripts/process_env_vars.js '" + PROJECT + "'";
    var execCleanTask = "rm -rf 'projects/" + PROJECT + "/build/'";
    var execBuildTask = "mkdir -p 'projects/" + PROJECT + "/build/output/'";
    var execPasteTask = "cat 'projects/" + PROJECT + "/build/index.min.html' | pbcopy;echo 'COPYING...';echo 'COPYING...';echo 'COPYING...';echo 'COPYING...';echo 'COPYING...';echo 'COPIED index.min.html to CLIPBOARD!';";
    var execStagingDeployTask = "echo 0";
    if (PROD) {
        execTemplateData += ' prod';
        execProcessEnvVars += ' prod';
    } else if (STAGING) {
        execTemplateData += ' staging';
        execProcessEnvVars += ' staging';
        execStagingDeployTask = "./deploy.sh";
        execPasteTask = "echo 0";
    } else if (LOCALNET) {
        execTemplateData += ' localnet';
        execPasteTask = "echo 0";
    } else {
        execPasteTask = "echo 0";
    }

    if (NOINLINE) {
        execTemplateData += ' noinline';
    }

    if (NOINLINE + '' !== 'true') {
        execTemplateData += ' ' + NOINLINE;
    }

    console.log(execTemplateData);

    if (SURVEY) {
        execProcessEnvVars += " " + SURVEY;
    }

    if (DEBUG) {
        execTemplateData += " debug";
    }

    execTask['inline'] = execTemplateData;
    execTask['process'] = execProcessEnvVars;
    execTask['clean'] = execCleanTask;
    execTask['build'] = execBuildTask;
    execTask['staging'] = execStagingDeployTask;
    execTask['paste'] = execPasteTask;
    grunt.config.set('exec', execTask);

    // -- beautify project files

    var jsbeautifyTask = grunt.config.get('jsbeautifier');
    var beautifyFiles = jsbeautifyTask['files'];
    beautifyFiles.push("projects/" + PROJECT + "/**/*.js");
    beautifyFiles.push("projects/" + PROJECT + "/**/*.html");
    beautifyFiles.push("projects/" + PROJECT + "/**/*.css");

    grunt.config.set('jsbeautifier', jsbeautifyTask);

    //    var files = copyDepsTask['main']['files'];

    // -- copy deps to min

    //    var copyDepsTask = {
    //        main: {
    //            files: [{
    //                expand: true,
    //                cwd: 'bower_components/angular-material/',
    //                src: 'angular-material.min.css'
    //            }, {
    //                expand: true,
    //                cwd: 'bower_components/angular/',
    //                src: 'angular.min.js'
    //            }, {
    //                expand: true,
    //                cwd: 'bower_components/angular-animate/',
    //                src: 'angular-animate.min.js'
    //            }, {
    //                expand: true,
    //                cwd: 'bower_components/angular-aria/',
    //                src: 'angular-aria.min.js'
    //            }, {
    //                expand: true,
    //                cwd: 'bower_components/hammerjs/',
    //                src: 'hammer.min.js'
    //            }, {
    //                expand: true,
    //                cwd: 'bower_components/angular-material/',
    //                src: 'angular-material.min.js'
    //            }],
    //        },
    //    };
    //
    //    for (var i = 0; i < files.length; i++) {
    //        var fileObj = files[i];
    //        if (fileObj) {
    //            fileObj['dest'] = "projects/" + PROJECT + "/build/";
    //        }
    //    }
    //
    //    grunt.config.set('copy', copyDepsTask);


    // -- min CSS

    var minCSSTask = {
        target: {
            files: {}
        }
    }

    grunt.file.expand('public/**/*.css').forEach(function(obj) {
        var name = path.basename(obj);
        var outputPath = '';
        if (!S(name).endsWith('.min.css')) {
            var newDir = 'projects/' + PROJECT + '/build/';
            //var newName = S(name).replaceAll('.css', '.min.css');
            //newDir += newName;
            outputPath = path.resolve(newDir, name);
        }
        minCSSTask['target']['files'][outputPath] = obj;
    });

    grunt.file.expand('projects/' + PROJECT + '/public/**/*.css').forEach(function(obj) {
        var name = path.basename(obj);
        var outputPath = '';
        if (!S(name).endsWith('.min.css')) {
            var newDir = 'projects/' + PROJECT + '/build/';
            var addDir = path.relative('projects/' + PROJECT + '/public/', obj);
            //addDir = S(addDir).replaceAll('.css', '.min.css').s;
            outputPath = path.resolve(newDir, addDir);
        }
        minCSSTask['target']['files'][outputPath] = obj;
    });

    grunt.config.set('cssmin', minCSSTask);

    // -- min JS

    var uglifyJSTask = {
        options: {
            mangle: false,
            preserveComments: false
        },
        target: {
            files: {}
        }
    };

    grunt.file.expand('public/**/*.js').forEach(function(obj) {
        var name = path.basename(obj);
        var outputPath = '';
        if (!S(name).endsWith('.min.js')) {
            var newDir = 'projects/' + PROJECT + '/build/';
            //console.log(path.resolve(newDir));
            //console.log(path.relative('projects/' + PROJECT + '/public/', obj));
            //var newName = S(name).replaceAll('.js', '.min.js');
            //newDir += newName;
            outputPath = path.resolve(newDir, name);
        }
        console.log(outputPath + ' <- ' + obj);
        uglifyJSTask['target']['files'][outputPath] = obj;
    });

    grunt.file.expand('projects/' + PROJECT + '/public/**/*.js').forEach(function(obj) {
        var name = path.basename(obj);
        var outputPath = '';
        if (!S(name).endsWith('.min.js')) {
            var newDir = projectPath + 'build/';
            //console.log(path.resolve(newDir));
            var addDir = path.relative(projectPath + 'public/', obj);
            //console.log(path.relative(newDir, '..', obj));
            //addDir = S(addDir).replaceAll('.js', '.min.js').s;
            outputPath = path.resolve(newDir, addDir);

        }
        console.log(outputPath + ' <- ' + obj);
        uglifyJSTask['target']['files'][outputPath] = obj;
    });

    //    for (var i = 0; i < files.length; i++) {
    //        var file = files[i];
    //        if (file.src.indexOf('js') > -1) {
    //            var filePath = 'projects/' + PROJECT + '/build/' + file.src;
    //            uglifyJSTask['target']['files'][filePath] = filePath;
    //        }
    //    }

    grunt.config.set('uglify', uglifyJSTask);

    // -- min HTML

    var minHTMLTask = {
        dist: {
            options: {
                removeComments: true,
                collapseWhitespace: true
            },
            files: {}
        }
    }

    minHTMLTask['dist']['files'][projectPath + 'build/index.min.html'] = projectPath + 'build/index.html';

    grunt.config.set('htmlmin', minHTMLTask);

    // compile handlebars

    var handleBarsTask = {
        compile: {
            options: {
                namespace: "JST"
            },
            files: {
                "public/templates.js": ["templates/**/*.hbs"],
            }
        }
    }

    handleBarsTask['compile']['files'][projectPath + 'public/handlebarsTemplates.js'] = [projectPath + 'public/handlebars/**/*.hbs', "public/templates/**/*.hbs"];

    grunt.config.set('handlebars', handleBarsTask);



    // -- WATCH TASK

    var watchTask = {
        js: {
            files: [
                '*.js'
            ],
            tasks: ['build'],
            options: {
                spawn: false
            }
        },
        express: {
            files: [
                'index.js'
            ],
            tasks: ['concurrent:dev']
        },
        livereload: {
            files: [
                '*.js'
            ],
            options: {
                livereload: true
            }
        }
    };

    var watchFiles = watchTask['js']['files'];
    watchFiles.push('projects/' + PROJECT + '/**/*.js');
    watchFiles.push('projects/' + PROJECT + '/**/*.css');
    watchFiles.push('projects/' + PROJECT + '/**/*.html');
    watchFiles.push('projects/' + PROJECT + '/**/*.csv');
    if (FAST) {
        watchTask['js']['tasks'] = [];
        watchTask['express']['tasks'] = [];
    }
    watchTask['js']['files'] = watchFiles;
    grunt.config.set('watch', watchTask);

    // load jshint
    grunt.registerTask('lint', function(target) {
        grunt.task.run([
            'jshint'
        ]);
    });

    //    grunt.registerTask('fast', function(target) {
    //        grunt.task.run([
    //            'jsbeautifier'
    //        ]);
    //    });

    grunt.registerTask('build', function(target) {
        grunt.task.run([
            'handlebars',
            'exec:clean',
            'exec:build',
            'lineending',
            'jsbeautifier',
            //            'copy',
            'uglify',
            'cssmin',
            'exec:inline',
            'htmlmin',
            'exec:process',
            'exec:staging',
            'exec:paste',
        ]);
    });


    grunt.registerTask('deploy', function(target) {
        grunt.task.run([
            'build',
            'exec:deploy'
        ]);
    });


    // default option to connect server
    grunt.registerTask('serve', function(target) {
        if (PROD || STAGING) {
            grunt.task.run([
                'build'
            ]);
        } else if (FAST) {
            grunt.task.run([
                'jsbeautifier',
                'nodemon'
            ]);
        } else {
            grunt.task.run([
                'build',
                'nodemon'
            ]);
        }
    });

    grunt.registerTask('server', function() {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve:' + target]);
    });
};
