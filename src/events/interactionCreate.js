const { Events: { InteractionCreate } } = require('discord.js');

module.exports = {
  name: InteractionCreate,
  on: true,
  async execute(interaction) {
    if (
      !interaction.isChatInputCommand()
      && !interaction.isAutocomplete()
    ) return;
    
    const { commandName } = interaction;
    const command = interaction.client.commands.get(commandName);

    if (!command) {
      console.error(`No command matching "${commandName}" was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    }
    catch (error) {
      console.error(error);
      await interaction.reply({
        content: `There was an error while executing "${commandName}"!`,
        ephemeral: true,
      });
    }
  },
};