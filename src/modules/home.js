import { InlineKeyboard } from 'grammy';

export async function homeHandler(ctx) {
  const keyboard = new InlineKeyboard()
    .text('Каталог', 'catalog')
    .row()
    .text('Профиль', 'profile')
    .text('О проекте', 'about');

  const text = '🎬 *blur* — онлайн-кинотеатр в Telegram.';

  try {
    const message = ctx.callbackQuery?.message;

    // если сообщение текстовое — редактируем
    if (message?.text) {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
    // если было медиа — удаляем и шлём новое
    else if (message) {
      await ctx.api.deleteMessage(message.chat.id, message.message_id);
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    }
  } catch (err) {
    console.error('HOME ERROR:', err);
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    });
  }
}
