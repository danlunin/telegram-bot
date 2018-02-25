using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Helpers;
using System.Net.Http;
using System.Timers;
using Telegram.Bot.Types.Enums;

namespace TelegramBot {
    public class Bot : IBot {
        public TelegramBotClient bot { get; set; }
        //public int Offset { get; set; } = 0;
        //public long ChatId { get; set; }
        public Queue<long> Users { get; set; } = new Queue<long>();
        public List<long> ProcessingUsers { get; set; } = new List<long>();

        public Bot() {
            bot = new TelegramBotClient(Config.Token);
        }

        public User GetUser() {
            return new User(this, Users.Dequeue());
        }

        public void CloseUser(User user) {
            SendMessage("Enjoy your time!", user);
            ProcessingUsers.Remove(user.ChatId);
        }

        public void Run(User user) {
            StartAsync(user).Wait();
        }

        private async Task StartAsync(User user, string startMessage = "/start") {
            while (true) {
                var updates = await bot.GetUpdatesAsync(user.Offset);
                foreach (var update in updates) {
                    user.Offset = update.Id + 1;
                    if (update.Message.Text == startMessage && !ProcessingUsers.Contains(update.Message.Chat.Id)) {
                        Users.Enqueue(update.Message.Chat.Id);
                        ProcessingUsers.Add(update.Message.Chat.Id);
                        return;
                    }
                }
            }
        }


        public void Ask(Question q, User user) {
            SendMessage(q.QuestionText, user);
            GetAnswer(q, user).Wait();
        }

        private async Task GetAnswer(Question question, User user) {
            while (true) {
                var timer = new Stopwatch();
                timer.Start();
                var updates = await bot.GetUpdatesAsync(user.Offset);
                if (timer.Elapsed.Minutes > 0)
                {
                    throw new ClientException();
                }
                foreach (var update in updates) {
                    user.Offset = update.Id + 1;
                    if (update.Message.Chat.Id == user.ChatId) {
                        question.Answer = update.Message.Text;
                        return;
                    }
                }
            }
        }

        public void SendMessage(string message, User user) {
            _SendMessage(message, user).Wait();
        }

        private async Task _SendMessage(string message, User user) {
            await bot.SendChatActionAsync(user.ChatId, ChatAction.Typing);
            await Task.Delay(1000);
            await bot.SendTextMessageAsync(user.ChatId, message);
        }
    }
}