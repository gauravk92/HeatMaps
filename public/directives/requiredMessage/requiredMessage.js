app.directive("requiredMessage", function() {
    return {
        priority: 10,
        restrict: 'A',
        template: "<div><div ng-message=\"required\">This is required.</div></div>",
        link: function($scope, $element, $attrs) {
            //$element.attr('style', 'min-height: initial;');
            $element.css('min-height', 'initial');
        }
    };
});
