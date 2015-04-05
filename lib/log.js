var chalk = require('chalk');

function Log(text){

	var msg = chalk.white('['+chalk.bold.cyan('Assessment Generator')+'] '+chalk.gray(text));

	console.log(msg);

}

module.exports = Log;