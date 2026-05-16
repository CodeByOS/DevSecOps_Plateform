FROM python:3.11-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


FROM python:3.11-slim AS runner

RUN useradd --create-home --shell /bin/bash mluser

WORKDIR /app

COPY --from=builder /install /usr/local

COPY features.py model.py train.py app.py ./
RUN chown -R mluser:mluser /app

USER mluser

# Train model at build time
RUN python train.py

ENV PORT=5001
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 5001

CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "60", "app:app"]