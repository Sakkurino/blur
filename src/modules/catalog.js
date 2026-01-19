import { InlineKeyboard } from 'grammy';
import { getAllFilms } from '../services/films.service.js';
import { safeEditOrReply } from '../utils/safeMessage.js';

const PAGE_SIZE = 5;

export async function catalogHandler(ctx, page = 0) {
  const films = getAllFilms();
  const totalPages = Math.ceil(films.length / PAGE_SIZE);

  const start = page * PAGE_SIZE;
  const pageFilms = films.slice(start, start + PAGE_SIZE);

  const keyboard = new InlineKeyboard();

  for (const film of pageFilms) {
    keyboard
      .text(`${film.title} (${film.year})`, `film_${film.kpId}`)
      .row();
  }

  const nav = new InlineKeyboard();
  if (page > 0) nav.text('⬅️', `catalog_page_${page - 1}`);
  nav.text('🏠 На главную', 'home');
  if (page < totalPages - 1) nav.text('➡️', `catalog_page_${page + 1}`);

  keyboard.row();
  keyboard.inline_keyboard.push(...nav.inline_keyboard);
  keyboard.row().text('🔍 Поиск', 'search');

  const text = `🎬 *Каталог*\n\nСтраница ${page + 1} из ${totalPages}`;

  await safeEditOrReply(ctx, text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}
