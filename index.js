const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { token } = require('./config.json');
const fs = require('fs');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessagePolls
  ]
});

client.once('ready', async() => {
  console.log(`${client.user.tag}で起動しました！`);
});

client.on('messageCreate', async (message) => {
  if (message.author.id === client.user.id) return;
  if (message.channel.name !== 'sq-schedule') return;
  let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
  const channel = message.channel;
  let content = message.content.split('\n').filter(s => s[0] !== '@');
  for(const s of content){
    const time = new Date(parseInt(s.substring(20, 30)) * 1000);
    await channel.send(
      '# ' + String(time.getMonth() + 1) + '/' +
      String(time.getDate()) + ' ' +
      String(time.getHours()).padStart(2, '0') + ':' +
      String(time.getMinutes()).padStart(2, '0') + ' ' +
      s.substring(10, 13)
    );
    const button = new ButtonBuilder()
      .setCustomId('vote')
      .setLabel('Can join')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(button);
    const sendRow = await channel.send({ components: [row] });
    obj.log.push({id: sendRow.id, count: 0, time: time.getMilliseconds()});
  }
  fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
});

client.on('interactionCreate', async (interaction) => {
  if(interaction.isButton()){
    // console.log('Button pushed');
    if(interaction.customId === 'vote'){
      console.log(interaction.message.id);
      let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
      for(let log of obj.log) if(log.id === interaction.message.id) log.count++;
      fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
      const button = new ButtonBuilder()
        .setCustomId('drop')
        .setLabel('Drop')
        .setStyle(ButtonStyle.Secondary);
      const row = new ActionRowBuilder().addComponents(button);
      interaction.update({content: "Successfully joined", components: [row]});
    }
    if(interaction.customId === 'drop'){
      console.log(interaction.message.id);
      let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
      for(let log of obj.log) if(log.id === interaction.message.id) log.count--;
      fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
      const button = new ButtonBuilder()
        .setCustomId('join')
        .setLabel('Can join')
        .setStyle(ButtonStyle.Primary);
      const row = new ActionRowBuilder().addComponents(button);
      interaction.update({content: "Successfully dropped", components: [row]});
    }
  }
});

client.login(token);
