var cheerio = require('cheerio'),
    S = require('string'),
    DATA = null,
    /**
     * Initial options
     */
    OPTIONS = {
        defaults: {
            radius: 80,
            blur: 0,
            opacity: 1,
            time: 1,
            heatmapPointWeightMax: 100,
            heatmapPointWeightValue: 50,
            zoomLevel: 1
        },
        loadingHeatmap: 0,
        loadingSelectedHeatmap: 0,
        heatmaps: {
            0: {
                totalClicks: null,
                maxTime: null
            }
        },
        timeouts: {
            playClicks: [],
            playHeatmaps: [],
            windowResize: null
        }
    };


function addBullseye(sel, x, y, time) {

    var heatmap = document.querySelector(sel + ' .heatmap');
    var dot = document.createElement('div');
    dot.setAttribute('class', 'drop');
    dot.setAttribute('style', 'top: ' + (y - 7) + 'px; left: ' + (x - 7) + 'px;transition: opacity 1ms linear ' + time + 'ms;');
    heatmap.appendChild(dot);
}

/**
 * Return if point is in rect
 *
 * @param {Number} x1 top left x-coordinate of rect
 * @param {Number} y1 top right y-coordinate of rect
 * @param {Number} x2 bottom right x-coordinate of rect
 * @param {Number} y2 bottom right y-coordinate of rect
 * @param {Number} px x-coordinate of point
 * @param {Number} py y-coordinate of point
 * @return {Boolean} true if point is in rect
 */
function rectContainsPoint(x1, y1, x2, y2, px, py) {

    var betweenX = ((x1 <= px && px <= x2) || (x2 <= px && px <= x1));
    var betweenY = ((y1 <= py && py <= y2) || (y2 <= py && py <= y1));
    return (betweenX && betweenY);
}

function jsonpWithJSON(data) {

    return "/**/ loadData && loadData(" + JSON.stringify(data) + ");";
}

var GenerateController = (function() {


    var typeJsonInput = false;

    var classRef = function(input, isJsonData) {
        typeJsonInput = isJsonData;
    };

    var generateWithData = function generateWithData(data) {
        var name = data[0]['title'];
        var resultHTML = generatePageHTML(data);
        generateZip(S(name).slugify().s, resultHTML);
    };
    classRef.prototype.generateWithData = generateWithData;

    function generatePageHTML(data) {
        var pageObj = cheerio.load(document.documentElement.outerHTML);

        pageObj('body').attr('ng-app', 'App');
        pageObj('#body').attr('ng-controller', 'AppCtrl');
        pageObj('#generateControllerJS').remove();
        pageObj('#GenerateScreenModal').remove();
        pageObj('#controllersjs').removeAttr('type');
        //        pageObj('#ResetViewportBounds').remove();

        if (typeJsonInput) {

            var jsonp = jsonpWithJSON(data);

            pageObj('#loadData').html(jsonp);

        } else {
            pageObj('#loadData').html(data);
        }

        return pageObj.html();
    };

    function generateZip(name, html) {

        var zip = new JSZip();
        zip.file("heatmap-" + name + ".html", html);
        var content = zip.generate({
            type: "blob"
        });

        saveAs(content, "heatmap-" + name + ".zip");
    }

    return classRef;
})();

//setTimeout(function() {
//    
//    // no data found?
//    if (DATA == null) {
//        $(GenerateScreenModal).modal({
//            'backdrop': 'static'
//        });
//    } else {
//        //document.body.setAttribute('ng-app', 'App');
//        //document.body.setAttribute('ng-controller', 'AppCtrl');
//    }
//}, 1000);

