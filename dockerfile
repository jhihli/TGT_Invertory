FROM python:3.13-slim
WORKDIR /app
COPY backend/server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/server/ .
ENV PYTHONUNBUFFERED=1
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]