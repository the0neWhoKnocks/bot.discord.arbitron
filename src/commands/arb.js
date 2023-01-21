const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const seedrandom = require('seedrandom');
const { ROOT_COLLECTION, db } = require('../database');
const log = require('../logger')('cmd:arb');

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
  log.info('Got list choices from DB');
  
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
      const userName = interaction.user.username;
      const list = (interaction.options.getString('list') ?? '').trim().toLowerCase().replace(/[\s_]/g, '-');
      const serverDocName = `server-${serverId}`;
      const serverDocRef = db.collection(ROOT_COLLECTION).doc(serverDocName);
      const choicesDocRef = serverDocRef.collection(list).doc('choices');
      
      // Event though it's required, garbage could still get passed in.
      if (!list) {
        log.warn('No list provided for command');
        return await interaction.reply({ content: 'You need to provide a list', ephemeral: true });
      }
      
      switch (subCommand) {
        case 'add':
        case 'remove': {
          const adding = subCommand === 'add';
          const choices = (interaction.options.getString('choices') ?? '').split(',').map(item => item.trim()).filter(item => !!item);
          
          if (!choices.length) {
            log.warn(`No choices provided for command "${subCommand}"`);
            return await interaction.reply({ content: 'You need to provide at least one choice', ephemeral: true });
          }
          
          const {
            choices: dbChoices,
            exists: savedChoicesExist,
          } = await getChoices(choicesDocRef);
          const uniqueChoices = [...new Set(choices).entries()].map(([c]) => c);
          const icon = (adding) ? '✅' : '❌';
          let color = msgColors.SUCCESS;
          let msgTitle = `${icon} Updated "${list}" list`;
          let msgParts = [
            `${userName} ${(adding) ? 'added' : 'removed'} ${(uniqueChoices.length === 1) ? 'this item' : 'these items'}:`,
            uniqueChoices.map((c) => `\`${c}\``).join(', '),
          ];
          let ephemeral = false;
          
          if (adding) {
            const _choices = uniqueChoices.reduce((obj, c) => {
              obj[c] = true;
              return obj;
            }, dbChoices);
            await choicesDocRef.set(_choices);
            log.info(`Added ${uniqueChoices.length} choice${(uniqueChoices.length > 1) ? 's' : ''} to "${list}"`);
          }
          else if (savedChoicesExist) {
            const deletedItems = [];
            const notMatched = [];
            uniqueChoices.forEach((c) => {
              if (dbChoices[c]) {
                delete dbChoices[c];
                deletedItems.push(c);
              }
              else {
                notMatched.push(c);
              }
            });
            
            if (!deletedItems.length) {
              log.warn(`No exact matches found to remove in list "${list}"`);
              return await interaction.reply({
                embeds: [buildMsg({
                  color: msgColors.WARNING,
                  msg: `Sorry, there were no exact matches for ${notMatched.map(i => `"${i}"`).join(', ')}.\nNo choices were removed from "${list}"`,
                })],
                ephemeral: true,
              });
            }
            
            // NOTE: https://firebase.google.com/docs/firestore/data-model
            // > When you delete a document that has subcollections, those
            // > subcollections are not deleted.
            //
            // Not sure why that decision was made, but the clean-up has to happen
            // in multiple stages.
            
            const noChoices = Object.keys(dbChoices).length === 0;
            // if choices empty, delete `list` collection
            if (noChoices) {
              await choicesDocRef.delete();
              log.info(`No choices remain, removed list "${list}"`);
            }
            // delete item(s)
            else {
              await choicesDocRef.set(dbChoices);
              log.info(`"${userName}" removed ${uniqueChoices.length} choice${(uniqueChoices.length > 1) ? 's' : ''} from "${list}"`);
            }
            
            const noLists = (await serverDocRef.listCollections()).length === 0;
            if (noLists) {
              await serverDocRef.delete();
              log.info(`No lists remain, removed server group "${serverDocName}"`);
            }
          }
          else {
            color = msgColors.WARNING;
            msgTitle = 'Nothing updated';
            msgParts = [`The list "${list}" doesn't exist. All of it's items were already removed, or you may have entered the wrong list name.`];
            ephemeral = true;
          }
          
          log.info(`Inform "${userName}" of changes`);
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
          const _choices = Object.keys(choices).map((c) => c).sort();
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
            
            log.info(`Chose option #${ndx + 1} out of ${_choices.length} options`);
          }
          
          log.info(`Sending "${userName}" their random choice`);
          return await interaction.reply({
            embeds: [buildMsg({ color, msg, title })],
            ephemeral,
          });
        }
          
        case 'view': {
          const { choices } = await getChoices(choicesDocRef);
          const _choices = Object.keys(choices).map((c) => c).sort();
          let title = '';
          let color = msgColors.WARNING;
          let msg = `No choices exist for list "${list}".`;
          
          if (_choices.length) {
            title = 'Available Choices';
            color = msgColors.SUCCESS;
            msg = `\`\`\`\n${_choices.map((c, ndx) => `[${`${ndx + 1}`.padStart(`${_choices.length}`.length, '0')}] • ${c}`).join('\n')}\n\`\`\``;
          }
          
          log.info(`Sending "${userName}" the list of choices`);
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
      
      log.error(`Problem running command\n${err.stack}`);
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
