import { Bot, InlineKeyboard, session } from 'grammy';
import { config } from './config.js';

import { catalogHandler } from './modules/catalog.js';
import { homeHandler } from './modules/home.js';
import { filmHandler } from './modules/film.js';
import {
  searchHandler,
  searchTextHandler,
  searchPaginationHandler,
} from './modules/search.js';

if (!config.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set');
}

const bot = new Bot(config.BOT_TOKEN);

// session нужна для:
// – поиска
// – хранения lastBotMessageId
// – хранения lastStartMessageId
bot.use(
  session({
    initial: () => ({
      lastBotMessageId: null,
      lastStartMessageId: null,
    }),
  })
);

bot.use(async (ctx, next) => {
  if (ctx.callbackQuery?.message?.message_id) {
    ctx.session.lastBotMessageId = ctx.callbackQuery.message.message_id;
  }
  await next();
});


/* =====================
   /start — ЕДИНОЕ МЕНЮ
===================== */

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('▶️ Каталог', 'catalog')
    .row()
    .text('👤 Профиль', 'profile')
    .text('ℹ️ О проекте', 'about');

  const text =
    '🎬 *blur* — онлайн-кинотеатр в Telegram.\n\n' +
    'Смотри фильмы и сериалы прямо здесь — удобно и без лишнего шума.';

  try {
    const chatId = ctx.chat.id;

    // 🔹 ID текущего активного меню (каталог / поиск / фильм)
    const currentMenuId =
      ctx.callbackQuery?.message?.message_id ??
      ctx.session.lastBotMessageId;

    // 1️⃣ отправляем новое меню
    const sentMenu = await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });

    // 2️⃣ удаляем старое меню (откуда бы ни пришли)
    if (currentMenuId) {
      await ctx.api
        .deleteMessage(chatId, currentMenuId)
        .catch(() => {});
    }

    // 3️⃣ удаляем старый /start
    if (ctx.session.lastStartMessageId) {
      await ctx.api
        .deleteMessage(chatId, ctx.session.lastStartMessageId)
        .catch(() => {});
    }

    // 4️⃣ сохраняем новые id
    ctx.session.lastBotMessageId = sentMenu.message_id;
    ctx.session.lastStartMessageId = ctx.message?.message_id ?? null;
  } catch (err) {
    console.error('START ERROR:', err);
  }
});


/* =====================
   CALLBACKS
===================== */

bot.callbackQuery('home', async (ctx) => {
  await homeHandler(ctx);
});

bot.callbackQuery('catalog', async (ctx) => {
  await catalogHandler(ctx, 0);
});

bot.callbackQuery(/catalog_page_(\d+)/, async (ctx) => {
  const page = Number(ctx.match[1]);
  await catalogHandler(ctx, page);
});

bot.callbackQuery(/film_(.+)/, async (ctx) => {
  await filmHandler(ctx, ctx.match[1]);
});

/* =====================
   ПОИСК
===================== */

bot.callbackQuery('search', searchHandler);
bot.on('message:text', searchTextHandler);

bot.callbackQuery('search_next', searchPaginationHandler);
bot.callbackQuery('search_prev', searchPaginationHandler);

/* =====================
   ПРОЧЕЕ
===================== */

bot.callbackQuery('profile', async (ctx) => {
  await ctx.editMessageText('👤 *Профиль пользователя*', {
    parse_mode: 'Markdown',
    reply_markup: new InlineKeyboard().text('⬅️ Назад', 'home'),
  });
});

bot.callbackQuery('about', async (ctx) => {
  await ctx.editMessageText(
    'ℹ️ *blur* — онлайн-кинотеатр.\n\nПроект в активной разработке.',
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('⬅️ Назад', 'home'),
    }
  );
});

/* =====================
   ERROR
===================== */

bot.catch(err => {
  console.error('BOT ERROR:', err.error);
});

bot.start();
console.log('🤖 Bot started');
