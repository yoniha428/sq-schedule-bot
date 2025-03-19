import { ChannelType, ChatInputCommandInteraction, TextChannel } from "discord.js";
import path from "path";
import fs from "fs";
import { GuildData } from "./class.js";
const dirname = import.meta.dirname;

export default async (interaction: ChatInputCommandInteraction) => {

  const channel = interaction.options.getChannel("channel");
  if(!(channel instanceof TextChannel)){
    interaction.editReply("テキストチャンネルではありません");
    return;
  }

  if(interaction.channel?.type !== ChannelType.GuildText){
    interaction.editReply("通常のテキストチャンネルからコマンドを実行してください");
    return;
  }

  const fileName = path.resolve(
      dirname,
      "../../log/" + interaction.guildId + ".json"
    );
  if(!fs.existsSync(fileName)){
    interaction.channel.send("ログの初期化がされていません。\n" + 
      "どこかのテキストチャンネルで@everyoneを送信した上で、設定し直してください。"
    );
  }
  let guildData: GuildData = GuildData.fromJSON(JSON.parse(fs.readFileSync(fileName, "utf8")));
  guildData.setFollowChannel(channel);
  fs.writeFileSync(fileName, JSON.stringify(guildData, undefined, " "));

  interaction.editReply("フォローチャンネルを変更しました");
}