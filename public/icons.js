// Maps fruit name (lowercase) -> real icon URL, sourced directly from
// fruityblox.com's Discord CDN emoji assets.
const FRUIT_ICONS = {
  "rocket": "https://cdn.discordapp.com/emojis/1196031892747718666.webp?size=40",
  "spin": "https://cdn.discordapp.com/emojis/1196031932090306600.webp?size=40",
  "blade": "https://cdn.discordapp.com/emojis/1196031811164323870.webp?size=40",
  "spring": "https://cdn.discordapp.com/emojis/1196031938885062686.webp?size=40",
  "bomb": "https://cdn.discordapp.com/emojis/1196031797339893770.webp?size=40",
  "smoke": "https://cdn.discordapp.com/emojis/1196031913723445398.webp?size=40",
  "spike": "https://cdn.discordapp.com/emojis/1196031928244117514.webp?size=40",
  "flame": "https://cdn.discordapp.com/emojis/1196031835013120060.webp?size=40",
  "ice": "https://cdn.discordapp.com/emojis/1196031847126286446.webp?size=40",
  "sand": "https://cdn.discordapp.com/emojis/1196031902709194752.webp?size=40",
  "dark": "https://cdn.discordapp.com/emojis/1196031815635435580.webp?size=40",
  "eagle": "https://cdn.discordapp.com/emojis/1539655641814278395.webp?size=40",
  "diamond": "https://cdn.discordapp.com/emojis/1196031818965725234.webp?size=40",
  "light": "https://cdn.discordapp.com/emojis/1196031863412752384.webp?size=40",
  "rubber": "https://cdn.discordapp.com/emojis/1196031896275128330.webp?size=40",
  "ghost": "https://cdn.discordapp.com/emojis/1196031839454892112.webp?size=40",
  "magma": "https://cdn.discordapp.com/emojis/1196031869620330597.webp?size=40",
  "quake": "https://cdn.discordapp.com/emojis/1196031890449240155.webp?size=40",
  "buddha": "https://cdn.discordapp.com/emojis/1196031800775024701.webp?size=40",
  "love": "https://cdn.discordapp.com/emojis/1196031865388277821.webp?size=40",
  "creation": "https://cdn.discordapp.com/emojis/1539655615272714350.webp?size=40",
  "spider": "https://cdn.discordapp.com/emojis/1196031923999481886.webp?size=40",
  "sound": "https://cdn.discordapp.com/emojis/1196031921847816212.webp?size=40",
  "phoenix": "https://cdn.discordapp.com/emojis/1196031886393344040.webp?size=40",
  "portal": "https://cdn.discordapp.com/emojis/1196031880710070302.webp?size=40",
  "lightning": "https://cdn.discordapp.com/emojis/1539655762589261824.webp?size=40",
  "pain": "https://cdn.discordapp.com/emojis/1196031876134096957.webp?size=40",
  "blizzard": "https://cdn.discordapp.com/emojis/1196031795095928863.webp?size=40",
  "gravity": "https://cdn.discordapp.com/emojis/1196031844634869862.webp?size=40",
  "mammoth": "https://cdn.discordapp.com/emojis/1196031873579765810.webp?size=40",
  "t-rex": "https://cdn.discordapp.com/emojis/1196031947340787722.webp?size=40",
  "dough": "https://cdn.discordapp.com/emojis/1196031821813653504.webp?size=40",
  "shadow": "https://cdn.discordapp.com/emojis/1196031908358914119.webp?size=40",
  "venom": "https://cdn.discordapp.com/emojis/1539655817773580299.webp?size=40",
  "gas": "https://cdn.discordapp.com/emojis/1539655720465604638.webp?size=40",
  "spirit": "https://cdn.discordapp.com/emojis/1196031934988558386.webp?size=40",
  "tiger": "https://cdn.discordapp.com/emojis/1539655782738428045.webp?size=40",
  "yeti": "https://cdn.discordapp.com/emojis/1539655837969154078.webp?size=40",
  "kitsune": "https://cdn.discordapp.com/emojis/1539655744377458708.webp?size=40",
  "control": "https://cdn.discordapp.com/emojis/1539655586562711612.webp?size=40",
  "dragon": "https://cdn.discordapp.com/emojis/1539653074774265967.webp?size=40"
};

if (typeof module !== "undefined") {
  module.exports = { FRUIT_ICONS };
}
