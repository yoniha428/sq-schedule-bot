import { ChatInputCommandInteraction } from "discord.js";
import { GuildData } from "../class.js";
import fs from "fs";
import path from "path";
import logInit from "../loginit.js";
const dirname = import.meta.dirname;

export default async (interaction: ChatInputCommandInteraction) => {
  if (!interaction.guild) return;
  const fileName = path.resolve(
    dirname,
    "../../../log/" + interaction.guildId + ".json"
  );

  if (!fs.existsSync(fileName)) {
    logInit(interaction.guild, null);
  }
  let guildData: GuildData = JSON.parse(fs.readFileSync(fileName, "utf8"));
  let needFormat = guildData.needFormat;

  const subcommand = interaction.options.getSubcommand(false);

  if (!subcommand) return;

  if (subcommand === "confirm") {
    interaction.editReply(
      "通知する設定となっているフォーマット\n# " +
        needFormat.map((num) => num + "v" + num).join(", ")
    );
    return;
  }

  if (subcommand === "add") {
    const addFormat = interaction.options.getInteger("format", true);
    if (needFormat.includes(addFormat)) {
      interaction.editReply("既に通知する設定になっています");
      return;
    }
    needFormat.push(addFormat);
    needFormat.sort();
  }

  if (subcommand === "delete") {
    const deleteFormat = interaction.options.getInteger("format", true);
    if (!needFormat.includes(deleteFormat)) {
      interaction.editReply("既に通知しない設定になっています");
      return;
    }
    needFormat = needFormat.filter((format) => format !== deleteFormat);
  }

  // needFormatはArrayなので、再代入によるコピーが発生していて、代入し直しが必要
  guildData.needFormat = needFormat;

  fs.writeFileSync(fileName, JSON.stringify(guildData, undefined, " "));
  interaction.editReply(
    "正常に" + (subcommand === "add" ? "追加" : "削除") + "しました"
  );
};
