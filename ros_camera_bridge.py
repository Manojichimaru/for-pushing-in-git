#!/usr/bin/env python3

import os
import socket
import threading
from flask import Flask, send_from_directory, make_response
from flask_cors import CORS

# Flask app setup
app = Flask(__name__)
# Enable CORS for all routes
CORS(app)
app_thread = None

# Directory where HTML, JS, and other static files are located
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

# Get local IP address
def get_local_ip():
    try:
        # Get hostname
        hostname = socket.gethostname()
        
        # Get all IP addresses associated with the hostname
        ip_addresses = socket.gethostbyname_ex(hostname)[2]
        
        # Filter out localhost (127.0.0.1) and return the first valid IP
        for ip in ip_addresses:
            if ip != '127.0.0.1' and not ip.startswith('172.'):
                return ip
        
        # If no suitable IP found, try a different approach
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))  # Connect to Google DNS
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        print(f"Error getting local IP: {e}")
        return "localhost"

# Flask routes
@app.route('/')
def index():
    response = make_response(send_from_directory(STATIC_DIR, 'automind-dynamics-dashboard.html'))
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/<path:path>')
def serve_static(path):
    response = make_response(send_from_directory(STATIC_DIR, path))
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

def start_flask_app(port=5000):
    """Start the Flask app"""
    host = '0.0.0.0'  # Allow connections from any IP
    print(f"Starting web server at http://{host}:{port}")
    app.run(host=host, port=port, debug=False, use_reloader=False)

def print_access_urls(port=5000):
    """Print access URLs in a prominent way"""
    local_ip = get_local_ip()
    
    # Create a box around the URLs for visibility
    box_width = 80
    separator = "=" * box_width
    
    print("\n" + separator)
    print(" AUTOMIND DYNAMICS DASHBOARD - ACCESS INFORMATION ".center(box_width, "="))
    print(separator)
    print(f"Local access:     http://localhost:{port}")
    print(f"Network access:   http://{local_ip}:{port}")
    print(f"Mobile devices:   Connect to the same network and enter: {local_ip}:{port}")
    print(separator)
    print(" Copy and share any of these URLs to allow others to access the dashboard ".center(box_width, "="))
    print(separator)
    print(" NOTE: Make sure rosbridge_server is running on the ROS master ".center(box_width, "="))
    print(" (typically: roslaunch rosbridge_server rosbridge_websocket.launch) ".center(box_width, "="))
    print(separator + "\n")

if __name__ == '__main__':
    try:
        # Set port
        port = 5000
        
        # Print access information
        print_access_urls(port)
        
        # Start Flask server
        start_flask_app(port)
        
    except KeyboardInterrupt:
        print("Server stopped by user")
    except Exception as e:
        print(f"Error: {e}") 