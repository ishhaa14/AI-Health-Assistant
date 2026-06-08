FROM python:3.12-slim

# Install system dependencies needed for OCR, OpenCV and PostgreSQL connection
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install CPU version of PyTorch to minimize image size
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set EasyOCR cache directory and pre-fetch the English OCR model
ENV EASYOCR_MODULE_PATH=/app/.easyocr
RUN python -c "import easyocr; easyocr.Reader(['en'], model_storage_directory='/app/.easyocr')"

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Script to run migrations and start backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
