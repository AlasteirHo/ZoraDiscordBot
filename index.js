"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const coins_sdk_1 = require("@zoralabs/coins-sdk");
const chains_1 = require("viem/chains");
const viem_1 = require("viem");
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, 'api.env') });
// Replace with your actual credentials
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "YOUR_DISCORD_BOT_TOKEN_HERE";
const CLIENT_ID = process.env.CLIENT_ID || "YOUR_CLIENT_ID_HERE"; // Found in the Developer Portal
const GUILD_ID = process.env.GUILD_ID || "YOUR_GUILD_ID_HERE"; // Use your test server's ID
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not found in .env file. Gemini functionality will be disabled.');
}
// Create a new Discord client instance
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
// Set up viem public client for on-chain queries
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.base,
    transport: (0, viem_1.http)("<RPC_URL>"), // Replace <RPC_URL> with a valid RPC endpoint
});
// Initialize Gemini API if the key is available
let genAI = null;
let geminiModel = null;
if (GEMINI_API_KEY) {
    genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}
// /coin – Fetch a single coin's details and log all properties.
const coinCommand = new discord_js_1.SlashCommandBuilder()
    .setName('coin')
    .setDescription('Fetch details for a single Zora20 coin by address')
    .addStringOption(option => option.setName('address')
    .setDescription('The Zora20 token address (e.g. 0x445e9c0a296068dc4257767b5ed354b77cf513de)')
    .setRequired(true));
// /coincomments – Fetch coin comments
const coinCommentsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('coincomments')
    .setDescription('Fetch community comments for a Zora20 coin by address')
    .addStringOption(option => option.setName('address')
    .setDescription('The Zora20 token address')
    .setRequired(true));
// /coins – List multiple coins using specific coins (example with fixed addresses)
const coinsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('coins')
    .setDescription('List multiple Zora20 coins (using fixed collection addresses)');
// /multicoins – Fetch multiple coins using collection addresses (comma-separated input)
const multiCoinsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('multicoins')
    .setDescription('Fetch details for multiple coins using collection addresses (comma-separated)')
    .addStringOption(option => option.setName('addresses')
    .setDescription('Enter coin contract addresses separated by commas, e.g. 0xFirst,0xSecond,0xThird')
    .setRequired(true));
// /profile – Fetch a user profile by wallet address or Zora handle
const profileCommand = new discord_js_1.SlashCommandBuilder()
    .setName('profile')
    .setDescription('Fetch a user profile by wallet address or Zora handle')
    .addStringOption(option => option.setName('identifier')
    .setDescription('The user wallet address or Zora handle')
    .setRequired(true));
// /profilebalances – Fetch a user’s coin balances
const profileBalancesCommand = new discord_js_1.SlashCommandBuilder()
    .setName('profilebalances')
    .setDescription('Fetch coin balances for a user profile')
    .addStringOption(option => option.setName('identifier')
    .setDescription('The user wallet address or Zora handle')
    .setRequired(true));
// /topgainers – Retrieve coins with the highest 24h market cap delta (top gainers)
const topGainersCommand = new discord_js_1.SlashCommandBuilder()
    .setName('topgainers')
    .setDescription('Retrieve coins with the highest 24h market cap delta (top gainers).');
// /topvolume – Retrieve coins with the highest trading volume in the last 24h.
const topVolumeCommand = new discord_js_1.SlashCommandBuilder()
    .setName('topvolume')
    .setDescription('Retrieve coins with the highest trading volume in the last 24h.');
// /mostvaluable – Retrieve coins with the highest market capitalization.
const mostValuableCommand = new discord_js_1.SlashCommandBuilder()
    .setName('mostvaluable')
    .setDescription('Retrieve coins with the highest market capitalization.');
// /newcoins – Retrieve the most recently created coins.
const newCoinsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('newcoins')
    .setDescription('Retrieve the most recently created coins.');
// /lasttraded – Retrieve coins that have been traded most recently.
const lastTradedCommand = new discord_js_1.SlashCommandBuilder()
    .setName('lasttraded')
    .setDescription('Retrieve coins that have been traded most recently.');
// /lasttradedunique – Retrieve coins most recently traded by unique traders.
const lastTradedUniqueCommand = new discord_js_1.SlashCommandBuilder()
    .setName('lasttradedunique')
    .setDescription('Retrieve coins most recently traded by unique traders.');
