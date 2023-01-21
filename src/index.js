const { readdir } = require('node:fs/promises');
const { join } = require('node:path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
} = require('discord.js');

(async function bot() {
  const CLIENT_ID = process.env.DISCORD__APPLICATION_ID;
  const TOKEN = process.env.DISCORD__BOT_TOKEN;
  
  try {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    
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
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
    
    // Update App with loaded commands
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: [...client.commands].map(([, { data }]) => data.toJSON()),
    });
    console.log('Successfully reloaded application (/) commands.');
    
    // Load events
    const PATH__EVENTS = join(__dirname, 'events');
    const eventFiles = (await readdir(PATH__EVENTS)).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
      const filePath = join(PATH__EVENTS, file);
      const event = require(filePath);
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      }
      else {
        client.on(event.name, (...args) => event.execute(...args));
      }
    }

    // Log in to Discord with your client's token
    client.login(TOKEN);
    
    if (process.env.CYCLIC_URL) {
      // This is purely a requirement of `cyclic.sh` https://docs.cyclic.sh/overview/launch
      // > It is expected that the start command launches an application that listens to http requests on a TCP port.
      const http = require('node:http');
      const port = process.env.CYCLIC_PORT || 3000;
      http
        .createServer((req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('OK');
        })
        .listen(port, () => {
          console.log(`Per Cyclic requirements, Server listening on port ${port}.`);
        });
    }
  }
  catch (err) {
    console.log(err.stack);
  }
})();
