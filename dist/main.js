"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const tmi_js_1 = require("tmi.js");
const isPleb = (badges) => {
    return badges ? (badges.subscriber !== undefined ||
        badges['sub-gifter'] !== undefined ||
        badges.moderator !== undefined ||
        badges.vip !== undefined ||
        badges.broadcaster !== undefined ||
        Number(badges.bits) > 500) : false;
};
class Chat {
    /**
     * @param {Object} config The configuration object
     * @param {String} channel Twitch channel to connect to
     * @param {Number} duplicateEmoteLimit Maxium number of emotes permitted for a single message
     * @param {Number} duplicateEmoteLimitPleb Maximum number of emotes permitted for a single message from an unsubscribed user, defaults to maximumEmoteLimit.
     * @param {Number} duplicateEmoteLimit Number of duplicate emotes permitted for a single message
     * @param {Object} emoteSettings Enable/disable certain category of emotes
     * @param {Boolean} emoteSettings.channelEmotes Twitch channel sub emotes
     * @param {Boolean} emoteSettings.bttv BTTV channel emotes
     * @param {Boolean} emoteSettings.bttvGlobal BTTV global emotes
     * @param {Boolean} emoteSettings.ffz FFZ channel emotes
     * @param {Boolean} emoteSettings.ffzGlobal FFZ Global emotes
     * @param {Boolean} emoteSettings.sevenTV 7tv channel emotes
     * @param {Boolean} emoteSettings.sevenTVGlobal 7tv global emotes
     */
    constructor(config) {
        this.bttvZeroWidth = ['SoSnowy', 'IceCold', 'cvHazmat', 'cvMask'];
        this.urls = {
            twitch: {
                channel: (channelName) => `https://api.retpaladinbot.com/twitch/emotes?id=${channelName}`,
                cdn: (emoteId) => `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/static/light/3.0`,
            },
            bttv: {
                channel: (channelId) => `https://api.betterttv.net/3/cached/users/twitch/${channelId}`,
                global: () => 'https://api.betterttv.net/3/cached/emotes/global',
                cdn: (emoteId) => `https://cdn.betterttv.net/emote/${emoteId}/3x`,
            },
            ffz: {
                channel: (channelId) => `https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${channelId}`,
                global: () => 'https://api.betterttv.net/3/cached/frankerfacez/emotes/global',
                cdn: (emoteId) => `https://cdn.frankerfacez.com/emoticon/${emoteId}/2`,
            },
            stv: {
                channel: (channelName) => `https://api.7tv.app/v2/users/${channelName}/emotes`,
                global: () => 'https://api.7tv.app/v2/emotes/global',
                cdn: (emoteId) => `https://cdn.7tv.app/emote/${emoteId}/3x`,
            },
        };
        const defaultConfig = {
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
        };
        this.config = Object.assign(defaultConfig, config);
        if (!this.config.channel)
            this.config.channel = "esfandtv";
        this.emotes = [];
        this.emoteRegex = new RegExp("", "gi");
        this.listeners = {};
        this.client = new tmi_js_1.Client({
            options: { debug: false },
            connection: {
                reconnect: true,
                secure: true
            },
            channels: [this.config.channel]
        });
        this.channelId = 0;
        axios_1.default.get("https://api.retpaladinbot.com/twitch/id?user=" + this.config.channel)
            .then((res) => {
            this.channelId = res.data.data.id;
        });
        this.fetchEmotes(this.config.channel, this.channelId);
        this.client.addListener('message', this.handleChat.bind(this));
        this.client.connect();
    }
    handleChat(channel, user, message, self) {
        this.getEmoteArrayFromMessage(message, user.emotes, isPleb(user.badges));
        //console.log(user["display-name"], message);
    }
    on(event = 'emotes', callback) {
        if (!this.listeners[event])
            this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    dispatch(event, data) {
        if (!this.listeners[event])
            return;
        for (let i = 0; i < this.listeners[event].length; i++) {
            this.listeners[event][i](data);
        }
    }
    getEmoteArrayFromMessage(text, emotes, subscriber) {
        const maxDuplicates = subscriber ? this.config.duplicateEmoteLimit : this.config.duplicateEmoteLimitPleb;
        let emoteCache = [];
        let test = text.match(this.emoteRegex);
        if (test !== null) {
            test = this.config.maxEmoteLimit ? test.splice(0, this.config.maxEmoteLimit) : test;
            let unique = test.filter((item, i, ar) => ar.indexOf(item) === i);
            unique.forEach(u => {
                let eCount = test === null || test === void 0 ? void 0 : test.filter(x => x === u).length;
                if (eCount >= maxDuplicates)
                    eCount = maxDuplicates;
                let foundEmote = this.emotes.filter(emote => {
                    return emote.name === u;
                });
                emoteCache.push({ count: eCount, emote: foundEmote });
            });
            this.dispatch("emotes", emoteCache);
        }
    }
    fetchEmotes(channelName, channelId) {
        let functionEndpoints = [];
        console.log(this.channelId);
        if (this.config.emoteSettings.channelEmotes)
            functionEndpoints.push(this.getTwitchEmotes('twitch', 'channel', 'name', channelName)); // good
        if (this.config.emoteSettings.bttv)
            functionEndpoints.push(this.getBttvChannelEmotes(channelId)); // good
        if (this.config.emoteSettings.bttvGlobal)
            functionEndpoints.push(this.getEmotesFromService('bttv', 'global', 'code', '')); // good
        if (this.config.emoteSettings.ffz)
            functionEndpoints.push(this.getEmotesFromService('ffz', 'channel', 'code', channelId)); // good
        if (this.config.emoteSettings.ffzGlobal)
            functionEndpoints.push(this.getEmotesFromService('ffz', 'global', 'code', '')); // rejected
        if (this.config.emoteSettings.sevenTV)
            functionEndpoints.push(this.getEmotesFromService('stv', 'channel', 'name', channelName)); // good
        if (this.config.emoteSettings.sevenTVGlobal)
            functionEndpoints.push(this.getEmotesFromService('stv', 'global', 'name', '')); // rejecteds 
        return Promise.allSettled(functionEndpoints)
            .then((resAll) => {
            this.emotes = resAll
                .filter((res) => res.status === 'fulfilled')
                .map((res) => res.value)
                .flat();
            let emoteNames = this.emotes.map(function (emote) { return "\\b" + emote["name"] + "\\b"; });
            this.emoteRegex = new RegExp("(" + emoteNames.join("|") + ")", "g");
        });
    }
    getTwitchEmotes(service, type, nameProp, param) {
        console.log(this.urls[service][type](param));
        return axios_1.default
            .get(this.urls[service][type](param))
            .then((res) => this.mapEmoteData(res === null || res === void 0 ? void 0 : res.data.data, service, type, nameProp));
    }
    getEmotesFromService(service, type, nameProp, param) {
        return axios_1.default
            .get(this.urls[service][type](param))
            .then((res) => this.mapEmoteData(res === null || res === void 0 ? void 0 : res.data, service, type, nameProp));
    }
    getBttvChannelEmotes(channelId) {
        return axios_1.default.get(this.urls.bttv.channel(channelId)).then((res) => {
            const channelEmotes = this.mapEmoteData(res === null || res === void 0 ? void 0 : res.data.channelEmotes, 'bttv', 'channel', 'code');
            const sharedEmotes = this.mapEmoteData(res === null || res === void 0 ? void 0 : res.data.sharedEmotes, 'bttv', 'channel', 'code');
            return channelEmotes.concat(sharedEmotes);
        });
    }
    mapEmoteData(data, service, type, nameProp) {
        return (data.map((emote) => ({
            name: emote[nameProp],
            url: this.getCdnUrl(emote, service),
            service: service === 'stv' ? '7tv' : service,
            scope: type,
            zeroWidth: this.isZeroWidth(emote, emote[nameProp]),
        })) || []);
    }
    getCdnUrl(emote, service) {
        var _a;
        return service === 'twitch' && ((_a = emote.format) === null || _a === void 0 ? void 0 : _a.includes('animated'))
            ? this.urls[service].cdn(emote.id).replace(/\/static\//, '/animated/')
            : this.urls[service].cdn(emote.id);
    }
    isZeroWidth(emote, name) {
        var _a;
        return (!!((_a = emote === null || emote === void 0 ? void 0 : emote.visibility_simple) === null || _a === void 0 ? void 0 : _a.includes('ZERO_WIDTH')) ||
            this.bttvZeroWidth.includes(name));
    }
}
exports.default = Chat;
