export interface Config {
  channel: string;
  duplicateEmoteLimit: number;
  duplicateEmoteLimitPleb: number | null;
  maxEmoteLimit: number;
  emoteSettings: EmoteSettings;
}

export interface EmoteTypes {
  ffz: string[];
  bttv: string[];
  sevenTV: string[];
}

export interface EmoteSettings {
  channelEmotes: boolean;
  ffz: boolean;
  ffzGlobal: boolean;
  bttv: boolean;
  bttvGlobal: boolean;
  sevenTV: boolean;
  sevenTVGlobal: boolean;
}

export interface EmoteObject {
  array: Emote[]
}

export interface Emote {
  name: string;
  url: string;
  service: string;
  scope: string;
  zeroWidth: boolean;
}