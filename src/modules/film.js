import { InlineKeyboard } from 'grammy';
import { getFilmByKpId } from '../services/films.service.js';

const countryFlags = {
  США: '🇺🇸',
  Великобритания: '🇬🇧',
  Франция: '🇫🇷',
  Россия: '🇷🇺',
  Япония: '🇯🇵',
  Германия: '🇩🇪',
};

export async function filmHandler(ctx, kpId) {
  const film = getFilmByKpId(kpId);

  if (!film) {
    return ctx.answerCallbackQuery({
      text: '❌ Фильм не найден',
      show_alert: true,
    });
  }

  const countries = (film.countries || [])
    .map(c => `${countryFlags[c] || '🌍'} ${c}`)
    .join(', ');

  const genres = (film.genres || []).join(', ');

  const text = 
`🎬 *${film.title}* (${film.year})

⭐ *Рейтинг:* ${film.rating || '—'}
🎭 *Жанр:* ${genres || '—'}
🌍 *Страны:* ${countries || '—'}

📝 ${film.description || 'Описание отсутствует.'}`;

  const keyboard = new InlineKeyboard()
    .url('▶️ Смотреть', film.url || 'https://t.me')
    .row()
    .text('⬅️ Назад', 'catalog')
    .text('🏠 В меню', 'home');

  try {
    // ⚡ безопасно удаляем предыдущее сообщение
    if (ctx.callbackQuery?.message?.message_id) {
      await ctx.api.deleteMessage(
        ctx.callbackQuery.message.chat.id,
        ctx.callbackQuery.message.message_id
      );
    }

    // 📸 отправляем карточку
    if (film.poster) {
      await ctx.replyWithPhoto(film.poster, {
        caption: text,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (err) {
    console.error('BOT ERROR:', err);
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }
}
