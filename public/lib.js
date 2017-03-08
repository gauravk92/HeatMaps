/* Exports: PubLib */
(function(exports) {
    exports.s4 = function _s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };

    exports.UUID = (function _UUID() {
        var UUIDCls = function() {
            return exports.s4() + exports.s4();
        };
        return UUIDCls;
    }());

    exports.guid = function _guid() {
        return exports.s4() + exports.s4() + '-' + exports.s4() + '-' + exports.s4() + '-' + exports.s4() + '-' + exports.s4() + exports.s4() + exports.s4();
    };

    /**
     * Returns an array of random unique indicies
     *
     * @type {Function} numOfRandomIndiciesForIndex
     * @param {Number} numOfIndicies The amount of indicies to return
     * @param {Number} maxIndex The maximum index of a random index
     * @return {Array} Array of random indicies
     */
    exports.numOfRandomIndiciesWithMaxIndex = function _numOfRandomIndiciesWithMaxIndex(numOfIndicies, maxIndex) {
        var randomIndicies = [];
        var indexMap = {};

        if (numOfIndicies > maxIndex) {
            throw new Error('Number of indicies can not be more than length');
        }

        while (randomIndicies.length < numOfIndicies) {
            var randomIndex = Math.floor(Math.random() * maxIndex);
            if (!indexMap.hasOwnProperty(randomIndex)) {
                indexMap[randomIndex] = 1;
                randomIndicies.push(randomIndex);
            }
        }
        return randomIndicies;
    };

    exports.shuffleArray = function _shuffleArray(array) {
        var newIndicies = exports.numOfRandomIndiciesWithMaxIndex(array.length, array.length);
        var newArray = [];
        for (var i = 0; i < newIndicies.length; i++) {
            newArray.push(array[newIndicies[i]]);
        }
        return newArray;
    };

    exports.coordinateOfClickEvent = function _coordinateOfClickEvent(event) {
        /*
         *  Convert all points to absolute position in page bounds
         */
        var docBody = (document.documentElement || document.body.parentNode || document.body);
        var scrollX = (window.pageXOffset !== undefined) ? window.pageXOffset : docBody.scrollLeft;
        var scrollY = (window.pageYOffset !== undefined) ? window.pageYOffset : docBody.scrollTop;

        // image container
        var container = $('.screen-view').get(0);
        var containerRect = container.getBoundingClientRect();
        containerRect.top += scrollY;
        containerRect.left += scrollX;

        // image scroll offset
        var screen = $('.screen').get(0);
        var screenRect = screen.getBoundingClientRect();
        screenRect.top += scrollY;
        screenRect.left += scrollX;

        // mouse click
        var mouseEvent = e.detail.event.gesture.srcEvent;
        var clickX = mouseEvent.clientX + scrollX;
        var clickY = mouseEvent.clientY + scrollY;

        /*
         *  Calculate point offsets relative to element bounds
         */
        var clickImageOffsetX = clickX - screenRect.left;
        var clickImageOffsetY = clickY - screenRect.top;

        var imageScrollOffsetY = Math.abs(screenRect.top - containerRect.top);
        /*
         *  Store event
         */
        var t = new Date().getTime();
        var trackData = {
            x: clickImageOffsetX,
            y: clickImageOffsetY,
            t: t,
            scrl: imageScrollOffsetY,
            w: screenRect.width,
            h: screenRect.height
        };
        return trackData;
    };

})(typeof exports === 'undefined' ? this['PubLib'] = {} : exports);
