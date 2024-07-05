// bot.js
const { Telegraf, Markup, session } = require('telegraf');



const WalletModel = require('./walletModel'); // Import the Wallet model schema

const db = require('./db');
require("dotenv").config();

const { getCoins } = require('./getCoins'); // Import the handler
const { transferAssets } = require('./transferAssets'); // Import the handler
const { getTransactions } = require('./getTransactions'); // Import the handler
const { bridgeTokens } = require('./bridgeTokens');
const { launchTokens } = require('./launchTokens');






const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);




bot.use(session());
// Create a state to manage the conversation flow
const conversationState = {};
// Updated Start command handler
bot.start(async (ctx) => {
    // Extract chatId from ctx
    const chatId = ctx.message.chat.id;
    // Initialize the conversation state for this user
    conversationState[chatId] = {
      step: 'initialStep', // Set the initial step here
    };
  // Check if the user has an existing wallet in the database
  const userId = ctx.from.id;
  const userWallet = await WalletModel.findOne({ userId });

  if (userWallet) {
    // User has an existing wallet
    ctx.replyWithMarkdown('*Welcome to FraxBot from Kiwi Protocol!\n\n Frax Bot is a fully decentralized multi-purpose telegram chat Bot that provides a comprehensive set of features for managing various aspects of DeFi operations in the Fraxtal Ecosystem, including EVM wallet manager, Frax Bridge, Frax Swap, Frax Pad, and Frax Stake.*\n\nChoose an option:\n\n*Wallets Manager:* Enables users to create or import wallets, deposit, and check transaction history.\n\n*Frax Bridge:* Enables users to bridge Fraxtal ecosystem tokens.\n\n*Frax Swap:*  Enables users to perform instant swaps on Frax Swap.\n\n* Frax Stake:* Enables users to stake Uniswap trading pair liquidity pool tokens in exchange for FXS rewards.\n\n*Frax Pad:* The factory acts as a template allowing users to deploy new tokens instantly on the Fraxtal network with desired parameters like name, symbol, supply, and functionality without writing an entire smart contract from scratch.\n\nAll our services are free!', Markup
      .keyboard([
        ['Wallets Manager', 'Frax Swap'],
        ['Frax Bridge', 'Frax Stake'],
        ['Frax Pad']
      ])
      .oneTime() 
      .resize()
    );
  } else {
    // User does not have a wallet
    ctx.replyWithMarkdown('*Welcome to FraxBot from Kiwi Protocol!\n\n Frax Bot is a fully decentralized multi-purpose telegram chat Bot that provides a comprehensive set of features for managing various aspects of DeFi operations in the Fraxtal Ecosystem, including EVM wallet manager, Frax Bridge, Frax Swap, Frax Pad, and Frax Stake.*\n\nChoose an option:\n\n*Wallets Manager:* Enables users to create or import wallets, deposit, and check transaction history.\n\n*Frax Bridge:* Enables users to bridge Fraxtal ecosystem tokens.\n\n*Frax Swap:*  Enables users to perform instant swaps on Frax Swap.\n\n* Frax Stake:* Enables users to stake Uniswap trading pair liquidity pool tokens in exchange for FXS rewards.\n\n*Frax Pad:* The factory acts as a template allowing users to deploy new tokens instantly on the Fraxtal network with desired parameters like name, symbol, supply, and functionality without writing an entire smart contract from scratch.\n\nAll our services are free!', Markup
      .keyboard([
        ['Wallets Manager', 'Frax Swap'],
        ['Frax Bridge', 'Frax Stake'],
        ['Frax Pad']
      ])
      .oneTime() 
      .resize()
    );
  }
});


// Wallet Management handler
bot.hears('Wallets Manager', async (ctx) => {
  const userId = ctx.from.id;

  // Check if the user has an existing wallet in the database
  const userWallet = await WalletModel.findOne({ userId });

  if (userWallet) {
    // User has an existing wallet
    ctx.replyWithMarkdown('*You have an existing wallet. What would you like to do?*', Markup
      .keyboard([
        ['Create Wallet', 'Import Wallet'],
        [ 'Deposit', 'Transaction History'], 
      ])
      .oneTime()
      .resize()
    ); 

  } else {
    // User does not have a wallet
    ctx.replyWithMarkdown('*You do not have an existing wallet. Create or Import Wallet.*', Markup
      .keyboard([
        ['Create Wallet', 'Import Wallet'],
        [ 'Deposit', 'Transaction History'], 
      ])
      .oneTime()
      .resize()
    ); 

  }
});




