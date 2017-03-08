/*jslint node: true */
"use strict";

var S = require('string'),
    Promise = require('promise'),
    child_process = require('child_process'),
    fs = require('fs'),
    read = Promise.denodeify(fs.readFile),
    write = Promise.denodeify(fs.writeFile),
    execCmd = Promise.denodeify(child_process.exec),
    PromiseBB = require('bluebird'),
    express = require('express'),
    http = require('http'),
    request = require('request'),
    path = require('path');


var Util = {
    execCmd: execCmd,
    pipeInputOutput: false,
    fileInput: null,
    fileOutput: null,
    args: {},
    patterns: {},
    input: null,
    output: [],
    start: function(ignoreStdInput) {
        process.argv.forEach(function(val, index, array) {
            if (index == 2) {
                if (val === '--stdinout') {
                    Util.pipeInputOutput = true;
                } else if (val === '--stdinoutpipe') {
                    Util.pipeInputOutput = true;
                    Util.pipePassthrough = true;
                } else {
                    Util.fileInput = val;
                }
            }
            if (index === 3 && !Util.pipeInputOutput) {
                Util.fileOutput = val;
            } else if (index === 3) {
                Util.args[val] = 1;
            }
            if (index > 3) {
                Util.args[val] = 1;
            }
        });

        if (!ignoreStdInput) {
            if (Util.pipePassthrough && Util.pipeInputOutput) {
                Util.input = fs.readFileSync('/dev/stdin').toString();
            } else if (Util.pipeInputOutput) {
                Util.input = JSON.parse(fs.readFileSync('/dev/stdin').toString());
            } else {
                Util.input = JSON.parse(fs.readFileSync(Util.fileInput).toString());
            }
        }

        var pattern_index = 0;
        for (var pattern in Util.args) {
            var search = S(pattern).replaceAll('*', '(.)').s;
            Util.patterns[pattern_index] = new RegExp(search);
            pattern_index++;
        }

        return Util.input;
    },
    startIgnoringInput: function() {
        Util.start(true);
    },
    promiseWhile: function(condition, action) {
        var resolver = PromiseBB.defer();

        var loop = function() {
            if (!condition()) {
                return resolver.resolve();
            }
            return PromiseBB.cast(action())
                .then(loop)
                .catch(resolver.reject);
        };

        process.nextTick(loop);

        return resolver.promise;
    },
    csvjson: function(path) {
        return new PromiseBB(function(fulfill, reject) {
            console.error(path);
            child_process.exec('mktemp -t csvjson', function(err, sout, serr) {
                var tempPath = sout.replace("\n", '') + '.json';
                child_process.exec('which csvjson', function(werr, wstdout, wstderr) {
                    var binpath = wstdout.replace("\n", '');
                    console.error(binpath);
                    child_process.exec(binpath + ' ' + path + ' > ' + tempPath, function(error, stdout, stderr) {
                        console.error(tempPath);
                        var output = fs.readFileSync(tempPath).toString();
                        var json = JSON.parse(output);
                        fulfill(json);
                    });
                });
            });
        });
    },
    jsoncsv: function(json) {
        return new PromiseBB(function(fulfill, reject) {
            //console.error(path);
            child_process.exec('mktemp -t jsoncsv', function(err1, sout1, serr1) {
                var path = sout1.replace("\n", '') + '.json';
                fs.writeFile(path, JSON.stringify(json), function(writeErr) {
                    if (writeErr) {
                        console.error('write file error at path: ' + path);  
                        console.error('write error: ' + writeErr);
                    }
                    child_process.exec('mktemp -t jsoncsv', function(err, sout, serr) {
                        var tempPath = sout.replace("\n", '') + '.csv';
                        child_process.exec('which in2csv', function(werr, wstdout, wstderr) {
                            var binpath = wstdout.replace("\n", '');
                            console.error(binpath);
                            child_process.exec(binpath + ' -f json ' + path + ' > ' + tempPath, function(error, stdout, stderr) {
                                console.error(tempPath);
                                fs.readFile(tempPath, function(readErr, csvData) {
                                    if (readErr) {
                                        console.error('read file error at path: ' + tempPath);
                                        console.error('read error: ' + readErr);
                                    }
                                    fulfill(csvData); 
                                });
                            });
                        });
                    });
                });
            });
        });
    },
    jsoncsvpath: function(path) {
        return new PromiseBB(function(fulfill, reject) {
            console.error(path);
            child_process.exec('mktemp -t jsoncsv', function(err, sout, serr) {
                var tempPath = sout.replace("\n", '') + '.csv';
                child_process.exec('which in2csv', function(werr, wstdout, wstderr) {
                    var binpath = wstdout.replace("\n", '');
                    console.error(binpath);
                    child_process.exec(binpath + ' -f json ' + path + ' > ' + tempPath, function(error, stdout, stderr) {
                        console.error(tempPath);
                        fulfill(tempPath);
                    });
                });
            });
        });
    },
    jsontojsonp: function(name, data, callback) {
        console.error(name);
        console.error(callback);
        return new PromiseBB(function(fulfill, reject) {
            var app = express();
            app.enable("jsonp callback");
            app.get('/', function(req, res) {
                res.jsonp(data);
            });
            var server = app.listen(56312);
            setTimeout(function() {
                request({
                    uri: "http://localhost:56312/?callback=" + callback,
                    method: "GET",
                    timeout: 10000,
                    followRedirect: true,
                    maxRedirects: 10
                }, function(error, response, body) {
                    if (!error) {
                        fs.writeFileSync(name, body);
                        server.close();
                        fulfill(name);
                    } else {
                        reject();
                    }
                });
            }, 50);
        });
    },
    close: function() {
        if (Util.pipeInputOutput) {
            console.log(JSON.stringify(Util.output));
        } else {
            fs.writeFileSync(Util.fileOutput, JSON.stringify(Util.output));
        }
    }
};

module.exports = Util;
