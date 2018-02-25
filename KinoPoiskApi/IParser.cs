using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RestSharp;

namespace KinoPoiskApi
{
    public interface IParser
    {
        IEnumerable<Dictionary<RequiredValueType, string>> GetMovies(IRestResponse response, IEnumerable<RequiredValueType> requiredValues);
    }
}
