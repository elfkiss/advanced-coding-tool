#!/usr/bin/env python3
"""SearXNG CLI - Privacy-respecting metasearch via your local instance."""

import argparse
import os
import sys
import json
import ssl
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from urllib.error import URLError

# Create SSL context that ignores verification (for local self-signed certs)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

SEARXNG_URL = os.getenv("SEARXNG_URL", "http://localhost:8080")

def search_searxng(
    query: str,
    limit: int = 10,
    category: str = "general",
    language: str = "auto",
    time_range: str = None
) -> dict:
    """Search using SearXNG instance."""
    params = {
        "q": query,
        "format": "json",
        "categories": category,
    }
    
    if language != "auto":
        params["language"] = language
    
    if time_range:
        params["time_range"] = time_range
    
    try:
        url = f"{SEARXNG_URL}/search?{urlencode(params)}"
        req = Request(url, headers={
            "User-Agent": "OpenClaw SearXNG Skill"
        })
        
        with urlopen(req, context=ssl_context, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        # Limit results
        if "results" in data:
            data["results"] = data["results"][:limit]
        
        return data
        
    except URLError as e:
        print(f"Error connecting to SearXNG: {e}", file=sys.stderr)
        return {"error": str(e), "results": []}
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return {"error": str(e), "results": []}


def display_results_json(data: dict):
    """Display results in JSON format for programmatic use."""
    print(json.dumps(data, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(
        description="SearXNG CLI - Search the web via your local SearXNG instance",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Examples:
  %(prog)s search "python asyncio"
  %(prog)s search "climate change" -n 20

Environment:
  SEARXNG_URL: SearXNG instance URL (default: {SEARXNG_URL})
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Search command
    search_parser = subparsers.add_parser("search", help="Search the web")
    search_parser.add_argument("query", nargs="+", help="Search query")
    search_parser.add_argument(
        "-n", "--limit",
        type=int,
        default=10,
        help="Number of results (default: 10)"
    )
    search_parser.add_argument(
        "-c", "--category",
        default="general",
        choices=["general", "images", "videos", "news", "map", "music", "files", "it", "science"],
        help="Search category (default: general)"
    )
    search_parser.add_argument(
        "-l", "--language",
        default="auto",
        help="Language code (auto, en, de, fr, etc.)"
    )
    search_parser.add_argument(
        "-t", "--time-range",
        choices=["day", "week", "month", "year"],
        help="Time range filter"
    )
    search_parser.add_argument(
        "-f", "--format",
        choices=["table", "json"],
        default="json",
        help="Output format (default: json)"
    )
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    if args.command == "search":
        query = " ".join(args.query)
        
        data = search_searxng(
            query=query,
            limit=args.limit,
            category=args.category,
            language=args.language,
            time_range=args.time_range
        )
        
        display_results_json(data)


if __name__ == "__main__":
    main()
