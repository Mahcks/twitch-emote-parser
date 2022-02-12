import { ChatUserstate, Client } from "tmi.js";
import { Config, Emote } from "./types";
export declare class Chat {
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
    constructor(config: Config);
    handleChat(channel: string, user: ChatUserstate, message: string, self: boolean): void;
    on(event: string | undefined, callback: (emotes: any) => void): void;
    dispatch(event: string | number, data: any): void;
    getEmoteArrayFromMessage(text: string, emotes: {
        [emoteid: string]: string[];
    } | undefined, subscriber: boolean): void;
    bttvZeroWidth: string[];
    urls: any;
    fetchEmotes(channelName: string, channelId: number): Promise<void>;
    getTwitchEmotes(service: string, type: string, nameProp: string, param: string): Promise<any>;
    getEmotesFromService(service: string, type: string, nameProp: string, param: string | number): Promise<any>;
    getBttvChannelEmotes(channelId: number): Promise<any>;
    mapEmoteData(data: any, service: string, type: string, nameProp: string): any;
    getCdnUrl(emote: any, service: string): any;
    isZeroWidth(emote: any, name: any): boolean;
}
