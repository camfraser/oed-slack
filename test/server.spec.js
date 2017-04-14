const sinon = require('sinon');
const expect = require('code').expect;
const proxyquire = require('proxyquire');
const routes = require('../src/routes');
require('dotenv').config();

describe('Server', () => {
    beforeEach(function be() {
        this.mockHapiServer = {
            connection: sinon.stub(),
            info: {
                uri: 'oed-slack.com',
            },
            route: sinon.stub(),
            start: sinon.stub(),
        };
        this.mockHapi = {
            Server: sinon.stub().returns(this.mockHapiServer),
        };
        this.mockLogger = sinon.stub();
    });

    it('should init', function test() {
        const server = proxyquire('../src/server', { // eslint-disable-line no-unused-vars
            hapi: this.mockHapi,
            './logger': this.mockLogger,
        });
        const connection = {
            host: 'localhost',
            port: process.env.PORT,
        };
        expect(this.mockHapiServer.connection.calledWith(connection)).to.be.true();
        expect(this.mockHapiServer.route.calledWith(routes)).to.be.true();
        this.mockHapiServer.start.firstCall.args[0]();
        expect(this.mockLogger.calledWith('Server is running at oed-slack.com')).to.be.true();
    });
});
