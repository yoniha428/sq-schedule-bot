import {
  Client,
  ButtonInteraction,
  escapeMarkdown,
  ChannelType,
} from "discord.js";
import fs from "fs";
import path from "path";
const dirname = import.meta.dirname;

import { Log, GuildData } from "../class.js";
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
    "../../../log/" + interaction.guildId + ".json"
  );

  if (!fs.existsSync(fileName)) {
    logInit(interaction.guild, interaction.channel);
  }
  let obj: GuildData = JSON.parse(fs.readFileSync(fileName, "utf8"));
  const matchLog: Array<Log> = obj.logs.filter(
    (log: Log) => log.id === interaction.message.id
  );

  // 2個以上マッチ
  if (matchLog.length > 1) {
    interaction.editReply(
      "一致するメッセージIDがログに2つ以上あります。\n管理者に連絡してください。"
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

  // 参加していない
  if (!log.participants.includes(userId)) {
    interaction.editReply("参加していません");
    return;
  }

  // 正常な処理
  log.count--;
  log.participants = log.participants.filter((id: string) => id !== userId);

  // メッセージ編集
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
  fs.writeFileSync(fileName, JSON.stringify(obj, undefined, " "));
};
