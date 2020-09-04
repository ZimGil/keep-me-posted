# keep-me-posted
Execute code on a web page, send yourself a telegram message.


## Install
`npm install https://github.com/ZimGil/keep-me-posted.git`

## Usage
Import the `keepMePosted` function from `'keep-me-posted'`
Available params:
 * **URL** (_String_) Webpage URL on which the callback will be executed.
 * **settings** (_Object_) Settings for telegram bot usage or return value.
   * **settings.telegramBotToken** (_string_) Telegram Bot API Token (from BotFather).
   * **settings.chatId** (_string | number | string[] | number[]_) Your telegram chat ID or IDs.
   * **[settings.browser]** (_Object - Optional_) Your Puppeteer browser instance.
 * **callback** (_function(...args)_) Function to execute on the Webpage. Should return a message or an object containing a 'message' property.
 * **[...args]** (_any[] - Optional_) Parameters for the callback function.
 
> ***NOTE:*** The callback function is executed in the webpage scop and not in your application scop, you will be able to access the window object and the DOM but will not be able to access any of you variables. You can pass extra arguments and catch them as arguments in your callback function.


## Examples
```javascript
const keepMePosted = require('keep-me-posted');

const URL = "https://github.com";
const settings = {
  telegramBotToken: 'my-bot-api-token' // Get it from BotFather
  chatId: 123456 // Send a message to your bot, then getUpdates
};

// Returning a String
keepMePosted(URL, settings, () => window.location.href);
// This will return a Promise that will resolve with "https://github.com"
// The bot will send a message "https://github.com"



// Returning an Object
function exec(foo) {
  return {
    message: 'Hi...',
    a: foo.a + 10
  };
}
keepMePosted(URL, settings, exec, {a: 1});
// This will return a Promise that will resolve with the object:
// { message: 'Hi...', a: 11 }
// The bot will send a message "Hi..."
```

