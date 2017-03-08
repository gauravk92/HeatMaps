app.directive('requireInput', function() {
    return {
        link: function($scope, $element, $attrs) {
            console.log($attrs.requireInput);
            $scope.$watch($attrs.requireInput, function(value) {
                if (value) {
                    $element.attr('ng-repeat', 'data in input');
                    // $element.attr('required', 'required');
                    //    $element.attr('aria-required', 'true');
                } else {
                    //    $element.removeAttr('required');
                    //  $element.removeAttr('aria-required');
                }
            });
        }
    };
});
