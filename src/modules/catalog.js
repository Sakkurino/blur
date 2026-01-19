import { InlineKeyboard } from 'grammy';
import { getAllFilms } from '../services/films.service.js';

const PAGE_SIZE = 5;

export async function catalogHandler(ctx, page = 0) {
  const films = getAllFilms();
  const totalPages = Math.ceil(films.length / PAGE_SIZE);

  const start = page * PAGE_SIZE;
  const pageFilms = films.slice(start, start + PAGE_SIZE);

  const keyboard = new InlineKeyboard();

  // 🎬 фильмы
  for (const film of pageFilms) {
    keyboard
      .text(`${film.title} (${film.year})`, `film_${film.kpId}`)
      .row();
  }

  // ⬅️ ◀️ ▶️ — ВСЕ В ОДНОЙ СТРОКЕ
  const navRow = new InlineKeyboard();

  if (page > 0) {
    navRow.text('Назад', `catalog_page_${page - 1}`);
  }

  navRow.text('В меню', 'home');

  if (page < totalPages - 1) {
    navRow.text('Далее', `catalog_page_${page + 1}`);
  }

  keyboard.row();
  keyboard.inline_keyboard.push(...navRow.inline_keyboard);

  // 🔍 поиск — отдельно
  keyboard
    .row()
    .text('🔍 Поиск', 'search');

  const text = `🎬 *Каталог фильмов*\n\nСтраница ${page + 1} из ${totalPages}`;

  try {
    const message = ctx.callbackQuery?.message;

    if (message?.text) {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else if (message) {
      await ctx.api.deleteMessage(message.chat.id, message.message_id);
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (err) {
    console.error('CATALOG ERROR:', err);
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }
}
