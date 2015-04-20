(function() {

  var app = angular.module('AssessmentApp', ['ui.router', 'angular-locker']);

  // setup
  app.run(['$rootScope', '$timeout', '$location', '$state', '$stateParams', 'user', function($rootScope, $timeout, $location, $state, $stateParams, user) {

    var userReady = false;

    $rootScope.userStatus = function() {
      return user.get('id');
    };

    $rootScope.$watch('userStatus()', function(newVal, oldVal) {
      if (newVal) userReady = true;
    });

    // make state & params available to templates
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

      if (!userReady) {
        event.preventDefault();
        $timeout(function() {
          $state.go(toState.name, toParams);
        }, 200);
        return false;
      }

      if (user.get('answersConfirmed')) {
        event.preventDefault();
        $state.go('grade');
        return false;
      }

      if (toState.name === 'intro' && user.get('hasStarted')) {
        event.preventDefault();
        $state.go(user.get('lastState').name, user.get('lastState').params);
        return false;
      }

    });

    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      if (toState.name !== 'otherwise') {
        user.set('lastState', {
          name: toState.name,
          params: toParams
        });
        user.save();
      }
    });

    window.addEventListener('beforeunload', function(event) {
      // if ($state.current.name === 'grade') {
      //   user.clear();
      // } else {
      //   //user.save();
      // }

      user.save();
    });

  }]);

  // configure routes
  app.config(['$stateProvider', function($stateProvider) {

    $stateProvider

    // otherwise
      .state('otherwise', {
      url: '*path',
      template: '<p>One moment...</p>',
      controller: ['$state', function($state) {
        $state.go('intro');
      }]
    })

    // intro state
    .state('intro', {
      url: '/intro',
      templateUrl: 'templates/intro.html',
      controller: ['$rootScope', '$scope', '$state', 'user', function($rootScope, $scope, $state, user) {

        $scope.info = $rootScope.info;

        $scope.getPct = function() {
          return Math.floor(($scope.info.passingScore / $scope.info.maxQuestions) * 100);
        };

        $scope.start = function() {
          user.set('hasStarted', true);
          $state.go('question', {
            questionNumber: 1
          });
        };

      }]
    })

    // question state
    .state('question', {
      url: '/question/{questionNumber:[0-9]{1,4}}',
      templateUrl: 'templates/question.html',
      resolve: {
        question: ['$stateParams', 'api', function($stateParams, api) {
          var ind = $stateParams.questionNumber - 1;
          return api.getInfo('questionKey').then(function(key) {
            return api.getQuestion(key[ind]).then(function(res) {
              return res.data;
            });
          });
        }]
      },
      controller: ['$scope', '$stateParams', 'user', 'api', 'question', function($scope, $stateParams, user, api, question) {
        $scope.q = question;
        $scope.q.index = $stateParams.questionNumber;

        $scope.q.selectedAnswer = user.get('answers')[question.id];

        $scope.setAnswer = function() {
          user.setAnswer(question.id, $scope.q.selectedAnswer);
          user.save();
        };

      }]
    })

    // confirm state
    .state('confirm', {
      url: '/confirm',
      templateUrl: 'templates/confirm.html',
      controller: ['$scope', '$state', 'user', function($scope, $state, user) {
        $scope.allAnswered = user.get('allAnswered');
        $scope.grade = function() {
          $state.go('grade');
        };
      }]
    })

    // grade state
    .state('grade', {
      url: '/grade',
      templateUrl: 'templates/grade.html',
      resolve: {
        grade: ['api', function(api) {
          return api.grade().then(function(res) {
            return res.data;
          });
        }]
      },
      controller: ['$rootScope', '$scope', '$state', 'grade', 'user', function($rootScope, $scope, $state, grade, user) {

        $scope.restart = function() {
          user.clear();
          $state.go('intro');
        };

        $scope.score = grade.score;

        $scope.key = grade.key;

        $scope.info = $rootScope.info;

        $scope.getPct = function() {
          return Math.floor(($scope.info.passingScore / $scope.info.maxQuestions) * 100);
        };

      }]
    });

  }]);

  app.directive('navigator', function() {
    return {
      restrict: 'A',
      templateUrl: 'templates/navigator.html',
      controller: ['$timeout', '$scope', '$stateParams', '$state', 'api', 'user', function($timeout, $scope, $stateParams, $state, api, user) {
        $scope.isVisible = function() {
          return ($state.current.name === 'question' || $state.current.name === 'confirm');
        };

        $scope.ans = function() {
          return _.keys(user.get('answers')).length;
        };

        $scope.$watch('ans()', function(newVal) {
          newVal = user.get('answers');
          if (angular.isObject(newVal)) applyStyling(newVal);
        });

        function applyStyling(ans) {
          var answeredQuestions = ans || user.get('answers');
          var opts = document.getElementsByTagName('option');

          angular.element(opts).removeClass('answered');

          angular.forEach(answeredQuestions, function(ans, que) {
            var ind = $scope.keys.indexOf(que);
            if (opts[ind]) angular.element(opts[ind]).addClass('answered');
          });

        }

        $timeout(applyStyling, 1000);

        $scope.$watch('$stateParams.questionNumber', function(newVal, oldVal) {
          if (angular.isString(newVal)) {
            $scope.navItem = $scope.questionKey[parseInt(newVal, 10) - 1].val;
          }
        });

        $scope.$watch('$state.current.name', function(newVal, oldVal) {
          if (newVal === 'confirm') {
            $scope.navItem = $scope.questionKey[$scope.questionKey.length - 1].val;
          }
        });

        $scope.questionKey = [];

        api.getInfo('questionKey').then(function(res) {
          $scope.keys = res;
          angular.forEach(res, function(item, ind) {
            $scope.questionKey.push({
              val: (ind + 1),
              label: 'Question ' + (ind + 1)
            });
          });

          $scope.questionKey.push({
            val: 'confirm',
            label: 'Confirm'
          });

          $scope.navItem = $scope.questionKey[0].val;

        });

        $scope.navigate = function() {
          if ($scope.navItem === 'confirm') {
            $state.go('confirm');
          } else {
            $state.go('question', {
              questionNumber: $scope.navItem
            });
          }
        };

        $scope.prev = function() {
          if ($state.current.name === 'question') {
            $state.go('question', {
              questionNumber: parseInt($stateParams.questionNumber, 10) - 1
            });
          } else {
            $state.go('question', {
              questionNumber: $scope.questionKey.length - 1
            });
          }
        };

        $scope.next = function() {
          if ($state.current.name === 'question' && $stateParams.questionNumber == $scope.questionKey.length - 1) {
            $state.go('confirm');
          } else {
            $state.go('question', {
              questionNumber: parseInt($stateParams.questionNumber, 10) + 1
            });
          }
        };

      }]
    };
  });

  app.factory('user', ['$rootScope', 'locker', function($rootScope, locker) {

    var userObj = {};

    function setObject(id, currentSession) {
      userObj = locker.namespace(id).get('user') || {};

      if(!userObj.session || userObj.session != currentSession){

        userObj = {
          id: id,
          session: currentSession,
          firstName: null,
          lastName: null,
          answers: {}
        };

      }

      return get();
    }

    function setAnswer(questionId, answerId) {
      userObj.answers[questionId] = answerId;

      (function(questions, answers) {
        var allAnswered = true;

        angular.forEach(questions, function(qid) {
          if (!answers[qid]) {
            allAnswered = false;
          }
        });

        set('allAnswered', allAnswered);
      })($rootScope.info.questionKey, get('answers'));

      saveState();
    }

    function setNames(firstName, lastName) {
      userObj.firstName = firstName;
      userObj.lastName = lastName;
    }

    function get(prop) {
      if (prop) {
        return userObj[prop];
      } else {
        return userObj;
      }
    }

    function set(prop, val) {
      if (angular.isObject(prop)) {
        userObj = prop;
        return userObj;
      } else {
        userObj[prop] = val;
        return val;
      }
    }

    function saveState() {
      locker.namespace(userObj.id).put('user', userObj);
    }

    function clearLocker() {
      locker.namespace(userObj.id).clean();
      setObject(userObj.id, userObj.session);
    }

    return {
      setObject: setObject,
      setAnswer: setAnswer,
      setNames: setNames,
      get: get,
      set: set,
      save: saveState,
      clear: clearLocker
    };

  }]);

  app.factory('api', ['$rootScope', '$http', 'user', function($rootScope, $http, user) {

    getInfo().then(function(res) {
      var info = res.data;
      user.setObject(info.id, info.session);
    });

    function getInfo(prop) {
      return $http.get('api/info', {
        cache: true
      }).then(function(res) {
        $rootScope.info = res.data;
        if (prop) {
          return res.data[prop];
        } else {
          return res;
        }
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
