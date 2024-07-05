const CryptoJS = require('crypto-js');


// Function to encrypt the private key
 function encryptPrivateKey(privateKey) {
    // Replace with your encryption logic
    // For example, use AES encryption with a strong passphrase
    const passphrase = process.env.MASTER_KEY;
    const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, passphrase).toString();
    return encryptedPrivateKey;
  }
  
  // Function to decrypt the private key
  function decryptPrivateKey(encryptedPrivateKey) {
    // Replace with your decryption logic
    // Decrypt using the same passphrase used for encryption
    const passphrase = process.env.MASTER_KEY;
    const decryptedBytes = CryptoJS.AES.decrypt(encryptedPrivateKey, passphrase);
    const decryptedPrivateKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
    return decryptedPrivateKey;
  }

  module.exports = {
    decryptPrivateKey,
    encryptPrivateKey,
  }