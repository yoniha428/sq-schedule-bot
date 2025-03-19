import { TextChannel } from "discord.js";

export class Log {
  id: string;
  time: number;
  format: number;
  count: number;
  participants: Array<string>;
  notified: {in30min: number, in60min: number};

  constructor(id: string, time: number, format: number){
    this.id = id;
    this.time = time;
    this.format = format;
    this.count = 0;
    this.participants = [];
    this.notified = {in30min: 0, in60min: 0};
  }
}

export class GuildData {
  followChannel: string;
  notifyChannel: string;
  needFormat: Array<number>;
  logs: Array<Log>;

  constructor(followChannel: string, notifyChannel: string, needFormat: Array<number>){
    this.followChannel = followChannel;
    this.notifyChannel = notifyChannel;
    this.needFormat = needFormat;
    this.logs = []
  }

  static fromJSON(obj: any): GuildData {
    let guildData = new GuildData(obj.followChannel, obj.notifyChannel, obj.needFormat);
    guildData.logs = obj.logs;
    return guildData;
  }

  addLog(log: Log): this {
    this.logs.push(log);
    return this;
  }

  setFollowChannel(channel: TextChannel): void {
    this.followChannel = channel.id;
  }

  setNotifyChannel(channel: TextChannel): void {
    this.notifyChannel = channel.id;
  }
}