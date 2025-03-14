const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, escapeMarkdown } = require('discord.js');
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
const { discordToken, notifyChannelId, noNeedFormat } = require('./config.json');

// 以下portを開けるための処理
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.write('<h1>sq-schedule-bot</h1>');
  res.end();
});
const port = process.env.PORT || 10000;
server.listen(port);

// 送信者だけに見えるreplyを作成
function ephermeralReply(interaction, content){
  interaction.reply({content: content, flags: MessageFlags.Ephemeral});
}

// 毎分走る、通知用
cron.schedule('* * * * *', async () => {
  console.log('cron running');
  let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
  const now = new Date().getTime();
  const notifyChannel = client.channels.resolve(notifyChannelId);
  // console.log(obj);
  obj.log = obj.log.filter(log => log.time > now);
  // console.log(obj);
  for (let log of obj.log) {
    if (log.count < log.format) continue;
    if (now + 60 * 60 * 1000 > log.time && log.notified.in60min === 0) {
      let message = '';
      for (const id of log.participants) {
        message += (await client.users.fetch(id)).toString();
      }
      message += '\n60分後に模擬があります！\n!cして！';
      if (log.count > log.format) {
        message += '\n人数超過です！話し合って参加者を決めましょう！';
      }
      notifyChannel.send(message);
      log.notified.in60min = 1;
    }
    if (now + 30 * 60 * 1000 > log.time && log.notified.in30min === 0) {
      let message = '';
      for (const id of log.participants) {
        message += (await client.users.fetch(id)).toString();
      }
      message += '\n30分後に模擬があります！\n!cした？';
      // console.log(message);
      notifyChannel.send(message);
      log.notified.in30min = 1;
    }
  }
  fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
});

// 起動したとき
client.once('ready', async () => {
  console.log(`${client.user.tag}で起動しました！`);
});

// 自分がいるサーバーにメッセージが送信されたとき
client.on('messageCreate', async (message) => {
  // sq-scheduleに送られた、このbot以外の発言で、@everyoneしているものを拾う
  if (message.author.id === client.user.id) return;
  if (message.channel.name !== 'sq-schedule') return;
  if (message.content.substring(0, 9) != '@everyone') return;

  // contentの整理と、送信チャンネルの確認
  const content = message.content.split('\n').filter(s => s.substring(0, 9) !== '@everyone');
  const channel = message.channel;

  // log.jsonから読み取る
  let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));
  

  for (const s of content) {
    // unixTimeとjstTimeをゴリ押しで作って、formatも取得
    // log.jsonで管理するのはunixTime
    const unixTime = parseInt(s.substring(20, 30)) * 1000;
    const jstTime = unixTime + 9 * 60 * 60 * 1000;
    const time = new Date(jstTime);
    const format = parseInt(s.at(10));

    // 投票を作る必要がないフォーマットなら飛ばす
    if (noNeedFormat.includes(format)) continue;

    // 日程のメッセージを送る
    await channel.send(
      '# ' + String(time.getMonth() + 1) + '/' +
      String(time.getDate()) + ' ' +
      String(time.getHours()).padStart(2, '0') + ':' +
      String(time.getMinutes()).padStart(2, '0') + ' ' +
      s.substring(10, 13)
    );

    // joinとdropのボタンを作って送る
    const button1 = new ButtonBuilder()
      .setCustomId('join')
      .setLabel('Can join')
      .setStyle(ButtonStyle.Success);
    const button2 = new ButtonBuilder()
      .setCustomId('drop')
      .setLabel('drop')
      .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder()
      .addComponents(button1)
      .addComponents(button2);
    const sendRow = await channel.send({ components: [row] });

    // logに現在の模擬の情報をpushする
    obj.log.push({
      id: sendRow.id,
      time: unixTime,
      format: format,
      count: 0,
      participants: [],
      notified: {
        in30min: 0,
        in60min: 0
      }
    });
  }

  // log.jsonにobjを書き込む
  fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
});

// interaction作成時
client.on('interactionCreate', async (interaction) => {

  //ボタンのとき
  if (interaction.isButton()) {

    // joinボタンのとき
    if (interaction.customId === 'join') {

      // log.jsonからobjに読み取る
      let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));

      let matchLog;
      const userId = interaction.member.user.id;
      for (let log of obj.log) if (log.id === interaction.message.id) {
        if (matchLog) {
          ephermeralReply(interaction, '一致するメッセージIDがログに2つ以上あります。\n管理者に連絡してください。');
          return;
        }
        if (log.participants.includes(userId)) {
          ephermeralReply(interaction, '既に参加しています');
          return;
        }
        log.count++;
        log.participants.push(userId);
        matchLog = log;
      }
      if (!matchLog) {
        // console.log(obj);
        ephermeralReply(interaction, 'メッセージIDに一致するログが見つかりませんでした。\n現在時刻以降の投票にも関わらずこのメッセージが表示されている場合は管理者に連絡してください。');
        return;
      }

      fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));

      let participantsName = [];
      for (const id of matchLog.participants) {
        const username = (await client.users.fetch(id)).username;
        // console.log(username);
        participantsName.push(username);
      }
      const content = escapeMarkdown('参加者: ' + participantsName.join(', ') + '\n参加人数: ' + matchLog.count + '/' + matchLog.format);
      interaction.update({ content: content });
    }
    if (interaction.customId === 'drop') {
      // console.log(interaction.message.id);
      let obj = JSON.parse(fs.readFileSync('./log.json', 'utf8'));

      let matchLog;
      const userId = interaction.member.user.id;
      for (let log of obj.log) if (log.id === interaction.message.id) {
        if (matchLog) {
          ephermeralReply(interaction, '一致するメッセージIDがログに2つ以上あります。\n管理者に連絡してください。');
          return;
        }
        if (!log.participants.includes(userId)) {
          ephermeralReply(interaction, 'joinしていません');
          return;
        }
        log.count--;
        log.participants = log.participants.filter(id => id !== userId);
        matchLog = log;
      }
      if (!matchLog) {
        // console.log(obj);
        ephermeralReply(interaction, 'メッセージIDに一致するログが見つかりませんでした。\n現在時刻以降の投票にも関わらずこのメッセージが表示されている場合は管理者に連絡してください。');
        return;
      }
      fs.writeFileSync('./log.json', JSON.stringify(obj, undefined, ' '));
      let participantsName = [];
      for (const id of matchLog.participants) {
        const username = (await client.users.fetch(id)).username;
        console.log(username);
        participantsName.push(username);
      }
      const content = escapeMarkdown('参加者: ' + participantsName.join(', ') + '\n参加人数: ' + matchLog.count + '/' + matchLog.format);
      interaction.update({ content: content });
    }
  }
});

client.login(discordToken);
