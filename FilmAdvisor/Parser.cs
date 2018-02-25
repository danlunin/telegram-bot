using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.RegularExpressions;
using RestSharp;

namespace FilmAdvisor
{
    public class Parser : IParser
    {
        public readonly Regex filmPageUrl;
        public readonly Dictionary<string, Regex> filmPageRegexes;
        public readonly Dictionary<string, Regex> SearchResultsRegexes;
        public readonly Regex entriesOnSearchResults;

        public Parser()
        {
            filmPageUrl = new Regex(@"^/film/\d+/$");
            entriesOnSearchResults = new Regex("<div class=\"info\">(.+?)</div>", RegexOptions.Singleline);
            filmPageRegexes = new Dictionary<string, Regex>();
            filmPageRegexes["year"] = new Regex("<td class=\"type\">год</td>.+title=\"\">([\\d –]+?)</a>", RegexOptions.Singleline);
            filmPageRegexes["name"] = new Regex("<h1 class=\"moviename-big\" itemprop=\"name\">(.+?)<");
            SearchResultsRegexes = new Dictionary<string, Regex>();
            SearchResultsRegexes["name"] = new Regex("<p class=\"name\">.*?data-type=\".*?\">(.+?)</a>", RegexOptions.Singleline);
            SearchResultsRegexes["year"] = new Regex("<span class=\"year\">(.+?)</span>", RegexOptions.Singleline);

        }
        public bool IsFilmPage(Uri url)
        {
            return filmPageUrl.IsMatch(url.AbsolutePath);
        }

        public Film ParseFilmPage(string html)
        {
            var year = GetMatch(filmPageRegexes["year"], html);
            var name = GetMatch(filmPageRegexes["name"], html);
            return new Film(name, year);
        }

        public string GetMatch(Regex regex, string text)
        {
            var match = regex.Match(text);
            if (!match.Success)
                throw new Exception("Pattern did not match");
            return match.Groups[1].Value.Trim();
        }

        public IEnumerable<Film> ParseSearchResults(string html)
        {
            foreach (var element in GetEntriesFromSearchResults(html))
            {
                yield return ParseFilmFromSearchResult(element);
            }

        }

        public IEnumerable<string> GetEntriesFromSearchResults(string html)
        {
            var matches = entriesOnSearchResults.Matches(html);
            var entries = matches
                .Cast<Group>();
            foreach (var entry in entries)
            {
                yield return entry.Value;
            }

        }

        public Film ParseFilmFromSearchResult(string html)
        {
            var year = GetMatch(SearchResultsRegexes["year"], html);
            var name = GetMatch(SearchResultsRegexes["name"], html);
            return new Film(name, year);
        }

        public IEnumerable<IFilm> GetFilms(IRestResponse response)
        {
            if (IsFilmPage(response.ResponseUri))
            {
                yield return ParseFilmPage(response.Content);
            }
            else
            {
                foreach (var film in ParseSearchResults(response.Content))
                {
                    yield return film;
                }
            }
        }
    }
}
