# Arbitron

A Discord bot that'll pick a random (arbitrary) item from a specified list.

- [Development](#development)
  - [Discord](#discord)
  - [NodeJS](#nodejs)
- [Sources](#sources)

---

## Development

### Discord

1. Create a local `.env` file within this cloned repo.
1. In Discord go to your profile's `User Settings`
   - Go to `Advanced`
      - Enable `Developer Mode`
1. Create a test Server for you to mess around in.
1. Right-click on the test Server, click on `Copy ID`. The Server ID is also referred to as `Guild ID`.
   - Add this to your `.env` file:
     ```
     SERVER_ID=<ID>
     ```
1. Go to https://discord.com/developers/applications to start creating the application.
   - Click `New Application`
      - `Name: Arbitron` (click `Create`)
   - In the left menu:
      - General Information
         - Add a description
         - Copy the `APPLICATION ID` and `PUBLIC KEY`. Discord sometimes refers to `APPLICATION ID` as `CLIENT ID`.
         - Add those values to your `.env` file:
            ```
            APPLICATION_ID=<ID>
            PUBLIC_KEY=<KEY>
            ```
      - Bot
         - Click `Add Bot`
         - Click `Reset Token` to generate a token. Add the token to your `.env` file:
            ```
            BOT_TOKEN=<TOKEN>
            ```
      - OAuth2 > URL Generator
         ```
         [Scopes]
           [X] bot
           [X] applications.commands
         
         [Bot Permissions]
           [General Permissions]
             [X] Read Messages/View Channels
           
           [Text Permissions]
             [X] Send Messages
             [X] Send Messages in Threads
             [X] Use Slash Commands
         ```
         - Copy the URL in the `GENERATED URL` section.
1. Open the copied URL in another tab, and add the application to the test Server.


### NodeJS

1. Within this repo, run:
   ```sh
   npm i
   ```
1. Start up in Dev mode:
   ```sh
   npm run start:dev
   ```
1. If you see a message that reads something like `Logged in as Arbitron`, go to your Discord Server and type `/arb` to see if the commands pop up.

---

## Sources

- https://discordjs.guide/preparations/
