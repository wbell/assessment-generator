var Assessment = require('../');

var ass1 = new Assessment({
	"Name": "DERP TEST",
	"Description": "This will test how derpy you are.",
	"Questions": "questions.xlsx"
});

ass1.launch('8080', true);