// /alltopgainers – Paginate through all top gainers and return a summary.
const allTopGainersCommand = new discord_js_1.SlashCommandBuilder()
    .setName('alltopgainers')
    .setDescription('Paginate through all top gaining coins and return a summary.');
// /onchaincoindetails – Fetch detailed on-chain coin information.
const onchainCoinDetailsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('onchaincoindetails')
    .setDescription('Fetch detailed on-chain information for a Zora20 coin')
    .addStringOption(option => option.setName('coin')
    .setDescription('The coin contract address (e.g. 0xCoinContractAddress)')
    .setRequired(true))
    .addStringOption(option => option.setName('user')
    .setDescription('Optional: A user address to fetch the coin balance for')
    .setRequired(false));
// /zora – Send text to Gemini and return the response.
const zoraCommand = new discord_js_1.SlashCommandBuilder()
    .setName('zora')
    .setDescription('Sends your text to Gemini and returns the response.')
    .addStringOption(option => option.setName('text')
    .setDescription('The text you want to send to Gemini.')
    .setRequired(true));
// --- Register All Commands with Discord ---
const rest = new discord_js_1.REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🚀 Registering slash commands...');
        yield rest.put(discord_js_1.Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: [
                coinCommand.toJSON(),
                coinCommentsCommand.toJSON(),
                coinsCommand.toJSON(),
                multiCoinsCommand.toJSON(),
                profileCommand.toJSON(),
                profileBalancesCommand.toJSON(),
                topGainersCommand.toJSON(),
                topVolumeCommand.toJSON(),
                mostValuableCommand.toJSON(),
                newCoinsCommand.toJSON(),
                lastTradedCommand.toJSON(),
                lastTradedUniqueCommand.toJSON(),
                allTopGainersCommand.toJSON(),
                onchainCoinDetailsCommand.toJSON(), // New on-chain coin details command
                zoraCommand.toJSON(), // Register the /zora command
            ],
        });
        console.log('✅ All slash commands registered.');
    }
    catch (error) {
        console.error('Error registering slash commands:', error);
    }
}))();
// --- Utility Function: Paginate All Top Gainers ---
function fetchAllTopGainers() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        let allCoins = [];
        let cursor = undefined;
        const pageSize = 20;
        do {
            const response = yield (0, coins_sdk_1.getCoinsTopGainers)({
                count: pageSize,
                after: cursor,
            });
            const edges = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.exploreList) === null || _b === void 0 ? void 0 : _b.edges;
            if (!edges || edges.length === 0)
                break;
            allCoins = [...allCoins, ...edges.map((edge) => edge.node)];
            cursor = (_e = (_d = (_c = response.data) === null || _c === void 0 ? void 0 : _c.exploreList) === null || _d === void 0 ? void 0 : _d.pageInfo) === null || _e === void 0 ? void 0 : _e.endCursor;
        } while (cursor);
        return allCoins;
    });
}
//
// --- Handle Slash Command Interactions ---
//
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30;
    if (!interaction.isChatInputCommand())
        return;
    // /coin – Fetch single coin details.
    if (interaction.commandName === 'coin') {
        const address = interaction.options.getString('address', true);
        try {
            const response = yield (0, coins_sdk_1.getCoin)({
                address: address.toLowerCase(),
                chain: chains_1.base.id,
            });
            const coin = (_a = response.data) === null || _a === void 0 ? void 0 : _a.zora20Token;
            if (!coin) {
                yield interaction.reply('❌ No coin data found.');
                return;
            }
            console.log("Coin Details:");
            console.log("- Name:", coin.name);
            console.log("- Symbol:", coin.symbol);
            console.log("- Description:", coin.description);
            console.log("- Total Supply:", coin.totalSupply);
            console.log("- Market Cap:", coin.marketCap);
            console.log("- 24h Volume:", coin.volume24h);
            console.log("- Creator:", coin.creatorAddress);
            console.log("- Created At:", coin.createdAt);
            console.log("- Unique Holders:", coin.uniqueHolders);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`${coin.name || 'Unknown'} (${coin.symbol || ''})`)
                .setDescription(coin.description || 'No description provided.')
                .setColor(0xffd700)
                .addFields({ name: 'Total Supply', value: ((_b = coin.totalSupply) === null || _b === void 0 ? void 0 : _b.toString()) || 'N/A', inline: true }, { name: 'Market Cap', value: `$${((_c = coin.marketCap) === null || _c === void 0 ? void 0 : _c.toString()) || 'N/A'}`, inline: true }, { name: '24h Volume', value: `$${((_d = coin.volume24h) === null || _d === void 0 ? void 0 : _d.toString()) || 'N/A'}`, inline: true }, { name: 'Unique Holders', value: ((_e = coin.uniqueHolders) === null || _e === void 0 ? void 0 : _e.toString()) || 'N/A', inline: true });
            if (coin.id) {
                embed.addFields({ name: 'Coin ID', value: coin.id, inline: false });
            }
            if ((_g = (_f = coin.mediaContent) === null || _f === void 0 ? void 0 : _f.previewImage) === null || _g === void 0 ? void 0 : _g.medium) {
                embed.setThumbnail(coin.mediaContent.previewImage.medium);
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching coin info:', error);
            yield interaction.reply('❌ Error fetching coin info.');
        }
    }
    // /coincomments – Fetch coin comments.
    else if (interaction.commandName === 'coincomments') {
        const address = interaction.options.getString('address', true);
        try {
            const response = yield (0, coins_sdk_1.getCoinComments)({
                address: address.toLowerCase(),
                chain: chains_1.base.id,
                count: 5,
            });
            const edges = (_k = (_j = (_h = response.data) === null || _h === void 0 ? void 0 : _h.zora20Token) === null || _j === void 0 ? void 0 : _j.zoraComments) === null || _k === void 0 ? void 0 : _k.edges;
            if (!edges || edges.length === 0) {
                yield interaction.reply('❌ No comments found for this coin.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Coin Comments')
                .setColor(0x00AE86)
                .setDescription(`Showing up to ${edges.length} comments for ${address}`);
            edges.forEach((edge, idx) => {
                var _a, _b, _c, _d, _e;
                const author = ((_b = (_a = edge.node) === null || _a === void 0 ? void 0 : _a.userProfile) === null || _b === void 0 ? void 0 : _b.handle) || ((_c = edge.node) === null || _c === void 0 ? void 0 : _c.userAddress) || 'Unknown';
                const text = ((_d = edge.node) === null || _d === void 0 ? void 0 : _d.comment) || 'No text.';
                embed.addFields({
                    name: `Comment #${idx + 1} by ${author}`,
                    value: `**Comment:** ${text}\n**Timestamp:** ${((_e = edge.node) === null || _e === void 0 ? void 0 : _e.timestamp) || 'N/A'}`,
                });
            });
            if ((_p = (_o = (_m = (_l = response.data) === null || _l === void 0 ? void 0 : _l.zora20Token) === null || _m === void 0 ? void 0 : _m.zoraComments) === null || _o === void 0 ? void 0 : _o.pageInfo) === null || _p === void 0 ? void 0 : _p.endCursor) {
                embed.setFooter({
                    text: `Next page cursor: ${response.data.zora20Token.zoraComments.pageInfo.endCursor}`,
                });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching coin comments:', error);
            yield interaction.reply('❌ Error fetching coin comments.');
        }
    }
    // /coins – List multiple coins using fixed collection addresses.
    else if (interaction.commandName === 'coins') {
        try {
            const response = yield (0, coins_sdk_1.getCoins)({
                coins: [
                    { chainId: chains_1.base.id, collectionAddress: "0xFirstCoinAddress" },
                    { chainId: chains_1.base.id, collectionAddress: "0xSecondCoinAddress" },
                    { chainId: chains_1.base.id, collectionAddress: "0xThirdCoinAddress" },
                ],
            });
            const coins = (_q = response.data) === null || _q === void 0 ? void 0 : _q.zora20Tokens;
            if (!coins || coins.length === 0) {
                yield interaction.reply('❌ No coins found.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('List of Coins')
                .setColor(0x123456)
                .setDescription(`Found ${coins.length} coin(s).`);
            coins.forEach((token, idx) => {
                const line = `${token.name} (${token.symbol}) | Holders: ${token.uniqueHolders} | Market Cap: $${token.marketCap}`;
                embed.addFields({ name: `Coin #${idx + 1}`, value: line });
            });
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching coins:', error);
            yield interaction.reply('❌ Error fetching coins.');
        }
    }
    // /multicoins – Fetch multiple coins using a comma-separated list of collection addresses.
    else if (interaction.commandName === 'multicoins') {
        const addressesInput = interaction.options.getString('addresses', true);
        const addressesArray = addressesInput.split(',').map(addr => addr.trim());
        const coinsArray = addressesArray.map(addr => ({
            chainId: chains_1.base.id,
            collectionAddress: addr,
        }));
        try {
            const response = yield (0, coins_sdk_1.getCoins)({ coins: coinsArray });
            const coins = (_r = response.data) === null || _r === void 0 ? void 0 : _r.zora20Tokens;
            if (!coins || coins.length === 0) {
                yield interaction.reply('❌ No coins found for the provided addresses.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Multiple Coins')
                .setColor(0x0099ff)
                .setDescription(`Workspaceed ${coins.length} coin(s):`);
            coins.forEach((coin, index) => {
                embed.addFields({
                    name: `Coin ${index + 1}: ${coin.name} (${coin.symbol})`,
                    value: `Market Cap: ${coin.marketCap}\n24h Volume: ${coin.volume24h}\nHolders: ${coin.uniqueHolders}`,
                    inline: false,
                });
            });
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching multiple coins:', error);
            yield interaction.reply('❌ Error fetching multiple coins.');
        }
    }
    // /profile – Fetch a user profile.
    else if (interaction.commandName === 'profile') {
        const identifier = interaction.options.getString('identifier', true);
        try {
            const response = yield (0, coins_sdk_1.getProfile)({ identifier });
            const profile = (_s = response === null || response === void 0 ? void 0 : response.data) === null || _s === void 0 ? void 0 : _s.profile;
            if (!profile) {
                yield interaction.reply('❌ Profile not found or not set up.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(profile.handle || profile.address || 'Unknown Profile')
                .setColor(0xff9900)
                .addFields({ name: 'Display Name', value: profile.displayName || 'N/A', inline: true }, { name: 'Bio', value: profile.bio || 'N/A', inline: false });
            if ((_t = profile.avatar) === null || _t === void 0 ? void 0 : _t.medium) {
                embed.setThumbnail(profile.avatar.medium);
            }
            if (profile.linkedWallets && profile.linkedWallets.length > 0) {
                let linked = '';
                profile.linkedWallets.forEach((link) => {
                    linked += `• ${link.type || 'Unknown'}: ${link.url || 'N/A'}\n`;
                });
                embed.addFields({ name: 'Linked Wallets', value: linked });
            }
            if (profile.followerCount !== undefined && profile.followingCount !== undefined) {
                embed.addFields({ name: 'Followers', value: profile.followerCount.toString(), inline: true }, { name: 'Following', value: profile.followingCount.toString(), inline: true });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching profile:', error);
            yield interaction.reply('❌ Error fetching profile.');
        }
    }
    // /profilebalances – Fetch a user's coin balances.
    else if (interaction.commandName === 'profilebalances') {
        const identifier = interaction.options.getString('identifier', true);
        try {
            const response = yield (0, coins_sdk_1.getProfileBalances)({
                identifier,
                count: 20,
                after: undefined,
            });
            const profile = (_u = response.data) === null || _u === void 0 ? void 0 : _u.profile;
            if (!profile) {
                yield interaction.reply('❌ No profile data found.');
                return;
            }
            const edges = (_v = profile.coinBalances) === null || _v === void 0 ? void 0 : _v.edges;
            const totalBalances = (edges === null || edges === void 0 ? void 0 : edges.length) || 0;
            if (totalBalances === 0) {
                yield interaction.reply('❌ No coin balances found for this profile.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Coin Balances for ${identifier}`)
                .setColor(0x66ccff)
                .setDescription(`Found ${totalBalances} coin balance(s).`);
            edges.forEach((edge, idx) => {
                var _a, _b, _c;
                const balance = edge.node;
                const token = balance.token;
                const amountRaw = ((_a = balance.amount) === null || _a === void 0 ? void 0 : _a.amountRaw) || 'N/A';
                const amountDecimal = ((_c = (_b = balance.amount) === null || _b === void 0 ? void 0 : _b.amountDecimal) === null || _c === void 0 ? void 0 : _c.toString()) || 'N/A';
                const valueUsd = balance.valueUsd ? `$${balance.valueUsd}` : 'N/A';
                embed.addFields({
                    name: `Balance #${idx + 1}: ${(token === null || token === void 0 ? void 0 : token.name) || 'Unknown'} (${(token === null || token === void 0 ? void 0 : token.symbol) || 'NA'})`,
                    value: `**Amount Raw:** ${amountRaw}\n**Amount Decimal:** ${amountDecimal}\n**Value (USD):** ${valueUsd}`,
                });
            });
            if ((_x = (_w = profile.coinBalances) === null || _w === void 0 ? void 0 : _w.pageInfo) === null || _x === void 0 ? void 0 : _x.endCursor) {
                embed.setFooter({ text: `Next page cursor: ${profile.coinBalances.pageInfo.endCursor}` });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching profile balances:', error);
            yield interaction.reply('❌ Error fetching profile balances.');
        }
    }
    // /topgainers – Coins with highest 24h market cap delta.
    else if (interaction.commandName === 'topgainers') {
        try {
            const response = yield (0, coins_sdk_1.getCoinsTopGainers)({ count: 10, after: undefined });
            const tokens = (_0 = (_z = (_y = response.data) === null || _y === void 0 ? void 0 : _y.exploreList) === null || _z === void 0 ? void 0 : _z.edges) === null || _0 === void 0 ? void 0 : _0.map((edge) => edge.node);
            if (!tokens || tokens.length === 0) {
                yield interaction.reply('❌ No top gainers found.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Top Gainers (${tokens.length} coins)`)
                .setColor(0x00ff00);
            tokens.forEach((coin, idx) => {
                const percentChange = coin.marketCapDelta24h
                    ? `${parseFloat(coin.marketCapDelta24h).toFixed(2)}%`
                    : 'N/A';
                embed.addFields({
                    name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
                    value: `24h Change: ${percentChange}\nMarket Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}`,
                });
            });
            if ((_3 = (_2 = (_1 = response.data) === null || _1 === void 0 ? void 0 : _1.exploreList) === null || _2 === void 0 ? void 0 : _2.pageInfo) === null || _3 === void 0 ? void 0 : _3.endCursor) {
                embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching top gainers:', error);
            yield interaction.reply('❌ Error fetching top gainers.');
        }
    }
    // /topvolume – Coins with highest 24h volume.
    else if (interaction.commandName === 'topvolume') {
        try {
            const response = yield (0, coins_sdk_1.getCoinsTopVolume24h)({ count: 10, after: undefined });
            const tokens = (_6 = (_5 = (_4 = response.data) === null || _4 === void 0 ? void 0 : _4.exploreList) === null || _5 === void 0 ? void 0 : _5.edges) === null || _6 === void 0 ? void 0 : _6.map((edge) => edge.node);
            if (!tokens || tokens.length === 0) {
                yield interaction.reply('❌ No top volume coins found.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Top Volume Coins (${tokens.length} coins)`)
                .setColor(0x0000ff);
            tokens.forEach((coin, idx) => {
                embed.addFields({
                    name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
                    value: `Volume 24h: ${coin.volume24h}\nMarket Cap: ${coin.marketCap}\nHolders: ${coin.uniqueHolders}`,
                });
            });
            if ((_9 = (_8 = (_7 = response.data) === null || _7 === void 0 ? void 0 : _7.exploreList) === null || _8 === void 0 ? void 0 : _8.pageInfo) === null || _9 === void 0 ? void 0 : _9.endCursor) {
                embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching top volume coins:', error);
            yield interaction.reply('❌ Error fetching top volume coins.');
        }
    }
    // /mostvaluable – Coins with highest market cap.
    else if (interaction.commandName === 'mostvaluable') {
        try {
            const response = yield (0, coins_sdk_1.getCoinsMostValuable)({ count: 10, after: undefined });
            const coins = (_11 = (_10 = response.data) === null || _10 === void 0 ? void 0 : _10.exploreList) === null || _11 === void 0 ? void 0 : _11.edges;
            if (!coins || coins.length === 0) {
                yield interaction.reply('❌ No most valuable coins found.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Most Valuable Coins (${coins.length} coins)`)
                .setColor(0xffaa00);
            coins.forEach((edge, idx) => {
                const coin = edge.node;
                embed.addFields({
                    name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
                    value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}\nCreated: ${coin.createdAt}`,
                });
            });
            if ((_14 = (_13 = (_12 = response.data) === null || _12 === void 0 ? void 0 : _12.exploreList) === null || _13 === void 0 ? void 0 : _13.pageInfo) === null || _14 === void 0 ? void 0 : _14.endCursor) {
                embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching most valuable coins:', error);
            yield interaction.reply('❌ Error fetching most valuable coins.');
        }
    }
    // /newcoins – Most recently created coins.
    else if (interaction.commandName === 'newcoins') {
        try {
            const response = yield (0, coins_sdk_1.getCoinsNew)({ count: 10, after: undefined });
            const coins = (_16 = (_15 = response.data) === null || _15 === void 0 ? void 0 : _15.exploreList) === null || _16 === void 0 ? void 0 : _16.edges;
            if (!coins || coins.length === 0) {
                yield interaction.reply('❌ No new coins found.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`New Coins (${coins.length} coins)`)
                .setColor(0xabcdef);
            coins.forEach((edge, idx) => {
                const coin = edge.node;
                const creationDate = new Date(coin.createdAt || '');
                const formattedDate = creationDate.toLocaleString();
                embed.addFields({
                    name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
                    value: `Created: ${formattedDate}\nCreator: ${coin.creatorAddress}\nMarket Cap: ${coin.marketCap}`,
                });
            });
            if ((_19 = (_18 = (_17 = response.data) === null || _17 === void 0 ? void 0 : _17.exploreList) === null || _18 === void 0 ? void 0 : _18.pageInfo) === null || _19 === void 0 ? void 0 : _19.endCursor) {
                embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching new coins:', error);
            yield interaction.reply('❌ Error fetching new coins.');
        }
    }
    // /lasttraded – Coins traded most recently.
    else if (interaction.commandName === 'lasttraded') {
        try {
            const response = yield (0, coins_sdk_1.getCoinsLastTraded)({ count: 10, after: undefined });
            const coins = (_21 = (_20 = response.data) === null || _20 === void 0 ? void 0 : _20.exploreList) === null || _21 === void 0 ? void 0 : _21.edges;
            if (!coins || coins.length === 0) {
                yield interaction.reply('❌ No recently traded coins found.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Recently Traded Coins (${coins.length} coins)`)
                .setColor(0x00ffff);
            coins.forEach((edge, idx) => {
                const coin = edge.node;
                embed.addFields({
                    name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
                    value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}`,
                });
            });
            if ((_24 = (_23 = (_22 = response.data) === null || _22 === void 0 ? void 0 : _22.exploreList) === null || _23 === void 0 ? void 0 : _23.pageInfo) === null || _24 === void 0 ? void 0 : _24.endCursor) {
                embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching last traded coins:', error);
            yield interaction.reply('Error fetching last traded coins.');
        }
    }
    // /lasttradedunique – Coins traded most recently by unique traders.
    else if (interaction.commandName === 'lasttradedunique') {
        try {
            const response = yield (0, coins_sdk_1.getCoinsLastTradedUnique)({ count: 10, after: undefined });
            const coins = (_26 = (_25 = response.data) === null || _25 === void 0 ? void 0 : _25.exploreList) === null || _26 === void 0 ? void 0 : _26.edges;
            if (!coins || coins.length === 0) {
                yield interaction.reply('No recently traded unique coins found.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`Recently Traded by Unique Traders (${coins.length} coins)`)
                .setColor(0xff00ff);
            coins.forEach((edge, idx) => {
                const coin = edge.node;
                embed.addFields({
                    name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
                    value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}\nUnique Holders: ${coin.uniqueHolders}`,
                });
            });
            if ((_29 = (_28 = (_27 = response.data) === null || _27 === void 0 ? void 0 : _27.exploreList) === null || _28 === void 0 ? void 0 : _28.pageInfo) === null || _29 === void 0 ? void 0 : _29.endCursor) {
                embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching last traded unique coins:', error);
            yield interaction.reply('Error fetching last traded unique coins.');
        }
    }
    // /alltopgainers – Paginate through all top gainers and return a summary.
    else if (interaction.commandName === 'alltopgainers') {
        try {
            const allCoins = yield fetchAllTopGainers();
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('All Top Gainers')
                .setColor(0x00ff00)
                .setDescription(`Workspaceed ${allCoins.length} total top gaining coins.`);
            const topFive = allCoins.slice(0, 5);
            topFive.forEach((coin, idx) => {
                embed.addFields({
                    name: `#${idx + 1}: ${coin.name} (${coin.symbol})`,
                    value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}`,
                    inline: false,
                });
            });
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching all top gainers:', error);
            yield interaction.reply('Error fetching all top gainers.');
        }
    }
    // /onchaincoindetails – Fetch detailed on-chain coin information.
    else if (interaction.commandName === 'onchaincoindetails') {
        const coinAddress = interaction.options.getString('coin', true);
        const userAddress = interaction.options.getString('user', false) || undefined;
        try {
            const details = yield (0, coins_sdk_1.getOnchainCoinDetails)({
                coin: coinAddress,
                user: userAddress ? userAddress : undefined,
                publicClient,
            }); // Type assertion to 'any' to access expected properties
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`On-Chain Details for ${details.name} (${details.symbol})`)
                .setDescription(`Address: ${details.address}`)
                .setColor(0x1a82e2)
                .addFields({ name: 'Total Supply', value: details.totalSupply.toString(), inline: true }, { name: 'Market Cap', value: details.marketCap.toString(), inline: true }, { name: 'Liquidity', value: details.liquidity.toString(), inline: true }, { name: 'Pool Address', value: details.pool, inline: false }, { name: 'Payout Recipient', value: details.payoutRecipient, inline: false }, { name: 'Owners', value: details.owners.join(', ') || 'N/A', inline: false });
            if (userAddress && details.balance !== undefined) {
                embed.addFields({
                    name: 'User Balance',
                    value: details.balance.toString(),
                    inline: true,
                });
            }
            yield interaction.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error('Error fetching on-chain coin details:', error);
            yield interaction.reply('Error fetching on-chain coin details.');
        }
    }
    // /zora - Send text to Gemini
    else if (interaction.commandName === 'zora') {
        if (!geminiModel) {
            yield interaction.reply('❌ Gemini functionality is not enabled. Please check the API key.');
            return;
        }
        const inputText = interaction.options.getString('text', true);
        const conciseInstruction = " Please explain this concisely in under 300 words.";
        const fullPrompt = inputText + conciseInstruction;
        try {
            yield interaction.deferReply(); // Acknowledge the command immediately
            const result = yield geminiModel.generateContent(fullPrompt);
            const responseText = (_30 = result.response) === null || _30 === void 0 ? void 0 : _30.text();
            if (responseText) {
                const maxChars = 2000; // Keeping a character limit as a final fallback
                if (responseText.length <= maxChars) {
                    yield interaction.editReply(responseText);
                }
                else {
                    let truncatedResponse = responseText.substring(0, maxChars);
                    const lastSentenceEnd = Math.max(truncatedResponse.lastIndexOf('.'), truncatedResponse.lastIndexOf('?'), truncatedResponse.lastIndexOf('!'));
                    if (lastSentenceEnd > 0) {
                        truncatedResponse = responseText.substring(0, lastSentenceEnd + 1) + '...';
                    }
                    else {
                        // If no sentence end found, or it's too early in the string, just truncate with ellipsis
                        truncatedResponse = responseText.substring(0, maxChars - 3) + '...';
                    }
                    yield interaction.editReply(truncatedResponse);
                }
            }
            else {
                yield interaction.editReply('Gemini did not return a response.');
            }
        }
        catch (error) {
            console.error('Error communicating with Gemini:', error);
            yield interaction.editReply('❌ An error occurred while processing your request with Gemini.');
        }
    }
}));
//
// --- Start the Bot ---
//
client.once('ready', () => {
    var _a;
    console.log(`✅ Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
});
client.login(DISCORD_BOT_TOKEN);
