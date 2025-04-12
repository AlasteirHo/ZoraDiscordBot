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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: 'api.env' });
const discord_js_1 = require("discord.js");
const axios_1 = __importDefault(require("axios"));
const coins_sdk_1 = require("@zoralabs/coins-sdk");
const chains_1 = require("viem/chains");
const viem_1 = require("viem");
// ----------------------------------------------------
// Credentials and Configuration from Environment Variables
// ----------------------------------------------------
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const RPC_URL = process.env.RPC_URL;
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.base,
    transport: (0, viem_1.http)(RPC_URL),
});
// ----------------------------------------------------
// Gemini AI Integration Settings from Environment Variables
// ----------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = process.env.GEMINI_API_URL;
/**
 * Calls the Gemini AI API with the given prompt and returns its response.
 */
function getGeminiResponse(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(GEMINI_API_URL, {
                model: "gemini-1", // Update as needed per Gemini docs.
                prompt: prompt,
                temperature: 0.7,
                max_tokens: 150,
            }, {
                headers: {
                    "Authorization": `Bearer ${GEMINI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            });
            // Adjust this line based on the actual API response structure.
            return response.data.choices[0].text;
        }
        catch (error) {
            console.error("Error calling Gemini AI API:", error);
            throw new Error("Failed to fetch Gemini AI response");
        }
    });
}
// ----------------------------------------------------
// Create Discord Client
// ----------------------------------------------------
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
// ----------------------------------------------------
// Define Slash Commands
// ----------------------------------------------------
const coinCommand = new discord_js_1.SlashCommandBuilder()
    .setName('coin')
    .setDescription('Fetch details for a single Zora20 coin by address')
    .addStringOption(option => option.setName('address')
    .setDescription('The Zora20 token address (e.g. 0x445e9c0a296068dc4257767b5ed354b77cf513de)')
    .setRequired(true));
const coinCommentsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('coincomments')
    .setDescription('Fetch community comments for a Zora20 coin by address')
    .addStringOption(option => option.setName('address')
    .setDescription('The Zora20 token address')
    .setRequired(true));
const coinsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('coins')
    .setDescription('List multiple Zora20 coins (using fixed collection addresses)');
const multiCoinsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('multicoins')
    .setDescription('Fetch details for multiple coins using collection addresses (comma-separated)')
    .addStringOption(option => option.setName('addresses')
    .setDescription('Enter coin contract addresses separated by commas, e.g. 0xFirst,0xSecond,0xThird')
    .setRequired(true));
const profileCommand = new discord_js_1.SlashCommandBuilder()
    .setName('profile')
    .setDescription('Fetch a user profile by wallet address or Zora handle')
    .addStringOption(option => option.setName('identifier')
    .setDescription('The user wallet address or Zora handle')
    .setRequired(true));
const profileBalancesCommand = new discord_js_1.SlashCommandBuilder()
    .setName('profilebalances')
    .setDescription('Fetch coin balances for a user profile')
    .addStringOption(option => option.setName('identifier')
    .setDescription('The user wallet address or Zora handle')
    .setRequired(true));
const topGainersCommand = new discord_js_1.SlashCommandBuilder()
    .setName('topgainers')
    .setDescription('Retrieve coins with the highest 24h market cap delta (top gainers).');
const topVolumeCommand = new discord_js_1.SlashCommandBuilder()
    .setName('topvolume')
    .setDescription('Retrieve coins with the highest trading volume in the last 24h.');
const mostValuableCommand = new discord_js_1.SlashCommandBuilder()
    .setName('mostvaluable')
    .setDescription('Retrieve coins with the highest market capitalization.');
const newCoinsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('newcoins')
    .setDescription('Retrieve the most recently created coins.');
const lastTradedCommand = new discord_js_1.SlashCommandBuilder()
    .setName('lasttraded')
    .setDescription('Retrieve coins that have been traded most recently.');
const lastTradedUniqueCommand = new discord_js_1.SlashCommandBuilder()
    .setName('lasttradedunique')
    .setDescription('Retrieve coins most recently traded by unique traders.');
const allTopGainersCommand = new discord_js_1.SlashCommandBuilder()
    .setName('alltopgainers')
    .setDescription('Paginate through all top gaining coins and return a summary.');
const onchainCoinDetailsCommand = new discord_js_1.SlashCommandBuilder()
    .setName('onchaincoindetails')
    .setDescription('Fetch detailed on-chain information for a Zora20 coin')
    .addStringOption(option => option.setName('coin')
    .setDescription('The coin contract address (e.g. 0xCoinContractAddress)')
    .setRequired(true))
    .addStringOption(option => option.setName('user')
    .setDescription('Optional: A user address to fetch the coin balance for')
    .setRequired(false));
// New /zora Command
const zoraCommand = new discord_js_1.SlashCommandBuilder()
    .setName('zora')
    .setDescription("Process a natural language prompt to retrieve coin info. Example: 'get me the information of coin 0xABC...'")
    .addStringOption(option => option.setName('prompt')
    .setDescription("Enter your prompt (e.g. 'get me the information of coin 0xYourCoinAddress')")
    .setRequired(true));
// ----------------------------------------------------
// Register Slash Commands with Discord
// ----------------------------------------------------
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
                onchainCoinDetailsCommand.toJSON(),
                zoraCommand.toJSON(),
            ],
        });
        console.log('✅ All slash commands registered.');
    }
    catch (error) {
        console.error('Error registering slash commands:', error);
    }
}))();
// ----------------------------------------------------
// Utility Function: Paginate All Top Gainers
// ----------------------------------------------------
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
// ----------------------------------------------------
// Handle Slash Command Interactions
// ----------------------------------------------------
client.on('interactionCreate', (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    if (!interaction.isChatInputCommand())
        return;
    // /coin Command Handler
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
    // /onchaincoindetails Command Handler
    else if (interaction.commandName === 'onchaincoindetails') {
        const coinAddress = interaction.options.getString('coin', true);
        const userAddress = interaction.options.getString('user', false) || undefined;
        try {
            const details = yield (0, coins_sdk_1.getOnchainCoinDetails)({
                coin: coinAddress,
                user: userAddress ? userAddress : undefined,
                publicClient,
            });
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
            yield interaction.reply('❌ Error fetching on-chain coin details.');
        }
    }
    // /zora Command Handler: Using OpenAI ChatGPT API (or Gemini AI if preferred)
    else if (interaction.commandName === 'zora') {
        const prompt = interaction.options.getString('prompt', true);
        // Expecting a prompt like: "get me the information of coin <address>"
        const regex = /get me the information of coin\s+(\S+)/i;
        const match = prompt.match(regex);
        if (match && match[1]) {
            const coinAddress = match[1];
            try {
                const response = yield (0, coins_sdk_1.getCoin)({
                    address: coinAddress.toLowerCase(),
                    chain: chains_1.base.id,
                });
                const coin = (_h = response.data) === null || _h === void 0 ? void 0 : _h.zora20Token;
                if (!coin) {
                    yield interaction.reply('❌ No coin data found for that address.');
                    return;
                }
                // Optionally, create a refined prompt for Gemini AI
                const aiPrompt = `Provide additional insights on the coin with address ${coinAddress}: ${coin.description || ''}`;
                let geminiInsights = "";
                try {
                    geminiInsights = yield getGeminiResponse(aiPrompt);
                }
                catch (aiError) {
                    console.error("Error retrieving Gemini AI insights:", aiError);
                    // Continue without insights if Gemini request fails.
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle(`${coin.name || 'Unknown'} (${coin.symbol || ''})`)
                    .setDescription(coin.description || 'No description provided.')
                    .setColor(0xffd700)
                    .addFields({ name: 'Total Supply', value: ((_j = coin.totalSupply) === null || _j === void 0 ? void 0 : _j.toString()) || 'N/A', inline: true }, { name: 'Market Cap', value: `$${((_k = coin.marketCap) === null || _k === void 0 ? void 0 : _k.toString()) || 'N/A'}`, inline: true }, { name: '24h Volume', value: `$${((_l = coin.volume24h) === null || _l === void 0 ? void 0 : _l.toString()) || 'N/A'}`, inline: true }, { name: 'Unique Holders', value: ((_m = coin.uniqueHolders) === null || _m === void 0 ? void 0 : _m.toString()) || 'N/A', inline: true });
                if (coin.id) {
                    embed.addFields({ name: 'Coin ID', value: coin.id, inline: false });
                }
                if ((_p = (_o = coin.mediaContent) === null || _o === void 0 ? void 0 : _o.previewImage) === null || _p === void 0 ? void 0 : _p.medium) {
                    embed.setThumbnail(coin.mediaContent.previewImage.medium);
                }
                if (geminiInsights) {
                    embed.addFields({ name: 'Gemini AI Insights', value: geminiInsights });
                }
                yield interaction.reply({ embeds: [embed] });
            }
            catch (error) {
                console.error("Error processing /zora command:", error);
                yield interaction.reply('❌ Error retrieving coin information.');
            }
        }
        else {
            yield interaction.reply("❌ Invalid prompt format. Please use: 'get me the information of coin <address>'");
        }
    }
}));
// ----------------------------------------------------
// Start the Bot
// ----------------------------------------------------
client.once('ready', () => {
    var _a;
    console.log(`✅ Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
});
client.login(DISCORD_BOT_TOKEN);
