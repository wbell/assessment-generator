var _ = require('lodash');

function ParseXLSX(sheet, opts) {

  var out = [];
  var key = [];
  var lastQuestion = null;

  sheet.forEach(function BuildOut(line, ind, sheet) {
    var data = line.split("=\'");
    var cell = data[0];
    var content = data[1];
    var currentObj = null;
    var correctAns = null;
    var len = 0;

    // this is a question
    if (cell.indexOf('A') === 0) {
      lastQuestion = cell;
      out.push({
        "id": cell,
        "question": content,
        "answers": []
      });

      key.push({
        "id": cell,
        "answer": null
      });
    }

    // this is an answer option
    if (cell.indexOf('B') === 0) {
      if (!lastQuestion) throw ('Excel document does not start with a question!');
      currentObj = _.findWhere(out, {
        "id": lastQuestion
      });
      currentObj.answers.push({
        "id": cell,
        "answer": content
      });
    }

    // this is a correct answer
    if (cell.indexOf('C') === 0) {
      if (!lastQuestion) throw ('Excel document does not start with a question!');
      currentObj = _.findWhere(key, {
        "id": lastQuestion
      });
      currentObj.answer = cell;
    }

  });

  len = out.length;

  // set nulls
  if (_.isNull(opts.maxQuestions)) opts.maxQuestions = len;

  // perform transformations on output array
  if (opts.randomizeQuestions) {
    out = _.shuffle(out);
  }

  if (opts.maxQuestions < len) {
    out = out.slice(0, opts.maxQuestions);
  }

  if (opts.maxQuestions > len) opts.maxQuestions = len;

  if (_.isNull(opts.passingScore) || (opts.maxQuestions < opts.passingScore)) opts.passingScore = opts.maxQuestions;

  if (opts.randomizeAnswers) {
    out.forEach(function ShuffleAnswers(question, ind, out) {
      question.answers = _.shuffle(question.answers);
    });
  }

  return {
    "questions": out,
    "key": key
  };
}

module.exports = ParseXLSX;
