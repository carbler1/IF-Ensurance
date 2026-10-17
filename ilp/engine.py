"""Risk list, partners, maintenance dates. Code decides. DESIGN.md §7."""


def risk_list(conn, home_id: str) -> list[dict]:
    """Matched entries with texts, by severity x probability, LLM-proposed last, at most 5."""
    raise NotImplementedError


def risk_detail(conn, home_id: str, risk_id: str) -> dict:
    """The risk, its evidence quotes and up to 3 partners."""
    raise NotImplementedError


def maintenance(conn, home_id: str) -> list[dict]:
    """Due date = last known date + check_interval_years, or today."""
    raise NotImplementedError
