app.directive("enRadio",function(){return{restrict:"A",scope:!0,priority:10,templateUrl:"/public/directives/enRadio/en-radio.html",link:function(scope,element,attrs){element[0].style.margin="15px";var guid=PubLib.guid();scope.guid=guid;var name=angular.element(element.parent("md-radio-group")[0]).attr("data-name");scope.radioName=name,scope.radioValue=angular.element(element[0]).attr("en-radio")}}});