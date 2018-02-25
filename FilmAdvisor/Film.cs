using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FilmAdvisor
{
    public class Film : IFilm
    {
        public string Name { get; set; }

        public string Year { get; set; }

        public string Country { get; set; }

        public string[] Genre { get; set; }

        public string Rate { get; set; }

        public string Producer { get; set; }

        public Film(string name, string year)
        {
            Name = name;
            year = Year;
        }

        public override string ToString()
        {
            return String.Format("Name: {0}, Country: {1}, Year: {2}, Rate: {3}, Producer{4}",
                Name,
                Country,
                Year,
                Rate,
                Producer);
        }
    }
}
