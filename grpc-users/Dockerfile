FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --system app && useradd --system --gid app --create-home app

COPY --chown=app:app app ./app

USER app

EXPOSE 50053

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import grpc; grpc.channel_ready_future(grpc.insecure_channel('localhost:50053')).result(timeout=3)" || exit 1

CMD ["python", "-m", "app.server"]
