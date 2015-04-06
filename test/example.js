var Assessment = require('../');

var ass1 = new Assessment({
	"Title": "DERP TEST",
	"Description": "This will test how derpy you are.",
	"Questions": "questions.xlsx",
	"MaxQuestions": 3
});

ass1.launch(8080, true);