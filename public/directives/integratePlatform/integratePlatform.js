app.directive("integratePlatform", function() {
    return {
        restrict: 'A',
        scope: true,
        priority: 10,
        templateUrl: "/public/directives/integratePlatform/integrate-form.html",
        link: function link(scope, element, attrs) {
            $document.ready(function() {

            });
            element[0].style.margin = '15px';

            var guid = PubLib.guid();
            scope.guid = guid;

            var mdRadioGroupElem = angular.element(element.parent('md-radio-group')[0]);
            var name = mdRadioGroupElem.attr('data-name');
            scope.radioName = name;
            scope.radioValue = angular.element(element[0]).attr('static-radio');

            scope.autofocus = false;
            if (angular.element(element[0]).attr('first') !== undefined) {
                scope.autofocus = true;
            }
        }
    };
});
