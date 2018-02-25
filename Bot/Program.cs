using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace TelegramBot
{
    class Program
    {
        public static void Main(string[] args)
        {
            testApiAsync();
        }

        static async void testApiAsync()
        {
            var Bot = new Telegram.Bot.Api("your API access Token");
            var me = await Bot.GetMeAsync();
            System.Console.WriteLine("Hello my name is " + me.FirstName);
        }
    }
}
