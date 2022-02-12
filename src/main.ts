import axios from "axios";
import { Badges, ChatUserstate, Client } from "tmi.js";

const isPleb = (badges: Badges) => {
  return badges ? (
    badges.subscriber !== undefined ||
    badges['sub-gifter'] !== undefined ||
    badges.moderator !== undefined ||
    badges.vip !== undefined ||
    badges.broadcaster !== undefined ||
    Number(badges.bits) > 500
  ) : false;
}

class Chat {

  config: Config;
  emotes: Emote[];
  emoteRegex: RegExp;
  listeners: any;
  channelId: number;

  client: Client;

  /**
   * @param {Object} config The configuration object
   * @param {String} channel Twitch channel to connect to
   * @param {Number} duplicateEmoteLimit Maxium number of emotes permitted for a single message
   * @param {Number} duplicateEmoteLimitPleb Maximum number of emotes permitted for a single message from an unsubscribed user, defaults to maximumEmoteLimit.
   * @param {Number} duplicateEmoteLimit Number of duplicate emotes permitted for a single message
   * @param {Number} maxEmoteLimit Max limit of emotes per message
   * @param {Object} emoteSettings Enable/disable certain category of emotes
   * @param {Boolean} emoteSettings.channelEmotes Twitch channel sub emotes
   * @param {Boolean} emoteSettings.bttv BTTV channel emotes
   * @param {Boolean} emoteSettings.bttvGlobal BTTV global emotes
   * @param {Boolean} emoteSettings.ffz FFZ channel emotes
   * @param {Boolean} emoteSettings.ffzGlobal FFZ Global emotes
   * @param {Boolean} emoteSettings.sevenTV 7tv channel emotes
   * @param {Boolean} emoteSettings.sevenTVGlobal 7tv global emotes
   */

  constructor(config: Config) {
    const defaultConfig: Config = {
      channel: "esfandtv",
      duplicateEmoteLimit: 0,
      duplicateEmoteLimitPleb: null,
      maxEmoteLimit: 5,
      emoteSettings: {
        channelEmotes: true,
        bttv: true,
        bttvGlobal: true,
        ffz: true,
        ffzGlobal: true,
        sevenTV: true,
        sevenTVGlobal: true
      },
    }

    this.config = Object.assign(defaultConfig, config);

    if (!this.config.channel) this.config.channel = "esfandtv";

    this.emotes = [];
    this.emoteRegex = new RegExp("", "gi");
    this.listeners = {};

    this.client = new Client({
      options: { debug: false },
      connection: {
        reconnect: true,
        secure: true
      },
      channels: [this.config.channel]
    });

    this.channelId = 0;
    axios.get("https://api.retpaladinbot.com/twitch/id?user=" + this.config.channel)
      .then((res: any) => {
        this.channelId = res.data.data.id;
      });

    this.fetchEmotes(this.config.channel, this.channelId);

    this.client.addListener('message', this.handleChat.bind(this));
    this.client.connect();
  }

  handleChat(channel: string, user: ChatUserstate, message: string, self: boolean) {
    this.getEmoteArrayFromMessage(message, user.emotes, isPleb(user.badges!));
    //console.log(user["display-name"], message);
  }

