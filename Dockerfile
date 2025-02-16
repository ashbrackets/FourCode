# Use an official Python runtime as the base image
FROM python:3.12-slim

# Install system dependencies required for compiling C code
RUN apt-get update && \
    apt-get install -y gcc build-essential && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python dependencies file first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the package.json and install npm dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy the entire project
COPY . .

# Make port available (Render uses $PORT environment variable)
ENV PORT 5000
EXPOSE $PORT

# Run the Flask application using Gunicorn
CMD gunicorn --bind 0.0.0.0:$PORT app:app