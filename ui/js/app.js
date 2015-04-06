(function() {

  var app = angular.module('AssessmentApp', ['ui.router', 'angular-locker']);

  app.run(['$rootScope', function($rootScope) {
    console.log('APP LOADED!', $rootScope);
  }]);

  app.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/intro');

    $stateProvider

      // intro state
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
          $scope.info = info;

          $scope.getPct = function(){
            return Math.floor((info.passingScore/info.maxQuestions)*100);
          };

          $scope.start = function(){
            user.set('hasStarted', true);
          };

        }]
      })

      // question state
      .state('question', {
        url: '/question/{questionNumber:[0-9]{1,4}}',
        templateUrl: 'templates/question.html',
        resolve: {
          question: ['$stateParams', 'api', function($stateParams, api){
            return api.getInfo().then(function(res){
              return res.data.questionKey;
            }).then(function(key){
              var ind = $stateParams.questionNumber - 1;
              return api.getQuestion(key[ind]).then(function(res){
                return res.data;
              });
            });

          }]
        },
        controller: ['$scope', '$stateParams', 'user', 'question', function($scope, $stateParams, user, question){
          $scope.q = question;
          $scope.q.index = $stateParams.questionNumber;


        }]
      })

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

    function set(prop, val){
      userObj[prop] = val;
      return val;
    }

    function saveState(){

    }

    return {
      setAnswer: setAnswer,
      setNames: setNames,
      get: get,
      set: set,
      save: saveState
    };

  });

  app.factory('api', ['$rootScope', '$http', 'user', function($rootScope, $http, user) {

    function getInfo() {
      return $http.get('api/info', {
        cache: true
      }).then(function(res){
        $rootScope.info = res.data;
        return res;
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
