// ライブラリのimport
import {
  Client,
  GatewayIntentBits,
  MessageFlags,
  ChannelType,
  Events,
  TextChannel,
} from "discord.js";
import fs from "fs";
import cron from "node-cron";
import http from "http";

// 設定のimport
import config from "./config.json" with { type: "json" };
const { discordToken } = config;

// 自作コマンドのimport
import { GuildData, Log } from "./util/class.js";
import commandManager from "./util/commandmanager.js";
import logInit from "./util/loginit.js";
import makeLog from "./util/makelog.js"

// 各種初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// 以下portを開けるための処理
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.write("<h1>sq-schedule-bot</h1>");
  res.end();
});
const port = parseInt(process.env.PORT || "10000");
server.listen(port);

async function sendNotify(log: Log, message: string, channel: TextChannel): Promise<string> {
  console.log("trying to send notification");
  let sendMessage = "";
  for (const userId of log.participants) {
    sendMessage += "<@" + userId + ">";
  }
  sendMessage += "\n";
  sendMessage += message;
  const result = await channel.send(sendMessage);
  return new Promise((resolve, reject) => {
    if (result) return resolve(message);
    else {
      return reject("send message failed");
    }
  });
}

// 毎分走る、通知用
cron.schedule("* * * * *", async () => {
  console.log("cron running");

  // ログインしていないなら、ログインする
  if (!client.isReady()) {
    console.log("not logged in");
    await client.login(discordToken);
    if (!client.isReady()) {
      console.error("login failed");
      return;
    }
  }

  const now = new Date().getTime();

  client.guilds.cache.each(async (guild) => {
    const fileName = "./log/" + guild.id + ".json";
    if(!fs.existsSync(fileName)) return;

    let guildData: GuildData = JSON.parse(fs.readFileSync(fileName, "utf8"));
    const notifyChannel = await client.channels.fetch(guildData.notifyChannel).catch(console.error);
    if(!notifyChannel || notifyChannel.type !== ChannelType.GuildText) return;

    let logs = guildData.logs;

    for (let log of logs) {
      // 過ぎている
      if (log.time <= now){
        await notifyChannel.messages.delete(log.id).catch(console.error);
      }

      // 人が足りない
      if (log.count < log.format) {
        continue;
      }

      // 何分後に模擬があるか(30 * 1000はバッファ、60 * 1000はミリ秒→分)
      const minutesAfter = Math.floor(new Date(log.time - now + 30 * 1000).getTime() / (60 * 1000));

      // 60分後通知
      if (now + 60 * 60 * 1000 > log.time && log.notified.in60min === 0) {
        const message =
          minutesAfter +
          "分後に模擬があります！\n!cして！" +
          (log.count > log.format
            ? "\n人数超過です！話し合って参加者を決めましょう！"
            : "");
        const result = await sendNotify(log, message, notifyChannel).catch(console.error);
        if (result) log.notified.in60min = 1;
      }

      // 30分後通知
      if (now + 30 * 60 * 1000 > log.time && log.notified.in30min === 0) {
        const message = minutesAfter + "分後に模擬があります！\n!cした？";
        const result = await sendNotify(log, message, notifyChannel).catch(console.error);
        if (result) log.notified.in30min = 1;
      }
    }

    guildData.logs = logs.filter((log: Log) => log.time > now);

    fs.writeFileSync(fileName, JSON.stringify(guildData, undefined, " "));
  });
});

// clientがreadyになったとき(毎回)
client.on(Events.ClientReady, async () => {
  console.log(client.user?.tag + "で起動しました！");
});

// 招待されたとき
client.on(Events.GuildCreate, async (guild) => {
  logInit(guild, guild.systemChannel);
})

// 自分がいるサーバーにメッセージが送信されたとき
client.on(Events.MessageCreate, async (message) => {
  if(!message.guild) return;
  const fileName = "./log/" + message.guildId + ".json";
  const existLog = fs.existsSync(fileName);
  let obj = existLog
    ? JSON.parse(fs.readFileSync(fileName, "utf8"))
    : null;

  // 自分のものでなく、notifyChannelに送られていて、@everyoneしているもの
  if (
    message.author.id !== client.user?.id &&
    (!existLog || (message.channel.id === obj.followChannel)) &&
    message.content.substring(0, 9) === "@everyone" &&
    message.channel.type === ChannelType.GuildText
  ){

    // ログがないなら作ればいいじゃない
    if(!existLog){
      logInit(message.guild, message.channel);
    }

    // makeLogをawaitして結果をログに書き込む
    obj = await makeLog(message, obj);
    fs.writeFileSync(fileName, JSON.stringify(obj, undefined, " "));
  }
});

// interaction作成時
client.on(Events.InteractionCreate, async (interaction) => {
  commandManager(interaction);
});

const result = await client.login(discordToken);
if (!result) {
  throw new Error("login failed");
}