// Create Wallet handler 
bot.hears('Create Wallet', async (ctx) => {
  try {
    // Generate a new Ethereum wallet using ethers.js
    const wallet = ethers.Wallet.createRandom();
    const privateKey = wallet.privateKey;
      // Encrypt the private key (you'll need to implement this part)
      const encryptedPrivateKey = encryptPrivateKey(privateKey);
    // Create a new WalletModel instance to save to the database
    const newWallet = new WalletModel({
      userId: ctx.from.id,
      address: wallet.address,
      privateKey: encryptedPrivateKey,
    });

    // Save the new wallet to the database
    await newWallet.save();

    // Respond to the user
ctx.replyWithMarkdown(`*Your new wallet has been created!* \n\n*Address:* \`${wallet.address}\`\n*Private Key:* \`${wallet.privateKey}\`\n\n_Your private key is encrypted, Save your private key somewhere offline, and delete this message for security reasons._`, Markup
  .keyboard([
    ['Wallets Manager', 'Frax Swap'],
    ['Frax Bridge', 'Frax Stake'],
    ['Frax Pad'],
  ])
  .oneTime()
  .resize()
);

  } catch (error) {
    console.error('Error creating wallet:', error);
    ctx.reply('An error occurred while creating your wallet. Please try again later.');
  }
});


bot.hears('Import Wallet', async (ctx) => {
    // Prompt the user to enter their private key
    ctx.replyWithMarkdown('Please enter your private key to import your wallet:\n\n_Make sure the private key has an 0x prefix_');
});



  // Handle importing wallet using text filter
  bot.hears(/0x[a-fA-F0-9]{64}/, async (ctx) => {
    try {
      const privateKey = ctx.message.text;

      // Create a wallet using the provided private key and the Alchemy provider
      const wallet = new ethers.Wallet(privateKey, alchemyProvider);

      

      // Check if the wallet is already in the database
      const existingWallet = await WalletModel.findOne({ address: wallet.address });
      if (existingWallet) {
        console.log('This wallet is already available.');
        await ctx.reply('This wallet is already available', Markup
        .keyboard([
          ['Wallets Manager', 'Frax Swap'],
           ['Frax Bridge', 'Frax Stake'],
           ['Frax Pad'],
        ])
        .oneTime()
        .resize())
        return;
      }

            // Encrypt the private key (you'll need to implement this part)
            const encryptedPrivateKey = encryptPrivateKey(privateKey);
      // Store the wallet information in MongoDB (you need to define your Wallet model)
      const newWallet = new WalletModel({
        userId: ctx.from.id,
        address: wallet.address,
        privateKey: encryptedPrivateKey,
      });

      await newWallet.save();

      ctx.replyWithMarkdown(`*Your new wallet has been imported successfully!* \n\n*Address:* \`${wallet.address}\`\n*Private Key:* \`${wallet.privateKey}\`\n\n_Save your private key somewhere offline, and delete this message for security reasons._`, Markup
      .keyboard([
        ['Wallets Manager', 'Frax Swap'],
        ['Frax Bridge', 'Frax Stake'],
        ['Frax Pad'],
      ])
      .oneTime()
      .resize());
    } catch (error) {
      console.error('Error importing wallet:', error);
      ctx.reply('An error occurred while importing your wallet. Please check the private key and try again.');
    }
  });
// Deposit handler
bot.hears('Deposit', async (ctx) => {
  const userId = ctx.from.id;

  // Check if the user has an existing wallet in the database
  const userWallets = await WalletModel.find({ userId });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import a wallet.');
    return;
  }

 await ctx.reply('*Please copy the receiving address, and paste it in your sending wallet or exchange.*', { parse_mode: 'Markdown' })
  // Display each wallet address in separate messages with backticks
  userWallets.forEach((wallet) => {

  
    // Send the address message with the copy button
    ctx.reply(`*Wallet Address:*\n\`${wallet.address}\``, { parse_mode: 'Markdown' });
  });
});


// Use the "Create ERC20 Token" handler with bot.hears
bot.hears('Withdraw', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:*\n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);



  // Prompt the user to enter the name, symbol, supply, network name, and token properties
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, token type, network name, token amount, and recipient address\nFor example:* 1 tokenType mainnet 500 recipientAddress*\nThe available network names are: *mainnet and testnet*\nAvailable token types are FRAX, FXS, frxETH, sfrxETH, and sFRAX');
}); 

bot.hears(/^(\d+)\s+(\S+)\s+(ETH|BASE|BNB|ARB|MATIC|GOERLI|opBNB)\s+(\d+(\.\d+)?)\s+(\S+)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenAddress = input[1];
  const networkName = input[2];
  const tokenAmount = parseFloat(input[3])
  const recipientAddress = input[4];
  const userWallets = await WalletModel.find({ userId: ctx.from.id });
  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // This function should be implemented in your code
  await transferToken(ctx, selectedWallet, tokenAddress, networkName, tokenAmount, recipientAddress);
});



