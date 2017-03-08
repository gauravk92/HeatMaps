'use strict';
var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    glob = require("glob"),
    Promise = require('promise'),
    PromiseBB = require('bluebird'),
    cheerio = require('cheerio'),
    child_process = require('child_process'),
    S = require('string'),
    Baby = require('babyparse'),
    Util = require('../scripts/util.js');

var PROJECT = null;
var PROD = 0;
var BUILD_DIR = null;
var SURVEY = null;
process.argv.forEach(function(val, index, array) {
    if (index == 2) {
        PROJECT = val;
    }
    if (index == 3) {
        if (val === 'prod') {
            PROD = 1;
        } else if (val !== 'staging') {
            SURVEY = val;
        }
    }
    if (index == 4) {
        if (val) {
            SURVEY = val;
        }
    }
    
});

var buildDir = 'projects/' + PROJECT + '/build/';
var surveyCSV = SURVEY ? 'projects/' + PROJECT + '/public/' + SURVEY : 'projects/' + PROJECT + '/public/survey.csv';
var outputDir = 'projects/' + PROJECT + '/build/output/';

if (!SURVEY && !fs.existsSync(surveyCSV)) {
    fs.writeFileSync(surveyCSV, "description\n0");
}

var indexData = fs.readFileSync(buildDir + 'index.min.html').toString();

function outputTemplate(files) {
    var begin = "<!DOCTYPE html><html><style>@font-face {font-family: 'Proxima Nova Alt Light';font-style: normal;font-weight: normal;src: local('Proxima Nova Alt Light'), url('/public/ProximaNovaAltLight.woff') format('woff');} body {font-family:'Proxima Nova Alt Light',\"Helvetica Neue\", Helvetica, Arial, sans-serif;} a {font-weight:normal;font-size:28px;line-height:40px;text-decoration:none;color:#3c80f6;}span {font-size:16px;color: #868585;margin-right: 12px;}</style><head></head><body><h1>STUDY</h1>";
    var end = '</body></html>';
    var links = '';

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileExt = path.extname(file);
        var fileName = path.basename(file, fileExt);
        links += "<span>ARM</span><a href=\"" + file + "\">" + fileName + "</a><span>" + fileExt.toUpperCase() + "</span><br />";
    }
    fs.writeFileSync(outputDir + 'index.html', begin + links + end);
}

console.log(surveyCSV);
var ParsedOutput = Baby.parse(fs.readFileSync(surveyCSV).toString(), {header: true});

console.log(ParsedOutput.data);

var files = [];
for (var i = 0; i < ParsedOutput.data.length; i++) {
    var row = ParsedOutput.data[i];
    var build = indexData;
    for (var key in row) {
        var stringified = JSON.stringify(row[key]);
        build = S(build).replaceAll('${' + key + '}', stringified.substring(1, stringified.length - 1));
    }
    build = S(build).replaceAll('${taskId}', 'TASK_ID_SUBMITTED');
    var descriptionKey = null;
    var firstKey = null;
    for (var key in row) {
        if (firstKey === null) {
            firstKey = key;
        }
        if (key.toLowerCase() === 'description') {
            descriptionKey = key;
        }
    }
    if (descriptionKey === null) {
        descriptionKey = firstKey;
    }
    var file = row[descriptionKey] + '.html';
    files.push(file);
    fs.writeFileSync(outputDir + file, build);
}
outputTemplate(files);
