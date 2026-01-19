/**
 * Безопасно заменяет текущее сообщение:
 * - если текст → editMessageText
 * - если медиа → delete + reply
 */
export async function safeEditOrReply(ctx, text, options = {}) {
  const message = ctx.callbackQuery?.message;

  try {
    // ✅ если сообщение текстовое — редактируем
    if (message?.text) {
      return await ctx.editMessageText(text, options);
    }

    // ✅ если сообщение медиа — удаляем и отправляем новое
    if (message) {
      await ctx.api.deleteMessage(message.chat.id, message.message_id);
      return await ctx.reply(text, options);
    }

    // fallback
    return await ctx.reply(text, options);
  } catch (err) {
    console.error('safeEditOrReply ERROR:', err);
    return await ctx.reply(text, options);
  }
}

/**
 * Безопасно отправляет карточку с постером
 */
export async function safeReplyWithPoster(ctx, poster, text, options = {}) {
  const message = ctx.callbackQuery?.message;

  try {
    if (message) {
      await ctx.api.deleteMessage(message.chat.id, message.message_id);
    }

    if (poster) {
      return await ctx.replyWithPhoto(poster, {
        caption: text,
        ...options,
      });
    }

    return await ctx.reply(text, options);
  } catch (err) {
    console.error('safeReplyWithPoster ERROR:', err);
    return await ctx.reply(text, options);
  }
}
