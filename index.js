const os = require('os');
const puppeteer = require('puppeteer');
const Telegram = require('messaging-api-telegram');

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
 * @param { function() => string | {message: string} }  callback                    Function to execute on the Webpage. Should return a message or an object containing a 'message' property.
 * @param { Object }                                    [settings]                    Settings for telegram bot usage or return value.
 * @param { string }                                    [settings.telegramBotToken]   Telegram Bot API Token (from BotFather).
 * @param { string | number | string[] | number[] }     [settings.chatId]             Your telegram chat ID.
 * @param { Object }                                    [settings.browser]          Your Puppeteer browser instance.
 * @param { ...any }                                    [args]                      Parameters for the callback function.
 *
 * @return {Promise<string>} Promise object that resolves with the Message or Object returned by the Callback function.
 */
async function keepMePosted(URL, callback, settings, ...args) {
  const options = Object.assign({}, settings);
  const browser = options.browser || await puppeteer.launch(browserOptions);
  try {
    const page = await browser.newPage();
    await page.goto(URL);
    const res = await page.evaluate(callback, ...args);
    const message = getMessageFromResult(res);

    if (message && options.telegramBotToken && options.chatId) {
      const client = Telegram.TelegramClient.connect(options.telegramBotToken);
      const ids = Array.isArray(options.chatId) ? options.chatId : [options.chatId];
      ids.forEach(async (id) => await client.sendMessage(id, message, { parse_mode: 'MarkdownV2' }));
    }

    return res;
  } finally {
    if (!options.browser) {
      browser.close();
    }
  }
}

function getMessageFromResult(res) {
  if (!res) { return null; }
  if (typeof res === 'string') { return escapeTelegramReservedChars(res); }
  if ((typeof res === 'object' && typeof res.message === 'string')) { return escapeTelegramReservedChars(res.message); }
  return null;
}

function escapeTelegramReservedChars(msg) {
  return msg.replace(/[_\*\[\]\(\)~`>#+-=|{}\.!]/g, (s) => `\\${s}`);
}

module.exports = keepMePosted;
