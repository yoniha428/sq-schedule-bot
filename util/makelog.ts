import {
  OmitPartialGroupDMChannel,
  Message,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";

import { GuildData, Log } from "./class.js";

export default async (
  message: OmitPartialGroupDMChannel<Message<boolean>>,
  guildData: GuildData
) => {
  const content = message.content
    .split("\n")
    .filter((s) => s.substring(0, 9) !== "@everyone");
  const channel = message.channel;
  const needFormat = guildData.needFormat;
  const nowTime = new Date().getTime();

  for (const s of content) {
    // unixTimeとjstTimeをゴリ押しで作って、formatも取得
    // logで管理するのはunixTime
    const unixTime = parseInt(s.substring(20, 30)) * 1000;
    const jstTime = unixTime + 9 * 60 * 60 * 1000;
    const date = new Date(jstTime);
    const format = parseInt(s.at(10) ?? "0");

    // 投票を作る必要がないフォーマットなら飛ばす
    if (!needFormat.includes(format)) continue;

    // 現在より前なら飛ばす
    if (unixTime < nowTime) continue;

    // 日程のメッセージを送る
    const content =
      "# " +
      String(date.getMonth() + 1) +
      "/" +
      String(date.getDate()) +
      " " +
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0") +
      " " +
      s.substring(10, 13);

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

    const sendResult = await channel.send({ components: [row] , content: content});

    // console.log(sendResult.id);

    // logに現在の模擬の情報をpushする
    guildData.logs.push(new Log(sendResult.id, unixTime, format));
  }

  // guildDataを返す
  return guildData;
};
