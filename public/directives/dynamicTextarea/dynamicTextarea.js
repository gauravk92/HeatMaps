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


app.directive("dynamicTextarea", function() {
    return {
        restrict: 'A',
        scope: {
            dynamicTextarea: '='
        },
        priority: 10,
        templateUrl: "/public/directives/dynamicTextarea/dynamic-textarea.html",
        link: function link(scope, element, attrs) {
            element[0].style.margin = '15px';

            var guid = PubLib.guid();
            scope.guid = guid;

            scope.textareaName = scope.dynamicTextarea.name;
            scope.textareaLabel = scope.dynamicTextarea.label;
        }
    };
});
