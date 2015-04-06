(function() {

  var app = angular.module('AssessmentApp', ['ui.router']);

  app.run(function() {
    console.log('APP LOADED!');
  });

  app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/intro');

    $stateProvider
      .state('intro', {
        url: '/intro',
        templateUrl: 'templates/intro.html',
        resolve: {
          info: ['api', function(api){
            return api.getInfo().then(function(res){
              return res.data;
            });
          }]
        },
        controller: ['$scope', 'user', 'info', 'api', function($scope, user, info, api){
          console.log(info);
        }]
      });

  });

  app.factory('user', function() {

    var userObj = {
      firstName: null,
      lastName: null,
      answers: {}
    };

    function setAnswer(questionId, answerId) {
      userObj.answers[questionId] = answerId;
    }

    function setNames(firstName, lastName) {
      userObj.firstName = firstName;
      userObj.lastName = lastName;
    }

    function get(prop) {
      return userObj[prop];
    }

    return {
      setAnswer: setAnswer,
      setNames: setNames,
      get: get
    };

  });

  app.factory('api', ['$http', 'user', function($http, user) {

    function getInfo() {
      return $http.get('api/info', {
        cache: true
      });
    }

    function getQuestion(id) {
      return $http.get('api/question/' + id, {
        cache: true
      });
    }

    function grade() {
      return $http.post('api/grade', user.get('answers'));
    }

    return {
      getInfo: getInfo,
      getQuestion: getQuestion,
      grade: grade
    };

  }]);

})();
