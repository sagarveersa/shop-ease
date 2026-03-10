import os
import socket
import time
from dotenv import load_dotenv

load_dotenv()

def env_flag(name: str, default: str = "true") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


def wait_for_tcp(host: str, port: int, service_name: str, timeout: int, interval: float = 1.0) -> None:
    start = time.time()
    while True:
        try:
            with socket.create_connection((host, port), timeout=3):
                print(f"{service_name} is available at {host}:{port}")
                return
        except OSError:
            elapsed = int(time.time() - start)
            if elapsed >= timeout:
                raise TimeoutError(f"Timed out waiting for {service_name} at {host}:{port}")
            print(f"Waiting for {service_name} at {host}:{port} ({elapsed}s/{timeout}s)")
            time.sleep(interval)


if __name__ == "__main__":
    timeout_seconds = int(os.getenv("WAIT_TIMEOUT", "90"))

    db_host = os.getenv("DB_HOST", "db")
    db_port = int(os.getenv("DB_PORT", os.getenv("DB_POST", "5432")))

    if env_flag("WAIT_FOR_DB", "true"):
        wait_for_tcp(db_host, db_port, "PostgreSQL", timeout_seconds)
