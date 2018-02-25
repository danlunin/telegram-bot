using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using RestSharp;

namespace KinoPoiskApi {
    public class Parser : IParser {
        private AngleSharp.Parser.Html.HtmlParser htmlParser;
        public readonly Regex moviePageUrl;
        public Dictionary<RequiredValueType, Func<string, string>> MoviePageParser;
        public Dictionary<RequiredValueType, Func<string, string>> SearchResultEntryParser;



        public Parser() {
            moviePageUrl = new Regex(@"^/film/\d+/$");
            htmlParser = new AngleSharp.Parser.Html.HtmlParser();

            MoviePageParser = new Dictionary<RequiredValueType, Func<string, string>> {
                [RequiredValueType.Country] = x => { throw new NotImplementedException(); },
                [RequiredValueType.Genre] = x => { throw new NotImplementedException(); },
                [RequiredValueType.Name] = x => {
                    var dom = htmlParser.Parse(x);
                    var element = dom
                        .QuerySelector("div#headerFilm>h1.moviename-big");
                    if (element.InnerHtml == element.TextContent)
                        return element.TextContent;
                    else
                        return Regex.Replace(element.InnerHtml, " <.*", "");
                },
                [RequiredValueType.Producer] = x => { throw new NotImplementedException(); },
                [RequiredValueType.Rate] = x => { throw new NotImplementedException(); },
                [RequiredValueType.Year] = x => {
                    var dom = htmlParser.Parse(x);
                    return dom.All
                        .Where(m => m.TagName == "td" && m.ClassName == "type" && m.TextContent == "год")
                        .First()
                        .NextElementSibling
                        .Children
                        .Where(m => m.TagName == "a")
                        .First()
                        .TextContent;
                },
            };

            SearchResultEntryParser = new Dictionary<RequiredValueType, Func<string, string>> {
                [RequiredValueType.Country] = x => {
                    var dom = htmlParser.Parse(x);
                    return dom
                        .QuerySelector("span.grey+span.grey")
                        .TextContent;
                },
                [RequiredValueType.Genre] = x => { throw new NotImplementedException(); },
                [RequiredValueType.Name] = x => {
                    var dom = htmlParser.Parse(x);
                    return dom
                        .QuerySelector("p.name>a")
                        .TextContent;
                },
                [RequiredValueType.Producer] = x => { throw new NotImplementedException(); },
                [RequiredValueType.Rate] = x => { throw new NotImplementedException(); },
                [RequiredValueType.Year] = x => {
                    var dom = htmlParser.Parse(x);
                    return dom
                        .QuerySelector("p.name>span.year")
                        .TextContent;
                },
            };
        }

        public IEnumerable<Dictionary<RequiredValueType, string>> GetMovies(IRestResponse response, IEnumerable<RequiredValueType> requiredValues) {
            if (IsMoviePage(response.ResponseUri))
                yield return ParseMoviePage(response.Content, requiredValues);
            else
                foreach (var dict in ParseSearchResultPage(response.Content, requiredValues))
                    yield return dict;
        }

        public bool IsMoviePage(Uri url) {
            return moviePageUrl.IsMatch(url.AbsolutePath);
        }

        public Dictionary<RequiredValueType, string> ParseMoviePage(string html, IEnumerable<RequiredValueType> requiredValues) {
            return ParseWithDict(html, requiredValues, MoviePageParser);
        }

        public IEnumerable<Dictionary<RequiredValueType, string>> ParseSearchResultPage(string html, IEnumerable<RequiredValueType> requiredValues) {
            foreach (var entry in GetEntriesFromSearchResults(html)) {
                yield return ParseSearchResultEntry(entry, requiredValues);
            }
        }

        public IEnumerable<string> GetEntriesFromSearchResults(string html) {
            var dom = htmlParser.Parse(html);
            foreach (var element in dom.QuerySelectorAll("div.info"))
                yield return element.InnerHtml;
        }

        public Dictionary<RequiredValueType, string> ParseSearchResultEntry(string html, IEnumerable<RequiredValueType> requiredValues) {
            return ParseWithDict(html, requiredValues, SearchResultEntryParser);
        }

        public Dictionary<RequiredValueType, string> ParseWithDict(string html, IEnumerable<RequiredValueType> requiredValues, Dictionary<RequiredValueType, Func<string, string>> funcDict) {
            var dict = new Dictionary<RequiredValueType, string>();
            foreach (var reqVal in requiredValues) {
                dict.Add(reqVal, SafeParse(funcDict[reqVal], html));
            }
            return dict;
        }

        public string SafeParse(Func<string, string> pFunc, string text) {
            try {
                return pFunc(text);
            }
            catch (NullReferenceException) {
                return "";
            }
        }
    }
}