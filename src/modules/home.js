import { InlineKeyboard } from 'grammy';
import { safeEditOrReply } from '../utils/safeMessage.js';

export async function homeHandler(ctx) {
  const keyboard = new InlineKeyboard()
    .text('Каталог', 'catalog')
    .row()
    .text('Профиль', 'profile')
    .text('О проекте', 'about');

  const text = '🎬 *blur* — онлайн-кинотеатр в Telegram.';

  await safeEditOrReply(ctx, text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard,
  });
}
