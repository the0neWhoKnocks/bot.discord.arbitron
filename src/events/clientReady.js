const { Events: { ClientReady } } = require('discord.js');

module.exports = {
  name: ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};