function loadData(json_data) {

    if (json_data) {
        DATA = json_data;

        window.onresize = resizeHeatmaps;
    }
    //    
    //    var data = [];
    //    for (var i = 0; i < json_data.length; i++) {
    //        data.push(json_data[0]['values']);
    //    }



    //    jQuery(function($) {
    //
    //        //console.log(setHeatmaps);
    //        //setHeatmaps(data);
    //
    //    });


    var heatmapNum = OPTIONS['loadingHeatmap'];
    var selectedNum = OPTIONS['loadingSelectedHeatmap'];
    var loadingHeatmap = OPTIONS['heatmaps'][heatmapNum];

    var list = DATA[selectedNum]['values'];
    var points = [];
    var maxTime = 0;
    for (var i = 0; i < list.length; i++) {
        var x = parseInt(list[i]['x'], 10);
        var y = parseInt(list[i]['y'], 10);
        var time = parseInt(list[i]['t'], 10);

        ////console.log(time + ' > ' + maxTime);
        if (time > maxTime) {

            maxTime = time;
        }

        var pointWeight = OPTIONS['defaults']['heatmapPointWeightValue'];
        var point = {
            x: x,
            y: y,
            //value: pointWeight,
            time: time
        };
        points.push(point);
    }

    var data = {
        max: OPTIONS['defaults']['heatmapPointWeightMax'],
        data: points
    };

    //console.log(data);

    if (!loadingHeatmap) {
        loadingHeatmap = {};
        OPTIONS['heatmaps'][heatmapNum] = loadingHeatmap;
    }

    var totalClicks = points.length;
    loadingHeatmap['totalClicks'] = totalClicks;
    loadingHeatmap['maxTime'] = maxTime;
    loadingHeatmap['data'] = data;

    loadHeatmapStat(heatmapNum, totalClicks, maxTime);

    if (json_data) {
        var firstDropdown = document.querySelector("a[data-key][data-view='0']")

        dropdownSelect(firstDropdown);
    }

    loadCompletion(data);
}

function startPlayingProgressBar(sel, time, timeoutsRef, callback) {

    var delay = 100;
    $(sel).css('transition', 'width ' + (time - delay) + 'ms linear 0ms');

    setTimeout(function() {
        $(sel).css('width', '100%');
        timeoutsRef.push(setTimeout(callback, time - delay));
    }, delay);
}

function playHeatmaps() {

    var playTimeouts = OPTIONS['timeouts']['playHeatmaps'];
    var loadingTime = 5000;
    var startTime = new Date().getTime();
    $('#loadingBar').css('width', '0%');
    $('body').addClass('loading-heatmaps');

    startPlayingProgressBar('#loadingBar', loadingTime, playTimeouts, function() {
        $('body').removeClass('loading-heatmaps');
    });

    var loadTimeout = 1000;

    setTimeout(function() {

            loadingTime -= loadTimeout;


            setupHeatmaps();
            disableInputForPlayback();

            var heatmaps = OPTIONS['heatmaps'];
            var maxTime = 0;

            for (var name in heatmaps) {
                var heatmap = heatmaps[name];
                var heatmapInstance = heatmap['instance'];

                if (heatmap['maxTime'] > maxTime) {
                    maxTime = heatmap['maxTime'];
                }
            }




            // TODO: verify playing functionality
            //startPlayingProgressBar('#playingBar', maxTime, 200, playTimeouts);

            for (var name in heatmaps) {
                var heatmap = heatmaps[name];
                var heatmapInstance = heatmap['instance'];

                heatmapInstance.store.setDataSet({
                    max: OPTIONS['defaults']['heatmapPointWeightMax'],
                    data: []
                });

                var heatmapData = heatmap['data'];
                var currentData = transformDataForImageSize('#image-' + name, heatmapData);

                var currentDataPoints = currentData['data'];
                for (var i = 0; i < currentDataPoints.length; i++) {
                    var clickData = currentDataPoints[i];
                    var clickTime = clickData['time'];
                    var timeoutFunction = function(instance, clickData) {
                        return function() {
                            instance.store.addDataPoint(clickData['x'], clickData['y'], 51);
                            //instance.addData(clickData);
                        };
                    };
                    var timeDiff = new Date().getTime() - startTime;
                    var exactTime = clickTime + loadingTime - timeDiff;
                    playTimeouts.push(setTimeout(timeoutFunction(heatmapInstance, clickData), exactTime));
                }
            }

            var event = new Event('SideNavCloseEvent');
            document.dispatchEvent(event);



            playTimeouts.push(setTimeout(stopPlayingHeatmaps, maxTime + loadingTime));

            playTimeouts.push(setTimeout(function() {
                $('body').addClass('stop-playing');
            }, loadingTime));
        },
        loadTimeout);
}

