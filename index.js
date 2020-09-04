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
 * @param { Object }                                    settings                    Settings for telegram bot usage or return value.
 * @param { string }                                    settings.telegramBotToken   Telegram Bot API Token (from BotFather).
 * @param { string | number | string[] | number[] }     settings.chatId             Your telegram chat ID.
 * @param { Object }                                    [settings.browser]          Your Puppeteer browser instance.
 * @param { function() => string | {message: string} }  callback                    Function to execute on the Webpage. Should return a message or an object containing a 'message' property.
 * @param { ...any }                                    [args]                      Parameters for the callback function.
 *
 * @return {Promise<string>} Promise object that resolves with the Message or Object returned by the Callback function.
 */
async function keepMePosted(URL, settings, callback, ...args) {
  const browser = settings.browser || await puppeteer.launch(browserOptions);
  try {
    const page = await browser.newPage();
    await page.goto(URL);
    const res = await page.evaluate(callback, ...args);
    const message = getMessageFromResult(res);

    if (message && settings.telegramBotToken && settings.chatId) {
      const client = Telegram.TelegramClient.connect(settings.telegramBotToken);
      const ids = Array.isArray(settings.chatId) ? settings.chatId : [settings.chatId];
      ids.forEach(async (id) => await client.sendMessage(id, message, { parse_mode: 'MarkdownV2' }));
    }

    return res;
  } finally {
    if (!settings.browser) {
      browser.close();
    }
  }
}

function getMessageFromResult(res) {
  return  res && (typeof res === 'string' || (typeof res === 'object' && typeof res.message === 'string'))
  ? escapeTelegramReservedChars(res.message)
  : null;
}

function escapeTelegramReservedChars(msg) {
  return msg.replace(/[_\*\[\]\(\)~`>#+-=|{}\.!]/g, (s) => `\\${s}`);
}

module.exports = keepMePosted;
