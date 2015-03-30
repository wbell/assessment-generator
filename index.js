var xlsx = require('xlsx');
var util = require('util');
var _ = require('lodash');

function AssessmentGenerator(opts){

	var file = xlsx.readFile('./test/questions.xlsx');

	//console.log(file);
	var sheetName = file.Props.SheetNames[0];
	var sheetObj = file.Sheets[sheetName];
	var sheet = xlsx.utils.sheet_to_formulae(sheetObj);
	var testJSON = ParseXLSX(sheet);

	console.log(util.inspect(testJSON, false, null));

}

function ParseXLSX(sheet){

	var out = [];
	var lastQuestion = null;

	sheet.forEach(function BuildOut(line,ind,sheet){
		var data = line.split("=\'");
		var cell = data[0];
		var content = data[1];
		var currentObj = null;
		var correctAns = null;

		// this is a question
		if(cell.indexOf('A')===0){
			lastQuestion = cell;
			out.push({
				"id": cell,
				"question": content,
				"answers": []
			});
		}

		// this is an answer option
		if(cell.indexOf('B')===0){
			if(!lastQuestion) throw ('Excel document does not start with a question!');
			currentObj = _.findWhere(out, {"id":lastQuestion});
			currentObj.answers.push({
				"id": cell,
				"answer": content,
				"correct": false
			});
		}

		// this is a correct answer
		if(cell.indexOf('C')===0){
			if(!lastQuestion) throw ('Excel document does not start with a question!');
			currentObj = _.findWhere(out, {"id":lastQuestion});
			correctAns = _.findWhere(currentObj.answers, {"id":cell.replace('C','B')});
			correctAns.correct = true;
		}

	});

	return out;
}

AssessmentGenerator();

module.exports = AssessmentGenerator;