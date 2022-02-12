interface Config {
  channel: string;
  duplicateEmoteLimit: number;
  duplicateEmoteLimitPleb: number | null;
  maxEmoteLimit: number;
  emoteSettings: EmoteSettings;
}

interface EmoteTypes {
  ffz: string[];
  bttv: string[];
  sevenTV: string[];
}

interface EmoteSettings {
  channelEmotes: boolean;
  ffz: boolean;
  ffzGlobal: boolean;
  bttv: boolean;
  bttvGlobal: boolean;
  sevenTV: boolean;
  sevenTVGlobal: boolean;
}

interface EmoteObject {
  array: Emote[]
}

interface Emote {
  name: string;
  url: string;
  service: string;
  scope: string;
  zeroWidth: boolean;
}