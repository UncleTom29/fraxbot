// bot.js
const { Telegraf, Markup, session } = require('telegraf');



const WalletModel = require('./walletModel'); // Import the Wallet model schema

const db = require('./db');
require("dotenv").config();

const { lockToken } = require('./utils');
const { transferToken } = require('./utils');
const { createUserToken } = require('./utils');
const { createLiqToken } = require('./utils');
const { addDEXLiquidity } = require('./utils');
const { lockLiquidity } = require('./utils'); 
const { editLock } = require('./utils');
const { unlockToken } = require('./utils');
const { removeDEXLiquidity } = require('./utils');






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
    ctx.replyWithMarkdown('*Welcome to FraxBot from Kiwi Protocol!\n\n Frax Bot is a fully decentralized multi-purpose telegram chat Bot that provides a comprehensive set of features for managing various aspects of DeFi operations in the Fraxtal Ecosystem, including EVM wallet manager, Frax Pool Manager, Frax Bridge, Frax Swap, Frax Pad, Frax Lock, and Frax Stake.*\n\nChoose an option:\n\n*Wallets Manager:* Enables users to create or import wallets, deposit, and check transaction history.\n\n*Frax Bridge:* Enables users to bridge Fraxtal ecosystem tokens.\n\n*Frax Swap:*  Enables users to perform instant swaps on Frax Swap.\n\n* Frax Stake:* Enables users to stake Uniswap trading pair liquidity pool tokens in exchange for FXS rewards.\n\n*Frax Pad:* The factory acts as a template allowing users to deploy new tokens instantly on the Fraxtal network with desired parameters like name, symbol, supply, and functionality without writing an entire smart contract from scratch.\n\n*Frax Pool Manager:* Enables project owners to add or remove liquidity from FraxSwap on Ethereum network.\n\n*Frax Lock:* Enables users to lock their ERC20 tokens and FraxSwap LP.\n\nAll our services are free!', Markup
      .keyboard([
        ['Wallets Manager', 'Frax Swap'],
        ['Frax Bridge', 'Frax Stake', 'Frax Lock'],
        ['Frax Pad', 'Frax Pool Manager']
      ])
      .oneTime() 
      .resize()
    );
  } else {
    // User does not have a wallet
    ctx.replyWithMarkdown('*Welcome to FraxBot from Kiwi Protocol!\n\n Frax Bot is a fully decentralized multi-purpose telegram chat Bot that provides a comprehensive set of features for managing various aspects of DeFi operations in the Fraxtal Ecosystem, including EVM wallet manager, Frax Pool Manager, Frax Bridge, Frax Swap, Frax Pad, Frax Lock, and Frax Stake.*\n\nChoose an option:\n\n*Wallets Manager:* Enables users to create or import wallets, deposit, and check transaction history.\n\n*Frax Bridge:* Enables users to bridge Fraxtal ecosystem tokens.\n\n*Frax Swap:*  Enables users to perform instant swaps on Frax Swap.\n\n* Frax Stake:* Enables users to stake Uniswap trading pair liquidity pool tokens in exchange for FXS rewards.\n\n*Frax Pad:* The factory acts as a template allowing users to deploy new tokens instantly on the Fraxtal network with desired parameters like name, symbol, supply, and functionality without writing an entire smart contract from scratch.\n\n*Frax Pool Manager:* Enables project owners to add or remove liquidity from FraxSwap on Ethereum network.\n\n*Frax Lock:* Enables users to lock their ERC20 tokens and FraxSwap LP.\n\nAll our services are free!', Markup
      .keyboard([
        ['Wallets Manager', 'Frax Swap'],
        ['Frax Bridge', 'Frax Stake', 'Frax Lock'],
        ['Frax Pad', 'Frax Pool Manager']
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
        [ 'Deposit', 'Withdraw'], 
      ])
      .oneTime()
      .resize()
    ); 

  } else {
    // User does not have a wallet
    ctx.replyWithMarkdown('*You do not have an existing wallet. Create or Import Wallet.*', Markup
      .keyboard([
        ['Create Wallet', 'Import Wallet'],
        [ 'Deposit', 'Withdraw'], 
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
    ['Frax Bridge', 'Frax Stake', 'Frax Lock'],
    ['Frax Pad', 'Frax Pool Manager'],
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
           ['Frax Bridge', 'Frax Stake', 'Frax Lock'],
           ['Frax Pad', 'Frax Pool Manager'],
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
        ['Frax Bridge', 'Frax Stake', 'Frax Lock'],
        ['Frax Pad', 'Frax Pool Manager'],
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

bot.hears(/^(\d+)\s+(\S+)\s+(mainnet|testnet|)\s+(\d+(\.\d+)?)\s+(\S+)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenType = input[1];
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
  await transferToken(ctx, selectedWallet, tokenType, networkName, tokenAmount, recipientAddress);
});

bot.hears('FraxPad', (ctx) => {
  ctx.reply('Choose an option for FraxPad:', Markup
    .keyboard([
      ['Generate Basic Token', 'Generate Liquidity Token'],
    ])
    .oneTime()
    .resize()
  );
});



bot.hears('Generate Basic Token', async (ctx) => {
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
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, name, symbol, supply, and network type of your ERC20 token on Fraxtal Network in the format:\n\n_walletnumber name symbol supply networkType_\n\nFor example: *1 TokenName TokenSymbol 1000 mainnet*\n\nThe available network types are: *mainnet and testnet*\n\n');
});

// Use the filter-based approach to handle user input
bot.hears(/^(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(mainnet|testnet)\$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenName = input[1];
  const tokenSymbol = input[2];
  const tokenSupply = parseInt(input[3], 10);
  const networkType = input[4];
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  } 
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // Pass the necessary dependencies to the createTokenHandler
  await createUserToken(ctx, selectedWallet, tokenName, tokenSymbol, tokenSupply, networkType);
});


bot.hears('Generate Liquidity Token', async (ctx) => {
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
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, name, symbol, supply, and liquidity amount(ETH) in the format:\n\n_walletnumber name symbol supply liquidityAmount_\n\nFor example: *1 TokenName TokenSymbol 1000 25*\n\nLiquidity tokens are automatically deployed on Frax Swap Ethereum Mainnet.');
});

// Use the filter-based approach to handle user input
bot.hears(/^(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+(\d+(\.\d+)?)\$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenName = input[1];
  const tokenSymbol = input[2];
  const tokenSupply = parseInt(input[3], 10);
  const liquidityAmount = parseFloat(input[4])
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  } 
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // Pass the necessary dependencies to the createTokenHandler
  await createLiqToken(ctx, selectedWallet, tokenName, tokenSymbol, tokenSupply, liquidityAmount);
});

bot.hears('Frax Pool Manager', (ctx) => {
  // Provide options for 'launchpad' when the user clicks on it
  ctx.reply('Choose an option for Frax Pool Manager:', Markup
    .keyboard([
      ['Add Liquidity', 'Remove Liquidity'],
    ])
    .oneTime()
    .resize()
  );
});


// Use the "Create ERC20 Token" handler with bot.hears
bot.hears('Add Liquidity', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:* \n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);

  // Prompt the user to enter the name, symbol, supply, network name, and token properties
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, token address, ERC20 token amount, and ETH amount.\n\nFor example: *1 TokenAddress 1000000 10*\n\nLiquidity is deployed on FraxSwap Ethereum Mainnet\n\n');
});

