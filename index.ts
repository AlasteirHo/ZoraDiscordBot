import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  Interaction
} from 'discord.js';

import {
  getCoin,
  getCoinComments,
  getCoins,
  getProfile,
  getProfileBalances,
  getCoinsTopGainers,
  getCoinsTopVolume24h,
  getCoinsMostValuable,
  getCoinsNew,
  getCoinsLastTraded,
  getCoinsLastTradedUnique,
  getOnchainCoinDetails
} from '@zoralabs/coins-sdk';

import { base } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, 'api.env') });

// Replace with your actual credentials
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "YOUR_DISCORD_BOT_TOKEN_HERE";
const CLIENT_ID = process.env.CLIENT_ID || "YOUR_CLIENT_ID_HERE"; // Found in the Developer Portal
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('Gemini API key not found in .env file. Gemini functionality will be disabled.');
}

// Create a new Discord client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Set up viem public client for on-chain queries
const publicClient = createPublicClient({
  chain: base,
  transport: http("<RPC_URL>"), // Replace <RPC_URL> with a valid RPC endpoint
});

// Initialize Gemini API if the key is available
let genAI: GoogleGenerativeAI | null = null;
let geminiModel: any = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

// /coin – Fetch a single coin's details and log all properties.
const coinCommand = new SlashCommandBuilder()
  .setName('coin')
  .setDescription('Fetch details for a single Zora20 coin by address')
  .addStringOption(option =>
    option.setName('address')
      .setDescription('The Zora20 token address (e.g. 0x445e9c0a296068dc4257767b5ed354b77cf513de)')
      .setRequired(true)
  );

// /coincomments – Fetch coin comments
const coinCommentsCommand = new SlashCommandBuilder()
  .setName('coincomments')
  .setDescription('Fetch community comments for a Zora20 coin by address')
  .addStringOption(option =>
    option.setName('address')
      .setDescription('The Zora20 token address')
      .setRequired(true)
  );

// /coins – List multiple coins using specific coins (example with fixed addresses)
const coinsCommand = new SlashCommandBuilder()
  .setName('coins')
  .setDescription('List multiple Zora20 coins (using fixed collection addresses)');

// /multicoins – Fetch multiple coins using collection addresses (comma-separated input)
const multiCoinsCommand = new SlashCommandBuilder()
  .setName('multicoins')
  .setDescription('Fetch details for multiple coins using collection addresses (comma-separated)')
  .addStringOption(option =>
    option.setName('addresses')
      .setDescription('Enter coin contract addresses separated by commas, e.g. 0xFirst,0xSecond,0xThird')
      .setRequired(true)
  );

// /profile – Fetch a user profile by wallet address or Zora handle
const profileCommand = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Fetch a user profile by wallet address or Zora handle')
  .addStringOption(option =>
    option.setName('identifier')
      .setDescription('The user wallet address or Zora handle')
      .setRequired(true)
  );

// /profilebalances – Fetch a user’s coin balances
const profileBalancesCommand = new SlashCommandBuilder()
  .setName('profilebalances')
  .setDescription('Fetch coin balances for a user profile')
  .addStringOption(option =>
    option.setName('identifier')
      .setDescription('The user wallet address or Zora handle')
      .setRequired(true)
  );

// /topgainers – Retrieve coins with the highest 24h market cap delta (top gainers)
const topGainersCommand = new SlashCommandBuilder()
  .setName('topgainers')
  .setDescription('Retrieve coins with the highest 24h market cap delta (top gainers).');

// /topvolume – Retrieve coins with the highest trading volume in the last 24h.
const topVolumeCommand = new SlashCommandBuilder()
  .setName('topvolume')
  .setDescription('Retrieve coins with the highest trading volume in the last 24h.');

// /mostvaluable – Retrieve coins with the highest market capitalization.
const mostValuableCommand = new SlashCommandBuilder()
  .setName('mostvaluable')
  .setDescription('Retrieve coins with the highest market capitalization.');

