const Logger = require('./logger');
const Request = require('request');
const Redis = require('redis');
const URL = require('url');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || process.env.REDISTOGO_URL || process.env.REDISCLOUD_URL;
const redisURL = URL.parse(REDIS_URL);
let redisClient;
try {
    redisClient = Redis.createClient(redisURL.port, redisURL.hostname, { no_ready_check: true });
    if (redisURL.auth) {
        redisClient.auth(redisURL.auth.split(':')[1]);
    }
} catch (e) {
    Logger(e, 'Could not connect to redis');
    redisClient = { ready: false };
}

const Oed = require('./oed')(redisClient);

module.exports = {
    index: {
        handler: (request, reply) => {
            reply({ message: 'OK' });
        },
    },
    defn: {
        handler: (request, reply) => {
            const payload = request.payload;
            Logger(payload.text, 'defn');
            if (payload.token !== process.env.SLACK_TOKEN) {
                return reply('Unauthorized');
            }
            const matches = payload.text.match(/^(\w+)\s*([\w-]*)$/);
            if (!matches || matches[1] === 'help') {
                return reply(Oed.helpText());
            }
            if (['d', 'def', 'defn', 'definition'].includes(matches[1]) && matches[2]) {
                Oed.getDefinition(matches[2], (code, output) => {
                    const requestOptions = {
                        method: 'POST',
                        url: payload.response_url,
                        headers: {
                            'content-type': 'application/json',
                        },
                    };
                    if (code === 200) {
                        requestOptions.body = JSON.stringify(Object.assign(output, {
                            isDelayedResponse: true,
                            response_type: 'in_channel',
                        }));
                    } else if (code === 404) {
                        requestOptions.body = JSON.stringify({
                            isDelayedResponse: true,
                            response_type: 'ephemeral',
                            text: `Sorry, we couldn't find a definition for ${matches[2]}`,
                        });
                    } else {
                        requestOptions.body = JSON.stringify({
                            isDelayedResponse: true,
                            response_type: 'ephemeral',
                            text: `*${code}:* ${output}`,
                        });
                    }
                    Logger(requestOptions, 'requestOptions');
                    Request(requestOptions, (err, res, payload2) => {
                        if (err || res.statusCode === 500) {
                            Logger({ err, payload2 }, 'Error from Slack');
                        } else {
                            Logger(requestOptions.url, res.statusCode);
                        }
                    });
                });
                return reply({ response_type: 'in_channel' });
            }
            return reply();
        },
    },
};
