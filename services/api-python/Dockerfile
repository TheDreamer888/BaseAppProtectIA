FROM fedora:41 AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN dnf install -y --setopt=install_weak_deps=False python3.12 python3.12-pip \
    && dnf clean all \
    && alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1

RUN python3 -m pip install --no-cache-dir poetry==2.2.1

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-root --only main

COPY src ./src

RUN useradd --create-home --shell /sbin/nologin appuser
USER appuser

EXPOSE 8000
HEALTHCHECK CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
