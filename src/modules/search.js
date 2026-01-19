import { InlineKeyboard } from 'grammy';
import { getAllFilms } from '../services/films.service.js';

const PAGE_SIZE = 1;

/* ===================== SEARCH START ===================== */

export async function searchHandler(ctx) {
  const text =
`🔍 *Поиск фильма*

Напиши название фильма:`;

  const keyboard = new InlineKeyboard()
    .text('Назад', 'catalog');

  let sentMessage;

  try {
    const message = ctx.callbackQuery?.message;

    if (message?.text) {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
      sentMessage = message;
    } else if (message) {
      await ctx.api.deleteMessage(message.chat.id, message.message_id);
      sentMessage = await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch {
    sentMessage = await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }

  ctx.session = {
    mode: 'search',
    searchMessageId: sentMessage.message_id,
    results: [],
    page: 0,
    cardMessageId: null,
  };
}

/* ===================== SEARCH INPUT ===================== */

export async function searchTextHandler(ctx) {
  if (!ctx.session || ctx.session.mode !== 'search') return;

  const query = ctx.message.text.trim().toLowerCase();
  await ctx.deleteMessage().catch(() => {});

  if (query.length < 2) {
    const warnText =
`🔍 *Поиск фильма*

Напиши название фильма:

⚠️ _Минимальная длина запроса — 2 символа_`;

    await ctx.api.editMessageText(
      ctx.chat.id,
      ctx.session.searchMessageId,
      warnText,
      { parse_mode: 'Markdown' }
    ).catch(() => {});
    return;
  }

  const films = getAllFilms();
  const results = films.filter(f =>
    f.title?.toLowerCase().includes(query) ||
    f.originalTitle?.toLowerCase().includes(query)
  );

  await ctx.api.deleteMessage(
    ctx.chat.id,
    ctx.session.searchMessageId
  ).catch(() => {});

  if (!results.length) {
    const keyboard = new InlineKeyboard()
      .text('Искать ещё', 'search')
      .row()
      .text('Назад', 'catalog');

    await ctx.reply('❌ Ничего не найдено', { reply_markup: keyboard });
    ctx.session = null;
    return;
  }

  ctx.session.results = results;
  ctx.session.page = 0;
  ctx.session.mode = 'search_results';

  await sendSearchCard(ctx);
}

/* ===================== CARD SENDER ===================== */

async function sendSearchCard(ctx) {
  const { results, page, cardMessageId } = ctx.session;
  const film = results[page];

  if (cardMessageId) {
    await ctx.api.deleteMessage(ctx.chat.id, cardMessageId).catch(() => {});
  }

  const caption =
`🎬 *${film.title}*
${film.originalTitle ? `_${film.originalTitle}_\n` : ''}
⭐ ${film.rating ?? '—'} | 📅 ${film.year}
🎭 ${film.genres.join(', ')}`;

  const keyboard = new InlineKeyboard();

  // ▶️ открыть карточку — ВСЕГДА первой
  keyboard.text('⬆️ Открыть', `film_${film.kpId}`).row();

  // ◀️ ▶️ пагинация — ВСЕГДА видна
  keyboard
    .text('◀️', 'search_prev')
    .text('▶️', 'search_next')
    .row();

  keyboard
    .text('🔍 Искать ещё', 'search')
    .text('Назад', 'catalog');

  const msg = await ctx.replyWithPhoto(film.poster, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });

  ctx.session.cardMessageId = msg.message_id;
}

/* ===================== PAGINATION ===================== */

export async function searchPaginationHandler(ctx) {
  if (!ctx.session || ctx.session.mode !== 'search_results') return;

  if (ctx.callbackQuery.data === 'search_next') {
    if (ctx.session.page < ctx.session.results.length - 1) {
      ctx.session.page++;
    }
  }

  if (ctx.callbackQuery.data === 'search_prev') {
    if (ctx.session.page > 0) {
      ctx.session.page--;
    }
  }

  await sendSearchCard(ctx);
}
