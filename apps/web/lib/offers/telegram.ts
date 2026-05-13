const TG_MAX = 3900;

/**
 * Отправка алерта в Telegram; длинный текст режется на несколько сообщений.
 */
export async function sendTelegramAlert(fullText: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы");
    return;
  }

  const chunks: string[] = [];
  for (let i = 0; i < fullText.length; i += TG_MAX) {
    chunks.push(fullText.slice(i, i + TG_MAX));
  }

  for (let i = 0; i < chunks.length; i++) {
    const part = chunks[i];
    const prefix = chunks.length > 1 ? `[${i + 1}/${chunks.length}]\n` : "";
    const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `${prefix}${part}`,
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("[telegram] sendMessage failed:", res.status, t);
    }
  }
}
