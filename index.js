var xlsx = require('xlsx');
var browserSync = require('browser-sync');
var util = require('util');
var _ = require('lodash');
var crypto = require('crypto');
var gulp = require('gulp');
var browserify = require('browserify');
var defaults = require('./defaults');
var htmlBuilder = require('./ui/html');
var assessmentStyle = require('./ui/style');

function AssessmentGenerator(userOpts){
	userOpts = _.isPlainObject(userOpts) ? userOpts : {};
	var opts = this.opts = _.assign(defaults, userOpts);

	// throw errors for malformed options
	if(!_.isNumber(opts.MaxQuestions) || opts.MaxQuestions<1) throw ('"MaxQuestions" must be of type `Number` and greater than `0`');
	if(!_.isNumber(opts.PassingScore) || opts.PassingScore<0) throw ('"PassingScore" must be of type `Number` and greater than `-1`');
	if(opts.PassingScore > opts.MaxQuestions) throw ('"PassingScore" can not exceed "MaxQuestions"');
	if(!opts.Name || !_.isString(opts.Name)) throw ('"Name" must be provided as a `String`');
	if(!opts.Description) throw ('"Description" must be provided');
	if(!opts.Questions || !_.isString(opts.Questions)) throw ('You must provide "Questions" in the form of an Excel document');
	
	var file = xlsx.readFile(opts.Questions);
	var sheetName = file.Props.SheetNames[0];
	var sheetObj = file.Sheets[sheetName];
	var sheet = xlsx.utils.sheet_to_formulae(sheetObj);
	
	this.dirName = 'assessment_'+opts.Name.replace(/\W/g, '')+'_'+randomValueHex(12);
	this.testJSON = ParseXLSX(sheet, opts);

	return this;

}

AssessmentGenerator.prototype.launch = function Launch(port, open){
	GenerateOutputEnv(this);

	this.opts.port = (port && _.isNumber(parseInt(port, 10))) ? parseInt(port, 10) : this.opts.port;
	open = !!open;

	var bsConfig = {
		ui: false,
		server: {
			baseDir: this.opts.BaseDir+'/'+this.dirName
		},
		port: this.opts.port,
		ghostMode: false,
		logPrefix: 'Assessment Generator',
		logFileChanges: false,
		open: open,
		notify: false,
		codeSync: false,
		middleware: function (req, res, next) {
			console.log(req.url);
			next();
		}
	};

	//browserSync(bsConfig);

	return this;
};

function GenerateOutputEnv(assessment){
	var html = htmlBuilder(assessment.opts.Name, assessmentStyle, assessmentScript);
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


function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
}

module.exports = AssessmentGenerator;