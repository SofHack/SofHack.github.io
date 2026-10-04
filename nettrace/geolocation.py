import ipaddress
from typing import Optional
import httpx


_GEO_CACHE: dict[str, dict] = {}
_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=5.0)
    return _client


def is_private_ip(value: str) -> bool:
    try:
        ip = ipaddress.ip_address(value)
        return not ip.is_global
    except ValueError:
        return True


async def geolocate(ip: str, client: Optional[httpx.AsyncClient] = None) -> dict:

    if not ip or is_private_ip(ip):
        return {
            "ip": ip,
            "geolocatable": False,
            "country": None,
            "city": None,
            "lat": None,
            "lon": None,
            "isp": None,
            "asn": None,
        }

    if ip in _GEO_CACHE:
        return _GEO_CACHE[ip]

    url = f"http://ip-api.com/json/{ip}"

    params = {
        "fields": (
            "status,message,country,countryCode,"
            "regionName,city,lat,lon,isp,org,as,query"
        )
    }

    http_client = client or get_http_client()

    try:
        response = await http_client.get(
            url,
            params=params,
        )

        response.raise_for_status()

        data = response.json()

        if data.get("status") != "success":
            result = {
                "ip": ip,
                "geolocatable": False,
            }
            _GEO_CACHE[ip] = result
            return result

        result = {
            "ip": ip,
            "geolocatable": True,
            "country": data.get("country"),
            "country_code": data.get("countryCode"),
            "region": data.get("regionName"),
            "city": data.get("city"),
            "lat": data.get("lat"),
            "lon": data.get("lon"),
            "isp": data.get("isp"),
            "org": data.get("org"),
            "asn": data.get("as"),
        }
        _GEO_CACHE[ip] = result
        return result

    except Exception as exc:

        return {
            "ip": ip,
            "geolocatable": False,
            "error": str(exc),
        }

