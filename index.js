import {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  escapeMarkdown,
  ChannelType,
} from "discord.js";
import fs from "fs";
import cron from "node-cron";
import http from "http";
import config from "./config.json" with { type: "json" };
const { discordToken, notifyChannelId, noNeedFormat } = config;

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
const port = process.env.PORT || 10000;
server.listen(port);

// 送信者だけに見えるreplyを作成
function ephemeralReply(interaction, content) {
  interaction.reply({ content: content, flags: MessageFlags.Ephemeral });
}

// 毎分走る、通知用
cron.schedule("* * * * *", async () => {
  console.log("cron running");
  if (!client.isReady()) {
    console.log("not logged in");
    await client.login(discordToken);
    if (!client.isReady()) {
      console.log("login failed");
      return;
    }
  }
  let obj = JSON.parse(fs.readFileSync("./log.json", "utf8"));
  const now = new Date().getTime();
  const notifyChannel = client.channels.resolve(notifyChannelId);
  if (!notifyChannel || notifyChannel.type !== ChannelType.GuildText) {
    console.log("notifyChannel not found or is not Text channel");
    return;
  }
  // console.log(obj);
  obj = obj.filter((log) => log.time > now);
  // console.log(obj);
  for (let log of obj) {
    if (log.count < log.format) continue;
    if (now + 60 * 60 * 1000 > log.time && log.notified.in60min === 0) {
      let message = "";
      for (const id of log.participants) {
        message += (await client.users.fetch(id)).toString();
      }
      message += "\n60分後に模擬があります！\n!cして！";
      if (log.count > log.format) {
        message += "\n人数超過です！話し合って参加者を決めましょう！";
      }
      notifyChannel
        .send(message)
        .then((_result) => {
          log.notified.in60min = 1;
        })
        .catch((err) => {
          console.log("message send failed. reason: ", err);
        });
    }
    if (now + 30 * 60 * 1000 > log.time && log.notified.in30min === 0) {
      let message = "";
      for (const id of log.participants) {
        message += (await client.users.fetch(id)).toString();
      }
      message += "\n30分後に模擬があります！\n!cした？";
      notifyChannel
        .send(message)
        .then((_result) => {
          log.notified.in30min = 1;
        })
        .catch((err) => {
          console.log("message send failed. reason: ", err);
        });
    }
  }
  fs.writeFileSync("./log.json", JSON.stringify(obj, undefined, " "));
});

// clientがreadyになったとき(毎回)
client.on("ready", async () => {
  console.log(`${client.user.tag}で起動しました！`);
});

// 自分がいるサーバーにメッセージが送信されたとき
client.on("messageCreate", async (message) => {
  // sq-scheduleに送られた、このbot以外の発言で、@everyoneしているものを拾う
  if (message.author.id === client.user.id) return;
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
    const format = parseInt(s.at(10));

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
    const row = new ActionRowBuilder()
      .addComponents(button1)
      .addComponents(button2);
    const sendRow = await channel.send({ components: [row] });

    // logに現在の模擬の情報をpushする
    obj.push({
      id: sendRow.id,
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
client.on("interactionCreate", async (interaction) => {
  //ボタンのとき
  if (interaction.isButton()) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // joinボタンのとき
    if (interaction.customId === "join") {
      // log.jsonからobjに読み取る
      let obj = JSON.parse(fs.readFileSync("./log.json", "utf8"));

      let matchLog;
      const userId = interaction.member.user.id;
      for (let log of obj)
        if (log.id === interaction.message.id) {
          if (matchLog) {
            interaction.editReply({
              content:
                "一致するメッセージIDがログに2つ以上あります。\n管理者に連絡してください。",
            });
            return;
          }
          if (log.participants.includes(userId)) {
            interaction.editReply({ content: "既に参加しています" });
            return;
          }
          log.count++;
          log.participants.push(userId);
          matchLog = log;
        }
      if (!matchLog) {
        // console.log(obj);
        interaction.editReply({
          content:
            "メッセージIDに一致するログが見つかりませんでした。\n現在時刻以降の投票にも関わらずこのメッセージが表示されている場合は管理者に連絡してください。",
        });
        return;
      }

      fs.writeFileSync("./log.json", JSON.stringify(obj, undefined, " "));

      let participantsName = [];
      for (const id of matchLog.participants) {
        const username = (await client.users.fetch(id)).username;
        // console.log(username);
        participantsName.push(username);
      }
      const content = escapeMarkdown(
        "参加者: " +
          participantsName.join(", ") +
          "\n参加人数: " +
          matchLog.count +
          "/" +
          matchLog.format
      );
      interaction.deleteReply();
      interaction.message.edit({ content: content });
    }
    if (interaction.customId === "drop") {
      // console.log(interaction.message.id);
      let obj = JSON.parse(fs.readFileSync("./log.json", "utf8"));

      let matchLog;
      const userId = interaction.member.user.id;
      for (let log of obj)
        if (log.id === interaction.message.id) {
          if (matchLog) {
            interaction.editReply({
              content:
                "一致するメッセージIDがログに2つ以上あります。\n管理者に連絡してください。",
            });
            return;
          }
          if (!log.participants.includes(userId)) {
            interaction.editReply({ content: "joinしていません" });
            return;
          }
          log.count--;
          log.participants = log.participants.filter((id) => id !== userId);
          matchLog = log;
        }
      if (!matchLog) {
        // console.log(obj);
        interaction.editReply({
          content:
            "メッセージIDに一致するログが見つかりませんでした。\n現在時刻以降の投票にも関わらずこのメッセージが表示されている場合は管理者に連絡してください。",
        });
        return;
      }
      fs.writeFileSync("./log.json", JSON.stringify(obj, undefined, " "));
      let participantsName = [];
      for (const id of matchLog.participants) {
        const username = (await client.users.fetch(id)).username;
        console.log(username);
        participantsName.push(username);
      }
      const content = escapeMarkdown(
        "参加者: " +
          participantsName.join(", ") +
          "\n参加人数: " +
          matchLog.count +
          "/" +
          matchLog.format
      );
      interaction.deleteReply();
      interaction.message.edit({ content: content });
    }
  }
});

if (!fs.existsSync("log.json")) {
  fs.writeFileSync("log.json", JSON.stringify([], undefined, " "));
}

await client.login(discordToken);
if (!client.isReady()) console.log("login failed");
