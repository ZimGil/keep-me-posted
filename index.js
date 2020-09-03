const puppeteer = require('puppeteer');
const Telegram = require('messaging-api-telegram');

const lodashCdnUrl = 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.15/lodash.min.js';
const browserOptions = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};
if (os.arch().includes('arm')) {
  browserOptions.executablePath = 'chromium-browser';
}

/**
 * Execute your callback on a Webpage, sends a Telegram Message using your Bot.
 *
 * @param {String}                                    URL                         Webpage URL on which the callback will be executed.
 * @param {Object}                                    settings                    Settings for telegram bot usage or return value.
 * @param {string}                                    settings.telegramBotToken   Telegram Bot API Token (from BotFather).
 * @param {string | number | string[] | number[]}     settings.cahtId             Your telegram chat ID or an Array of IDs.
 * @param {function() => string | {message: string}}  callback                    Function to execute on the Webpage. Should return a message or an object containing a 'message' property.
 * @param {...any}                                    [args]                      Parameters for the callback function.
 *
 * @return {Promise<string>} Promise object that resolves with the Message or Object returned by the Callback function.
 */
module.exports = async function keepMePosted(URL, settings, callback, ...args) {
  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();
  await page.goto(URL);
  await page.addScriptTag({ url: lodashCdnUrl });
  const res = await page.evaluate(callback, ...args);
  await browser.close();

  if (typeof res === 'string') {
    res = { message: res };
  }

  if (settings.telegramBotToken && settings.cahtId) {
    const client = Telegram.TelegramClient.connect(settings.telegramBotToken);
    res.message = res.message.replace(/[_\*\[\]\(\)~`>#+-=|{}\.!]/g, (s) => `\\${s}`);
    const ids = Array.isArray(settings.cahtId) ? settings.cahtId : [settings.cahtId];
    ids.forEach(async (id) => await client.sendMessage(id, res.message, { parse_mode: 'MarkdownV2' }));
    return res;
  }

  return res;
}