function stopPlayingHeatmaps() {

    enableInputAfterPlayback();
    clearTimeouts(OPTIONS['timeouts']['playHeatmaps']);
    $('body').removeClass('stop-playing');
    resetHeatmaps();
}

function renderHeatmapTemplate(id, imgurl, heatmapIndex) {

    var context = {
            imgId: id,
            imgSrc: imgurl,
            index: heatmapIndex
        }
        //console.log(imgurl);
    var template = Handlebars.compile($('#heatmap-template').html());
    return template(context);
}

function getPostWithId(id, cb) {

    $.ajax('/api/post/' + id, {
        success: function(data) {

            if (cb) {
                cb(data.post);
            }
        },
        error: function() {
            alert('There was an error, please try again.');
        }
    });
}

function dropdownSelect(elem) {

    var heatmapIndex = elem.getAttribute('data-view');
    $('#dropdown-' + heatmapIndex).text($(elem).text());
    //    var postId = elem.parentElement.getAttribute('data-key');
    removeHeatmaps();
    //getPostWithId(postId, function(post) {
    var id = 'image-' + heatmapIndex;
    //  //console.log(post);

    var selectKey = elem.getAttribute('data-key');
    var selectIndex = 0;
    for (var i = 0; i < DATA.length; i++) {
        if (DATA[i]['name'] === selectKey) {
            selectIndex = i;
            continue;
        }
    }

    var postRender = renderHeatmapTemplate(id, DATA[selectIndex]['image'], heatmapIndex);
    OPTIONS['loadingHeatmap'] = parseInt(heatmapIndex, 10);
    OPTIONS['loadingSelectedHeatmap'] = selectIndex;
    $('#heatmap-' + heatmapIndex).html(postRender);
    loadData();
    //var scriptElem = document.createElement('script');
    //  scriptElem.innerHTML = post.jsonp;
    //    $('#heatmap-' + heatmapIndex).get(0).appendChild(scriptElem);
    $('#image-' + heatmapIndex).load(function() {
        resetHeatmaps();
    });
    if (Object.keys(OPTIONS['heatmaps']).length > 1) {
        $('body').addClass('two-pane');
    }
    //});
    //
    //    //console.log(postId);
    //    //console.log(elem.getAttribute('data-key'));
    //    //console.log(elem.getAttribute('data-view'));
}

function removeHeatmaps() {

    $('canvas').remove();
    $('.drop').remove();
}

function setupHeatmaps() {

    var radius = OPTIONS['radius'];
    var blur = OPTIONS['blur'];

    // initial values
    radius = isNaN(radius) ? OPTIONS['defaults']['radius'] : radius;
    blur = isNaN(blur) ? OPTIONS['defaults']['blur'] : blur;

    // sanity check
    radius = radius < 5 ? 5 : radius;

    // remove existing heatmaps
    removeHeatmaps();

    var heatmaps = OPTIONS['heatmaps'];

    for (var name in heatmaps) {
        var heatmap = heatmaps[name];


        var heatmapEl = 'heatmap-' + name;

        var elem = document.getElementById(heatmapEl);
        var image = document.getElementById('image-' + name);

        var zoomLevel = OPTIONS['zoomLevel'];
        if (zoomLevel === undefined) {
            OPTIONS['zoomLevel'] = OPTIONS['defaults']['zoomLevel'];
        }


        var imageWidth = Math.round(zoomLevel * image.naturalWidth);
        var imageHeight = Math.round(zoomLevel * image.naturalHeight);



        image.style.width = imageWidth + 'px';
        image.style.height = imageHeight + 'px';
        elem.style.width = imageWidth + 'px';
        elem.style.height = imageHeight + 'px';

        if (parseInt(name) > 0) {
            var leftSideWidth = $('#left-side').width();
            $('#right-side').css('left', leftSideWidth + 'px');
        }

        //console.log(radius);
        //console.log(getImageSizeRatio('#image-' + name));

        var ratioRadius = radius * getImageSizeRatio('#image-' + name);


        var heatmapElement = document.getElementById(heatmapEl);
        var config = {
            // required container
            element: heatmapEl,
            // backgroundColor to cover transparent areas
            backgroundColor: 'rgba(0,0,0,0)',
            // custom gradient colors
            gradient: {
                // enter n keys between 0 and 1 here
                // for gradient color customization
                '.05': 'purple',
                '.15': 'blue',
                '.25': 'red',
                '.35': 'yellow',
                '1': 'white'
                    //'.3': 'yellow',
                    //'.4': 'yellow',
                    //'.9': 'red',
                    //'.95': 'white'
            },
            blur: blur,
            radius: ratioRadius,
            // the maximum opacity (the value with the highest intensity will have it)
            maxOpacity: 0.99,
            // minimum opacity. any value > 0 will produce no transparent gradient transition
            minOpacity: 0.98
        };

        var heatmapInstance = h337.create(config);
        //console.log(heatmapInstance);
        heatmap['instance'] = heatmapInstance;
    }
}

