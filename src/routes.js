const controller = require('./controller');

module.exports = [
    {
        method: 'GET',
        path: '/',
        config: controller.index,
    },
    {
        method: 'POST',
        path: '/defn',
        config: controller.defn,
    },
];
