require('angular');
require('angular-ui-router');

var app = angular.module('AssessmentApp', ['ui.router']);

app.ready(function(){
	console.log('APP LOADED!');
});

module.exports = app;