const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const seedrandom = require('seedrandom');
const { ROOT_COLLECTION, db } = require('../database');

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

const msgColors = {
  ERROR: 'DE0055',
  SUCCESS: '00FFAA',
  WARNING: 'FFB500',
};

const buildMsg = ({ color, msg, title }) => {
  if (!color) console.log('Missing `color` for message');
  
  const builder = new EmbedBuilder();
  builder.conditionalTitle = (_title) => {
    if (_title) builder.setTitle(_title);
    return builder;
  };
  builder.conditionalMsg = (_msg) => {
    if (_msg) builder.setDescription(_msg);
    return builder;
  };
  
  return builder
    .setColor(`0x${color || 'FF0000'}`)
    .conditionalTitle(title)
    .conditionalMsg(msg);
};

const getChoices = async (ref) => {
  const doc = await ref.get();
  const savedChoicesExist = doc.exists;
  return {
    choices: (savedChoicesExist) ? doc.data() : {},
    exists: savedChoicesExist,
  };
};

const randomWithinRange = (min, max, seed) => Math.floor(seed * (max - min + 1) + min);

module.exports = {
  data,
  async execute(interaction) {
    try {
      const serverId = interaction.member.id;
      const subCommand = interaction.options.getSubcommand();
      const list = (interaction.options.getString('list') ?? '').trim().toLowerCase().replace(/[\s_]/g, '-');
      const serverDocRef = db.collection(ROOT_COLLECTION).doc(`server-${serverId}`);
      const choicesDocRef = serverDocRef.collection(list).doc('choices');
      
      // Event though it's required, garbage could still get passed in.
      if (!list) {
        return await interaction.reply({ content: 'You need to provide a list', ephemeral: true });
      }
      
      switch (subCommand) {
        case 'add':
        case 'remove': {
          const adding = subCommand === 'add';
          const choices = (interaction.options.getString('choices') ?? '').split(',').map(item => item.trim()).filter(item => !!item);
          const userName = interaction.user.username;
          
          if (!choices.length) {
            return await interaction.reply({ content: 'You need to provide at least one choice', ephemeral: true });
          }
          
          const {
            choices: dbChoices,
            exists: savedChoicesExist,
          } = await getChoices(choicesDocRef);
          const icon = (adding) ? '✅' : '❌';
          let color = msgColors.SUCCESS;
          let msgTitle = `${icon} Updated "${list}" list`;
          let msgParts = [
            `${userName} ${(adding) ? 'added' : 'removed'} ${(choices.length === 1) ? 'this item' : 'these items'}:`,
            choices.map((c) => `\`${c}\``).join(', '),
          ];
          let ephemeral = false;
          
          if (adding) {
            const _choices = [...new Set(choices).entries()].reduce((obj, [c]) => {
              obj[c] = true;
              return obj;
            }, dbChoices);
            await choicesDocRef.set(_choices);
          }
          else if (savedChoicesExist) {
            [...new Set(choices).entries()].forEach(([c]) => {
              delete dbChoices[c];
            });
            
            // NOTE: https://firebase.google.com/docs/firestore/data-model
            // > When you delete a document that has subcollections, those
            // > subcollections are not deleted.
            //
            // Not sure why that decision was made, but the clean-up has to happen
            // in multiple stages.
            
            const noChoices = Object.keys(dbChoices).length === 0;
            (noChoices)
              // if choices empty, delete `list` collection
              ? await choicesDocRef.delete()
              // delete item(s)
              : await choicesDocRef.set(dbChoices);
            
            const noLists = (await serverDocRef.listCollections()).length === 0;
            if (noLists) await serverDocRef.delete();
          }
          else {
            color = msgColors.WARNING;
            msgTitle = 'Nothing updated';
            msgParts = [`The list "${list}" doesn't exist. All of it's items were already removed, or you may have entered the wrong list name.`];
            ephemeral = true;
          }
          
          return await interaction.reply({
            embeds: [buildMsg({
              color,
              msg: msgParts.join(' '),
              title: msgTitle,
            })],
            ephemeral,
          });
        }
          
        case 'pick': {
          const { choices } = await getChoices(choicesDocRef);
          const _choices = Object.keys(choices).map((c) => c);
          let title = '';
          let color = msgColors.WARNING;
          let msg = `No choices exist in list "${list}" to pick from.`;
          let ephemeral = true;
          
          if (_choices.length) {
            const userId = interaction.user.id;
            const seed = (seedrandom(`${userId}-${Date.now()}`))();
            const ndx = randomWithinRange(1, _choices.length - 1, seed);
            
            title = `🤖 Your Robot Overlord Has Chosen:  \` ${_choices[ndx]} \``;
            color = msgColors.SUCCESS;
            msg = '';
            ephemeral = false;
          }
          
          return await interaction.reply({
            embeds: [buildMsg({ color, msg, title })],
            ephemeral,
          });
        }
          
        case 'view': {
          const { choices } = await getChoices(choicesDocRef);
          const _choices = Object.keys(choices).map((c) => c);
          let title = '';
          let color = msgColors.WARNING;
          let msg = `No choices exist for list "${list}".`;
          
          if (_choices.length) {
            title = 'Available Choices';
            color = msgColors.SUCCESS;
            msg = `\`\`\`\n${_choices.sort().map((c) => `• ${c}`).join('\n')}\n\`\`\``;
          }
            
          return await interaction.reply({
            embeds: [buildMsg({ color, msg, title })],
            ephemeral: true,
          });
        }
      }
    }
    catch (err) {
      const truncatedError = err.stack.split('\n').reduce((msg, line, ndx) => {
        if (ndx < 3) msg += `${line}\n`;
        else if (ndx === 3) msg += '...';
        return msg;
      }, '');
      
      await interaction.reply({
        embeds: [buildMsg({
          color: msgColors.ERROR,
          msg: `Bot malfunction:\n\`\`\`\n${truncatedError}\n\`\`\``,
          title: 'Bot Error',
        })],
        ephemeral: true,
      });
    }
  },
};
