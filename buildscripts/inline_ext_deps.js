'use strict';
var sys = require('sys'),
    exec = require('child_process').execSync,
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    glob = require("glob"),
    Promise = require('promise'),
    cheerio = require('cheerio'),
    S = require('string'),
    uglifycss = require('uglifycss'),
    htmlmin = require('htmlmin'),
    os = require('os');

var DEBUG = 0,PROJECT = null, BUILD_DIR = null, PROD = 0, STAGING = 0, LOCALNET = 0, NOINLINE = 0, NOINLINE_PATH;

process.argv.forEach(function(val, index, array) {
    if (index == 2) {
        PROJECT = val;
    }
    if (index == 3) {
        if (val === 'prod') {
            PROD = 1;
        } else if (val === 'staging') {
            STAGING = 1;
        } else if (val === 'localnet') {
            LOCALNET = 1;
        } else if (val === 'debug') {
            DEBUG = 1;
        }
    }
    if (index == 4) {
        if (val === 'noinline') {
            console.log('NO INLINE DETECTED!!!!!!!!!!!!!!!!!!!');
            NOINLINE = 1;
        }
    }
    if (index == 5) {
        if (NOINLINE) {
            console.log('NO INLINE PATH= ' + val);
            NOINLINE_PATH = val;
        }
    }
    if (val == 'debug') {
        DEBUG = 1;
    }
});

var buildDir = 'projects/' + PROJECT + '/build/';
var buildOutputDir = buildDir + 'output/';
var resourcesDir = 'projects/' + PROJECT + '/build/resources/';
var projectDir = 'projects/' + PROJECT + '/public/';
var indexFile = projectDir + 'index.html';

if (NOINLINE) {
    fs.mkdir(resourcesDir);
}

function resolvePathToDir(aPath, dir) {
    if (S(aPath).startsWith('/')) {
        var newPath = path.join(process.cwd(), aPath);
        //console.log('n' + newPath);
        return newPath;
    } else {
        var relPath = path.join(process.cwd(), path.join(dir, aPath));
        //console.log('r' + relPath);
        return relPath;
    }
}