// Use the "Add Liquidity" handler with bot.hears
bot.hears(/^(\d+)\s+(\S+)\s+(\d+(\.\d+)?)\s+(\d+(\.\d+)?)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenAddress = input[1];
  const tokenAmount = parseFloat(input[2]);
  const ethamount = parseFloat(input[3]);
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // Call a function to create the token vesting contract
  // This function should be implemented in your code
  await addDEXLiquidity(ctx, selectedWallet, tokenAddress, tokenAmount, ethamount);
});

bot.hears('Remove Liquidity', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:* \n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);

  // Prompt the user to enter the name, symbol, supply, network name, and token properties
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, token address, LP tokens amount(LP tokens are automatically generated when you add liquidity to Fraxswap Pool)\n\nFor example: *1 TokenAddress 20*\n\nLiquidity is removed from Fraxswap pool in Ethereum Mainnet');
});

// Use the "Add Liquidity" handler with bot.hears
bot.hears(/^(\d+)\s+(\S+)\s+(\d+(\.\d+)?)\s+(\S+)\s+(ETH|BASE|BNB|ARB|MATIC|GOERLI)\s+(UniswapV2|PancakeswapV2|Kiwiswap|SushiswapV2)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenAddress = input[1];
  const liquidityAmount = parseFloat(input[2]);


  const userWallets = await WalletModel.find({ userId: ctx.from.id });
  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // This function should be implemented in your code
  await removeDEXLiquidity(ctx, selectedWallet, tokenAddress, liquidityAmount);
});
//Lock handler
bot.hears('Frax Lock', (ctx) => {
  ctx.reply('Choose an option for Frax Lock:', Markup
    .keyboard([
      ['Lock Token', 'Lock Liquidity'],
      ['Unlock', 'Edit Lock'],
    ])
    .oneTime()
    .resize()
  );
});

 
// Use the "Create ERC20 Token" handler with bot.hears
bot.hears('Lock Liquidity', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:* \n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);


  ctx.replyWithMarkdown('Please enter the serial number of the wallet, LP address, lock amount, lock period(no of days), and lock description of your liquidity token lock.\n\nFor example: *1 LpAddress 100 30 LockDescription.*\n\nFrax Lock locks LPs deployed on Fraxswap Ethereum Mainnet.\n\n_No space should be in between lock description_.\n\n');
});

