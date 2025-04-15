import {
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import path from "path";
import fs from "fs";
import { GuildData } from "../class.js";
import logInit from "../loginit.js";
const dirname = import.meta.dirname;

export default async (interaction: ChatInputCommandInteraction) => {
  const channel = interaction.options.getChannel("channel");
  if (!(channel instanceof TextChannel)) {
    interaction.editReply("テキストチャンネルではありません");
    return;
  }

  if (!interaction.guild) {
    interaction.editReply(
      "サーバーのテキストチャンネルからメッセージを送信してください。"
    );
    return;
  }

  if (interaction.channel?.type !== ChannelType.GuildText) {
    interaction.editReply(
      "通常のテキストチャンネルからコマンドを実行してください"
    );
    return;
  }

  const fileName = path.resolve(
    dirname,
    "../../../log/" + interaction.guildId + ".json"
  );
  if (!fs.existsSync(fileName)) {
    logInit(interaction.guild, null);
  }

  let guildData: GuildData = GuildData.fromJSON(
    JSON.parse(fs.readFileSync(fileName, "utf8"))
  );
  guildData.setNotifyChannel(channel);
  fs.writeFileSync(fileName, JSON.stringify(guildData, undefined, " "));

  interaction.editReply("通知チャンネルを変更しました");
};
