using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TelegramBot
{
    public class User : IDisposable
    {

        public long ChatId { get; set; }
        public int Offset { get; set; }
        public IBot Bot;

        public User(IBot bot, long chatId = 0, int offset = 0)
        {
            ChatId = chatId;
            Offset = offset;
            Bot = bot;
        }

        public void Dispose()
        {
            Bot.CloseUser(this);
        }
    }
}
