// ライブラリのimport
import {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  ChannelType,
  Events,
} from "discord.js";
import type { TextChannel } from "discord.js";
import fs from "fs";
import cron from "node-cron";
import http from "http";

// 設定のimport
import config from "./config.json" with { type: "json" };
const { discordToken, notifyChannelId } = config;

// 自作コマンドのimport
import { joinCommand } from "./commands/join.js";
import { dropCommand } from "./commands/drop.js";
import { makeLog } from "./commands/makelog.js";

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

async function sendNotify(log: any, message: string, channel: TextChannel) {
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
      console.log("send message failed");
      return reject(null);
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
      console.log("login failed");
      return;
    }
  }

  // 送信用チャンネルを準備する
  const notifyChannel = client.channels.resolve(notifyChannelId);
  if (!notifyChannel || notifyChannel.type !== ChannelType.GuildText) {
    console.log("notifyChannel not found or is not Text channel");
    return;
  }

  let obj = JSON.parse(fs.readFileSync("./log.json", "utf8"));
  const now = new Date().getTime();

  obj = obj.filter((log: any) => log.time > now);
  console.log(obj);

  for (let log of obj) {
    // 人が足りない
    if (log.count < log.format) {
      continue;
    }

    // 何分後に模擬があるか
    const minutesAfter = new Date(log.time - now + 30 * 1000).getMinutes();

    // 60分後通知
    if (now + 60 * 60 * 1000 > log.time && log.notified.in60min === 0) {
      const message =
        minutesAfter +
        "分後に模擬があります！\n!cして！" +
        (log.count > log.format
          ? "\n人数超過です！話し合って参加者を決めましょう！"
          : "");
      const result = await sendNotify(log, message, notifyChannel);
      if (result) log.notified.in60min = 1;
    }

    // 30分後通知
    if (now + 30 * 60 * 1000 > log.time && log.notified.in30min === 0) {
      const message = minutesAfter + "分後に模擬があります！\n!cした？";
      const result = await sendNotify(log, message, notifyChannel);
      if (result) log.notified.in30min = 1;
    }
  }

  fs.writeFileSync("./log.json", JSON.stringify(obj, undefined, " "));
});

// clientがreadyになったとき(毎回)
client.on(Events.ClientReady, async () => {
  console.log(client.user?.tag + "で起動しました！");
});

// 自分がいるサーバーにメッセージが送信されたとき
client.on(Events.MessageCreate, async (message) => {
  // sq-scheduleに送られた、このbot以外の発言で、@everyoneしているものを拾う
  // if (message.author.id === client.user?.id) return;
  // if (message.channel.type !== ChannelType.GuildText) return;
  // if (message.content.substring(0, 9) != "@everyone") return;

  const targetLogName = "./log/" + message.channelId + ".json";
  const existLog = fs.existsSync(targetLogName);
  let obj = existLog
    ? JSON.parse(fs.readFileSync(targetLogName, "utf8"))
    : {
        followChannel: message.channel.id,
        notifyChannel: message.channel.id,
        needFormat: [2, 3, 4, 6],
        logs: [],
      };

  // 自分のものでなく、notifyChannelに送られていて、@everyoneしているもの
  if (
    message.author.id !== client.user?.id &&
    (!existLog || message.channel.id === obj.followChannel)&&
    message.content.substring(0, 9) === "@everyone"
  ){
    if(!existLog){
      message.channel.send(
        "初期設定としてこのチャンネルをフォローチャンネルおよびお知らせチャンネルに設定しました。\n" + 
        "sq-followchannelコマンドおよびsq-notifychannelコマンドにより、設定を行ってください。\n" +
        "sq-needformatコマンドによって、通知が必要なフォーマットの設定をすることもできます。"
      );
      fs.writeFileSync(targetLogName, JSON.stringify(obj, undefined, " "));
    }
    obj = await makeLog(message, obj);
    fs.writeFileSync(targetLogName, JSON.stringify(obj, undefined, " "));
  }
});

// interaction作成時
client.on(Events.InteractionCreate, async (interaction) => {
  //ボタンのとき
  if (interaction.isButton()) {
    // 考え中のリプライ
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // joinボタン
    if (interaction.customId === "join") {
      joinCommand(client, interaction);
    }

    // dropボタン
    if (interaction.customId === "drop") {
      dropCommand(client, interaction);
    }
  }
});

if (!fs.existsSync("./log.json")) {
  fs.writeFileSync("./log.json", JSON.stringify([], undefined, " "));
}

const result = await client.login(discordToken);
if (!result) {
  throw new Error("login failed");
}
