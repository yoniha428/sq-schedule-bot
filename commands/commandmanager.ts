import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import needFormat from "./needformat.js";
import notifyChannel from "./notifychannel.js";
import followChannel from "./followchannel.js";

export default async (interaction: ChatInputCommandInteraction) => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (interaction.commandName === "sq-needformat") needFormat(interaction);
  if (interaction.commandName === "sq-notifychannel") notifyChannel(interaction);
  if (interaction.commandName === "sq-followchannel") followChannel(interaction);
};
