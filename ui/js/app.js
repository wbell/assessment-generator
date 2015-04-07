(function() {

  var app = angular.module('AssessmentApp', ['ui.router', 'angular-locker']);

  // setup
  app.run(['$rootScope', '$state', '$stateParams', 'user', function($rootScope, $state, $stateParams, user) {
    console.log('APP LOADED!');
    // make state & params available to templates
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){

      // prevent skipping ahead if intro hasn't been seen
      if(toState.name!=='intro' && !user.get('hasStarted')){
        event.preventDefault();
        $state.go('intro');
      }

      // prevent confirmation if all questions haven't been answered
      if(toState.name==='confirm' && !user.get('allAnswered')){
        event.preventDefault();
        $state.go('question', user.get('lastQuestion'));
      }

      // prevent grade if no confirmation
      if(toState.name==='grade' && !user.get('answersConfirmed')){
        event.preventDefault();
        $state.go('confirm');
      }
    });

    window.addEventListener("beforeunload", function(event) {
        if($state.is('grade')){
          console.log("CLEAR");
          user.clear();
        } else {
          console.log("SAVE");
          user.save();
        }

    });

  }]);

  // configure routes
  app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

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
        controller: ['$scope', '$stateParams', 'user', 'api', 'question', function($scope, $stateParams, user, api, question){
          $scope.q = question;
          $scope.q.index = $stateParams.questionNumber;

          user.set('lastQuestion', $stateParams.questionNumber);
        }]
      });

  }]);

  // configure locker
  app.config(['lockerProvider', function(lockerProvider){
    //lockerProvider.setDefaultNamespace('AssessmentApp')
  }]);

  app.directive('navigator', function(){
    return {
      restrict: 'A',
      templateUrl: 'templates/navigator.html',
      controller: ['$scope', '$stateParams', '$state', 'api', 'user', function($scope, $stateParams, $state, api, user){
        $scope.isVisible = function(){
          return ($state.name === 'question' || $state.name === 'confirm');
        };

        $scope.questionKey = [];

        api.getInfo().then(function(res){
          $scope.questionKey = res.data.questionKey;
        });

        $scope.prev = function(){
          if($state.name==='question'){

          }
        }

      }]
    };
  });

  app.factory('user', ['locker', function(locker) {

    var userObj = locker.get('user') || {
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
      if(prop){
        return userObj[prop];
      } else {
        return userObj;
      }
    }

    function set(prop, val){
      userObj[prop] = val;
      return val;
    }

    function saveState(){
      locker.put(userObj);
    }

    function clearLocker(){
      locker.clean();
    }

    return {
      setAnswer: setAnswer,
      setNames: setNames,
      get: get,
      set: set,
      save: saveState,
      clear: clearLocker
    };

  }]);

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
