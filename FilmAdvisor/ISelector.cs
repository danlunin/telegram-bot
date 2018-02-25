using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FilmAdvisor {
    public interface ISelector
    {
        IEnumerable<T> ReadCsv<T>(string filename);
        //List<string> SelectWithPreference<T>(Request request);
    }
}
