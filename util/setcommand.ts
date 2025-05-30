import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandIntegerOption,
  SlashCommandChannelOption,
  REST,
  Routes,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import config from "../config.json" with { type: "json" };
const { discordToken, clientId } = config;

// 必要なフォーマットの設定
const setNeedFormat = new SlashCommandBuilder()
  .setName("sq-needformat")
  .setDescription("通知するフォーマットの設定")
  .addSubcommandGroup(
    new SlashCommandSubcommandGroupBuilder()
      .setName("subcommands")
      .setDescription("確認/追加/削除")

      .addSubcommand(
        new SlashCommandSubcommandBuilder()
          .setName("confirm")
          .setDescription("通知するフォーマットの確認")
      )

      .addSubcommand(
        new SlashCommandSubcommandBuilder()
          .setName("add")
          .setDescription("通知するフォーマットの追加")
          .addIntegerOption(
            new SlashCommandIntegerOption()
              .setName("format")
              .setDescription("追加するフォーマット")
              .setRequired(true)
              .addChoices(
                { name: "2v2", value: 2 },
                { name: "3v3", value: 3 },
                { name: "4v4", value: 4 },
                { name: "6v6", value: 6 }
              )
          )
      )

      .addSubcommand(
        new SlashCommandSubcommandBuilder()
          .setName("delete")
          .setDescription("通知するフォーマットの削除")
          .addIntegerOption(
            new SlashCommandIntegerOption()
              .setName("format")
              .setDescription("削除するフォーマット")
              .setRequired(true)
              .addChoices(
                { name: "2v2", value: 2 },
                { name: "3v3", value: 3 },
                { name: "4v4", value: 4 },
                { name: "6v6", value: 6 }
              )
          )
      )
  );

const setNotifyChannel = new SlashCommandBuilder()
  .setName("sq-notifychannel")
  .setDescription("通知を送信するチャンネルの設定")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("通知するチャンネル")
      .setRequired(true)
  );

const setFollowChannel = new SlashCommandBuilder()
  .setName("sq-followchannel")
  .setDescription("ラウンジのsq-scheduleをフォローするチャンネルの設定")
  .addChannelOption(
    new SlashCommandChannelOption()
      .setName("channel")
      .setDescription("フォローするチャンネル")
      .setRequired(true)
  );

const commands = [setNeedFormat, setNotifyChannel, setFollowChannel];

const rest = new REST().setToken(discordToken);

rest
  .put(Routes.applicationCommands(clientId), { body: commands })
  .catch(console.error);