function resizeHeatmaps() {

    clearTimeout(OPTIONS['timeouts']['windowResize']);
    OPTIONS['timeouts']['windowResize'] = setTimeout(function() {
        resetHeatmaps();
    }, 100);
};


function resetHeatmaps() {

    setupHeatmaps();

    var percentTime = OPTIONS['time'];
    percentTime = isNaN(percentTime) ? OPTIONS['defaults']['time'] : percentTime;
    percentTime = percentTime === 0 ? 1 : percentTime;


    //console.log('PERCENT TIME ' + percentTime);

    var heatmaps = OPTIONS['heatmaps'];
    for (var name in heatmaps) {
        var heatmap = heatmaps[name];

        var heatmapData = heatmap['data'];
        var currentData = transformDataForImageSize('#image-' + name, heatmapData);

        var timeMax = heatmap['maxTime'] * percentTime;
        var points = [];

        var currentDataPoints = currentData['data'];
        for (var i = 0; i < currentDataPoints.length; i++) {
            var item = currentDataPoints[i];
            var time = parseInt(item['time'], 10);
            ////console.log(time);
            ////console.log(timeMax);
            if (time <= timeMax) {
                points.push(item);

                //addBullseye('#heatmap-' + name, item['x'], item['y'], item['time']);
            }
        }


        currentData = {
            max: OPTIONS['defaults']['heatmapPointWeightMax'],
            data: points
        };
        heatmap['currentData'] = currentData;

        //console.log(heatmap['instance']);
        //console.log('currentData');
        //console.log(currentData);

        heatmap['instance'].store.setDataSet(currentData);
    }
}

function disableInputForPlayback() {

    $("#radiusSlider")
        .attr('disabled', 'disabled')
        .removeClass('slider-material-orange')
        .addClass('slider-material-gray');

    $("#blurSlider")
        .attr('disabled', 'disabled')
        .removeClass('slider-material-purple')
        .addClass('slider-material-gray');

    $("#playbackSlider")
        .attr('disabled', 'disabled')
        .removeClass('slider-material-red')
        .addClass('slider-material-gray');
}

function enableInputAfterPlayback() {

    $("#radiusSlider")
        .removeAttr('disabled')
        .removeClass('slider-material-gray')
        .addClass('slider-material-orange');

    $("#blurSlider")
        .removeAttr('disabled')
        .removeClass('slider-material-gray')
        .addClass('slider-material-purple');

    $("#playbackSlider")
        .removeAttr('disabled')
        .removeClass('slider-material-gray')
        .addClass('slider-material-red');
}

// TODO: remove play click functionality
function playClicks() {

    $('body')
        .addClass('playback-clicks')
        .addClass('playback-setup')
        .addClass('playback-start')
        .removeClass('playback-not-playing');

    PLAY_CLICK_TIMEOUTS.push(setTimeout(function() {


        $('body').removeClass('playback-setup');

        PLAY_CLICK_TIMEOUTS.push(setTimeout(function() {


            $('body')
                .addClass('playback-play')
                .addClass('stop-playing');

            // setup cleanup at end
            PLAY_CLICK_TIMEOUTS.push(setTimeout(function() {


                stopPlayback();

            }, MAX_TIME_AMOUNT));
        }, 100));
    }, 100));
}

/**
 * Return statistical summary of times given in sec
 *
 * @param {Array} times individual time values in sec
 * @return {Object} containing mean, media, mode, etc.
 */
