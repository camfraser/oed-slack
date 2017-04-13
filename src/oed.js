const Request = require('request');
const Logger = require('./logger');
const Redis = require('redis');
const URL = require('url');
require('dotenv').config();

const redisURI = URL.parse(process.env.REDIS_URL);

const redisClient = Redis.createClient({ host: redisURI.hostname });

const OED_API_URL = process.env.OED_API_URL;
const OED_APPLICATION_ID = process.env.OED_APPLICATION_ID;
const OED_APPLICATION_KEY = process.env.OED_APPLICATION_KEY;

const AUDIO_ICON = 'http://www.freeiconspng.com/uploads/volume-icon-15.gif';
const ATTACHMENT_LIMIT = 20;
const BOT_ICON = 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQUZKHymyxUaGu5XZ8PwC_s2LVSdMAi5CiPd9JC9MTD0cojQDp9MA';
const BOT_NAME = 'Oxford English Dictionary';
const HELP_TEXT = `*Welcome to the Oxford English Dictionary Slack Tool!*

To get a complete definition for a word, use the command: \`/oed defn <word>\`

*Example:*
\`/oed defn tor\` would return the complete definition for _a hill or rocky peak_

*Alternatives:*
\`/oed d tor\`
\`/oed definition tor\`
`;
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'oed-slack:';
const REDIS_TTL = process.env.REDIS_TTL || 60 * 60 * 24;

const OED = {
    bold(value) {
        return `*${value}*`;
    },

    getDefinition(definition, callback, skipRedis = false) {
        const redisKey = `${REDIS_PREFIX}${definition}`;
        if (!skipRedis && redisClient.ready) {
            Logger(redisKey, 'getting redis');
            redisClient.get(redisKey, (err, output) => {
                if (err || !output) {
                    Logger({ err, output }, 'No redis entry found');
                    return OED.getDefinition(definition, callback, true);
                }
                Logger('redis entry found');
                return callback(200, JSON.parse(output));
            });
        } else {
            const oedUrl = `${OED_API_URL}${encodeURIComponent(definition)}`;
            const options = {
                headers: {
                    Accept: 'application/json',
                    app_id: OED_APPLICATION_ID,
                    app_key: OED_APPLICATION_KEY,
                },
            };
            Request.get(oedUrl, options, (err, res, body) => {
                if (res.statusCode && res.statusCode === 404) {
                    return callback(404, `No results found for ${definition}`);
                } else if (err || res.statusCode !== 200) {
                    return callback(res.statusCode, `Error: ${err}`);
                }
                let entry;
                try {
                    entry = JSON.parse(body);
                } catch (e) {
                    Logger(e, 'e');
                    return callback(500, 'Couldn\'t parse JSON in response from OED');
                }
                const result = entry.results[0];
                const output = {
                    attachments: [],
                    username: BOT_NAME,
                    icon_url: BOT_ICON,
                };
                let attachmentCount = 0;
                let pronunciation;
                if (result.pronunciations && result.pronunciations.length) {
                    pronunciation = result.pronunciations[0];
                }
                for (let e = 0; e < result.lexicalEntries.length; e++) {
                    if (attachmentCount < ATTACHMENT_LIMIT) {
                        output.attachments.push(OED.processEntry(result.lexicalEntries[e], pronunciation));
                    }
                    attachmentCount++;
                }
                if (!attachmentCount) {
                    output.text = result.word;
                }
                if (redisClient.ready) {
                    Logger(redisKey, 'setting redis');
                    redisClient.set(redisKey, JSON.stringify(output), 'EX', REDIS_TTL);
                }
                return callback(200, output);
            });
        }
    },

    helpText() {
        return HELP_TEXT;
    },

    italicize(value) {
        return `_${value}_`;
    },

    parseDefinitions(definitions) {
        return definitions.join('\n');
    },

    parseExamples(example) {
        let resp = example.text;
        if (example.registers) {
            resp = `${OED.parseRegisters(example.registers)} ${resp}`;
        }
        return OED.italicize(resp);
    },

    parseRegisters(registers) {
        return `(${registers.join(',')})`;
    },

    processEntry(lexicalEntry, pronunciation = null) {
        if (!pronunciation && lexicalEntry.pronunciations && lexicalEntry.pronunciations.length) {
            pronunciation = lexicalEntry.pronunciations[0]; // eslint-line-disable no-param-reassign
        }
        const attachment = {
            pretext: `${OED.bold(lexicalEntry.text)}, ${lexicalEntry.lexicalCategory}`,
            fallback: `${lexicalEntry.text}, ${lexicalEntry.lexicalCategory}`,
            fields: [],
            mrkdwn_in: ['pretext', 'fields'],
        };
        if (pronunciation) {
            if (pronunciation.audioFile) {
                attachment.footer = pronunciation.audioFile;
                attachment.footer_icon = AUDIO_ICON;
            }
            if (pronunciation.phoneticSpelling) {
                attachment.pretext = `${attachment.pretext}, ${OED.italicize(pronunciation.phoneticSpelling)}`;
                attachment.fallback = `${attachment.fallback}, ${pronunciation.phoneticSpelling}`;
            }
        }
        for (let e = 0; e < lexicalEntry.entries.length; e++) {
            const entry = lexicalEntry.entries[e];
            if (entry.etymologies && entry.etymologies.length) {
                attachment.fields.push({ value: `:books: ${entry.etymologies.join('\n:books: ')}` });
            }
            for (let s = 0; s < entry.senses.length; s++) {
                const sense = entry.senses[s];
                // Definition
                if (sense.definitions && sense.definitions.length) {
                    let registers = '';
                    if (sense.registers && sense.registers.length) {
                        registers = `${OED.parseRegisters(sense.registers)} `;
                    }
                    let value = '';
                    if (sense.examples && sense.examples.length) {
                        value = sense.examples.map(OED.parseExamples).join('\n');
                    }
                    attachment.fields.push({
                        title: `${registers}${OED.parseDefinitions(sense.definitions)}`,
                        value,
                        short: false,
                    });
                }
                if (sense.subsenses && sense.subsenses.length) {
                    for (let b = 0; b < sense.subsenses.length; b++) {
                        const subsense = sense.subsenses[b];
                        let subRegisters = '';
                        if (subsense.registers && subsense.registers.length) {
                            subRegisters = `${OED.italicize(OED.parseRegisters(subsense.registers))} `;
                        }
                        attachment.fields.push({
                            value: `${subRegisters}${OED.parseDefinitions(subsense.definitions)}`,
                            short: (subsense.examples && subsense.examples.length),
                        });
                        if (subsense.examples && subsense.examples.length) {
                            // Examples
                            attachment.fields.push({
                                value: subsense.examples.map(OED.parseExamples).join('\n'),
                                short: true,
                            });
                        }
                    }
                }
            }
        }
        return attachment;
    },
};


module.exports = OED;
