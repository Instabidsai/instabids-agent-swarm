# This Dockerfile sets up the environment for the Media Processor Agent.
# It inherits from a base Python image and installs necessary dependencies for media processing,
# such as OpenCV for handling video frames and the LiveKit SDK.

FROM python:3.11-slim

# Install system dependencies required for OpenCV and other libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libgtk-3-dev \
    libatlas-base-dev \
    gfortran \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install specific dependencies for this agent
RUN pip install --no-cache-dir livekit-agents opencv-python-headless

# Copy application code
COPY . .

# Set the entrypoint for the agent
CMD ["python", "agents/media_processor/media_agent.py"]
