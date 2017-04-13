/* eslint-disable no-console */
const chalk = require('chalk');

module.exports = (message, name) => {
    console.log(chalk.green('============================'));
    if (name) console.log(chalk.blue(name));
    if (typeof message === 'object') {
        console.log(chalk.blue(JSON.stringify(message, undefined, 4)));
    } else {
        console.log(chalk.blue(message));
    }
};
