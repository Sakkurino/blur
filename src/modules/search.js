import { InlineKeyboard } from 'grammy';
import { getAllFilms } from '../services/films.service.js';
import { safeEditOrReply, safeReplyWithPoster } from '../utils/safeMessage.js';

export async function searchHandler(ctx) {
  const text =
`🔍 *Поиск фильма*

Напиши название фильма:`;

  const keyboard = new InlineKeyboard()
    .text('⬅️ Назад', 'catalog');

  await safeEditOrReply(ctx, text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });

  ctx.session = {
    mode: 'search',
    results: [],
    page: 0,
  };
}

export async function searchTextHandler(ctx) {
  if (!ctx.session || ctx.session.mode !== 'search') return;

  const query = ctx.message.text.trim().toLowerCase();
  await ctx.deleteMessage().catch(() => {});

  if (query.length < 2) {
    const warn =
`🔍 *Поиск фильма*

Напиши название фильма:

⚠️ _Минимальная длина запроса — 2 символа_`;

    await safeEditOrReply(ctx, warn, { parse_mode: 'Markdown' });
    return;
  }

  const films = getAllFilms();
  const results = films.filter(f =>
    f.title?.toLowerCase().includes(query) ||
    f.originalTitle?.toLowerCase().includes(query)
  );

  if (!results.length) {
    const kb = new InlineKeyboard()
      .text('🔄 Искать ещё', 'search')
      .row()
      .text('⬅️ Назад', 'catalog');

    await safeEditOrReply(ctx, '❌ Ничего не найдено', {
      reply_markup: kb,
    });

    ctx.session = null;
    return;
  }

  ctx.session = {
    mode: 'search_results',
    results,
    page: 0,
  };

  await sendSearchCard(ctx);
}

async function sendSearchCard(ctx) {
  const { results, page } = ctx.session;
  const film = results[page];

  const text =
`🎬 *${film.title}*
${film.originalTitle ? `_${film.originalTitle}_\n` : ''}
⭐ ${film.rating ?? '—'} | 📅 ${film.year}
🎭 ${(film.genres || []).join(', ')}`;

  const keyboard = new InlineKeyboard()
    .text('⬆️ Открыть', `film_${film.kpId}`)
    .row()
    .text('◀️', 'search_prev')
    .text('▶️', 'search_next')
    .row()
    .text('🔍 Искать ещё', 'search')
    .text('⬅️ Назад', 'catalog');

  await safeReplyWithPoster(ctx, film.poster, text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}

export async function searchPaginationHandler(ctx) {
  if (!ctx.session || ctx.session.mode !== 'search_results') return;

  if (ctx.callbackQuery.data === 'search_next') {
    ctx.session.page = Math.min(
      ctx.session.page + 1,
      ctx.session.results.length - 1
    );
  }

  if (ctx.callbackQuery.data === 'search_prev') {
    ctx.session.page = Math.max(ctx.session.page - 1, 0);
  }

  await sendSearchCard(ctx);
}
