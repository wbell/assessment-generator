var xlsx = require('xlsx');
var _ = require('lodash');
var defaults = require('./lib/defaults');
var ParseXLSX = require('./lib/parsexlsx');
var log = require('./lib/log');
var path = require('path');
var http = require('http');
var os = require('os');
var open = require('open');
var nodeStatic = require('node-static');

// constructor
function AssessmentGenerator(userOpts) {
  userOpts = _.isPlainObject(userOpts) ? userOpts : {};
  var opts = this.opts = _.assign(defaults, userOpts);

  // throw errors for malformed options
  if (!_.isNull(opts.MaxQuestions) && (!_.isNumber(opts.MaxQuestions) || opts.MaxQuestions < 1)) throw ('"MaxQuestions" must be of type `Number` and greater than `0`');
  if (!_.isNull(opts.PassingScore) && (!_.isNumber(opts.PassingScore) || opts.PassingScore < 0)) throw ('"PassingScore" must be of type `Number` and greater than `-1`');
  if (!_.isNull(opts.MaxQuestions) && !_.isNull(opts.PassingScore) && (opts.PassingScore > opts.MaxQuestions)) throw ('"PassingScore" can not exceed "MaxQuestions"');
  if (!opts.Title || !_.isString(opts.Title)) throw ('"Title" must be provided as a `String`');
  if (!opts.Description) throw ('"Description" must be provided');
  if (!opts.Questions || !_.isString(opts.Questions)) throw ('You must provide "Questions" in the form of an Excel document');

  var file = xlsx.readFile(opts.Questions);
  var sheetName = file.Props.SheetNames[0];
  var sheetObj = file.Sheets[sheetName];
  var sheet = xlsx.utils.sheet_to_formulae(sheetObj);

  // create test JSON
  this.testJSON = ParseXLSX(sheet, opts);

  return this;

}

// methods
AssessmentGenerator.prototype.launch = function Launch(port, launchBrowser) {

  var _this = this;
  var fileServer = new nodeStatic.Server(path.join(__dirname, 'ui'));

  this.opts.Port = (port && _.isNumber(parseInt(port, 10))) ? parseInt(port, 10) : this.opts.Port;
  launchBrowser = !!launchBrowser;

  require('http').createServer(function(req, res) {

    // serve static files
    req.addListener('end', function() {
      fileServer.serve(req, res);
    }).resume();

    // send general info
    if (req.url.toLowerCase() === '/api/info') {
      var info = {
        "Title": _this.opts.Title,
        "Description": _this.opts.Description,
        "MaxQuestions": _this.opts.MaxQuestions,
        "PassingScore": _this.opts.PassingScore,
        "QuestionKey": _.pluck(_this.testJSON.questions, 'id')
      };

      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify(info));
    }

    // send question info
    if (req.url.toLowerCase().match('/api/question/[a-z]{1}[0-9]{1,4}')) {
      var qID = _.last(req.url.split('/'));
      var info = _.find(_this.testJSON.questions, {
        id: qID
      }) || {};
      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(JSON.stringify(info));
    }

  }).listen(this.opts.Port);

  log(_this.opts.Title + ' started at http://' + _this.opts.Host + ':' + this.opts.Port);

  if (launchBrowser) {
    log('Opening browser');
    open('http://' + _this.opts.Host + ':' + this.opts.Port);
  }

  return this;
};




module.exports = AssessmentGenerator;
