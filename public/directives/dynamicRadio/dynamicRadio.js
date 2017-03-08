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


app.directive("dynamicRadio", function() {
    return {
        restrict: 'A',
        scope: {
            dynamicRadio: '='
        },
        priority: 10,
        templateUrl: "/public/directives/dynamicRadio/dynamic-radio.html",
        link: function link(scope, element, attrs) {
            element[0].style.margin = '15px';

            var guid = PubLib.guid();
            scope.guid = guid;

            scope.other = scope.dynamicRadio.other ? true : false;
            scope.radioName = scope.dynamicRadio.name;
            scope.radioValue = scope.dynamicRadio.value;
            scope.autofocus = scope.dynamicRadio.autofocus ? true : false;
            scope.displayValue = 'inline';
            if (scope.other) {
                scope.radioValue = 'Other';

                element[0].style.marginTop = '-20px';
                scope.otherRadioPosition = 'relative';
                scope.otherRadioTop = '27px';

                $(document).ready(function() {
                    setTimeout(function() {
                        var textarea = document.querySelector('[name=' + scope.radioName + '_text' + ']');
                        $(textarea).on('focus', function() {
                            var otherRadio = document.getElementById(guid);
                            $(otherRadio).prop('checked', true);
                        });
                    }, 1000);
                });
            }
        }
    };
});