// /newcoins – Retrieve the most recently created coins.
const newCoinsCommand = new SlashCommandBuilder()
  .setName('newcoins')
  .setDescription('Retrieve the most recently created coins.');

// /lasttraded – Retrieve coins that have been traded most recently.
const lastTradedCommand = new SlashCommandBuilder()
  .setName('lasttraded')
  .setDescription('Retrieve coins that have been traded most recently.');

// /lasttradedunique – Retrieve coins most recently traded by unique traders.
const lastTradedUniqueCommand = new SlashCommandBuilder()
  .setName('lasttradedunique')
  .setDescription('Retrieve coins most recently traded by unique traders.');

// /alltopgainers – Paginate through all top gainers and return a summary.
const allTopGainersCommand = new SlashCommandBuilder()
  .setName('alltopgainers')
  .setDescription('Paginate through all top gaining coins and return a summary.');

// /onchaincoindetails – Fetch detailed on-chain coin information.
const onchainCoinDetailsCommand = new SlashCommandBuilder()
  .setName('onchaincoindetails')
  .setDescription('Fetch detailed on-chain information for a Zora20 coin')
  .addStringOption(option =>
    option.setName('coin')
      .setDescription('The coin contract address (e.g. 0xCoinContractAddress)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('user')
      .setDescription('Optional: A user address to fetch the coin balance for')
      .setRequired(false)
  );

// /zora – Send text to Gemini and return the response.
const zoraCommand = new SlashCommandBuilder()
  .setName('zora')
  .setDescription('Sends your text to Gemini and returns the response.')
  .addStringOption(option =>
    option.setName('text')
      .setDescription('The text you want to send to Gemini.')
      .setRequired(true)
  );

// --- Register All Commands with Discord ---
const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
(async () => {
  try {
    console.log('🚀 Registering global slash commands...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID), // Changed to applicationCommands
      {
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
      }
    );
    console.log('✅ All global slash commands registered.');
  } catch (error) {
    console.error('Error registering global slash commands:', error);
  }
})();

// --- Utility Function: Paginate All Top Gainers ---
async function fetchAllTopGainers(): Promise<any[]> {
  let allCoins: any[] = [];
  let cursor: string | undefined = undefined;
  const pageSize = 20;
  do {
    const response = await getCoinsTopGainers({
      count: pageSize,
      after: cursor,
    });
    const edges = response.data?.exploreList?.edges;
    if (!edges || edges.length === 0) break;
    allCoins = [...allCoins, ...edges.map((edge: any) => edge.node)];
    cursor = response.data?.exploreList?.pageInfo?.endCursor;
  } while (cursor);
  return allCoins;
}

//
// --- Handle Slash Command Interactions ---
//
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // /coin – Fetch single coin details.
  if (interaction.commandName === 'coin') {
    const address = interaction.options.getString('address', true);
    try {
      const response = await getCoin({
        address: address.toLowerCase(),
        chain: base.id,
      });
      const coin = response.data?.zora20Token;
      if (!coin) {
        await interaction.reply('❌ No coin data found.');
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

      const embed = new EmbedBuilder()
        .setTitle(`${coin.name || 'Unknown'} (${coin.symbol || ''})`)
        .setDescription(coin.description || 'No description provided.')
        .setColor(0xffd700)
        .addFields(
          { name: 'Total Supply', value: coin.totalSupply?.toString() || 'N/A', inline: true },
          { name: 'Market Cap', value: `$${coin.marketCap?.toString() || 'N/A'}`, inline: true },
          { name: '24h Volume', value: `$${coin.volume24h?.toString() || 'N/A'}`, inline: true },
          { name: 'Unique Holders', value: coin.uniqueHolders?.toString() || 'N/A', inline: true },
        );
      if (coin.id) {
        embed.addFields({ name: 'Coin ID', value: coin.id, inline: false });
      }
      if (coin.mediaContent?.previewImage?.medium) {
        embed.setThumbnail(coin.mediaContent.previewImage.medium);
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching coin info:', error);
      await interaction.reply('❌ Error fetching coin info.');
    }
  }

  // /coincomments – Fetch coin comments.
  else if (interaction.commandName === 'coincomments') {
    const address = interaction.options.getString('address', true);
    try {
      const response = await getCoinComments({
        address: address.toLowerCase(),
        chain: base.id,
        count: 5,
      });
      const edges = response.data?.zora20Token?.zoraComments?.edges;
      if (!edges || edges.length === 0) {
        await interaction.reply('❌ No comments found for this coin.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle('Coin Comments')
        .setColor(0x00AE86)
        .setDescription(`Showing up to ${edges.length} comments for ${address}`);
      edges.forEach((edge: any, idx: number) => {
        const author = edge.node?.userProfile?.handle || edge.node?.userAddress || 'Unknown';
        const text = edge.node?.comment || 'No text.';
        embed.addFields({
          name: `Comment #${idx + 1} by ${author}`,
          value: `**Comment:** ${text}\n**Timestamp:** ${edge.node?.timestamp || 'N/A'}`,
        });
      });
      if (response.data?.zora20Token?.zoraComments?.pageInfo?.endCursor) {
        embed.setFooter({
          text: `Next page cursor: ${response.data.zora20Token.zoraComments.pageInfo.endCursor}`,
        });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching coin comments:', error);
      await interaction.reply('❌ Error fetching coin comments.');
    }
  }

  // /coins – List multiple coins using fixed collection addresses.
  else if (interaction.commandName === 'coins') {
    try {
      const response = await getCoins({
        coins: [
          { chainId: base.id, collectionAddress: "0xFirstCoinAddress" },
          { chainId: base.id, collectionAddress: "0xSecondCoinAddress" },
          { chainId: base.id, collectionAddress: "0xThirdCoinAddress" },
        ],
      });
      const coins = response.data?.zora20Tokens;
      if (!coins || coins.length === 0) {
        await interaction.reply('❌ No coins found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle('List of Coins')
        .setColor(0x123456)
        .setDescription(`Found ${coins.length} coin(s).`);
      coins.forEach((token: any, idx: number) => {
        const line = `${token.name} (${token.symbol}) | Holders: ${token.uniqueHolders} | Market Cap: $${token.marketCap}`;
        embed.addFields({ name: `Coin #${idx + 1}`, value: line });
      });
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching coins:', error);
      await interaction.reply('❌ Error fetching coins.');
    }
  }

  // /multicoins – Fetch multiple coins using a comma-separated list of collection addresses.
  else if (interaction.commandName === 'multicoins') {
    const addressesInput = interaction.options.getString('addresses', true);
    const addressesArray = addressesInput.split(',').map(addr => addr.trim());
    const coinsArray = addressesArray.map(addr => ({
      chainId: base.id,
      collectionAddress: addr,
    }));
    try {
      const response = await getCoins({ coins: coinsArray });
      const coins = response.data?.zora20Tokens;
      if (!coins || coins.length === 0) {
        await interaction.reply('❌ No coins found for the provided addresses.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle('Multiple Coins')
        .setColor(0x0099ff)
        .setDescription(`Workspaceed ${coins.length} coin(s):`);
      coins.forEach((coin: any, index: number) => {
        embed.addFields({
          name: `Coin ${index + 1}: ${coin.name} (${coin.symbol})`,
          value: `Market Cap: ${coin.marketCap}\n24h Volume: ${coin.volume24h}\nHolders: ${coin.uniqueHolders}`,
          inline: false,
        });
      });
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching multiple coins:', error);
      await interaction.reply('❌ Error fetching multiple coins.');
    }
  }

  // /profile – Fetch a user profile.
  else if (interaction.commandName === 'profile') {
    const identifier = interaction.options.getString('identifier', true);
    try {
      const response = await getProfile({ identifier });
      const profile: any = response?.data?.profile;
      if (!profile) {
        await interaction.reply('❌ Profile not found or not set up.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(profile.handle || profile.address || 'Unknown Profile')
        .setColor(0xff9900)
        .addFields(
          { name: 'Display Name', value: profile.displayName || 'N/A', inline: true },
          { name: 'Bio', value: profile.bio || 'N/A', inline: false }
        );
      if (profile.avatar?.medium) {
        embed.setThumbnail(profile.avatar.medium);
      }
      if (profile.linkedWallets && profile.linkedWallets.length > 0) {
        let linked = '';
        profile.linkedWallets.forEach((link: any) => {
          linked += `• ${link.type || 'Unknown'}: ${link.url || 'N/A'}\n`;
        });
        embed.addFields({ name: 'Linked Wallets', value: linked });
      }
      if (profile.followerCount !== undefined && profile.followingCount !== undefined) {
        embed.addFields(
          { name: 'Followers', value: profile.followerCount.toString(), inline: true },
          { name: 'Following', value: profile.followingCount.toString(), inline: true }
        );
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching profile:', error);
      await interaction.reply('❌ Error fetching profile.');
    }
  }

  // /profilebalances – Fetch a user's coin balances.
  else if (interaction.commandName === 'profilebalances') {
    const identifier = interaction.options.getString('identifier', true);
    try {
      const response = await getProfileBalances({
        identifier,
        count: 20,
        after: undefined,
      });
      const profile: any = response.data?.profile;
      if (!profile) {
        await interaction.reply('❌ No profile data found.');
        return;
      }
      const edges = profile.coinBalances?.edges;
      const totalBalances = edges?.length || 0;
      if (totalBalances === 0) {
        await interaction.reply('❌ No coin balances found for this profile.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Coin Balances for ${identifier}`)
        .setColor(0x66ccff)
        .setDescription(`Found ${totalBalances} coin balance(s).`);
      edges.forEach((edge: any, idx: number) => {
        const balance = edge.node;
        const token = balance.token;
        const amountRaw = balance.amount?.amountRaw || 'N/A';
        const amountDecimal = balance.amount?.amountDecimal?.toString() || 'N/A';
        const valueUsd = balance.valueUsd ? `$${balance.valueUsd}` : 'N/A';
        embed.addFields({
          name: `Balance #${idx + 1}: ${token?.name || 'Unknown'} (${token?.symbol || 'NA'})`,
          value: `**Amount Raw:** ${amountRaw}\n**Amount Decimal:** ${amountDecimal}\n**Value (USD):** ${valueUsd}`,
        });
      });
      if (profile.coinBalances?.pageInfo?.endCursor) {
        embed.setFooter({ text: `Next page cursor: ${profile.coinBalances.pageInfo.endCursor}` });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching profile balances:', error);
      await interaction.reply('❌ Error fetching profile balances.');
    }
  }

  // /topgainers – Coins with highest 24h market cap delta.
  else if (interaction.commandName === 'topgainers') {
    try {
      const response = await getCoinsTopGainers({ count: 10, after: undefined });
      const tokens = response.data?.exploreList?.edges?.map((edge: any) => edge.node);
      if (!tokens || tokens.length === 0) {
        await interaction.reply('❌ No top gainers found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Top Gainers (${tokens.length} coins)`)
        .setColor(0x00ff00);
      tokens.forEach((coin: any, idx: number) => {
        const percentChange = coin.marketCapDelta24h
          ? `${parseFloat(coin.marketCapDelta24h).toFixed(2)}%`
          : 'N/A';
        embed.addFields({
          name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
          value: `24h Change: ${percentChange}\nMarket Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}`,
        });
      });
      if (response.data?.exploreList?.pageInfo?.endCursor) {
        embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching top gainers:', error);
      await interaction.reply('❌ Error fetching top gainers.');
    }
  }

  // /topvolume – Coins with highest 24h volume.
  else if (interaction.commandName === 'topvolume') {
    try {
      const response = await getCoinsTopVolume24h({ count: 10, after: undefined });
      const tokens = response.data?.exploreList?.edges?.map((edge: any) => edge.node);
      if (!tokens || tokens.length === 0) {
        await interaction.reply('❌ No top volume coins found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Top Volume Coins (${tokens.length} coins)`)
        .setColor(0x0000ff);
      tokens.forEach((coin: any, idx: number) => {
        embed.addFields({
          name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
          value: `Volume 24h: ${coin.volume24h}\nMarket Cap: ${coin.marketCap}\nHolders: ${coin.uniqueHolders}`,
        });
      });
      if (response.data?.exploreList?.pageInfo?.endCursor) {
        embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching top volume coins:', error);
      await interaction.reply('❌ Error fetching top volume coins.');
    }
  }

  // /mostvaluable – Coins with highest market cap.
  else if (interaction.commandName === 'mostvaluable') {
    try {
      const response = await getCoinsMostValuable({ count: 10, after: undefined });
      const coins = response.data?.exploreList?.edges;
      if (!coins || coins.length === 0) {
        await interaction.reply('❌ No most valuable coins found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Most Valuable Coins (${coins.length} coins)`)
        .setColor(0xffaa00);
      coins.forEach((edge: any, idx: number) => {
        const coin = edge.node;
        embed.addFields({
          name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
          value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}\nCreated: ${coin.createdAt}`,
        });
      });
      if (response.data?.exploreList?.pageInfo?.endCursor) {
        embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching most valuable coins:', error);
      await interaction.reply('❌ Error fetching most valuable coins.');
    }
  }

  // /newcoins – Most recently created coins.
  else if (interaction.commandName === 'newcoins') {
    try {
      const response = await getCoinsNew({ count: 10, after: undefined });
      const coins = response.data?.exploreList?.edges;
      if (!coins || coins.length === 0) {
        await interaction.reply('❌ No new coins found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`New Coins (${coins.length} coins)`)
        .setColor(0xabcdef);
      coins.forEach((edge: any, idx: number) => {
        const coin = edge.node;
        const creationDate = new Date(coin.createdAt || '');
        const formattedDate = creationDate.toLocaleString();
        embed.addFields({
          name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
          value: `Created: ${formattedDate}\nCreator: ${coin.creatorAddress}\nMarket Cap: ${coin.marketCap}`,
        });
      });
      if (response.data?.exploreList?.pageInfo?.endCursor) {
        embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching new coins:', error);
      await interaction.reply('❌ Error fetching new coins.');
    }
  }

  // /lasttraded – Coins traded most recently.
  else if (interaction.commandName === 'lasttraded') {
    try {
      const response = await getCoinsLastTraded({ count: 10, after: undefined });
      const coins = response.data?.exploreList?.edges;
      if (!coins || coins.length === 0) {
        await interaction.reply('❌ No recently traded coins found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Recently Traded Coins (${coins.length} coins)`)
        .setColor(0x00ffff);
      coins.forEach((edge: any, idx: number) => {
        const coin = edge.node;
        embed.addFields({
          name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
          value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}`,
        });
      });
      if (response.data?.exploreList?.pageInfo?.endCursor) {
        embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching last traded coins:', error);
      await interaction.reply('Error fetching last traded coins.');
    }
  }

  // /lasttradedunique – Coins traded most recently by unique traders.
  else if (interaction.commandName === 'lasttradedunique') {
    try {
      const response = await getCoinsLastTradedUnique({ count: 10, after: undefined });
      const coins = response.data?.exploreList?.edges;
      if (!coins || coins.length === 0) {
        await interaction.reply('No recently traded unique coins found.');
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`Recently Traded by Unique Traders (${coins.length} coins)`)
        .setColor(0xff00ff);
      coins.forEach((edge: any, idx: number) => {
        const coin = edge.node;
        embed.addFields({
          name: `${idx + 1}. ${coin.name} (${coin.symbol})`,
          value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}\nUnique Holders: ${coin.uniqueHolders}`,
        });
      });
      if (response.data?.exploreList?.pageInfo?.endCursor) {
        embed.setFooter({ text: `Next page cursor: ${response.data.exploreList.pageInfo.endCursor}` });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching last traded unique coins:', error);
      await interaction.reply('Error fetching last traded unique coins.');
    }
  }

  // /alltopgainers – Paginate through all top gainers and return a summary.
  else if (interaction.commandName === 'alltopgainers') {
    try {
      const allCoins = await fetchAllTopGainers();
      const embed = new EmbedBuilder()
        .setTitle('All Top Gainers')
        .setColor(0x00ff00)
        .setDescription(`Workspaceed ${allCoins.length} total top gaining coins.`);
      const topFive = allCoins.slice(0, 5);
      topFive.forEach((coin: any, idx: number) => {
        embed.addFields({
          name: `#${idx + 1}: ${coin.name} (${coin.symbol})`,
          value: `Market Cap: ${coin.marketCap}\nVolume 24h: ${coin.volume24h}`,
          inline: false,
        });
      });
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching all top gainers:', error);
      await interaction.reply('Error fetching all top gainers.');
    }
  }

  // /onchaincoindetails – Fetch detailed on-chain coin information.
  else if (interaction.commandName === 'onchaincoindetails') {
    const coinAddress = interaction.options.getString('coin', true);
    const userAddress = interaction.options.getString('user', false) || undefined;
    try {
      const details = await getOnchainCoinDetails({
        coin: coinAddress as `0x${string}`,
        user: userAddress ? userAddress as `0x${string}` : undefined,
        publicClient,
      }) as any; // Type assertion to 'any' to access expected properties

      const embed = new EmbedBuilder()
        .setTitle(`On-Chain Details for ${details.name} (${details.symbol})`)
        .setDescription(`Address: ${details.address}`)
        .setColor(0x1a82e2)
        .addFields(
          { name: 'Total Supply', value: details.totalSupply.toString(), inline: true },
          { name: 'Market Cap', value: details.marketCap.toString(), inline: true },
          { name: 'Liquidity', value: details.liquidity.toString(), inline: true },
          { name: 'Pool Address', value: details.pool, inline: false },
          { name: 'Payout Recipient', value: details.payoutRecipient, inline: false },
          { name: 'Owners', value: details.owners.join(', ') || 'N/A', inline: false }
        );

      if (userAddress && details.balance !== undefined) {
        embed.addFields({
          name: 'User Balance',
          value: details.balance.toString(),
          inline: true,
        });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching on-chain coin details:', error);
      await interaction.reply('Error fetching on-chain coin details.');
    }
  }

  // /zora - Send text to Gemini
  else if (interaction.commandName === 'zora') {
    if (!geminiModel) {
      await interaction.reply('❌ Gemini functionality is not enabled. Please check the API key.');
      return;
    }

    const inputText = interaction.options.getString('text', true);
    const conciseInstruction = " Please explain this concisely in under 300 words.";
    const fullPrompt = inputText + conciseInstruction;

    try {
      await interaction.deferReply(); // Acknowledge the command immediately

      const result = await geminiModel.generateContent(fullPrompt);
      const responseText = result.response?.text();

      if (responseText) {
        const maxChars = 2000; // Keeping a character limit as a final fallback
        if (responseText.length <= maxChars) {
          await interaction.editReply(responseText);
        } else {
          let truncatedResponse = responseText.substring(0, maxChars);
          const lastSentenceEnd = Math.max(
            truncatedResponse.lastIndexOf('.'),
            truncatedResponse.lastIndexOf('?'),
            truncatedResponse.lastIndexOf('!')
          );

          if (lastSentenceEnd > 0) {
            truncatedResponse = responseText.substring(0, lastSentenceEnd + 1) + '...';
          } else {
            // If no sentence end found, or it's too early in the string, just truncate with ellipsis
            truncatedResponse = responseText.substring(0, maxChars - 3) + '...';
          }
          await interaction.editReply(truncatedResponse);
        }
      } else {
        await interaction.editReply('Gemini did not return a response.');
      }
    } catch (error: any) {
      console.error('Error communicating with Gemini:', error);
      await interaction.editReply('❌ An error occurred while processing your request with Gemini.');
    }
  }
});

//
// --- Start the Bot ---
//
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
});
client.login(DISCORD_BOT_TOKEN);