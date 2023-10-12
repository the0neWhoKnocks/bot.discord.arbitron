const { readdir } = require('node:fs/promises');
const { join } = require('node:path');
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} = require('discord.js');
const logger = require('./logger');

const log = logger();
let client;

// Log the Bot out immediately if the process is going down.
['SIGINT', 'SIGQUIT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, (sig) => {
    log.warn(`[${sig}] Process killed, stopping Discord Bot`);
    client?.destroy();
  });
});
process.on('uncaughtExceptionMonitor', (err) => {
  log.error(`Fatal error:\n${err.stack}`);
  client?.destroy();
});

(async function bot() {
  const CLIENT_ID = process.env.DISCORD__APPLICATION_ID;
  const TOKEN = process.env.DISCORD__BOT_TOKEN;
  
  try {
    client = new Client({ intents: [GatewayIntentBits.Guilds] });
    
    if (process.env.DEBUG) {
      const discordLogger = logger.custom('discord');
      client.on(Events.Debug, discordLogger.info);
    }
    
    // Auto-load commands
    client.commands = new Collection();
    const PATH__COMMANDS = join(__dirname, 'commands');
    const commandFiles = (await readdir(PATH__COMMANDS)).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = join(PATH__COMMANDS, file);
      const command = require(filePath);
      
      // Set a new item in the Collection with the key as the command name and the value as the exported module
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      }
      else {
        log.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
    
    // Update Discord App with auto-loaded slash commands
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    const commandsJSON = [...client.commands].map(([, { data }]) => data.toJSON());
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandsJSON });
    const formattedCmds = commandsJSON.reduce((str, { name, options }) => {
      str += `  • /${name}`;
      if (options) str += ` [${options.map(({ name: optName }) => optName).join('|')}]`;
      return str;
    }, '');
    log.info(`[UPDATED] App slash commands to:\n${formattedCmds}`);
    
    // Load events
    const PATH__EVENTS = join(__dirname, 'events');
    const eventFiles = (await readdir(PATH__EVENTS)).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
      const filePath = join(PATH__EVENTS, file);
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
        log.info(`[AUTO_LOADED] Event type: once | name: "${event.name}"`);
      }
      else {
        client.on(event.name, (...args) => event.execute(...args));
        log.info(`[AUTO_LOADED] Event type: on | name: "${event.name}"`);
      }
    }

    // Log in to Discord with your client's token
    client.login(TOKEN);
  }
  catch (err) {
    log.error(`[ERROR] Problem initializing bot\n${err.stack}`);
  }
})();
