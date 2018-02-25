using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using RestSharp;

namespace KinoPoiskApi
{
    public class Requester : IRequester
    {
        private readonly Uri baseUrl;
        private readonly RestClient client;

        public Requester()
        {
            baseUrl = new Uri("http://kinopoisk.ru/");
            client = new RestClient();
            client.BaseUrl = baseUrl;
        }

        public IRestResponse Search(IParameters parameters)
        {
            var request = new RestRequest("s/", Method.GET);

            foreach (var param in parameters)
            {
                request.AddParameter(param.Key, param.Value);
            }

            var response = client.Execute(request);
            return response;
        }
    }
}
