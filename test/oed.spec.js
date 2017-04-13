const sinon = require('sinon');
const expect = require('code').expect;
const proxyquire = require('proxyquire');

describe('OED', () => {
    beforeEach(function be() {
        this.mockRedis = {
            set: sinon.stub(),
            get: sinon.stub(),
        };
        this.OED = proxyquire('../src/oed', {
            logger: sinon.stub(),
            redis: this.mockRedis,
        });
    });

    describe('Formatting', () => {
        it('should bold value', function test() {
            expect(this.OED.bold('value')).to.equal('*value*');
        });

        it('should italicize value', function test() {
            expect(this.OED.italicize('value')).to.equal('_value_');
        });
    });

    describe('Help', () => {
        it('should get help text', function test() {
            const expectedHelp = `*Welcome to the Oxford English Dictionary Slack Tool!*

To get a complete definition for a word, use the command: \`/oed defn <word>\`

*Example:*
\`/oed defn tor\` would return the complete definition for _a hill or rocky peak_

*Alternatives:*
\`/oed d tor\`
\`/oed definition tor\`
`;
            expect(this.OED.helpText()).to.equal(expectedHelp);
        });
    });

    describe('Parsing', () => {
        it('should parse definitions', function test() {
            const definitions = [
                'higgledy',
                'piggledy',
                'pew',
            ];
            expect(this.OED.parseDefinitions(definitions)).to.equal(definitions.join('\n'));
        });

        it('should parse registers', function test() {
            const registers = [
                'samwise',
                'merry',
                'pippen',
            ];
            expect(this.OED.parseRegisters(registers)).to.equal(`(${registers.join(',')})`);
        });

        it('should parse example without registers', function test() {
            const example = {
                text: 'monthly may month',
            };
            const expected = '_monthly may month_';
            expect(this.OED.parseExample(example)).to.equal(expected);
        });

        it('should parse example with registers', function test() {
            const example = {
                text: 'monthly may month',
                registers: [
                    'giggle',
                    'pig',
                ],
            };
            const expected = '_(giggle,pig) monthly may month_';
            expect(this.OED.parseExample(example)).to.equal(expected);
        });
    });
});
