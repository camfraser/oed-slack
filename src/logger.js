/* eslint-disable no-console */
const chalk = require('chalk');

module.exports = (message, name) => {
    console.log(chalk.green('============================'));
    if (name) console.log(chalk.blue(name));
    if (typeof message === 'object') {
        console.log(chalk.magenta(JSON.stringify(message, null, 4)));
    } else {
        console.log(chalk.white(message));
    }
};
