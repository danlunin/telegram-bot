using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RestSharp;
using TelegramBot;
using System.Text.RegularExpressions;

namespace FilmAdvisor {
    public class Controller : IController {
        private IParser parser;
        private IRequester requester;

        public Controller(IParser parser, IRequester requester) {
            this.parser = parser;
            this.requester = requester;
        }

        public Question[] GetQuestions() {
            var genre = new Question("Введите жанр", QuestionType.Genre, "");
            var year = new Question("Введите год", QuestionType.Year, "");
            var country = new Question("Введите страну", QuestionType.Country, "");
            return new[] { genre, country, year };
        }

        public bool CheckAnswer(Question question) {
            return Regex.IsMatch(question.Answer, question.Pattern);
        }

        public IEnumerable<KeyValuePair<string, object>> GetDictionaryForRequest(
            Question[] questions, User user) {
            foreach (var q in questions) {
                try {
                    user.Bot.Ask(q, user);
                    
                } catch (ClientException) {
                    user.Dispose();
                    Console.WriteLine("Slow user!");
                }
                if (CheckAnswer(q)) {
                    Console.WriteLine(q.QuestionType.ToString() + " " + q.Answer);
                    yield return new KeyValuePair<string, object>(q.QuestionType.ToString(), q.Answer);
                }
            }
        }

        public List<IFilm> EarnFilms(IEnumerable<KeyValuePair<string, object>> requestDict, int amountOfFilms) {
            var rawResponse = requester.Search(new Parameters(requestDict));
            var films = parser.GetFilms(rawResponse);
            return films.Take(amountOfFilms).ToList();
        }

        public Task ProcessUserAsync(User user) {
            var t = new Task(() => ProcessUser(user));
            t.Start();
            return t;
        }

        public void ProcessUser(User user) {
            using (user) {
                var questions = GetQuestions();
                var request = GetDictionaryForRequest(questions, user);
                var films = EarnFilms(request, 10);
                foreach (var film in films) {
                    user.Bot.SendMessage(film.ToString(), user);
                    Console.WriteLine(film);
                }
            }
        }

    }

}