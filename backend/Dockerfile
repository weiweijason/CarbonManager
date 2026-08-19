FROM python:3.13-alpine

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . . 

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application (app:app = app.py 中的 app 變數)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]

