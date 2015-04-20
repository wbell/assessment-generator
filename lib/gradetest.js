var _ = require('lodash');

function GradeTest(postData, testJSON, passingScore) {

  var score = 0;
  var total = testJSON.questions.length;
  var ansQuestions = [];


  _.forEach(postData, function(ans, qid) {
    var keyAns = ans.replace('B', 'C');
    var keyMatch = _.findWhere(testJSON.key, {
      id: qid
    });
    var questionMatch = _.findWhere(testJSON.questions, {
      id: qid
    });

    // console.log('KEY ANS', keyAns);
    // console.log('KEY MATCH', keyMatch);
    // console.log('Question MATCH', questionMatch);

    if (keyAns === keyMatch.answer) {
      ++score;
    }

    if(questionMatch){
      questionMatch.answers.forEach(function(a, ind) {
        var correctAnswer = keyMatch.answer.replace('C', 'B');
        var chosenAnswer = ans;

        if (a.id === correctAnswer) {
          a.correct = true;
        }

        if (a.id === chosenAnswer) {
          a.chosen = true;
        } else {
          a.chosen = false;
        }
      });

      ansQuestions.push(questionMatch);
    }

  });


  return {
    score: {
      number: score,
      percent: Math.floor((score/total)*100),
      pass: score >= passingScore
    },
    key: score >= passingScore ? ansQuestions : null
  };

}

module.exports = GradeTest;
