#!/usr/bin/env python
import http.server
import socketserver
import os
import socket

# Configure the proper MIME types for JavaScript modules
class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        super().end_headers()
    
    def guess_type(self, path):
        """Customize MIME types for JavaScript modules"""
        if path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

# Find an available port
def find_free_port(start_port=8000, max_port=8100):
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            free = s.connect_ex(('localhost', port)) != 0
            if free:
                return port
    return None

# Set up the server
PORT = find_free_port()
if PORT is None:
    print("No free ports found in the range 8000-8100.")
    exit(1)

Handler = CustomHTTPRequestHandler

# Set the working directory to the script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

# Start the server
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.") 