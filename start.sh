#!/bin/bash

# Install Python dependencies
echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd ../frontend
npm install

# Build frontend for production
echo "Building frontend..."
npm run build

# Go back to root
cd ..

# Start the backend server
echo "Starting FastAPI server..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# Start the frontend development server (for development)
echo "Starting frontend development server..."
cd ../frontend
npm run dev -- --host 0.0.0.0 --port 5173 &

# Wait for both processes
wait
