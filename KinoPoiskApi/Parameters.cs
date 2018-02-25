﻿using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace KinoPoiskApi
{
    public class Parameters : IParameters
    {
        private Dictionary<string, object> parameters { get; }
        private Dictionary<SearchParameterType, Func<string, object>> valueToParameter { get; }
        private Dictionary<string, int> countriesMapping { get; }
        private Dictionary<string, int> genresMapping { get; }

        public Parameters()
        {
            parameters = new Dictionary<string, object> {
                ["level"] = 7,
                ["from"] = "forma",
                ["result"] = "adv",
                ["m_act[from]"] = "forma",
                ["m_act[what]"] = "content"
            };

            #region set genresMapping
            var genresMapping = new Dictionary<string, int> {
                ["аниме"] = 1750,
                ["биография"] = 22,
                ["боевик"] = 3,
                ["вестерн"] = 13,
                ["военный"] = 19,
                ["детектив"] = 17,
                ["детский"] = 456,
                ["для взрослых"] = 20,
                ["документальный"] = 12,
                ["драма"] = 8,
                ["игра"] = 27,
                ["история"] = 23,
                ["комедия"] = 6,
                ["концерт"] = 1747,
                ["короткометражка"] = 15,
                ["криминал"] = 16,
                ["мелодрама"] = 7,
                ["музыка"] = 21,
                ["мультфильм"] = 14,
                ["мюзикл"] = 9,
                ["новости"] = 28,
                ["приключения"] = 10,
                ["реальное ТВ"] = 25,
                ["семейный"] = 11,
                ["спорт"] = 24,
                ["триллер"] = 4,
                ["ужасы"] = 1,
                ["фантастика"] = 2,
                ["фэнтези"] = 5,
                ["церемония"] = 1751
            };
            #endregion

            #region set countriesMapping
            countriesMapping = new Dictionary<string, int> {
                ["россия"] = 2,
                ["сша"] = 1,
                ["ссср"] = 13,
                ["австралия"] = 25,
                ["австрия"] = 57,
                ["азербайджан"] = 136,
                ["албания"] = 120,
                ["алжир"] = 20,
                ["американские виргинские острова"] = 1026,
                ["американское самоа"] = 1062,
                ["ангола"] = 139,
                ["андорра"] = 159,
                ["антарктида"] = 1044,
                ["антигуа и барбуда"] = 1030,
                ["антильские острова"] = 1009,
                ["аргентина"] = 24,
                ["армения"] = 89,
                ["аруба"] = 175,
                ["афганистан"] = 113,
                ["багамы"] = 124,
                ["бангладеш"] = 75,
                ["барбадос"] = 105,
                ["бахрейн"] = 164,
                ["беларусь"] = 69,
                ["белиз"] = 173,
                ["бельгия"] = 41,
                ["бенин"] = 140,
                ["берег слоновой кости"] = 109,
                ["бермуды"] = 1004,
                ["бирма"] = 148,
                ["болгария"] = 63,
                ["боливия"] = 118,
                ["босния"] = 178,
                ["ботсвана"] = 145,
                ["бразилия"] = 10,
                ["бурунди"] = 162,
                ["вутан"] = 114,
                ["вануату"] = 1059,
                ["великобритания"] = 11,
                ["венгрия"] = 49,
                ["венесуэла"] = 72,
                ["внешние малые острова сша"] = 1064,
                ["восточная сахара"] = 1043,
                ["вьетнам"] = 52,
                ["вьетнам северный"] = 170,
                ["габон"] = 127,
                ["гаити"] = 99,
                ["гайана"] = 165,
                ["гамбия"] = 1040,
                ["гана"] = 144,
                ["гваделупа"] = 142,
                ["гватемала"] = 135,
                ["гвинея"] = 129,
                ["германия"] = 3,
                ["гибралтар"] = 1022,
                ["гондурас"] = 112,
                ["гонконг"] = 28,
                ["гренада"] = 1060,
                ["гренландия"] = 117,
                ["греция"] = 55,
                ["грузия"] = 61,
                ["гуам"] = 1045,
                ["дания"] = 4,
                ["демократическая республика конго"] = 1037,
                ["джибути"] = 1028,
                ["доминика"] = 1031,
                ["доминикана"] = 128,
                ["египет"] = 101,
                ["заир"] = 155,
                ["замбия"] = 133,
                ["зимбабве"] = 104,
                ["израиль"] = 42,
                ["индия"] = 29,
                ["индонезия"] = 73,
                ["иордания"] = 154,
                ["ирак"] = 90,
                ["иран"] = 48,
                ["ирландия"] = 38,
                ["исландия"] = 37,
                ["испания"] = 15,
                ["италия"] = 14,
                ["йемен"] = 169,
                ["казахстан"] = 122,
                ["каймановы острова"] = 1051,
                ["камбоджа"] = 84,
                ["камерун"] = 95,
                ["канада"] = 6,
                ["катар"] = 1002,
                ["кения"] = 100,
                ["кипр"] = 64,
                ["кирибати"] = 1024,
                ["китай"] = 31,
                ["колумбия"] = 56,
                ["коморы"] = 1058,
                ["конго"] = 134,
                ["корея"] = 156,
                ["корея северная"] = 137,
                ["корея южная"] = 26,
                ["косово"] = 1013,
                ["куба"] = 76,
                ["кувейт"] = 147,
                ["кыргызстан"] = 86,
                ["лаос"] = 149,
                ["латвия"] = 54,
                ["лесото"] = 1015,
                ["либерия"] = 176,
                ["ливан"] = 97,
                ["ливия"] = 126,
                ["литва"] = 123,
                ["лихтенштейн"] = 125,
                ["люксембург"] = 59,
                ["маврикий"] = 115,
                ["мавритания"] = 67,
                ["мадагаскар"] = 150,
                ["макао"] = 153,
                ["македония"] = 80,
                ["малави"] = 1025,
                ["малайзия"] = 83,
                ["мали"] = 151,
                ["мальдивы"] = 1050,
                ["мальта"] = 111,
                ["марокко"] = 43,
                ["мартиника"] = 102,
                ["маршалловы острова"] = 1067,
                ["масаи"] = 1042,
                ["мексика"] = 17,
                ["мелкие отдаленные острова сша"] = 1041,
                ["мозамбик"] = 81,
                ["молдова"] = 58,
                ["монако"] = 22,
                ["монголия"] = 132,
                ["монтсеррат"] = 1065,
                ["мьянма"] = 1034,
                ["намибия"] = 91,
                ["непал"] = 106,
                ["нигер"] = 157,
                ["нигерия"] = 110,
                ["нидерланды"] = 12,
                ["никарагуа"] = 138,
                ["новая зеландия"] = 35,
                ["новая каледония"] = 1006,
                ["норвегия"] = 33,
                ["оаэ"] = 119,
                ["оккупированная палестинская территория"] = 1019,
                ["оман"] = 1003,
                ["остров Мэн"] = 1052,
                ["остров Святой Елены"] = 1047,
                ["острова кука"] = 1063,
                ["острова теркс и кайкос"] = 1007,
                ["пакистан"] = 74,
                ["палау"] = 1057,
                ["палестина"] = 78,
                ["панама"] = 107,
                ["парагвай"] = 143,
                ["перу"] = 23,
                ["польша"] = 32,
                ["португалия"] = 36,
                ["пуэрто рико"] = 82,
                ["реюньон"] = 1036,
                ["российская империя"] = 1033,
                ["россия"] = 2,
                ["руанда"] = 103,
                ["сумыния"] = 46,
                ["сальвадор"] = 121,
                ["самоа"] = 1039,
                ["саудовская аравия"] = 158,
                ["свазиленд"] = 1029,
                ["сейшельские острова"] = 1010,
                ["сенегал"] = 65,
                ["сербия"] = 177,
                ["сербия и черногория"] = 174,
                ["сиам"] = 1021,
                ["сингапур"] = 45,
                ["сирия"] = 98,
                ["словакия"] = 94,
                ["словения"] = 40,
                ["соломоновы острова"] = 1069,
                ["сомали"] = 160,
                ["ссср"] = 13,
                ["судан"] = 167,
                ["суринам"] = 171,
                ["сша"] = 1,
                ["таджикистан"] = 70,
                ["таиланд"] = 44,
                ["тайвань"] = 27,
                ["танзания"] = 130,
                ["того"] = 161,
                ["тонга"] = 1012,
                ["тринидад и Тобаго"] = 88,
                ["тувалу"] = 1053,
                ["тунис"] = 50,
                ["туркменистан"] = 152,
                ["турция"] = 68,
                ["уганда"] = 172,
                ["узбекистан"] = 71,
                ["украина"] = 62,
                ["уругвай"] = 79,
                ["фарерские острова"] = 1008,
                ["федеративные штаты микронезии"] = 1038,
                ["фиджи"] = 166,
                ["филиппины"] = 47,
                ["финляндия"] = 7,
                ["франция"] = 8,
                ["Французская Гвиана"] = 1032,
                ["французская Полинезия"] = 1046,
                ["хорватия"] = 85,
                ["цар"] = 141,
                ["чад"] = 77,
                ["черногория"] = 1020,
                ["чехия"] = 34,
                ["чехословакия"] = 16,
                ["чили"] = 51,
                ["швейцария"] = 21,
                ["швеция"] = 5,
                ["эквадор"] = 96,
                ["экваториальная Гвинея"] = 1061,
                ["эритрея"] = 87,
                ["эстония"] = 53,
                ["эфиопия"] = 168,
                ["юАР"] = 30,
                ["югославия"] = 19,
                ["ямайка"] = 93,
                ["япония"] = 9
            };
            #endregion

            valueToParameter = new Dictionary<SearchParameterType, Func<string, object>> {
                [SearchParameterType.Genre] = x => {
                    if (!genresMapping.ContainsKey(x))
                        throw new ArgumentException();
                    return genresMapping[x];
                },
                [SearchParameterType.Country] = x => {
                    if (!countriesMapping.ContainsKey(x))
                        throw new ArgumentException();
                    return genresMapping[x];
                },
                [SearchParameterType.From_Year] = x => x,
                [SearchParameterType.To_Year] = x => x,
                [SearchParameterType.Year] = x => x,
                [SearchParameterType.Actor] = x => x
            };
        }

        public void Add(SearchParameterType name, string value) {
            parameters.Add(name.ToString(), valueToParameter[name](value));
        }

        public IEnumerator<KeyValuePair<string, object>> GetEnumerator()
        {
            return parameters.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return parameters.GetEnumerator();
        }
    }
}