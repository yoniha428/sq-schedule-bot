import { Interaction, MessageFlags } from "discord.js";
import needFormat from "./commands/needformat.js";
import notifyChannel from "./commands/notifychannel.js";
import followChannel from "./commands/followchannel.js";
import joinCommand from "./commands/join.js";
import dropCommand from "./commands/drop.js";

export default async (interaction: Interaction) => {
  if (interaction.isButton()) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (interaction.customId === "join") {
      joinCommand(interaction);
    }

    if (interaction.customId === "drop") {
      dropCommand(interaction);
    }
  }
  if (interaction.isChatInputCommand()) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (interaction.commandName === "sq-needformat") needFormat(interaction);
    if (interaction.commandName === "sq-notifychannel")
      notifyChannel(interaction);
    if (interaction.commandName === "sq-followchannel")
      followChannel(interaction);
  }
};
