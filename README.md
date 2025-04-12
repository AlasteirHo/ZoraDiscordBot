# 🪙 Zora coin trading assistant Discord Bot

A feature-rich Discord bot for discovering, analyzing, and interacting with Zora20 coins. It fetches real-time token data, profiles, comments, and more using the [Zora Labs Coins SDK](https://github.com/ourzora/coins-sdk) and supports Gemini AI responses for user queries.

## 📦 Features

- `/coin` – Fetches detailed info on a specific Zora20 coin
- `/coincomments` – Retrieves community comments on a coin
- `/coins` – Lists fixed Zora20 coins
- `/multicoins` – Accepts comma-separated token addresses
- `/profile` – Displays user profile via wallet/Zora handle
- `/profilebalances` – Lists token balances for a user
- `/topgainers` – Top tokens with the largest 24h market cap growth
- `/topvolume` – Highest volume tokens in the past 24h
- `/mostvaluable` – Tokens with the highest market cap
- `/newcoins` – Recently deployed coins
- `/lasttraded` – Recently traded coins
- `/lasttradedunique` – Recently traded coins by unique users
- `/alltopgainers` – Paginated list of top gainers
- `/onchaincoindetails` – Fetch deep on-chain info about a coin
- `/zora` – Interact with Gemini AI using text

## 🧪 Technologies Used

- [`discord.js`](https://discord.js.org/) – Discord bot framework
- [`@zoralabs/coins-sdk`](https://www.npmjs.com/package/@zoralabs/coins-sdk) – Zora coin data
- [`viem`](https://viem.sh/) – On-chain queries
- [`@google/generative-ai`](https://www.npmjs.com/package/@google/generative-ai) – Gemini AI integration
- `dotenv` – Securely load environment variables

## 🛠 Installation

```bash
git clone https://github.com/AlasteirHo/ZoraDiscordBot.git
cd ZoraDiscordBot
npm install
```
## 🔑 Environment Variables
Create an .env or api.env file in the root folder with the following:
```bash
DISCORD_BOT_TOKEN=your_discord_token_here
CLIENT_ID=your_discord_client_id_here
GEMINI_API_KEY=your_gemini_api_key_here
```
Please request personally for the API keys as it is secretive (For demonstration only)

## 🚀 Running the Bot
```bash
node index.js
```

## 🤖 Gemini Integration (Optional)
The /zora command uses Gemini 2.0 via Google’s GenAI SDK.
To enable it, ensure you set GEMINI_API_KEY in your environment file.

## 🛡 Commands Deployment
To register all slash commands, ensure the bot is added to a Discord server and then run:
```bash
node index.js
```
