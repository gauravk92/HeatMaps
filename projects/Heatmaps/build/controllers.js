angular.module("App",["ngMaterial"]).controller("AppCtrl",function($scope,$timeout,$mdSidenav,$log){$scope.heatmapTitle=null,$scope.sideNavIsOpen=!1,$scope.toggleCloseIcon=function(){var fab=document.getElementById("md-fab");fab&&$scope.sideNavIsOpen?addClass(fab,"close"):removeClass(fab,"close")},$scope.$watch("sideNavIsOpen",function(){setTimeout($scope.toggleCloseIcon,500)}),$scope.sideNavToggle=function(){$mdSidenav("right").toggle().then($scope.toggleCloseIcon)},$scope.init=function(){document.addEventListener("SideNavCloseEvent",function(e){$scope.$apply(function(){$scope.sideNavIsOpen=!1})},!1)},$scope.init()}).controller("RightCtrl",function($scope,$timeout,$mdSidenav,$log){$scope.heatmaps=[],$scope.zoomLevels=[.25,.5,.75,1,1.25,1.5,1.75,2],$scope.init=function(){if(console.log(DATA),DATA)for(var i=0;i<DATA.length;i++){var name=DATA[i].name;0==i&&$("#dropdown-0").html(name);var title=DATA[i].title;!$scope.heatmapTitle&&title&&($("#SettingsTitle").html("Settings - "+title),$scope.heatmapTitle=title),$scope.heatmaps.push(name)}},$scope.init()}).controller("SelectController",function($scope){$scope.leftheatmaps=[],$scope.rightheatmaps=[],$scope.selectLeft=function(heatmap){console.log(heatmap),console.log($scope.leftheatmaps)},$scope.selectRight=function(heatmap){console.log(heatmap),console.log($scope.rightheatmaps)},setHeatmaps=function(maps){$scope.leftheatmaps=maps,$scope.rightheatmaps=maps,console.log(maps)}});