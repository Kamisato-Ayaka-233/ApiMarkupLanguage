import httpx
import asyncio
from typing import Dict, List, Literal, Optional, Union
from . import constants

loop = asyncio.get_event_loop()

def request(
        method: constants.HttpRequestMethod, 
        url: str, 
        params: Optional[constants.StrDict] = None, 
        json: Optional[constants.JsonData] = None, 
        data: Optional[Union[str, bytes]] = None,
        headers: Optional[constants.StrDict] = None,
        cookies: Optional[constants.StrDict] = None,
        verify: bool = True
    ) -> httpx.Response:
    return httpx.request(method, url, params=params, data=data, json=json, headers=headers, cookies=cookies, verify=verify) # type: ignore

async def asyncRequest(
        method: constants.HttpRequestMethod, 
        url: str, 
        params: Optional[constants.StrDict] = None, 
        json: Optional[constants.JsonData] = None, 
        data: Optional[Union[str, bytes]] = None,
        headers: Optional[constants.StrDict] = None,
        cookies: Optional[constants.StrDict] = None,
        verify: bool = True
    ) -> httpx.Response:
    return await loop.run_in_executor(None, request, method, url, params, json, data, headers, cookies, verify)