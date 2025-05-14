// lib/hashPassword.js
const bcrypt = require("bcrypt");

const hashPassword = async (plainText) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainText, salt);
};

const comparePassword = async (plainText, hashed) => {
  return await bcrypt.compare(plainText, hashed);
};

module.exports = {
  hashPassword,
  comparePassword,
};
