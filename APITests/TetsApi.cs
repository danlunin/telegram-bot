using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using FakeItEasy;
using KinoPoiskApi;
using NUnit.Framework;
using NUnit.Framework.Api;
using TelegramBot;
using RestSharp;
using IParameters = FilmAdvisor.IParameters;
using IParser = FilmAdvisor.IParser;
using IRequester = FilmAdvisor.IRequester;


namespace APITests {
    [TestFixture]
    public class TestsApi {
        private KinoPoiskApi.IParser parser;
        private KinoPoiskApi.IRequester requester;
        private Api api;
        private User user;

        [SetUp]
        public void SetUp() {
            api = new Api();
            parser = A.Fake<KinoPoiskApi.IParser>();
            requester = A.Fake<KinoPoiskApi.IRequester>();
            api.parser = parser;
            api.requester = requester;
            api.AddSearchParameter(SearchParameterType.Genre, "ужасы");
            api.AddRequiredValue(RequiredValueType.Genre);
            //questions[0].Answer = "драма";
            //questions[1].Answer = "россия";
            //questions[2].Answer = "2000";
            //user = new User(bot);

        }

        [Test]
        public void TestRequesterSearch()
        {
            api.Get<Movie>(1).ToList();
            A.CallTo(() => api.requester.Search(A<Parameters>.Ignored))
                .MustHaveHappened(Repeated.Exactly.Once);
        }

        [Test]
        public void TestParserGet() {
            api.Get<Movie>(1).ToList();
            A.CallTo(() => api.parser.GetMovies(A<IRestResponse>.Ignored, A<IEnumerable<RequiredValueType>>.Ignored))
                .MustHaveHappened(Repeated.Exactly.Once);
        }

        [Test]
        public void TestDictTo()
        {
            var dict = new Dictionary<RequiredValueType, string>();
            var country = "Россия";
            dict[RequiredValueType.Country] = country;
            var d = api.DictTo<Movie>(dict);
            Console.WriteLine(d);
            Assert.AreEqual(country, d.Country);
        }
        //[Test]
        //public void TestCheckAnswer() {
        //    questions[1].Answer = "1980";
        //    Assert.True(controller.CheckAnswer(questions[1]));
        //}

        //[Test]
        //public void TestEarnFilms() {
        //    controller.EarnFilms(
        //        controller.GetDictionaryForRequest(questions, user),
        //        4);
        //    A.CallTo(() => requester.Search(A<IParameters>.Ignored))
        //        .MustHaveHappened(Repeated.Exactly.Once);
        //}

        //[Test]
        //public void TestEarnFilms2() {
        //    controller.EarnFilms(
        //        controller.GetDictionaryForRequest(questions, user),
        //        4);
        //    A.CallTo(() => parser.GetFilms(A<IRestResponse>.Ignored))
        //        .MustHaveHappened(Repeated.Exactly.Once);
        //}

        //[Test]
        //public void TestAskBot() {
        //    controller.EarnFilms(
        //        controller.GetDictionaryForRequest(questions, user),
        //        4);
        //    A.CallTo(() => bot.Ask(A<Question>.Ignored, A<User>.Ignored))
        //        .MustHaveHappened(Repeated.Exactly.Times(3));
        //}

    }
}