import { Bot, InlineKeyboard, session } from 'grammy';
import { config } from './config.js';
import { catalogHandler } from './modules/catalog.js';
import { homeHandler } from './modules/home.js';
import { filmHandler } from './modules/film.js';
import { searchHandler, searchTextHandler } from './modules/search.js';
import { searchPaginationHandler } from './modules/search.js';


if (!config.BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set');
}

const bot = new Bot(config.BOT_TOKEN);

// ✅ session нужен ТОЛЬКО для поиска
bot.use(session({ initial: () => ({}) }));

// /start
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('Каталог', 'catalog')
    .row()
    .text('Профиль', 'profile')
    .text('О проекте', 'about');

  await ctx.reply(
    '🎬 *blur* — онлайн-кинотеатр в Telegram.\n\nСмотри фильмы и сериалы прямо здесь — удобно и без лишнего шума.',
    {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    }
  );
});

// Главный экран
bot.callbackQuery('home', async (ctx) => {
  await homeHandler(ctx);
});

// Каталог — первая страница
bot.callbackQuery('catalog', async (ctx) => {
  await catalogHandler(ctx, 0);
});

// Пагинация
bot.callbackQuery(/catalog_page_(\d+)/, async (ctx) => {
  const page = Number(ctx.match[1]);
  await catalogHandler(ctx, page);
});

// Карточка фильма
bot.callbackQuery(/film_(.+)/, async (ctx) => {
  const filmId = ctx.match[1];
  await filmHandler(ctx, filmId);
});

// 🔍 ПОИСК (inline)
bot.callbackQuery('search', async (ctx) => {
  await searchHandler(ctx);
});

bot.callbackQuery(['search_next', 'search_prev'], searchPaginationHandler);

// ✅ ТЕКСТ — ТОЛЬКО ЕСЛИ АКТИВЕН ПОИСК
bot.on('message:text', async (ctx) => {
  if (ctx.session?.mode === 'search') {
    await searchTextHandler(ctx);
  }
});


// Профиль
bot.callbackQuery('profile', async (ctx) => {
  await ctx.editMessageText('👤 *Профиль пользователя*', {
    parse_mode: 'Markdown',
    reply_markup: new InlineKeyboard().text('Назад', 'home'),
  });
});

// О проекте
bot.callbackQuery('about', async (ctx) => {
  await ctx.editMessageText(
    'ℹ️ *blur* — онлайн-кинотеатр.\n\nПроект в активной разработке.',
    {
      parse_mode: 'Markdown',
      reply_markup: new InlineKeyboard().text('Назад', 'home'),
    }
  );
});

bot.catch(err => {
  console.error('BOT ERROR:', err.error);
});

// Запуск
bot.start();
console.log('🤖 Bot started');