function summarizeTime(times, percentTime, timeMax) {

    var summary = {};
    var decimals = 2;
    summary['mean'] = parseFloat(ss.mean(times)).toFixed(decimals);
    summary['med'] = parseFloat(ss.median(times)).toFixed(decimals);
    summary['mode'] = parseFloat(ss.mode(times)).toFixed(decimals);
    summary['min'] = parseFloat(ss.min(times)).toFixed(decimals);
    summary['max'] = parseFloat(ss.max(times)).toFixed(decimals);
    summary['var'] = parseFloat(ss.variance(times)).toFixed(decimals);
    summary['std'] = parseFloat(ss.standard_deviation(times)).toFixed(decimals);
    summary['mad'] = parseFloat(ss.median_absolute_deviation(times)).toFixed(decimals);
    summary['timePercent'] = parseFloat(percentTime * 100).toFixed(decimals);
    summary['timeMax'] = parseFloat(timeMax / 1000).toFixed(decimals);
    for (var key in summary) {
        if (isNaN(summary[key])) {
            summary[key] = parseFloat(0).toFixed(decimals);
        }
    }
    return summary;
}

function summarizeClicks(key, x1, y1, x2, y2) {

    var total = 0;
    var data = OPTIONS['heatmaps'][key]['currentData']['data'];
    var times = [];
    var percentTime = $("#playbackSlider").val() / 100;
    var timeMax = OPTIONS['heatmaps'][key]['maxTime'] * percentTime;

    for (var i = 0; i < data.length; i++) {
        var itemTime = data[i]['time'];
        if (rectContainsPoint(x1, y1, x2, y2, data[i]['x'], data[i]['y'])) {
            total++;
            times.push(itemTime / 1000);
        }
    }
    var summaryData = {};
    summaryData['clicksCounted'] = total;
    summaryData['timeSummary'] = summarizeTime(times, percentTime, timeMax);
    return summaryData;
}

/**
 * Returns a filled in template for an alert message
 *
 * @param {Number} clicksCounted number of clicks counted in area
 * @param {Number} totalClicks total number of clicks in heatmap
 * @param {Object} t statistical summary
 */
function renderAlertMessage(clicksCounted, totalClicks, t) {

    var template = Handlebars.compile($('#alert-template').html());
    var clicksPercent = parseFloat((clicksCounted / totalClicks) * 100).toFixed(2);
    var ctx = t;
    ctx['clicksCounted'] = clicksCounted;
    ctx['totalClicks'] = totalClicks;
    ctx['clicksPercent'] = clicksPercent;
    //console.log(ctx);
    return template(ctx);
    //return JST['templates/alert-template.hbs'](ctx);
}

function getImageSizeRatio(sel) {

    var image = $(sel);
    var imageSizeWidth = image.width();
    var imageNaturalSizeWidth = image.get(0).naturalWidth;
    var imageSizeRatio = imageSizeWidth / imageNaturalSizeWidth;
    return imageSizeRatio;
}

/**
 * Takes a selector and heatmap data and resizes for the image ratio
 *
 * @param {string} sel selector for img element
 * @param {Object} data original heatmap data
 * @return {Object} transformed heat map data
 */
function transformDataForImageSize(sel, data) {

    var imageSizeRatio = getImageSizeRatio(sel);
    var points = [];
    var inputData = data['data'];
    for (var i = 0; i < inputData.length; i++) {
        var item = inputData[i];
        var x = parseInt(item['x'] * imageSizeRatio, 10);
        var y = parseInt(item['y'] * imageSizeRatio, 10);
        var time = item['time'];
        var value = item['value'];
        var point = {
            x: x,
            y: y,
            value: value,
            time: time
        };
        points.push(point);
    }
    var max = data['max'];
    return {
        max: max,
        data: points
    };
}

/**
 * Calculates summary data for clicks in a rect and alerts
 *
 * @param {Number} x1 top left x-coordinate in rect
 * @param {Number} y1 top left y-coordinate in rect
 * @param {Number} x2 bottom right x-coordinate in rect
 * @param {Number} y2 bottom right y-coordinate in rect
 */
