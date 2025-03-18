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

  addLog(log: Log): this {
    this.logs.push(log);
    return this;
  }

  setFollowChannel(channel: TextChannel): this {
    this.followChannel = channel.id;
    return this;
  }

  setNotifyChannel(channel: TextChannel): this {
    this.notifyChannel = channel.id;
    return this;
  }
}