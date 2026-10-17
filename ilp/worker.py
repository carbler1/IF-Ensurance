"""Takes the next queued job, runs the pipeline, sets status and stage. DESIGN.md §6."""


def run_once(conn) -> bool:
    raise NotImplementedError


def main() -> None:
    raise NotImplementedError


if __name__ == "__main__":
    main()
