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

module.exports = async function keepMePosted(URL, settings, callback, ...args) {
  const browser = await puppeteer.launch(browserOptions);
  const page = await browser.newPage();
  await page.goto(URL);
  await page.addScriptTag({ url: lodashCdnUrl });
  let message = await page.evaluate(callback, ...args);
  await browser.close();

  if (settings.type === 'telegram') {
    const client = Telegram.TelegramClient.connect(settings.telegramBotToken);
    message = message.replace(/[_\*\[\]\(\)~`>#+-=|{}\.!]/g, (s) => `\\${s}`);
    await client.sendMessage(settings.chatId, message, { parse_mode: 'MarkdownV2' });
    return true;
  }

  return message;
}
