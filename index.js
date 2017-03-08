var express = require('express'),
    request = require('request'),
    path = require('path'),
    fs = require('fs'),
    multiparty = require('multiparty'),
    http = require('http'),
    util = require('util'),
    app = express(),
    startStopDaemon = require('start-stop-daemon'),
    sys = require('sys'),
    exec = require('child_process').exec;

var options = {
    outFile: '/var/log/node/endortemplate.log',
    errFile: '/var/log/node/endortemplate-error.log',
    max: 5 //the script will run 5 times at most
};

startStopDaemon(options, function() {

    //CORS middleware
    var allowCrossDomain = function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        next();
    }

    http.createServer(function(req, res) {
        if (req.url === '/upload' && req.method === 'POST') {
            // parse a file upload
            var form = new multiparty.Form();

            form.parse(req, function(err, fields, files) {
                console.log(fields);
                console.log(files);

                var end_string = "<!DOCTYPE html><head><link href='http://fonts.googleapis.com/css?family=Anonymous+Pro' rel='stylesheet' type='text/css'><style>body {font-family:'Anonymous Pro',\"Helvetica Neue\", Helvetica, Arial, sans-serif;} span {font-weight:normal;font-size:24px;line-height:28px;text-decoration:none;color:#444;}</style></head><body><span>fields -></span> <br><br>";
                for (var key in fields) {
                    var wrap_style = "";
                    var wrap_message = "";
                    if (key === "taskId") {
                        if (fields[key][0] !== "TASK_ID_SUBMITTED") {
                            wrap_style = " style=\"color: red;font-weight: 900;text-decoration: underline;font-size: 200%;\"";
                            wrap_message = " (Ensure taskId is set properly in production!)";

                            exec("osascript -e 'beep'", function(error, stdout, stderr) {
                                console.log("TASKID NOT CORRECTLY PASSED THROUGH WILL FAIL PROD!!!!!!!!");
                            });
                        }
                    }
                    end_string += "<span" + wrap_style + ">" + key + ': ' + JSON.stringify(fields[key]) + wrap_message + "</span>";
                    end_string += "<br>";
                }
                end_string += "<br><br><span>files -></span><br>";
                for (var file in files) {
                    end_string += "<span>" + key + ': ' + JSON.stringify(files[file]) + "</span><br>";
                }
                end_string += "<br><br></body></html>";

                console.log('Upload completed!');
                res.writeHead(200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'content-type': 'text/html'
                });
                res.end(end_string);
            });
            return;
        }
    }).listen(4080);

    app.use(allowCrossDomain);
    app.use(express.static(path.join(__dirname, '.'), {
        etag: false
    }));

    app.listen(4000);

});
