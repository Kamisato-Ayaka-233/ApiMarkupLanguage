from typing import Dict, List, Union, Any, Literal

__all__ = [
    'HttpRequestMethod',
    'StrDict',
    'JsonData',
    'JsonArray',
    'JsonObject'
]

HttpRequestMethod = Literal['get', 'GET', 'post', 'POST', 'put', 'PUT', 'delete', 'DELETE', 'head', 'HEAD', 'patch', 'PATCH', 'options', 'OPTIONS']

StrDict = Dict[str, Any]

JsonObject = Dict[str, 'JsonData']
JsonArray = List[Union[JsonObject, 'JsonArray', 'JsonData']]
JsonData = Union[str, int, float, bool, None, JsonObject, JsonArray]

