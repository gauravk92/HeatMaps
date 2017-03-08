function addClass(el, className) {
    if (el && el.classList) {
        el.classList.add(className);
    } else if (el) {
        el.className += ' ' + className;
    } else {
        throw "element must not be null";
    }
}

function removeClass(el, className) {
    if (el && el.classList) {
        el.classList.remove(className);
    } else if (el) {
        el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    } else {
        throw "element must not be null";
    }
}

function hasClass(el, className) {
    if (el && el.classList) {
        return el.classList.contains(className);
    } else if (el) {
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    } else {
        throw "element must not be null";
    }
}

function getJsonFromUrl(hashBased) {
    var query = null;
    if (hashBased) {
        var pos = location.href.indexOf("?");
        if (pos == -1) return [];
        query = location.href.substr(pos + 1);
    } else {
        query = location.search.substr(1);
    }
    var result = {};
    if (query) {
        query.split("&").forEach(function(part) {
            if (!part) return;
            var item = part.split("=");
            var key = item[0];
            var from = key.indexOf("[");
            if (from == -1) result[key] = decodeURIComponent(item[1]);
            else {
                var to = key.indexOf("]");
                var index = key.substring(from + 1, to);
                key = key.substring(0, from);
                if (!result[key]) result[key] = [];
                if (!index) result[key].push(item[1]);
                else result[key][index] = item[1];
            }
        });
    } else {
        throw "Error: attempt to split null string";
    }
    return result;
}


function setCookie(cname, cvalue) {
    var exdays = 30;
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}


function isInputCheckedWithName(name) {
    var checked = false;
    var elements = document.getElementsByName(name);
    for (var i = 0; i < elements.length; i++) {
        var elem = elements[i];
        if (elem && 'checked' in elem && elem.checked) {
            checked = true;
            continue;
        }
    }
    return checked;
}

function inPreviewMode() {
    var searchString = 'assignmentId=ASSIGNMENT_ID_NOT_AVAILABLE';
    return window.location.href.indexOf(searchString) >= 0;
}

function postForm(form) {
    var postRoute = form.getAttribute('action');
    var formElements = document.querySelectorAll('form [name]');
    var postData = {};
    var postForm = new FormData();
    for (var z = 0; z < formElements.length; z++) {
        var elem = formElements[z];
        postData[elem.getAttribute('name')] = elem.value;
        postForm.append(elem.getAttribute('name'), elem.value);
    }
    $http.post(postRoute, postForm, {
        transformRequest: angular.identity,
        headers: {
            'Content-Type': undefined
        }
    }).then(function(response) {
        document.body.innerHTML = "<h2>Your task was submitted successfully!<br>Please enter your confirmation code: HEJSA into your browser on your desktop device to complete this HIT.</h2>";
    }, function(response) {
        ////console.log(response);
        alert('failure');
    });
}

document.addEventListener("DOMContentLoaded", function(event) {

    if (!inPreviewMode()) {
        var hiddenElems = document.querySelectorAll('.hiddenInPreview');
        for (var i = 0; i < hiddenElems.length; i++) {
            removeClass(hiddenElems[i], 'hidden');
        }
    } else {
        var nonHiddenElems = document.querySelectorAll('.visibleInPreview');
        for (var i = 0; i < nonHiddenElems.length; i++) {
            removeClass(nonHiddenElems[i], 'hidden');
        }
    }

    var randomOrderElements = document.querySelectorAll('[random-order]');
    for (var x = 0; x < randomOrderElements.length; x++) {
        var element = randomOrderElements[x];
        var children = element.childNodes;
        var newHTML = "";
        var randomIndicies = PubLib.numOfRandomIndiciesWithMaxIndex(children.length, children.length);
        var childrenStore = [];
        for (var j = 0; j < children.length; j++) {
            var child = children[j];
            childrenStore.push(child.outerHTML);
        }
        for (var z = 0; z < randomIndicies.length; z++) {
            var index = randomIndicies[z];
            var newChild = childrenStore[index];
            newHTML += newChild;
        }
        element.innerHTML = newHTML;
    }

}, false);