// Use the "Lock Liquidity" handler with bot.hears
bot.hears(/^(\d+)\s+(\S+)\s+(\d+(\.\d+)?)\s+(\d+(\.\d+)?)\s+([\w\s]+)$/i, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenAddress = input[1];
  const lockAmount = parseFloat(input[2]);
  const lockPeriod = parseFloat(input[3]);
  const lockDescription = input[4];

  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet 
  const selectedWallet = userWallets[walletIndex];

  
  // This function should be implemented in your code
  await lockLiquidity(ctx, selectedWallet, tokenAddress, lockAmount, lockPeriod, lockDescription);
});


// Use the "Create ERC20 Token" handler with bot.hears
bot.hears('Lock Token', async (ctx) => {
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
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, token address, lock amount, network type, lock period(no of days), and lock description of your ERC20 token lock\n\nFor example: *1 TokenAddress 1000 mainnet 30 LockDescription*\n\nThe available network names are: *mainnet and testnet*.\n\n');
});

// Use the "Create ERC20 Token Vesting" handler with bot.hears
bot.hears(/^(\d+)\s+(\S+)\s+(\d+)\s+(mainnet|testnet)\s+(\d+)\s+([\w\s]+)$/
, async (ctx) => {
  try{
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const tokenAddress = input[1];
  const lockAmount = parseInt(input[2]);
  const networkName = input[3];
  const lockPeriod = parseInt(input[4]);
  const lockDescription = input[5];

  
    // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });
  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return; 
  }

  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // Call a function to create the token vesting contract
  // This function should be implemented in your code
  await lockToken(ctx, selectedWallet, tokenAddress, lockAmount, lockPeriod, networkName, lockDescription);

}  catch (error) {
  console.error('Error creating lock contract:', error);
  ctx.reply('Error creating lock contract. Please check your input and try again.'); // Replace with actual error message
}
}); 


// Use the "Create ERC20 Token" handler with bot.hears
bot.hears('Edit Lock', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:* \n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);

  // Prompt the user to enter the name, symbol, supply, network name, and token properties
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, new lock amount, new lock period (_in days_), lock ID, and network type\nFor example: *1 1000 20  110003 mainnet*\n_The new amount should be greater than the initial lock amount_\n_The new lock period (in days) should be greater than the initial lock period_\nThe available network types are: *mainnet and testnet*');
});
bot.hears(/^(\d+)\s+(\d+(\.\d+)?)\s+(\d+(\.\d+)?)\s+(\d+(\.\d+)?)\s+(mainnet|testnet)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const newAmount = parseFloat(input[1]);
  const newlockPeriod = parseFloat(input[2]);
  const lockID = parseFloat(input[3]);
  const networkName = input[4];


  const userWallets = await WalletModel.find({ userId: ctx.from.id });
  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // Call a function to create the token vesting contract
  // This function should be implemented in your code
  await editLock(ctx, selectedWallet, newAmount, newlockPeriod, lockID, networkName);
});


// Use the "Create ERC20 Token" handler with bot.hears
bot.hears('Unlock Tokens / Liquidity', async (ctx) => {
  // Retrieve all wallets associated with the user
  const userWallets = await WalletModel.find({ userId: ctx.from.id });

  if (!userWallets || userWallets.length === 0) {
    ctx.reply('No wallets found for your account. Please import a wallet.');
    return;
  }

  // Display the wallets to the user with serial numbers in a shortened form
  let walletListMessage = '*Available wallets:* \n';
  userWallets.forEach((wallet, index) => {
    // Shorten the wallet address by displaying the first 6 and last 4 characters
    const shortAddress = `${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 4)}`;
    walletListMessage += `${index + 1}. Wallet Address: ${shortAddress}\n`;
  });

  // Send the message without markdown formatting
  ctx.replyWithMarkdown(walletListMessage);

  // Prompt the user to enter the name, symbol, supply, network name, and token properties
  ctx.replyWithMarkdown('Please enter the serial number of the wallet, lock ID, and network type. For example: *1 05 mainnet*\nThe available network types are: *mainnet and testnet*');
});
bot.hears(/^(\d+)\s+(\d+(\.\d+)?)\s+(mainnet|testnet)$/, async (ctx) => {
  // Parse the user input
  const input = ctx.message.text.trim().split(' ');
  const walletIndex = parseInt(input[0], 10) - 1;
  const lockID = parseFloat(input[1]);
  const networkName = input[2];
  const userWallets = await WalletModel.find({ userId: ctx.from.id });
  // Validate the wallet index
  if (walletIndex < 0 || walletIndex >= userWallets.length) {
    ctx.reply('Invalid wallet number. Please try again.');
    return;
  }
 
  // Get the selected wallet
  const selectedWallet = userWallets[walletIndex];

  // This function should be implemented in your code
  await unlockToken(ctx, selectedWallet, lockID, networkName);
});





bot.launch({ handleUpdates: true });

