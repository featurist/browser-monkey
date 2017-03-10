var angular = require('angular');

angular
  .module('FrameworksApp', [])
  .directive('bestFrameworks', function () {
    return {
      restrict: 'A',
      controller: 'FrameworksController',
      template: `<div ng-controller="FrameworksController">
        <button ng-click="hello()">press me</button>
        <div class="message">{{message}}</div>
      </div>`
    };
  })
  .controller('FrameworksController', function($scope){
    $scope.message = 'default';
    $scope.hello = function () {
      $scope.message = 'hello browser-monkey';
    }
  });

module.exports = class WebApp {
  constructor() {
    this.directiveName = 'best-frameworks';
    this.moduleName = 'FrameworksApp';
  }
}
