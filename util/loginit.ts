import { TextChannel, Guild } from "discord.js";
import fs from "fs";

import { GuildData } from "./class.js";

const needFormatDefault = [2, 3, 4, 6];

export default async (guild: Guild, channel: TextChannel | null) => {
  const targetLogName = "./log/" + guild.id + ".json";
  const obj = new GuildData(channel?.id ?? "", channel?.id ?? "", needFormatDefault);
  if (channel) {
    channel.send(
      "ラウンジのsq-scheduleをフォローするチャンネルと、お知らせチャンネルをこのチャンネルに設定しました。\n" +
        "/sq-followchannelコマンドおよび/sq-notifychannelコマンドにより、設定を行ってください。\n" +
        "sq-needformatコマンドによって、通知が必要なフォーマットの設定をすることもできます。"
    );
  }
  fs.writeFileSync(targetLogName, JSON.stringify(obj, undefined, " "));
};
