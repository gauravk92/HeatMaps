angular.module("App",["ngMaterial"]).controller("GenerateController",function($scope){$scope.inputItems=[],$scope.title=null,$scope.countChar="A",$scope.addItem=function(){var inputItem={},char=String.fromCharCode($scope.countChar.charCodeAt()+1);$scope.countChar=char,inputItem.nameid=PubLib.guid(),inputItem.imageid=PubLib.guid(),inputItem.dataid=PubLib.guid(),inputItem.helpid=PubLib.guid(),inputItem.jsondataid=PubLib.guid(),inputItem["char"]=char,$scope.inputItems.push(inputItem),console.log($scope.title)},$scope.generate=function(){if($scope.jsondata){var genController=new GenerateController;genController.generateWithData($scope.jsondata)}else{for(var outputData=[],i=0;i<$scope.inputItems.length;i++){var item=$scope.inputItems[i],newItem={};newItem.image=item.image,newItem.name=item.name,newItem.title=$scope.title;var results=Papa.parse(item.data,{header:!0}),data=results.data,errors=results.errors;if(!(data&&data.length>0)&&errors&&errors.length>0){var helpText="";return errors.forEach(function(obj,idx){var row=obj.row?"Row "+obj.row+": ":"",message=(obj.code?obj.code:"",obj.message?obj.message:"");helpText+=row+message+"\n"}),void(item.helptext=helpText)}newItem.values=data,outputData.push(newItem)}console.log(outputData);var genController=new GenerateController;genController.generateWithData(outputData)}},$scope.init=function(){$scope.addItem()},$scope.init()});