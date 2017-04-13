const Hapi = require('hapi');
const Logger = require('./logger');
const routes = require('./routes');
require('dotenv').config();

const server = new Hapi.Server();

const PORT = process.env.PORT;

server.connection({
    host: 'localhost',
    port: PORT,
});

server.route(routes);

server.start(() => {
    Logger(`Server is running at ${server.info.uri}`);
});
