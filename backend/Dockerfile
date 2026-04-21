FROM python:3.11-slim
WORKDIR /workspace

# Install runtime dependencies
RUN pip install --no-cache-dir fastapi uvicorn

# We copy the application code
COPY . .

WORKDIR /workspace/backend
EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