function alertClicksInRect(selections) {

    for (var key in selections) {
        var selection = selections[key];
        var x1 = selection.left;
        var y1 = selection.top;
        var x2 = selection.left + selection.width;
        var y2 = selection.top + selection.height;
        var clicksSummary = summarizeClicks(key, x1, y1, x2, y2);
        var clicksCounted = clicksSummary['clicksCounted'];
        var timeSummary = clicksSummary['timeSummary'];
        var totalClicks = OPTIONS['heatmaps'][key]['totalClicks'];
        var message = renderAlertMessage(clicksCounted, totalClicks, timeSummary);
        var activeSnackbars = OPTIONS['activeSnackbars'];


        var snackbarContent = function() {
            return $('#heatmap-' + key + ' .snackbar-container' + key + ' .snackbar');
        };

        var snackbarClickHandler = function(key) {
            return function(e) {
                $('#heatmap-' + key + ' .snackbar-container' + key + ' .snackbar').removeClass('snackbar-opened');
                event.preventDefault();
                return false;
            };
        };

        var snackbarOpenHandler = function(key) {
            return function() {
                return $('#heatmap-' + key + ' .snackbar-container' + key + ' .snackbar').addClass('snackbar-opened');
            };
        };

        $(snackbarContent).get(0).addEventListener('click', snackbarClickHandler(key), false);

        var snackbar = $('#heatmap-' + key + ' .snackbar-container span').get(0);

        $(snackbarContent()).removeClass('snackbar-opened');

        $('#heatmap-' + key + ' .snackbar-container' + key + ' .snackbar-content').html(message);

        setTimeout(snackbarOpenHandler(key), 500);

        OPTIONS['activeSnackbars'] = activeSnackbars;
    }
}

function loadHeatmapStat(key, total, time) {

    var elem = $('#total-clicks-' + key);
    if (elem) {
        elem.html(total);

        $('#total-time-' + key).html(parseFloat(time / 1000).toFixed(1));
    }
}

