import {
  ButtonInteraction,
  escapeMarkdown,
  ChannelType,
} from "discord.js";
import fs from "fs";
import path from "path";
const dirname = import.meta.dirname;

import { GuildData, Log } from "../class.js";
import logInit from "../loginit.js";

export default async (interaction: ButtonInteraction) => {
  if (
    !interaction.guild ||
    !interaction.channel ||
    interaction.channel.type !== ChannelType.GuildText
  ) {
    console.log("ボタン押されてるのにギルドとかチャンネルが変");
    return;
  }

  // idが一致するログを抽出
  const fileName = path.resolve(
    dirname,
    "../../log/" + interaction.guildId + ".json"
  );

  if (!fs.existsSync(fileName)) {
    logInit(interaction.guild, interaction.channel);
  }
  const guildDataBefore: GuildData = JSON.parse(fs.readFileSync(fileName, "utf8"));

  const matchLog: Array<Log> = guildDataBefore.logs.filter(
    (log: Log) => log.id === interaction.message.id
  );

  // 2個以上マッチ
  if (matchLog.length > 1) {
    interaction.editReply(
      "一致するメッセージIDがログに2つ以上あります。\n" +
        "管理者に連絡してください。"
    );
    return;
  }

  // マッチなし
  if (matchLog.length === 0) {
    interaction.editReply(
      "メッセージIDに一致するログが見つかりませんでした。\n" +
        "現在時刻以降の投票にも関わらずこのメッセージが表示されている場合は管理者に連絡してください。"
    );
    return;
  }

  const log = matchLog.at(0);
  const userId = interaction.member?.user.id;

  if (!log || !userId) {
    console.error("logとかuserIdミスってそう");
    return;
  }

  // 参加済み
  if (log.participants.includes(userId)) {
    interaction.editReply({ content: "既に参加しています" });
    return;
  }

  // 正常な処理
  log.count++;
  log.participants.push(userId);

  // メッセージ編集
  // 参加者一覧を取得
  // todo! participantsNameはPromise.all()とlog.participants.map()でいけそう
  // let participantsName = [];
  // for (const id of log.participants) {
  //   const username = (await client.users.fetch(id)).username;
  //   // console.log(username);
  //   participantsName.push(username);
  // }
  const participantsName = (
    await Promise.all(log.participants.map((id) => interaction.client.users.fetch(id)))
  ).map((user) => user.username);

  const dateContent = interaction.message.content.split("\n").at(0);
  if (!dateContent) {
    interaction.editReply("日付を示すcontentが見つかりません");
    return;
  }

  const content =
    dateContent +
    "\n" +
    escapeMarkdown(
      "参加者: " +
        (log.count ? participantsName.join(", ") : "なし") +
        "\n参加人数: " +
        log.count +
        "/" +
        log.format
    );

  await interaction.deleteReply();
  interaction.message.edit({ content: content });

  // ログを更新
  fs.writeFileSync(fileName, JSON.stringify(guildDataBefore, undefined, " "));
};
