using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RestSharp;

namespace KinoPoiskApi
{
    public interface IRequester
    {
        IRestResponse Search(IParameters parameters);
    }
}
