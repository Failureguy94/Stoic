// Lets the app import the website's shared data files (../data/*.ts).
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
config.watchFolders = [path.resolve(__dirname, "../data")];

module.exports = config;
