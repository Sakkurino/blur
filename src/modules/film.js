import { InlineKeyboard } from 'grammy';
import { getFilmByKpId } from '../services/films.service.js';
import { safeReplyWithPoster } from '../utils/safeMessage.js';

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
🎭 *Жанры:* ${genres || '—'}
🌍 *Страны:* ${countries || '—'}

📝 ${film.description || 'Описание отсутствует.'}`;

  const keyboard = new InlineKeyboard()
    .url('▶️ Смотреть', film.url || 'https://t.me')
    .row()
    .text('⬅️ Назад', 'catalog')
    .text('🏠 На главную', 'home');

  await safeReplyWithPoster(ctx, film.poster, text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}
