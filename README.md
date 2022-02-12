# twitch-emote-parser
NPM package that parses Twitch chat for 3rd party, and channel emotes.

```
import Chat from 'twitch-emote-parser'

// Channel you want to connect and listen to.
let channel = 'mahcksimus';

// Creating the chat instance.
const ChatInstance = new Chat({
  channel: channel,
  duplicateEmoteLimit: 5,
  duplicateEmoteLimitPleb: null,
  emoteSettings: {
    bttv: true,
    bttvGlobal: true,
    channelEmotes: true,
    ffz: true,
    ffzGlobal: true,
    sevenTV: true,
    sevenTVGlobal: true
  },
  maxEmoteLimit: 10
});

// Listening to emotes 
ChatInstance.on("emotes", (emotes) => {
  console.log(emotes);
});
```
| Property                      | Type    | Description                                                                                                       |
|-------------------------------|---------|-------------------------------------------------------------------------------------------------------------------|
| `channel`                     | string  | Channel name string that you want to connect to chat with.                                                        |
| `duplicateEmoteLimit`         | number  | Maxium number of emotes permitted for a single message.                                                           |
| `duplicateEmoteLimitPleb`     | number  | Maximum number of emotes permitted for a single message from an unsubscribed user, defaults to maximumEmoteLimit. |
| `maxEmoteLimit`               | number  | Max limit of emotes per message                                                                                   |
| `emoteSettings`               | object  | Enable/disable certain category of emotes.                                                                        |
| `emoteSettings.channelEmotes` | boolean | Channel sub/bits emotes.                                                                                          |
| `emoteSettings.bttv`          | boolean | BTTV channel emotes.                                                                                              |
| `emoteSettings.bttvGlobal`    | boolean | BTTV global emotes.                                                                                               |
| `emoteSettings.ffz`           | boolean | FFZ channel emotes.                                                                                               |
| `emoteSettings.ffzGlobal`     | boolean | FFZ global emotes                                                                                                 |
| `emoteSettings.sevenTV`       | boolean | 7tv channel emotes.                                                                                               |
| `emoteSettings.sevenTVGlboal` | boolean | 7tv global emotes.                                                                                                |

**Listening for Emotes**
`ChatInstance.on(event, callback)` <br />
On callback it will return an object like so: 
```
{
  count: 3,
  emote: [
    {
      name: 'pajaDank',
      url: 'https://cdn.7tv.app/emote/60ae3a6c259ac5a73e3a3ca2/3x',
      service: '7tv',
      scope: 'channel',
      zeroWidth: false
    }
  ]
}
```