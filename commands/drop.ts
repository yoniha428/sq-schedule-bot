import { Client, ButtonInteraction, escapeMarkdown } from "discord.js";
import fs from "fs";

export const dropCommand = async (
  client: Client,
  interaction: ButtonInteraction
) => {
  // idが一致するログを抽出
  let obj: any = JSON.parse(fs.readFileSync("./log.json", "utf8"));
  const matchLog = obj.filter((log: any) => log.id === interaction.message.id);

  // 2個以上マッチ
  if (matchLog.length > 1) {
    interaction.editReply({
      content:
        "一致するメッセージIDがログに2つ以上あります。\n管理者に連絡してください。",
    });
    return;
  }

  // マッチなし
  if (matchLog.length === 0) {
    interaction.editReply({
      content:
        "メッセージIDに一致するログが見つかりませんでした。\n" +
        "現在時刻以降の投票にも関わらずこのメッセージが表示されている場合は管理者に連絡してください。",
    });
    return;
  }

  const log = matchLog.at(0);
  const userId = interaction.member?.user.id;

  // 参加していない
  if (!log.participants.includes(userId)) {
    interaction.editReply({ content: "参加していません" });
    return;
  }

  // 正常な処理
  log.count--;
  log.participants = log.participants.filter((id: string) => id !== userId);

  // メッセージ編集
  let participantsName: Array<string> = [];
  for (const id of log.participants) {
    const username = (await client.users.fetch(id)).username;
    // console.log(username);
    participantsName.push(username);
  }
  const content = escapeMarkdown(
    "参加者: " +
      participantsName.join(", ") +
      "\n参加人数: " +
      log.count +
      "/" +
      log.format
  );
  interaction.deleteReply();
  interaction.message.edit({ content: content });

  // ログを更新
  fs.writeFileSync("./log.json", JSON.stringify(obj, undefined, " "));
};
