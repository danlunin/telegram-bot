using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TelegramBot;

namespace FilmAdvisor
{
    public class Program
    {
        public static async void Start(Controller c, User user)
        {
            await c.ProcessUserAsync(user);
        }

        public static void Main(string[] args)
        {
            var c = new Controller(new Parser(), new Requester());
            var bot = new Bot();
            while (true)
            {
                var user = new User(bot);
                bot.Run(user);
                Start(c, bot.GetUser());
            }
        }
    }
}
