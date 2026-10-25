import os
from pathlib import Path

from dynaconf import Dynaconf

SECRETS_PATH = Path(__file__).resolve().parents[3] / ".secrets.toml"

settings = Dynaconf(
    envvar_prefix="CATALYST",
    settings_files=[str(SECRETS_PATH)],
    environments=True,
    default_env="default",
)


def get_openai_api_key() -> str:
    """Returns OpenAI API key from the single root .secrets.toml or environment."""
    try:
        key = settings.get("openai.api_key") or os.environ.get("OPENAI_API_KEY", "")
        return str(key).strip()
    except (KeyError, AttributeError, OSError):
        return os.environ.get("OPENAI_API_KEY", "")


def get_polygon_api_key() -> str:
    """Returns Polygon.io API key from the single root .secrets.toml or environment."""
    try:
        key = settings.get("data.polygon_api_key") or os.environ.get("POLYGON_API_KEY", "")
        return str(key).strip()
    except (KeyError, AttributeError, OSError):
        return os.environ.get("POLYGON_API_KEY", "")