function stripSourceMapLinks(data) {
    return data.replace(/\/\/#\s?sourcemappingurl\s?=\s?.*\.map/gi, '');
}

function genTmpFile(prefix) {
    return exec('/usr/bin/env mktemp -t ' + prefix + 'XXXXXX').toString().replace("\n", '');
}

function uglifyCSS(path) {
    if (DEBUG) {
        return fs.readFileSync(path).toString();
    }
    return uglifycss.processFiles([ path ]);
}

function uglifyJS(path) {
    if (DEBUG) {
        console.log("COPYING FILE OVER");
        return fs.readFileSync(path).toString();
    }
    var tmpfile = genTmpFile('uglifyjs');

    var opts = "sequences=true,conditionals=true,join_vars=true,keep_fargs=true";

    if (PROD) {
        opts += ",drop_debugger=true,drop_console=true";
    }

    var stdout = exec("node_modules/uglify-js/bin/uglifyjs '" + path + "' -c " + opts + " -o " + tmpfile);

    var data;
    data = fs.readFileSync(tmpfile).toString();
    data = stripSourceMapLinks(data);
    return data;
}

function inlineFileExtWithAttrToTag(ext, withAttr, toTag) {
    return function(index, elem) {
        var href = $(elem).attr(withAttr);
        if (!href || href.length < 1) {
            return;
        } else {
            href = S(href).trim().s;
        }
        if (S(href).startsWith('http') || S(href).startsWith('//')) {
            return;
        }
        var absolutePath = resolvePathToDir(href, projectDir);
        var name = path.basename(href);
        var buildPath = null;
        var dotExt = '.' + ext;
        var minExt = '.min.' + ext;
        var fileExt = path.extname(href);

        var absoluteBuiltPath = resolvePathToDir(href, buildDir);
        console.log('absbpath:' + absolutePath);
        if (!DEBUG && fs.existsSync(absoluteBuiltPath)) {
            absolutePath = absoluteBuiltPath;
        }

        var data = null;

        if (fileExt === '.js' && absolutePath.indexOf('.min.js') > -1) {
            data = fs.readFileSync(absolutePath).toString();
            data = stripSourceMapLinks(data);
            console.log(fileExt + ' -> ' + absolutePath);
        } else if (fileExt === '.css') {

            data = uglifyCSS(absolutePath);
            console.log(fileExt + ' m-> ' + absolutePath);
        } else if (fileExt === '.js') {
            data = uglifyJS(absolutePath);

            console.log(fileExt + '(' + absolutePath + ') m-> ' + tmpfile);
        } else if (fileExt === '.html') {
            // if (DEBUG) {
            //     data = fs.readFileSync(absolutePath).toString();
            // }
            var tmpfile = genTmpFile('htmlmin');

            var filedata = fs.readFileSync(absolutePath).toString();

            data = htmlmin(filedata, {
                cssmin: false, //minifier inline css
                jsmin: false, //minifier inline javascript
                caseSensitive: true,
                removeComments: true, //remove comment, if you want keep comment, give a '!' at the beginning of your comment
                removeIgnored: false, //remove tags not recognize
                removeOptionalTags: false, //some tag can without end tag, remove these end tags
                collapseWhitespace: true
            });
            console.log(fileExt + ' min-> ' + absolutePath);
        } else if (fileExt === '.svg') {
            var tmpfile = genTmpFile('svgo');

            var stdout = exec("node_modules/svgo/bin/svgo '" + absolutePath + "' '" + tmpfile + "'");
            data = fs.readFileSync(tmpfile).toString();
            console.log(fileExt + ' m-> ' + tmpfile);
        }

        if (S(href).startsWith('/') && ( NOINLINE || DEBUG)) {
            if (DEBUG && $(elem).attr('type') === 'text/ng-template') {
                var attrId = $(elem).attr('id');
                $(elem).replaceWith("<script type=\"text/ng-template\" id=\"" + attrId + "\">" + data + "</script>");
            } else if (!DEBUG) {
                fs.writeFileSync(resourcesDir + name, data);
                if (NOINLINE_PATH) {
                    $(elem).attr(withAttr, NOINLINE_PATH + name);
                }
            }
        } else if (NOINLINE || DEBUG) {
            console.log($(elem));
            console.log(fileExt);
            console.log($(elem).attr('type'));
            console.log('isDebug: ' + DEBUG + ' , tag:' + startTag + ', fileExt:' + fileExt);
            if (DEBUG && $(elem).attr('type') === 'text/ng-template') {
                var attrId = $(elem).attr('id');
                $(elem).replaceWith("<script type=\"text/ng-template\" id=\"" + attrId + "\">" + data + "</script>");
            } else if (DEBUG) {
                console.log('abs: ' + absolutePath);
                fs.writeFileSync(buildOutputDir + name, fs.readFileSync(absolutePath).toString());
            } else {
                if (fileExt === '.css') {
                    fs.writeFileSync(resourcesDir + name, uglifyCSS(absolutePath));
                    if (NOINLINE_PATH) {
                        $(elem).attr(withAttr, NOINLINE_PATH + name);
                    }
                } else if (fileExt === '.js') {
                    fs.writeFileSync(resourcesDir + name, uglifyJS(absolutePath));
                    if (NOINLINE_PATH) {
                        $(elem).attr(withAttr, NOINLINE_PATH + name);
                    }
                } else {
                    console.log('ERROR FILE EXTENSION NOT FOUND!!!!!!!!!!!!');
                }
            }
        } else {
            var startTag = toTag;
            var attrId = $(elem).attr('id');
            var attrClass = $(elem).attr('class');
            var attrType = $(elem).attr('type');

            if (attrType && attrType.length > 0) {
                startTag += " type=\"" + attrType + "\"";
            }
            if (attrId && attrId.length > 0) {
                startTag += " id=\"" + attrId + "\"";
            }
            if (attrClass && attrClass.length > 0) {
                startTag += " class=\"" + attrClass + "\"";
            }

            $(elem).replaceWith('<' + startTag + '>' + data + '</' + toTag + '>');
        }
    };
}
var inputIndexFile = fs.readFileSync(indexFile).toString();
var $ = cheerio.load(inputIndexFile, {xmlMode: false, decodeEntities: false});

$('link').each(inlineFileExtWithAttrToTag('css', 'href', 'style'));

$('script').each(inlineFileExtWithAttrToTag('js', 'src', 'script'));

//$('script').each(inlineFileExtWithAttrToTag('html', 'src', 'script'));

if (!(inputIndexFile.indexOf('${description}') > -1)) {
    $("body").append("<script>(function(){var d = '${description}';}())</script>");
}

var hasForm = $('form[name=form]').get().length > 0;
if (hasForm) {
    var methodVal = $('form[name=form]').attr('method');
    var actionVal = $('form[name=form]').attr('action');
    // if method and action attributes exist, do not modify
    if (methodVal && methodVal.length > 0 && actionVal && actionVal.length > 0) {
        // instead console log everything and make sure builder knows
        for (var j = 0;j<20;j++) {
            console.log('FOUND EXISTING METHOD/ACTION PAIR....');
        }
        console.log('METHOD: ' + methodVal);
        console.log('ACTION: ' + actionVal);
        console.log('DID NOT MODIFY FORM ELEMENT IN ANY WAY!!');
        console.log('ENSURE ALL FORM ATTRIBUTES ARE CORRECT!!');
    } else {
        if (PROD) {
            $('form[name=form]').attr('action', 'https://www.google.com/evaluation/endor/submit');
        } else if (STAGING) {
            $('form[name=form]').attr('action', 'http://ratslab.dls.corp.google.com:4080/upload');
        } else if (LOCALNET) {
            var interfaces = os.networkInterfaces();
            var addresses = [];
            for (var k in interfaces) {
                for (var k2 in interfaces[k]) {
                    var address = interfaces[k][k2];
                    if (address.family === 'IPv4' && !address.internal) {
                        addresses.push(address.address);
                    }
                }
            }
            if (addresses.length > 0 && addresses[0]) {
                $('form[name=form]').attr('action', 'http://' + addresses[0] + ':4080/upload');
            } else {
                console.log('WAS NOT ABLE TO FIND CURRENT IP ADDRESS');
                $('form[name=form]').attr('action', 'http://localhost:4080/upload');
            }
        } else {
            $('form[name=form]').attr('action', 'http://localhost:4080/upload');
        }
        if (!($('head link[rel=icon]').get().length > 0)) {
            $('head').append("<link rel=\"icon\" href=\"data:;base64,iVBORw0KGgo=\">");
        }
        $('form[name=form]').attr('id', 'form');
        $('form[name=form]').attr('name', 'form');
        $('form[name=form]').attr('method', 'post');
        $('form[name=form]').attr('enctype', 'multipart/form-data');
        $('form[name=form]').attr('target', '_self');
        $('form[name=form]').removeAttr('onsubmit');
    }
}

var buildPath = path.join(process.cwd(), path.join(buildDir, 'index.html'));
fs.writeFileSync(buildPath, $.html());
