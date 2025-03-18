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
const { discordToken, notifyChannelId, noNeedFormat } = config;

// 自作コマンドのimport
import { joinCommand } from "./commands/join.js";
import { dropCommand } from "./commands/drop.js";

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
  if (message.author.id === client.user?.id) return;
  if (message.channel.type !== ChannelType.GuildText) return;
  if (message.channel.name !== "sq-schedule") return;
  if (message.content.substring(0, 9) != "@everyone") return;

  // contentの整理と、送信チャンネルの確認
  const content = message.content
    .split("\n")
    .filter((s) => s.substring(0, 9) !== "@everyone");
  const channel = message.channel;

  // log.jsonから読み取る
  let obj = JSON.parse(fs.readFileSync("./log.json", "utf8"));

  for (const s of content) {
    // unixTimeとjstTimeをゴリ押しで作って、formatも取得
    // log.jsonで管理するのはunixTime
    const unixTime = parseInt(s.substring(20, 30)) * 1000;
    const jstTime = unixTime + 9 * 60 * 60 * 1000;
    const time = new Date(jstTime);
    const format = parseInt(s.at(10) ?? "0");

    // 投票を作る必要がないフォーマットなら飛ばす
    if (noNeedFormat.includes(format)) continue;

    // 日程のメッセージを送る
    await channel.send(
      "# " +
        String(time.getMonth() + 1) +
        "/" +
        String(time.getDate()) +
        " " +
        String(time.getHours()).padStart(2, "0") +
        ":" +
        String(time.getMinutes()).padStart(2, "0") +
        " " +
        s.substring(10, 13)
    );

    // joinとdropのボタンを作って送る
    const button1 = new ButtonBuilder()
      .setCustomId("join")
      .setLabel("Can join")
      .setStyle(ButtonStyle.Success);
    const button2 = new ButtonBuilder()
      .setCustomId("drop")
      .setLabel("drop")
      .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button1)
      .addComponents(button2);
    const sendResult = await channel.send({ components: [row] });

    // logに現在の模擬の情報をpushする
    obj.push({
      id: sendResult.id,
      time: unixTime,
      format: format,
      count: 0,
      participants: [],
      notified: {
        in30min: 0,
        in60min: 0,
      },
    });
  }

  // log.jsonにobjを書き込む
  fs.writeFileSync("./log.json", JSON.stringify(obj, undefined, " "));
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
