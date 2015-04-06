var Assessment = require('../');

var ass1 = new Assessment({
	"title": "DERP TEST",
	"questions": "questions.xlsx",
	"maxQuestions": 3,
  "passingScore": 2
});

ass1.launch(8080, true);