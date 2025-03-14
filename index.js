const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const cron = require('node-cron');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});
const { discordToken, notifyChannelId } = require('./config.json');


// 毎分走る、通知用
cron.schedule('* * * * *', async () => {
  console.log('cron running');
  let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
  const now = new Date().getTime();
  const notifyChannel = client.channels.resolve(notifyChannelId);
  // console.log(obj);
  obj.log = obj.log.filter(log => log.time > now);
  // console.log(obj);
  for(let log of obj.log){
    if(log.count < log.format) continue;
    if(now + 60 * 60 * 1000 > log.time && log.notified.in30min === 0){
      let message = '';
      for(const id of log.participants){
        message += (await client.users.fetch(id)).toString();
      }
      message += '\n60分後に模擬があります！\n!cして！';
      if(log.count > log.format){
        message += '\n人数超過です！話し合って参加者を決めましょう！';
      }
      notifyChannel.send(message);
      log.notified.in60min = 1;
    }
    if(now + 30 * 60 * 1000 > log.time && log.notified.in30min === 0){
      let message = '';
      for(const id of log.participants){
        message += (await client.users.fetch(id)).toString();
      }
      message += '\n30分後に模擬があります！\n!cした？';
      console.log(message);
      notifyChannel.send(message);
      log.notified.in30min = 1;
    }
  }
  fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
});

// 起動時
client.once('ready', async() => {
  console.log(`${client.user.tag}で起動しました！`);
});

// sq-scheduleに送られた、このbot以外の発言を拾う
client.on('messageCreate', async (message) => {
  if (message.author.id === client.user.id) return;
  if (message.channel.name !== 'sq-schedule') return;
  let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
  const channel = message.channel;
  let content = message.content.split('\n').filter(s => s[0] !== '@');
  for(const s of content){
    const unixTime = parseInt(s.substring(20, 30)) * 1000;
    const time = new Date(unixTime);
    await channel.send(
      '# ' + String(time.getMonth() + 1) + '/' +
      String(time.getDate()) + ' ' +
      String(time.getHours()).padStart(2, '0') + ':' +
      String(time.getMinutes()).padStart(2, '0') + ' ' +
      s.substring(10, 13)
    );
    const button1 = new ButtonBuilder()
      .setCustomId('join')
      .setLabel('Can join')
      .setStyle(ButtonStyle.Primary);
    const button2 = new ButtonBuilder()
      .setCustomId('drop')
      .setLabel('drop')
      .setStyle(ButtonStyle.Secondary);
    const row = new ActionRowBuilder()
      .addComponents(button1)
      .addComponents(button2);
    const sendRow = await channel.send({ components: [row] });
    // console.log(time.getMilliseconds());
    obj.log.push({
      id: sendRow.id,
      time: unixTime,
      format: parseInt(s.at(10)),
      count: 0,
      participants: [],
      notified: {
        in30min: 0,
        in60min: 0
      }
    });
  }
  fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
});

// interaction作成時
client.on('interactionCreate', async (interaction) => {
  if(interaction.isButton()){
    // console.log('Button pushed');
    if(interaction.customId === 'join'){
      // console.log(interaction.message.id);
      let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
      let matchLog;
      const userId = interaction.member.user.id;
      for(let log of obj.log) if(log.id === interaction.message.id){
        log.count++;
        log.participants.push(userId);
        matchLog = log;
      }
      fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
      let participantsName = [];
      for(const id of matchLog.participants){
        const username = (await client.users.fetch(id)).username;
        console.log(username);
        participantsName.push(username);
      }
      const content = '参加者: ' + participantsName.join(', ') + '\n参加人数: ' + matchLog.count + '/' + matchLog.format;
      interaction.update({content: content});
    }
    if(interaction.customId === 'drop'){
      // console.log(interaction.message.id);
      let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
      const userId = interaction.member.user.id;
      for(let log of obj.log) if(log.id === interaction.message.id){
        log.count--;
        log.participants = log.participants.filter(name => name !== userId);
        matchLog = log;
      }
      fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
      let participantsName = [];
      for(const id of matchLog.participants){
        const username = (await client.users.fetch(id)).username;
        console.log(username);
        participantsName.push(username);
      }
      const content = '参加者: ' + participantsName.join(', ') + '\n参加人数: ' + matchLog.count + '/' + matchLog.format;
      interaction.update({content: content});
    }
  }
});

client.login(discordToken);
