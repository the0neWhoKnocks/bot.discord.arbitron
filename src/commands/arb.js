const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const addRemove = ({ name, description }) => (subcommand) => {
  return subcommand
    .setName(name)
    .setDescription(description)
    .addStringOption(option => option
      .setName('list')
      .setDescription(`The list name where a choice will be ${(name === 'add') ? 'added' : 'removed'}.`)
      .setRequired(true)
    )
    .addStringOption(option => option
      .setName('choices')
      .setDescription('One or more comma separated items')
      .setRequired(true)
    );
};

const pick = (subcommand) => {
  return subcommand
    .setName('pick')
    .setDescription('Pick a random choice from a given list.')
    .addStringOption(option => option
      .setName('list')
      .setDescription('The list where a random choice will be picked.')
      .setRequired(true)
    );
};

const view = (subcommand) => {
  return subcommand
    .setName('view')
    .setDescription('Displays all the items in a given list.')
    .addStringOption(option => option
      .setName('list')
      .setDescription('The name of the list.')
      .setRequired(true)
    );
};

const data = new SlashCommandBuilder()
  .setName('arb')
  .setDescription('Pick a random choice from a list')
  .addSubcommand( addRemove({ name: 'add', description: 'Add choice(s) to a list' }) )
  .addSubcommand( addRemove({ name: 'remove', description: 'Remove choice(s) from a list' }) )
  .addSubcommand(pick)
  .addSubcommand(view);

module.exports = {
  data,
  async execute(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const msg = () => customMsg || `User requested: "${cmd}"`;
    let cmd;
    let customMsg;
    
    switch (subCommand) {
      case 'add':
      case 'remove': {
        const list = (interaction.options.getString('list') ?? '').trim().toLowerCase().replace(/[\s_]/g, '-');
        const choices = (interaction.options.getString('choices') ?? '').split(',').filter(item => !!item);
        const serverId = interaction.member.id;
        const userId = interaction.user.id;
        const userName = interaction.user.username;
        
        if (!list) {
          return await interaction.reply({ content: 'You need to provide a list', ephemeral: true });
        }
        else if (!choices.length) {
          return await interaction.reply({ content: 'You need to provide at least one choice', ephemeral: true });
        }
        
        // TODO:
        // - if adding, create list under group by `serverId`
        // - if removing, and no items remain, remove list/group by `serverId`
        // - add/remove item(s)
        
        const color = (subCommand === 'add') ? '00FFAA' : 'FFB500';
        const exampleEmbed = new EmbedBuilder()
          .setColor(`0x${color}`)
          .setTitle(`Updated "${list}" list`)
          .setDescription([
            `${userName} ${(subCommand === 'add') ? 'added' : 'removed'} ${(choices.length === 1) ? 'this item' : 'these items'}:`,
            choices.map((c) => `"${c}"`).join(', '),
          ].join(' '));
        
        return await interaction.reply({
          embeds: [exampleEmbed],
          ephemeral: false,
        });
      }
        
      case 'pick':
        // TODO:
        // - get items from DB
        // - generate random seed from `userId` and timestamp
        // - pick item
        return await interaction.reply({
          content: 'List of items',
          ephemeral: true,
        });
        
      case 'view':
        // TODO: get items from DB
        return await interaction.reply({
          content: 'List of items',
          ephemeral: true,
        });
    }
    
    await interaction.reply({ content: msg(), ephemeral: true });
  },
};
