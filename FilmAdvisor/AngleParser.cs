using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RestSharp;
using System.Text.RegularExpressions;

namespace FilmAdvisor {
    public class AngleParser : IParser {

        public IEnumerable<IFilm> GetFilms(IRestResponse response) {
            if (IsFilmPage(response.ResponseUri)) {
                yield return ParseFilmPage(response.Content);
            }
            else {
                foreach (var film in ParseSearchResults(response.Content)) {
                    yield return film;
                }
            }
        }

        public IEnumerable<IFilm> ParseSearchResults(string content) {
            throw new NotImplementedException();
        }

        public IFilm ParseFilmPage(string content) {
            var parser = new AngleSharp.Parser.Html.HtmlParser();
            var page = parser.Parse(content);

            //filmPageRegexes["name"] = new Regex("<h1 class=\"moviename-big\" itemprop=\"name\">(.+?)<");
            //filmPageRegexes["year"] = new Regex("<td class=\"type\">год</td>.+title=\"\">([\\d –]+?)</a>", RegexOptions.Singleline);
            var name_node = page.All
                .Where(m => m.ClassName == "moviename-big" & m.GetAttribute("itemprop") == "name")
                .First();
            var name = new Regex(" <.*>").Replace(name_node.InnerHtml, "");
            var year = page.All
                .Where(m => m.PreviousElementSibling != null)
                .Where(m => m.PreviousElementSibling.ClassName == "type" & m.PreviousElementSibling.TextContent == "год")
                .First()
                .Children
                .First()
                .Children
                .Where(m => !m.ClassList.Any())
                .First()
                .TextContent;
            return new Film(name, year);
        }

        public bool IsFilmPage(Uri url) {
            return new Regex(@"^/film/\d+/$").IsMatch(url.AbsolutePath);
        }
    }
}
