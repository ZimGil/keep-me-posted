const os = require('os');
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
 * @param { String }                                    URL                         Webpage URL on which the callback will be executed.
 * @param { Object }                                    settings                    Settings for telegram bot usage or return value.
 * @param { string }                                    settings.telegramBotToken   Telegram Bot API Token (from BotFather).
 * @param { string | number | string[] | number[] }     settings.chatId             Your telegram chat ID.
 * @param { function() => string | {message: string} }  callback                    Function to execute on the Webpage. Should return a message or an object containing a 'message' property.
 * @param { ...any }                                    [args]                      Parameters for the callback function.
 *
 * @return {Promise<string>} Promise object that resolves with the Message or Object returned by the Callback function.
 */
async function keepMePosted(URL, settings, callback, ...args) {
  let browser;
  try {
    browser = await puppeteer.launch(browserOptions);
  } catch (e) {
    throw e;
  }

  try {
    const page = await browser.newPage();
    await page.goto(URL);
    let res = await page.evaluate(callback, ...args);
    await browser.close();

    if (typeof res === 'string') {
      res = { message: res };
    }

    if (settings.telegramBotToken && settings.chatId) {
      const client = Telegram.TelegramClient.connect(settings.telegramBotToken);
      res.message = res.message.replace(/[_\*\[\]\(\)~`>#+-=|{}\.!]/g, (s) => `\\${s}`);
      const ids = Array.isArray(settings.chatId) ? settings.chatId : [settings.chatId];
      ids.forEach(async (id) => await client.sendMessage(id, res.message, { parse_mode: 'MarkdownV2' }));
    }

    return res;
  } catch (e) {
    browser.close();
    throw e;
  }
}

module.exports = keepMePosted;
