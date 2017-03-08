/**

<div ng-repeat="q in surveyQuestions">
    <md-radio-group>
        <p>{{q.question}}</p>
        <div dynamic-radio="q"></div>
        <div dynamic-radio="q"></div>
        <div dynamic-radio="q"></div>
        <div dynamic-radio="q"></div>
        <div dynamic-radio="q"></div>
    </md-radio-group>
</div>


var surveyQuestionsFeed = [{
        name: 'question1',
        question: "How beautiful was the search page?",
        kw: "Beautiful"
    };

*/


app.directive("dynamicCheckbox", function() {
    return {
        restrict: 'A',
        scope: {
            dynamicCheckbox: '='
        },
        priority: 10,
        templateUrl: "/public/directives/dynamicCheckbox/dynamic-checkbox.html",
        link: function link(scope, element, attrs) {
            element[0].style.margin = '15px';

            var guid = PubLib.guid();
            scope.guid = guid;


            scope.other = scope.dynamicCheckbox.other ? true : false;
            scope.checkboxName = scope.dynamicCheckbox.name;
            scope.checkboxValue = scope.dynamicCheckbox.value;
            scope.autofocus = scope.dynamicCheckbox.autofocus ? true : false;
            scope.displayValue = 'inline';
            if (scope.other) {

                element[0].style.marginTop = '-20px';
                scope.otherCheckboxPosition = 'relative';
                scope.otherCheckboxTop = '27px';

                scope.checkboxName = scope.dynamicCheckbox.name + '_other';
                scope.checkboxValue = 'Other';

                $(document).ready(function() {
                    setTimeout(function() {
                        var textarea = document.querySelector('[name=' + scope.checkboxName + '_text' + ']');
                        $(textarea).on('focus', function() {
                            var otherCheckbox = document.getElementById(guid);
                            $(otherCheckbox).prop('checked', true);
                        });
                    }, 1000);
                });
            }
        }
    };
});
