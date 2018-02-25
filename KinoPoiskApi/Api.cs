using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace KinoPoiskApi
{
    public class Api
    {
        private Parameters searchParameters;
        private List<RequiredValueType> requiredValues;
        public IRequester requester;
        public IParser parser;

        public Api()
        {
            searchParameters = new Parameters();
            requiredValues = new List<RequiredValueType>();
            requester = new Requester();
            parser = new Parser();
        }

        public Api AddSearchParameter(SearchParameterType type, string value)
        {
            searchParameters.Add(type, value);
            return this;
        }

        public Api AddRequiredValue(RequiredValueType valueType)
        {
            requiredValues.Add(valueType);
            return this;
        }

        public IEnumerable<M> Get<M>(int v) where M : IMovie
        {
            var response = requester.Search(searchParameters);
            var movieDicts = parser.GetMovies(response, requiredValues);
            foreach (var dict in movieDicts)
            {
                yield return DictTo<M>(dict);
            }
        }

        public M DictTo<M>(Dictionary<RequiredValueType, string> dict) where M : IMovie
        {
            var type = typeof (M);
            ConstructorInfo ctor = type.GetConstructor(new Type[] {});
            var result = ctor.Invoke(new object[] {});
            var propertyNames = type.GetProperties();
            foreach (var property in propertyNames)
            {
                var propertyInfo = type.GetProperty(property.Name);
                var key = (RequiredValueType) Enum.Parse(typeof (RequiredValueType), property.Name);
                if (dict.ContainsKey(key))
                {
                    propertyInfo.SetValue(result,
                        dict[(RequiredValueType) Enum.Parse(typeof (RequiredValueType), property.Name)]);
                }
            }
            return (M) result;
        }
    }
}
                
