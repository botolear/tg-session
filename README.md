# Botol TgBot Session

## Example
```typescript
import { BotolTg } from '@botol/tg-bot';
import { BotolSession } from '@botol/tg-session';

type session = { user: string };
let bot = new BotolTg('<token>');
let botSession = bot.middleware(
    BotolSession<session>({
        init: () => ({ user: 'undefined' }),
    }),
);
botSession.use(async (ctx) => {
    await ctx.reply(`hi ${ctx.session.user}`);
    if (ctx.text != null) {
        ctx.session.user = ctx.text;
    }
});
bot1.startPolling();
```