bot.hears('View Assets', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import or create a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:*\n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);


  ctx.replyWithMarkdown(`Please enter the network type and the serial number of the wallet you want to check balance from.n\nFor example: *testnet 1*\n\nAvailaible network types are: *mainnet and testnet*\n`);

});
bot.hears(/^(mainnet|testnet)\s+(\d)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const networkName = input[0];
  const walletIndex = parseInt(input[1], 10) - 1;
  const userWallets = await WalletModel.find({ userId: ctx.from.id });
  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];


  await getCoins(ctx, selectedWallet, networkName);
});
bot.hears('Transfer Assets', async (ctx) => {
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import or create a wallet.');
    return;
  }

  let walletListMessage = '*Available wallets:*\n';
  userWallets.forEach((wallet, index) => {
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  ctx.replyWithMarkdown(walletListMessage);
  ctx.replyWithMarkdown(`Please enter the serial number of the wallet you want to use to send tokens, amount, receiving address, assetID, and network type.\nFor example: *1 10 0x.... assetID testnet*\n\nAvailable network types are *mainnet and testnet*\n\nIf you're sending Algos, input *'ALGO'* as assetID`);
});

bot.hears(/^(\d+)\s+(\d+(\.\d+)?)\s+(\S+)\s+(\S+)\s+(mainnet|testnet)$/, async (ctx) => {
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const amount = parseFloat(input[1]);
  const receivingAddress = input[2];
  const assetID = input[3];
  const networkName = input[4];

  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }

  ctx.reply(`Transferring Tokens...`)

  const selectedWallet = userWallets[walletIndex];
  await transferAssets(ctx, selectedWallet, amount, assetID, receivingAddress, networkName);
});


bot.hears('Algo Bridge', async (ctx) => {
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
      ctx.reply('No wallets found for your account. Please import or create a wallet.');
      return;
  }

  let walletListMessage = '*Available wallets:*\n';
  userWallets.forEach((wallet, index) => {
      const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
      walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  ctx.replyWithMarkdown(walletListMessage);

  ctx.replyWithMarkdown(`Please enter the serial number of the wallet you want to use to send tokens, amount, Sending Network Type, AssetID, Receiving Network name, and Receiving address.\nFor example: *1 10 testnet assetID ETH 0x....*\n\n\nAvailable receiving networks are: *ETH, SOLANA, COSMOS, SUI, APTOS, NEAR, XPLA, TERRA, ACALA, OASIS, FANTOM, MOONBEAM, ARBITRUM, OPTIMISM, CELO, KARURA, POLYGON, AURORA, BSC, BLAST, BASE, NEON, KLAYTN, SEI, OSMOSIS, INJECTIVE, TERRA2, AVAX, LINEA, CELESTIA, BERACHAIN, EVMOS, HOLESKY, SCROLL, BTC, WORMCHAIN, MANTLE, COSMOSHUB, STARGAZE, KUJIRA. *\n\n\nAvailable network types are mainnet and testnet.\n\nIf you're bridging Algorand native token, input *'ALGO'* as assetID`);
});

bot.hears(/^(\d+)\s+(\d+)\s+(testnet|mainnet)\s+(\S+)\s+(\S+)\s+(\S+)$/, async (ctx) => {
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const amount = parseInt(input[1], 10);
  const networkName = input[2];
  const assetID = input[3];
  const receivingNetwork = input[4];
  const receivingAddress = input[5];

  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (walletIndex < 0 || walletIndex >= userWallets.length) {
      ctx.reply('Invalid wallet number. Please try again.');
      return;
  }

  ctx.reply('Bridging Tokens...');

  const selectedWallet = userWallets[walletIndex];
  await bridgeTokens(ctx, selectedWallet, amount, networkName, assetID, receivingNetwork, receivingAddress);
});

bot.hears('Transaction History', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import or create a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:*\n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);

 
  ctx.replyWithMarkdown(`Please enter the serial number of the wallet you want to check its transaction history, and network type.n\nFor example: *1 testnet*\n\nAvailaible network types are: *mainnet and testnet*\n`);

});
bot.hears(/^(\d)\s+(mainnet|testnet)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const networkName = input[1];
  const userWallets = await WalletModel.find({ userId: ctx.from.id });
  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];
  

  await getTransactions(ctx, selectedWallet, networkName);
});

bot.hears('Algo Pad', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import or create a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:*\n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);

  ctx.replyWithMarkdown(`Please enter the serial number of the wallet you want to check launch project with, network type, token name, unit name, total issuance, and decimals.n\nFor example: *1 testnet KIWITOKEN KIWI 1000000 18*\n\nAvailable network types are: *mainnet and testnet*\n`);
});

bot.hears(/^(\d+)\s+(mainnet|testnet)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\d+)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const networkName = input[1];
  const tokenName = input[2];
  const unitName = input[3];
  const totalIssuance = parseInt(input[4], 10);
  const decimals = parseInt(input[5], 10);

  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }

  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];
  
  ctx.reply('Minting Token...');

  await launchTokens(ctx, selectedWallet, networkName, tokenName, unitName, totalIssuance, decimals);
});





bot.launch({ handleUpdates: true });

