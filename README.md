# oed-slack
Slack slash command API to interact with Oxford English Dictionary API, with built-in Redis caching.

## Setting up your environment

```
$ yarn
$ cp .env-sample .env
```

Replace the values in `.env` with proper ones. You'll get `YOUR_SLACK_TOKEN_ID` when you set up your
Slack integration, but before going too much further, you should sign up for a developer's account
at https://developer.oxforddictionaries.com/ and then generate your own `API Credentials`, then paste
them into your `.env` file.

Since free accounts are limited to 30,000 API calls per month, you should probably get a Redis server
running somewhere, because you know those trolls are going to keep searching words like `moist`,
`skiddy-cock`, `kumquat`, and `shaft` over and over again in every channel they can. Enter the redis URL
in your `.env` file.

## Usage

```
$ npm start

============================
Server is running at http://localhost:2345
```

## Local Development

```
$ PORT=2345 npm run lt
your url is: https://krletcmtsg.localtunnel.me
```

Generates a local tunnel to your node server that you can use for testing in your Slack client.
This will need to be in a separate tab in your terminal.

## Setting up Slack

1. Click `Apps & Integrations` from your Slack Team.
2. Click the `Manage` menu.
3. Click `Custom Integrations`.
4. Click `Slash Commands`.
5. Click `Add Configuration` button.
6. In the `Choose a command` field, enter `/oed` and click the `Add Slash Command Integration` button.
7. In the `URL` field, enter the localtunnel.me development URL with the suffix `/defn`.
8. Choose `POST` for the `Method`.
9. Select the value in `Token` and replace `YOUR_SLACK_TOKEN_ID` with it in your `.env` file.
10. Customize the name of the command and the icon to your preference.
11. Check the box next to `Show this command in the autocomplete list` and enter `defn [word]` in the `Usage hint` field.
12. Click the `Save Integration` button.
13. In your Slack channel of choice, enter `/oed defn tor` and you should receive a definition.

## Heroku install

To come. I can only do so much.
