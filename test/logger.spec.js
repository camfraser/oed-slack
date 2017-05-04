/* eslint-disable no-console */
const sinon = require('sinon');
const expect = require('code').expect;
const proxyquire = require('proxyquire');

describe('Logger', () => {
    beforeEach(function be() {
        sinon.spy(console, 'log');
        this.mockChalk = {
            blue: sinon.stub().returns('blue'),
            green: sinon.stub().returns('green'),
            magenta: sinon.stub().returns('magenta'),
            white: sinon.stub().returns('white'),
        };

        this.Logger = proxyquire('../src/logger', {
            chalk: this.mockChalk,
        });
    });

    afterEach(() => {
        console.log.restore();
    });

    it('should display plain message and name', function test() {
        this.Logger('message', 'name');
        expect(this.mockChalk.green.calledWith('============================')).to.be.true();
        expect(this.mockChalk.blue.calledWith('name')).to.be.true();
        expect(this.mockChalk.white.calledWith('message')).to.be.true();
        expect(console.log.calledWith('blue')).to.be.true();
        expect(console.log.calledWith('green')).to.be.true();
        expect(console.log.calledWith('magenta')).to.be.false();
        expect(console.log.calledWith('white')).to.be.true();
    });

    it('should display object message and name', function test() {
        const message = {
            msg: 'A message',
            ina: 'bottle',
        };
        this.Logger(message, 'name');
        expect(this.mockChalk.green.calledWith('============================')).to.be.true();
        expect(this.mockChalk.blue.calledWith('name')).to.be.true();
        expect(this.mockChalk.magenta.calledWith(JSON.stringify(message, null, 4))).to.be.true();
        expect(console.log.calledWith('blue')).to.be.true();
        expect(console.log.calledWith('green')).to.be.true();
        expect(console.log.calledWith('magenta')).to.be.true();
        expect(console.log.calledWith('white')).to.be.false();
    });

    it('should display plain message without name', function test() {
        this.Logger('message');
        expect(this.mockChalk.green.calledWith('============================')).to.be.true();
        expect(this.mockChalk.blue.calledWith('name')).to.be.false();
        expect(this.mockChalk.white.calledWith('message')).to.be.true();
        expect(console.log.calledWith('blue')).to.be.false();
        expect(console.log.calledWith('green')).to.be.true();
        expect(console.log.calledWith('magenta')).to.be.false();
        expect(console.log.calledWith('white')).to.be.true();
    });
});
