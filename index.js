const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { token } = require('./config.json');
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
  const channel = message.channel;
  let content = message.content;
  content = content.split('\n');
  content = content.filter(s => s[0] !== '@');
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
    await channel.send({ components: [row] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if(interaction.isButton()){

  }
})

client.login(token);
