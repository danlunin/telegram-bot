using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TelegramBot
{
    public interface IBot
    {
        User GetUser();
        void CloseUser(User user);

        void Run(User user);
        void Ask(Question q, User user);
        void SendMessage(string message, User user);
    }
}
