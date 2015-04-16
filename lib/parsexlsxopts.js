var _ = require('lodash');

function ParseXLSXOpts(sheet) {

  var out = {};
  var lastOption = null;
  var availableFields = [
    "id",
    "title",
    "description",
    "maxQuestions",
    "passingScore",
    "randomizeQuestions",
    "randomizeAnswers",
    "port",
    "host"
  ];

  sheet.forEach(function BuildOut(line, ind, sheet) {
    var data = line.split("=\'");
    var cell = data[0];
    var content = data[1];

    // this is a key
    if (cell.indexOf('A') === 0) {
      if(_.includes(availableFields, content)){
        lastOption = content;
      } else {
        throw ('Option "'+content+'" is not supported, please remove from excel config sheet');
      }
    }

    // this is a value
    if (cell.indexOf('B') === 0) {
      out[lastOption] = _.isNaN(parseInt(content, 10)) ? ((content.toLowerCase()==='true' || content.toLowerCase()==='false') ? (content.toLowerCase()==='true') : content ) : parseInt(content, 10);
      lastOption = null;
    }

  });

  return out;
}

module.exports = ParseXLSXOpts;
