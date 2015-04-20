var xlsx = require('xlsx');
var _ = require('lodash');
var defaults = require('./lib/defaults');
var ParseXLSX = require('./lib/parsexlsx');
var ParseXLSXOpts = require('./lib/parsexlsxopts');
var GradeTest = require('./lib/gradetest');
var log = require('./lib/log');
var path = require('path');
var http = require('http');
var open = require('open');
var nodeStatic = require('node-static');

// constructor
function AssessmentGenerator(userOpts) {
  userOpts = _.isPlainObject(userOpts) ? userOpts : {};
  var opts = this.opts = _.assign({}, defaults, userOpts);

  // make sure excel sheet is there
  if (!opts.questions || !_.isString(opts.questions)) throw ('You must provide "questions" in the form of an Excel document');

  // parse file
  var file = xlsx.readFile(opts.questions);

  // if config sheet is there, parse it for more options
  if (_.includes(file.Props.SheetNames, opts.configSheetName)) {
    var xlsxConfigSheetObj = file.Sheets[opts.configSheetName];
    var xlsxConfigSheet = xlsx.utils.sheet_to_formulae(xlsxConfigSheetObj);
    var xlsxConfigOpts = ParseXLSXOpts(xlsxConfigSheet);

    opts = this.opts = _.assign({}, defaults, xlsxConfigOpts, userOpts);
  }

  // throw errors for malformed options
  if (!_.isNull(opts.maxQuestions) && (!_.isNumber(opts.maxQuestions) || opts.maxQuestions < 1)) throw ('"maxQuestions" must be of type `Number` and greater than `0`');
  if (!_.isNull(opts.passingScore) && (!_.isNumber(opts.passingScore) || opts.passingScore < 0)) throw ('"passingScore" must be of type `Number` and greater than `-1`');
  if (!_.isNull(opts.maxQuestions) && !_.isNull(opts.passingScore) && (opts.passingScore > opts.maxQuestions)) throw ('"passingScore" can not exceed "maxQuestions"');
  if (!opts.title || !_.isString(opts.title)) throw ('"title" must be provided as a `String`');
  if (!opts.description) throw ('"description" must be provided');


  var sheetName = opts.questionsSheetName || _.without(file.Props.SheetNames, opts.configSheetName)[0];
  var sheetObj = file.Sheets[sheetName];
  if (!sheetObj) throw ('"' + sheetNAme + '" sheet not found.');
  var sheet = xlsx.utils.sheet_to_formulae(sheetObj);

  // create test JSON
  this.testJSON = ParseXLSX(sheet, opts);

  return this;

}

// methods
AssessmentGenerator.prototype.launch = function Launch(port, launchBrowser) {

  var _this = this;
  var fileServer = new nodeStatic.Server(path.join(__dirname, 'ui'));
  var session = Date.parse(new Date());

  this.opts.port = (port && _.isNumber(parseInt(port, 10))) ? parseInt(port, 10) : this.opts.port;
  launchBrowser = !!launchBrowser;

  require('http').createServer(function(req, res) {

    // serve static files
    req.addListener('end', function() {
      fileServer.serve(req, res);
    }).resume();

    // send general info
    if (req.url.toLowerCase() === '/api/info') {
      var info = {
        "id": _this.opts.id || _this.opts.title.replace(/\W/g, ''),
        "session": session,
        "title": _this.opts.title,
        "description": _this.opts.description,
        "maxQuestions": _this.opts.maxQuestions,
        "passingScore": _this.opts.passingScore,
        "questionKey": _.pluck(_this.testJSON.questions, 'id')
      };

      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify(info));
    }

    // send question info
    if (req.url.toLowerCase().match('/api/question/a[0-9]{1,4}')) {
      var qID = _.last(req.url.split('/'));
      var info = _.find(_this.testJSON.questions, {
        id: qID
      }) || {};
      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify(info));
    }

    // send grade info
    if (req.url.toLowerCase() === '/api/grade' && req.method === 'POST') {
      var postData = '';

      req.on('data', function(chunk) {
        postData += chunk.toString();
      });

      req.on('end', function() {
        var result = GradeTest(JSON.parse(postData), _this.testJSON, _this.opts.passingScore);
        res.writeHead(200, {
          "Content-Type": "application/json"
        });
        res.end(JSON.stringify(result));

        if(result.score.pass){
          var dateStamp = new Date().toISOString();
          log('Congrats! You passed! '+dateStamp);
        } else {
          log('Aw, you failed. You dumb.');
        }

      });
    }

  }).listen(this.opts.port);

  log(this.opts.title + ' started at http://' + this.opts.host + ':' + this.opts.port);

  if (launchBrowser) {
    log('Opening browser');
    open('http://' + this.opts.host + ':' + this.opts.port);
  }

  return this;
};




module.exports = AssessmentGenerator;
