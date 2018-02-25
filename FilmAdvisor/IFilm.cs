using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FilmAdvisor {
    public interface IFilm
    {


        string Name { get; set; }
        string[] Genre { get; set; }

        string Year { get; set; }

        string Rate { get; set; }

        string Country { get; set; }

        string Producer { get; set; }


    }
}
