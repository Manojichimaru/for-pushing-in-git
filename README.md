# Automind Dynamics Dashboard

A professional and elegant web-based dashboard for visualizing ROS camera feeds and vehicle data.

## Features

- **Dual Camera Display**: Side-by-side camera feeds from ROS topics
- **Dual Speed Metrics**: Separate speed readings for camera and LIDAR
- **Total Distance**: Real-time odometer reading
- **Detection Model**: Support for detection model visualization
- **Responsive Design**: Works on desktop and mobile devices (optimized for 705x390 viewport)
- **Modern UI**: Clean, professional interface with intuitive layout
- **Web Server**: Simple Python-based web server for sharing the dashboard on your network

## Architecture

This dashboard uses a simple and efficient architecture:

1. **Python Web Server**: A lightweight Flask server that only serves static files (HTML, JS, CSS)
2. **ROS Communication**: All ROS communication happens directly in the browser using roslibjs
3. **Responsive UI**: The dashboard adapts to different screen sizes and maintains proper aspect ratios

This design separates concerns:
- The Python script only handles web serving (no ROS functionality)
- The JavaScript code handles all ROS communication and UI updates
- The HTML/CSS defines the structure and appearance

## Setup

### Prerequisites

- ROS (Robot Operating System) installed
- rosbridge_server package installed
- Python 3.6 or higher with Flask
- Web browser with JavaScript enabled

### Installation

1. Clone this repository to your workspace:
   ```bash
   git clone https://github.com/yourusername/automind-dynamics-dashboard.git
   cd automind-dynamics-dashboard
   ```

2. Install Flask:
   ```bash
   pip install flask
   ```

### Running the Dashboard

1. Run the web server script:
   ```bash
   python ros_camera_bridge.py
   ```

2. The script will output URLs that you can share with others on your network.

## Accessing the Dashboard

- **Local Access**: Open http://localhost:5000 in your web browser
- **Network Access**: Open the URL displayed when starting the script (e.g., http://192.168.1.100:5000)
- **Mobile Access**: Connect your mobile device to the same network and enter the IP address and port

## Configuration

You can configure the dashboard by modifying the following settings in the UI:

- **ROS Bridge URL**: The WebSocket URL of the rosbridge server (default: ws://localhost:9090)
- **Camera Topics**: The ROS topics for the camera feeds
- **Speed Topic**: The ROS topic for vehicle speed data
- **Odometer Topic**: The ROS topic for odometer data
- **Detection Topic**: The ROS topic for detection model data (leave empty if not used)

## ROS Topics

The dashboard subscribes to the following ROS topics by default:

- `/camera1/image_raw`: Camera 1 feed (sensor_msgs/Image)
- `/camera2/image_raw`: Camera 2 feed (sensor_msgs/Image)
- `/vehicle/camera_speed`: Camera speed (std_msgs/Float32)
- `/vehicle/lidar_speed`: LIDAR speed (std_msgs/Float32)
- `/vehicle/odometer`: Odometer reading (std_msgs/Float32)

## Responsive Design

The dashboard is designed to be responsive across different screen sizes:
- Above 770px: Cameras displayed side by side with odometers in between
- Below 770px: Elements stack vertically for better mobile viewing
- Optimized for 705x390 viewport

## Customization

You can customize the dashboard appearance by modifying the CSS variables in the HTML file:

```css
:root {
    --primary-bg: #0a1929;
    --secondary-bg: #132f4c;
    --panel-bg: #1e3a8a;
    --accent-color: #3399ff;
    --accent-secondary: #00c6ff;
    /* ... other variables ... */
}
```

## How It Works

1. The Python script starts a Flask web server that serves the HTML, JS, and other static files
2. When you access the URL, your browser loads the HTML and JavaScript
3. The JavaScript connects to the rosbridge WebSocket server (typically on port 9090)
4. The JavaScript subscribes to ROS topics and updates the UI when new data arrives
5. All ROS communication happens directly between your browser and the rosbridge server

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [roslibjs](https://github.com/RobotWebTools/roslibjs) for browser-based ROS communication
- Fonts from Google Fonts (Montserrat and Roboto)
- Flask for lightweight web serving 
