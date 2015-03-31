var xlsx = require('xlsx');
var util = require('util');
var _ = require('lodash');
var defaults = require('./defaults');

function AssessmentGenerator(userOpts){
	userOpts = _.isPlainObject(userOpts) ? userOpts : {};
	var opts = _.assign(defaults, userOpts);

	// throw errors for malformed options
	if(!_.isNumber(opts.MaxQuestions) || opts.MaxQuestions<1) throw ('"MaxQuestions" must be of type `Number` and greater than `0`');
	if(!_.isNumber(opts.PassingScore) || opts.PassingScore<0) throw ('"PassingScore" must be of type `Number` and greater than `-1`');
	if(opts.PassingScore > opts.MaxQuestions) throw ('"PassingScore" can not exceed "MaxQuestions"');
	if(!opts.Name) throw ('"Name" must be provided');
	if(!opts.Description) throw ('"Description" must be provided');
	if(!opts.Questions || !_.isString(opts.Questions)) throw ('You must provide "Questions" in the form of an Excel document');
	
	var file = xlsx.readFile(opts.Questions);
	var sheetName = file.Props.SheetNames[0];
	var sheetObj = file.Sheets[sheetName];
	var sheet = xlsx.utils.sheet_to_formulae(sheetObj);
	
	this.testJSON = ParseXLSX(sheet, opts);

	return this;

}

AssessmentGenerator.prototype.launch = function Launch(userOpts){
	userOpts = _.isPlainObject(userOpts) ? userOpts : {};
	var opts = _.assign(defaults, userOpts);

	return this;
};

AssessmentGenerator.prototype.printKey = function PrintKey(){
	return this;
};

function ParseXLSX(sheet){

	var out = [];
	var key = [];
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

			key.push({
				"id": cell,
				"answer": null
			});
		}

		// this is an answer option
		if(cell.indexOf('B')===0){
			if(!lastQuestion) throw ('Excel document does not start with a question!');
			currentObj = _.findWhere(out, {"id":lastQuestion});
			currentObj.answers.push({
				"id": cell,
				"answer": content
			});
		}

		// this is a correct answer
		if(cell.indexOf('C')===0){
			if(!lastQuestion) throw ('Excel document does not start with a question!');
			currentObj = _.findWhere(key, {"id":lastQuestion});
			currentObj.answer = cell;
		}

	});

	// perform transformations on output array

	return {"questions": out, "key": key};
}

module.exports = AssessmentGenerator;