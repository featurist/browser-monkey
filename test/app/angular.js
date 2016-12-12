var angular = require('angular');
var httpism = require('httpism');

angular
  .module('FrameworksApp', [])
  .directive('bestFrameworks', function () {
    return {
      restrict: 'A',
      controller: 'FrameworksController',
      template: `<div ng-controller="FrameworksController">
        <ul>
          <li ng-repeat="framework in frameworks">{{framework}}</li>
        </ul>
      </div>`
    };
  })
  .controller('FrameworksController', function($scope){
    httpism.get('/api/frameworks').then(response => {
      $scope.frameworks = response.body;
      $scope.$digest();
    });
  });

module.exports = class WebApp {
  constructor() {
    this.directiveName = 'best-frameworks';
    this.moduleName = 'FrameworksApp';
  }
}