function loadCompletion(data) {

    jQuery(function($) {

        var proxy0Width = null;
        var startedRight = false;

        var leftSelectRect = function(ev, dd) {
            var obj = {};
            obj['top'] = Math.min(ev.pageY, dd.startY);
            if (startedRight) {
                obj['left'] = Math.min(ev.pageX - proxy0Width, dd.startX - proxy0Width);
            } else {
                obj['left'] = Math.min(ev.pageX, dd.startX);
            }
            obj['height'] = Math.abs(ev.pageY - dd.startY);
            obj['width'] = Math.abs(ev.pageX - dd.startX);
            return obj;
        };

        var rightSelectRect = function(ev, dd) {
            var obj = {};
            obj['top'] = Math.min(ev.pageY, dd.startY);
            if (startedRight) {
                obj['left'] = Math.min(ev.pageX, dd.startX);
            } else {
                obj['left'] = Math.min(ev.pageX + proxy0Width, dd.startX + proxy0Width);
            }
            obj['height'] = Math.abs(ev.pageY - dd.startY);
            obj['width'] = Math.abs(ev.pageX - dd.startX);
            return obj;
        };

        $('#content-wrapper')
            .drag("start", function(ev, dd) {

                if (proxy0Width === null) {
                    resetDragSelection();

                    if (Object.keys(OPTIONS['heatmaps']).length > 1) {
                        proxy0Width = $('#heatmap-0').width();

                        if (dd.startX > proxy0Width) {
                            //console.log('swapped');
                            startedRight = true;
                        } else {
                            startedRight = false;
                        }
                        $('#ddproxy1').css('display', 'initial');
                    } else {
                        $('#ddproxy1').css('display', 'none');
                    }

                    $('#ddproxy').css('display', 'initial');

                    return $('<div class="hidden"/>');

                }

            })
            .drag(function(ev, dd) {

                $('#ddproxy').css(leftSelectRect(ev, dd));
                $('#ddproxy1').css(rightSelectRect(ev, dd));
            })
            .drag("end", function(ev, dd) {

                var heatmapsSelection = {};
                var selection = {
                    x: dd.startX,
                    y: dd.startY,
                    w: dd.deltaX,
                    h: dd.deltaY
                };

                if (selection.w > 4 && selection.h > 4) {

                    var data = {};
                    data['0'] = leftSelectRect(ev, dd);
                    if (Object.keys(OPTIONS['heatmaps']).length > 1) {
                        var rightData = rightSelectRect(ev, dd);
                        rightData.left -= proxy0Width;
                        data['1'] = rightData;
                    }

                    alertClicksInRect(data);
                }

                startedRight = false;
                proxy0Width = null;
                $('#ddproxy1').css('display', 'none');
                $('#ddproxy').css('display', 'none');

            });
        $('.drop')
            .drop("start", function() {

                $(this).addClass("active");
            })
            .drop(function(ev, dd) {

                $(this).toggleClass("dropped");
            })
            .drop("end", function() {

                $(this).removeClass("active");
            });
        $.drop({
            multi: true
        });


        $.material.init();
        $.material.ripples();
        $.material.input();

        $("select.dropdown").dropdown();

        var initRadius = OPTIONS['defaults']['radius'];
        $("#radiusSlider").noUiSlider({
            start: initRadius,
            animate: true,
            connect: 'lower',
            //        orientation: "vertical",
            range: {
                min: [20],
                max: [125]
            }
        });


        //    var initBlur = OPTIONS['defaults']['blur'] * 100;
        //    $("#blurSlider").noUiSlider({
        //        start: initBlur,
        //        animate: true,
        //        connect: 'lower',
        //        orientation: "vertical",
        //        range: {
        //            min: 0,
        //            max: 100
        //        }
        //    });

        var initOpacity = OPTIONS['defaults']['opacity'] * 100;
        $("#opacitySlider").noUiSlider({
            start: initOpacity,
            animate: true,
            connect: 'lower',
            //        orientation: "vertical",
            range: {
                min: 0,
                max: 100
            }
        });

        var initTime = OPTIONS['defaults']['time'] * 100;
        $("#playbackSlider").noUiSlider({
            start: initTime,
            animate: true,
            connect: 'lower',
            //        orientation: "vertical",
            range: {
                min: 0,
                max: 100
            }
        });

        $("#radiusSlider").on('set', function() {

            var radius = $(this).val();
            OPTIONS['radius'] = radius;
            resetHeatmaps();

        });

        $("#opacitySlider").on('set', function() {

            var opacity = '' + parseFloat($(this).val() / 100).toFixed(2);
            OPTIONS['opacity'] = opacity;
            $('canvas').css('opacity', opacity);
        });

        $("#playbackSlider").on('set', function() {

            var time = $(this).val() / 100;
            OPTIONS['time'] = time;
            resetHeatmaps();
        });

        loadHeatmapStat('0', OPTIONS['heatmaps'][0]['totalClicks'], OPTIONS['heatmaps'][0]['maxTime']);

        $('#image-0').load(resetHeatmaps);

        $('#showHeatmap').click(function() {

            if ($(this).is(':checked')) {
                $('body').removeClass('hide-heatmap');
            } else {
                $('body').addClass('hide-heatmap');
            }
        });

        $('#showClicks').click(function() {

            if ($(this).is(':checked')) {
                $('body').removeClass('hide-clicks');
            } else {
                $('body').addClass('hide-clicks');
            }
        });

        $('#playbackStopInput').click(function() {

            stopPlayingHeatmaps();
        });

        $('#playbackInput').click(playClicks);

        $('#playbackHeatmapInput').click(playHeatmaps);



    });
}

function clearTimeouts(timeouts) {

    timeouts.map(clearTimeout);
    timeouts = [];
}

function stopPlayback() {


    clearTimeouts(PLAY_CLICK_TIMEOUTS);

    $('body')
        .removeClass('playback-clicks')
        .removeClass('playback-setup')
        .removeClass('playback-start')
        .removeClass('playback-setup')
        .addClass('playback-not-playing');

    setTimeout(function() {
        $('body')
            .removeClass('playback-playing')
            .removeClass('stop-playing');
    }, 500);
}

function resetDragSelection() {

    $('.drop').removeClass('dropped');
}

function zoomSelect(zoomElement) {

    $('#zoom-dropdown').html($(zoomElement).html());

    OPTIONS['zoomLevel'] = parseFloat($(zoomElement).attr('data-key'));

    resetHeatmaps();
}