  on(event = 'emotes', callback: (emotes: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  dispatch(event: string | number, data: any) {
    if (!this.listeners[event]) return;
    for (let i = 0; i < this.listeners[event].length; i++) {
      this.listeners[event][i](data);
    }
  }

  getEmoteArrayFromMessage(text: string, emotes: { [emoteid: string]: string[]; } | undefined, subscriber: boolean) {
    const maxDuplicates = subscriber ? this.config.duplicateEmoteLimit : this.config.duplicateEmoteLimitPleb;

    let emoteCache: object[] = [];
    let test = text.match(this.emoteRegex);

    if (test !== null) {
      test = this.config.maxEmoteLimit ? test.splice(0, this.config.maxEmoteLimit) : test;

      let unique = test.filter((item, i, ar) => ar.indexOf(item) === i);
      unique.forEach(u => {
        let eCount = test?.filter(x => x === u).length;
        if (eCount! >= maxDuplicates!) eCount! = maxDuplicates!;

        let foundEmote = this.emotes.filter(emote => {
          return emote.name === u;
        });

        emoteCache.push({ count: eCount, emote: foundEmote });
      });

      this.dispatch("emotes", emoteCache);
      emoteCache = [];
    }
  }

  bttvZeroWidth: string[] = ['SoSnowy', 'IceCold', 'cvHazmat', 'cvMask'];
  urls: any = {
    twitch: {
      channel: (channelName: string | number) =>
        `https://api.retpaladinbot.com/twitch/emotes?id=${channelName}`,
      cdn: (emoteId: string | number) =>
        `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/static/light/3.0`,
    },
    bttv: {
      channel: (channelId: number) =>
        `https://api.betterttv.net/3/cached/users/twitch/${channelId}`,
      global: () => 'https://api.betterttv.net/3/cached/emotes/global',
      cdn: (emoteId: string | number) => `https://cdn.betterttv.net/emote/${emoteId}/3x`,
    },
    ffz: {
      channel: (channelId: number) =>
        `https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${channelId}`,
      global: () =>
        'https://api.betterttv.net/3/cached/frankerfacez/emotes/global',
      cdn: (emoteId: string | number) => `https://cdn.frankerfacez.com/emoticon/${emoteId}/2`,
    },
    stv: {
      channel: (channelName: string) =>
        `https://api.7tv.app/v2/users/${channelName}/emotes`,
      global: () => 'https://api.7tv.app/v2/emotes/global',
      cdn: (emoteId: string | number) => `https://cdn.7tv.app/emote/${emoteId}/3x`,
    },
  };

  fetchEmotes(channelName: string, channelId: number) {
    let functionEndpoints: Promise<any>[] = [];

    console.log(this.channelId);
    if (this.config.emoteSettings.channelEmotes) functionEndpoints.push(this.getTwitchEmotes('twitch', 'channel', 'name', channelName)); // good
    if (this.config.emoteSettings.bttv) functionEndpoints.push(this.getBttvChannelEmotes(channelId)); // good
    if (this.config.emoteSettings.bttvGlobal) functionEndpoints.push(this.getEmotesFromService('bttv', 'global', 'code', '')); // good
    if (this.config.emoteSettings.ffz) functionEndpoints.push(this.getEmotesFromService('ffz', 'channel', 'code', channelId)); // good
    if (this.config.emoteSettings.ffzGlobal) functionEndpoints.push(this.getEmotesFromService('ffz', 'global', 'code', '')); // rejected
    if (this.config.emoteSettings.sevenTV) functionEndpoints.push(this.getEmotesFromService('stv', 'channel', 'name', channelName)); // good
    if (this.config.emoteSettings.sevenTVGlobal) functionEndpoints.push(this.getEmotesFromService('stv', 'global', 'name', '')); // rejecteds 

    return Promise.allSettled(functionEndpoints)
      .then((resAll: any) => {
        this.emotes = resAll
          .filter((res: any) => res.status === 'fulfilled')
          .map((res: any) => res.value)
          .flat()

        let emoteNames = this.emotes.map(function (emote: Emote) { return "\\b" + emote["name"] + "\\b"; });
        this.emoteRegex = new RegExp("(" + emoteNames.join("|") + ")", "g");
      });
  }

  getTwitchEmotes(service: string, type: string, nameProp: string, param: string) {
    console.log(this.urls[service][type](param));
    return axios
      .get(this.urls[service][type](param))
      .then((res: any) => this.mapEmoteData(res?.data.data, service, type, nameProp));
  }

  getEmotesFromService(service: string, type: string, nameProp: string, param: string | number) {
    return axios
      .get(this.urls[service][type](param))
      .then((res) => this.mapEmoteData(res?.data, service, type, nameProp));
  }

  getBttvChannelEmotes(channelId: number) {
    return axios.get(this.urls.bttv.channel(channelId)).then((res) => {
      const channelEmotes = this.mapEmoteData(
        res?.data.channelEmotes,
        'bttv',
        'channel',
        'code'
      );
      const sharedEmotes = this.mapEmoteData(
        res?.data.sharedEmotes,
        'bttv',
        'channel',
        'code'
      );

      return channelEmotes.concat(sharedEmotes);
    });
  }

  mapEmoteData(data: any, service: string, type: string, nameProp: string) {
    return (
      data.map((emote: { [x: string]: any; }) => ({
        name: emote[nameProp],
        url: this.getCdnUrl(emote, service),
        service: service === 'stv' ? '7tv' : service,
        scope: type,
        zeroWidth: this.isZeroWidth(emote, emote[nameProp]),
      })) || []
    );
  }

  getCdnUrl(emote: any, service: string) {
    return service === 'twitch' && emote.format?.includes('animated')
      ? this.urls[service].cdn(emote.id).replace(/\/static\//, '/animated/')
      : this.urls[service].cdn(emote.id);
  }

  isZeroWidth(emote: any, name: any) {
    return (
      !!emote?.visibility_simple?.includes('ZERO_WIDTH') ||
      this.bttvZeroWidth.includes(name)
    );
  }
}

export default Chat;