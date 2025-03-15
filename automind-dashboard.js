// Automind Dynamics Dashboard - ROS Communication and UI Management

// Global variables
let ros;
let isConnected = false;
let subscribers = {};
let totalDistance = 0.0;

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const cameraSpeedElement = document.getElementById('camera-speed');
const lidarSpeedElement = document.getElementById('lidar-speed');
const totalOdometerElement = document.getElementById('total-odometer');
const detectionContainer = document.getElementById('detection-container');

// Canvas elements and contexts
const camera1Canvas = document.getElementById('camera1-feed');
const camera2Canvas = document.getElementById('camera2-feed');
const ctx1 = camera1Canvas.getContext('2d');
const ctx2 = camera2Canvas.getContext('2d');

// Initialize canvas sizes based on container sizes
function initCanvasSizes() {
    const containers = document.querySelectorAll('.camera-container');
    
    containers.forEach(container => {
        const canvas = container.querySelector('canvas');
        if (canvas) {
            // Get container dimensions
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // Set canvas dimensions to match container while maintaining 16:9 aspect ratio
            canvas.width = containerWidth;
            canvas.height = containerHeight;
            
            // Clear and fill with background color
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    });
    
    // Handle detection container if it exists
    if (detectionContainer) {
        const existingCanvas = detectionContainer.querySelector('canvas');
        if (existingCanvas) {
            existingCanvas.width = detectionContainer.clientWidth;
            existingCanvas.height = detectionContainer.clientHeight;
            
            const ctx = existingCanvas.getContext('2d');
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, existingCanvas.width, existingCanvas.height);
        }
    }
}

// Connect to ROS
function connectToROS() {
    console.log('Connecting to ROS');
    
    // Check if ROSLIB is defined
    if (typeof ROSLIB === 'undefined') {
        console.error('ROSLIB library is not loaded. Cannot connect to ROS.');
        alert('Error: ROSLIB library is not loaded. Please check your internet connection or reload the page.');
        return;
    }
    
    const rosUrl = document.getElementById('ros-url').value;
    console.log('ROS URL:', rosUrl);
    
    // Update connection status
    connectionStatus.textContent = 'Connecting to ROS...';
    connectionStatus.classList.remove('connected');
    
    // Create connection to ROS
    ros = new ROSLIB.Ros({
        url: rosUrl
    });
    
    // ROS connection event handlers
    ros.on('connection', function() {
        console.log('Connected to ROS bridge websocket server.');
        connectionStatus.textContent = 'Connected to ROS';
        connectionStatus.classList.add('connected');
        isConnected = true;
        
        // Subscribe to topics
        subscribeToTopics();
        
        // Test ROS connection by getting topics
        ros.getTopics(function(topics) {
            console.log('Available ROS topics:', topics);
            
            // Check if our camera topics exist
            const camera1Topic = document.getElementById('camera1-topic').value;
            const camera2Topic = document.getElementById('camera2-topic').value;
            
            if (topics.topics.includes(camera1Topic)) {
                console.log('Camera 1 topic is available');
            } else {
                console.warn('Camera 1 topic not found in available topics');
            }
            
            if (topics.topics.includes(camera2Topic)) {
                console.log('Camera 2 topic is available');
            } else {
                console.warn('Camera 2 topic not found in available topics');
            }
        });
    });
    
    ros.on('error', function(error) {
        console.error('Error connecting to ROS: ', error);
        connectionStatus.textContent = 'Error connecting to ROS';
        connectionStatus.classList.remove('connected');
        isConnected = false;
        
        // Show error details
        alert('Failed to connect to ROS bridge at ' + rosUrl + '. Please check that rosbridge_server is running and accessible.');
    });
    
    ros.on('close', function() {
        console.log('Connection to ROS bridge websocket server closed.');
        connectionStatus.textContent = 'Disconnected from ROS';
        connectionStatus.classList.remove('connected');
        isConnected = false;
    });
}

// Disconnect from ROS
function disconnectFromROS() {
    if (ros) {
        // Unsubscribe from all topics
        for (let key in subscribers) {
            if (subscribers[key]) {
                subscribers[key].unsubscribe();
            }
        }
        
        // Close ROS connection
        ros.close();
        isConnected = false;
        
        // Reset UI elements
        connectionStatus.textContent = 'Disconnected from ROS';
        connectionStatus.classList.remove('connected');
        
        // Reset values
        cameraSpeedElement.textContent = '0.0';
        lidarSpeedElement.textContent = '0.0';
        totalOdometerElement.textContent = '0.0';
        
        // Clear canvases
        clearCanvases();
    }
}

// Clear all canvas elements
function clearCanvases() {
    ctx1.fillStyle = '#111';
    ctx1.fillRect(0, 0, camera1Canvas.width, camera1Canvas.height);
    
    ctx2.fillStyle = '#111';
    ctx2.fillRect(0, 0, camera2Canvas.width, camera2Canvas.height);
}

// Subscribe to ROS topics
function subscribeToTopics() {
    console.log('Subscribing to ROS topics');
    
    const camera1Topic = document.getElementById('camera1-topic').value;
    const camera2Topic = document.getElementById('camera2-topic').value;
    const cameraSpeedTopic = document.getElementById('camera-speed-topic').value;
    const lidarSpeedTopic = document.getElementById('lidar-speed-topic').value;
    const odometerTopic = document.getElementById('odometer-topic').value;
    const detectionTopic = document.getElementById('detection-topic').value;
    
    console.log('Camera 1 Topic:', camera1Topic);
    console.log('Camera 2 Topic:', camera2Topic);
    console.log('Camera Speed Topic:', cameraSpeedTopic);
    console.log('LIDAR Speed Topic:', lidarSpeedTopic);
    console.log('Odometer Topic:', odometerTopic);
    console.log('Detection Topic:', detectionTopic);
    
    // Subscribe to camera feeds
    if (camera1Topic) {
        console.log('Subscribing to Camera 1 topic');
        subscribers.camera1 = new ROSLIB.Topic({
            ros: ros,
            name: camera1Topic,
            messageType: 'sensor_msgs/Image'
        });
        
        subscribers.camera1.subscribe(function(message) {
            console.log('Received message from Camera 1');
            
            // Inspect message structure
            console.log('Message type:', typeof message);
            console.log('Message keys:', Object.keys(message));
            console.log('Message encoding:', message.encoding);
            console.log('Message dimensions:', message.width, 'x', message.height);
            
            // Check data property
            if (message.data) {
                console.log('Data type:', typeof message.data);
                console.log('Is array:', Array.isArray(message.data));
                console.log('Is ArrayBuffer:', message.data instanceof ArrayBuffer);
                console.log('Is Uint8Array:', message.data instanceof Uint8Array);
                console.log('Data length:', message.data.length);
                
                // If data is a string, it might be base64 encoded
                if (typeof message.data === 'string') {
                    console.log('Data is a string, first 50 chars:', message.data.substring(0, 50));
                }
                
                // If data is an object but not an array, check its properties
                if (typeof message.data === 'object' && !Array.isArray(message.data) && 
                    !(message.data instanceof ArrayBuffer) && !(message.data instanceof Uint8Array)) {
                    console.log('Data object keys:', Object.keys(message.data));
                }
            } else {
                console.error('Message data is undefined or null');
            }
            
            displayCameraImage(message, camera1Canvas, ctx1);
        });
    }
    
    if (camera2Topic) {
        console.log('Subscribing to Camera 2 topic');
        subscribers.camera2 = new ROSLIB.Topic({
            ros: ros,
            name: camera2Topic,
            messageType: 'sensor_msgs/Image'
        });
        
        subscribers.camera2.subscribe(function(message) {
            console.log('Received message from Camera 2');
            displayCameraImage(message, camera2Canvas, ctx2);
        });
    }
    
    // Subscribe to camera speed data
    if (cameraSpeedTopic) {
        subscribers.cameraSpeed = new ROSLIB.Topic({
            ros: ros,
            name: cameraSpeedTopic,
            messageType: 'std_msgs/Float32'
        });
        
        subscribers.cameraSpeed.subscribe(message => {
            updateSpeedDisplay(cameraSpeedElement, message.data);
        });
    }
    
    // Subscribe to LIDAR speed data
    if (lidarSpeedTopic) {
        subscribers.lidarSpeed = new ROSLIB.Topic({
            ros: ros,
            name: lidarSpeedTopic,
            messageType: 'std_msgs/Float32'
        });
        
        subscribers.lidarSpeed.subscribe(message => {
            updateSpeedDisplay(lidarSpeedElement, message.data);
        });
    }
    
    // Subscribe to odometer data
    if (odometerTopic) {
        subscribers.odometer = new ROSLIB.Topic({
            ros: ros,
            name: odometerTopic,
            messageType: 'std_msgs/Float32'
        });
        
        subscribers.odometer.subscribe(message => {
            updateOdometerDisplay(message.data);
        });
    }
    
    // Subscribe to detection model data if topic is provided
    if (detectionTopic) {
        subscribers.detection = new ROSLIB.Topic({
            ros: ros,
            name: detectionTopic,
            messageType: 'sensor_msgs/Image'
        });
        
        subscribers.detection.subscribe(message => {
            displayDetectionImage(message);
        });
        
        document.querySelector('.detection-status').textContent = 'Active';
    } else {
        document.querySelector('.detection-status').textContent = 'Inactive';
    }
}

// Display camera image from ROS topic
function displayCameraImage(message, canvas, context) {
    try {
        console.log('Received camera message:', message);
        
        // Draw a placeholder to show the canvas is active
        context.fillStyle = '#111';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '14px Montserrat';
        context.fillStyle = '#3399ff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Processing image data...', canvas.width / 2, canvas.height / 2);
        
        // Process sensor_msgs/Image format
        if (message.data && message.width && message.height) {
            console.log('Processing raw image data');
            console.log('Image dimensions:', message.width, 'x', message.height);
            console.log('Image encoding:', message.encoding);
            
            // Handle different data types
            let rawData;
            if (typeof message.data === 'string') {
                // If data is a string, it might be base64 encoded
                console.log('Data is a string, attempting to decode');
                try {
                    // Try to decode base64
                    const binary = atob(message.data);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) {
                        bytes[i] = binary.charCodeAt(i);
                    }
                    rawData = bytes;
                    console.log('Successfully decoded base64 data, length:', rawData.length);
                } catch (err) {
                    console.error('Failed to decode base64 data:', err);
                    // Draw error message on canvas
                    context.fillStyle = '#111';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '14px Montserrat';
                    context.fillStyle = '#f44336';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText('Error decoding image data: ' + err.message, canvas.width / 2, canvas.height / 2);
                    return;
                }
            } else if (message.data instanceof Uint8Array) {
                // If data is already a Uint8Array, use it directly
                rawData = message.data;
                console.log('Data is a Uint8Array, using directly');
            } else if (message.data instanceof ArrayBuffer) {
                // If data is an ArrayBuffer, create a Uint8Array view
                rawData = new Uint8Array(message.data);
                console.log('Data is an ArrayBuffer, created Uint8Array view');
            } else if (Array.isArray(message.data)) {
                // If data is a regular array, convert to Uint8Array
                rawData = new Uint8Array(message.data);
                console.log('Data is an Array, converted to Uint8Array');
            } else {
                console.error('Unsupported data type:', typeof message.data);
                // Draw error message on canvas
                context.fillStyle = '#111';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.font = '14px Montserrat';
                context.fillStyle = '#f44336';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText('Unsupported data type: ' + typeof message.data, canvas.width / 2, canvas.height / 2);
                return;
            }
            
            // Log data information
            console.log('Raw data length:', rawData.length);
            console.log('First few bytes:', Array.from(rawData.slice(0, 10)));
            
            // Create a canvas to convert the raw data to an image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = message.width;
            tempCanvas.height = message.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Create ImageData object
            const imageData = tempCtx.createImageData(message.width, message.height);
            
            // Fill the ImageData based on the encoding
            if (message.encoding === 'rgb8' || message.encoding === 'bgr8') {
                console.log('Processing RGB8/BGR8 image');
                const data = rawData;
                const isRgb = message.encoding === 'rgb8';
                
                // Check if data length matches expected size
                const expectedLength = message.width * message.height * 3;
                console.log('Expected data length:', expectedLength, 'Actual:', data.length);
                
                if (data.length === 0) {
                    console.error('Empty data array received!');
                    // Draw error message on canvas
                    context.fillStyle = '#111';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '14px Montserrat';
                    context.fillStyle = '#ff9800';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText('Empty image data received', canvas.width / 2, canvas.height / 2);
                    return;
                }
                
                if (data.length !== expectedLength) {
                    console.warn('Data length mismatch! Expected:', expectedLength, 'Actual:', data.length);
                    // Continue anyway, but log the warning
                }
                
                try {
                    for (let i = 0, j = 0; i < data.length && j < imageData.data.length; i += 3, j += 4) {
                        if (isRgb) {
                            imageData.data[j] = data[i];         // R
                            imageData.data[j + 1] = data[i + 1]; // G
                            imageData.data[j + 2] = data[i + 2]; // B
                        } else {
                            imageData.data[j] = data[i + 2];     // R (from B)
                            imageData.data[j + 1] = data[i + 1]; // G
                            imageData.data[j + 2] = data[i];     // B (from R)
                        }
                        imageData.data[j + 3] = 255;             // Alpha
                    }
                    console.log('RGB/BGR conversion completed');
                } catch (err) {
                    console.error('Error during RGB/BGR conversion:', err);
                    // Draw error message on canvas
                    context.fillStyle = '#111';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '14px Montserrat';
                    context.fillStyle = '#f44336';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText('Error converting image: ' + err.message, canvas.width / 2, canvas.height / 2);
                    return;
                }
            } else if (message.encoding === 'bgra8') {
                console.log('Processing BGRA8 image');
                const data = rawData;
                
                // Check if data length matches expected size
                const expectedLength = message.width * message.height * 4;
                console.log('Expected data length:', expectedLength, 'Actual:', data.length);
                
                if (data.length === 0) {
                    console.error('Empty data array received!');
                    // Draw error message on canvas
                    context.fillStyle = '#111';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '14px Montserrat';
                    context.fillStyle = '#ff9800';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText('Empty image data received', canvas.width / 2, canvas.height / 2);
                    return;
                }
                
                if (data.length !== expectedLength) {
                    console.warn('Data length mismatch! Expected:', expectedLength, 'Actual:', data.length);
                    // Continue anyway, but log the warning
                }
                
                try {
                    // BGRA to RGBA conversion
                    for (let i = 0; i < data.length; i += 4) {
                        imageData.data[i] = data[i + 2];     // R (from B)
                        imageData.data[i + 1] = data[i + 1]; // G
                        imageData.data[i + 2] = data[i];     // B (from R)
                        imageData.data[i + 3] = data[i + 3]; // Alpha
                    }
                    console.log('BGRA conversion completed');
                } catch (err) {
                    console.error('Error during BGRA conversion:', err);
                    // Draw error message on canvas
                    context.fillStyle = '#111';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '14px Montserrat';
                    context.fillStyle = '#f44336';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText('Error converting image: ' + err.message, canvas.width / 2, canvas.height / 2);
                    return;
                }
            } else if (message.encoding === 'mono8') {
                console.log('Processing mono8 image');
                const data = rawData;
                
                // Check if data length matches expected size
                const expectedLength = message.width * message.height;
                console.log('Expected data length:', expectedLength, 'Actual:', data.length);
                
                if (data.length === 0) {
                    console.error('Empty data array received!');
                    // Draw error message on canvas
                    context.fillStyle = '#111';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '14px Montserrat';
                    context.fillStyle = '#ff9800';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText('Empty image data received', canvas.width / 2, canvas.height / 2);
                    return;
                }
                
                try {
                    for (let i = 0; i < data.length; i++) {
                        const j = i * 4;
                        imageData.data[j] = data[i];     // R
                        imageData.data[j + 1] = data[i]; // G
                        imageData.data[j + 2] = data[i]; // B
                        imageData.data[j + 3] = 255;     // Alpha
                    }
                    console.log('Mono8 conversion completed');
                } catch (err) {
                    console.error('Error during mono8 conversion:', err);
                    // Draw error message on canvas
                    context.fillStyle = '#111';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.font = '14px Montserrat';
                    context.fillStyle = '#f44336';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText('Error converting image: ' + err.message, canvas.width / 2, canvas.height / 2);
                    return;
                }
            } else {
                console.error('Unsupported encoding:', message.encoding);
                // Draw error message on canvas
                context.fillStyle = '#111';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.font = '14px Montserrat';
                context.fillStyle = '#ff9800';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText('Unsupported image encoding: ' + message.encoding, canvas.width / 2, canvas.height / 2);
                return;
            }
            
            // Put the image data on the temporary canvas
            try {
                console.log('Putting image data on canvas');
                tempCtx.putImageData(imageData, 0, 0);
                console.log('Image data put on canvas successfully');
            } catch (err) {
                console.error('Error putting image data on canvas:', err);
                return;
            }
            
            // Use the temporary canvas as the image source
            const img = new Image();
            img.onload = function() {
                console.log('Image loaded successfully, dimensions:', img.width, 'x', img.height);
                // Clear canvas before drawing new image
                context.clearRect(0, 0, canvas.width, canvas.height);
                
                // Calculate dimensions to maintain aspect ratio
                const imgAspect = img.width / img.height;
                const canvasAspect = canvas.width / canvas.height;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (imgAspect > canvasAspect) {
                    // Image is wider than canvas
                    drawHeight = canvas.height;
                    drawWidth = drawHeight * imgAspect;
                    offsetX = (canvas.width - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    // Image is taller than canvas
                    drawWidth = canvas.width;
                    drawHeight = drawWidth / imgAspect;
                    offsetX = 0;
                    offsetY = (canvas.height - drawHeight) / 2;
                }
                
                // Fill background
                context.fillStyle = '#111';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image with proper aspect ratio
                context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                console.log('Image drawn to canvas');
            };
            
            img.onerror = function(err) {
                console.error('Error loading image:', err);
                // Draw error message on canvas
                context.fillStyle = '#111';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.font = '14px Montserrat';
                context.fillStyle = '#f44336';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText('Error loading camera image', canvas.width / 2, canvas.height / 2);
            };
            
            try {
                console.log('Converting canvas to data URL');
                const dataUrl = tempCanvas.toDataURL('image/png');
                console.log('Data URL created successfully');
                img.src = dataUrl;
            } catch (err) {
                console.error('Error creating data URL:', err);
                // Draw error message on canvas
                context.fillStyle = '#111';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.font = '14px Montserrat';
                context.fillStyle = '#f44336';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText('Error creating image: ' + err.message, canvas.width / 2, canvas.height / 2);
            }
        } else {
            console.error('Invalid image message format:', message);
            // Draw error message on canvas
            context.fillStyle = '#111';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = '14px Montserrat';
            context.fillStyle = '#f44336';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText('Invalid image format', canvas.width / 2, canvas.height / 2);
        }
    } catch (error) {
        console.error('Error in displayCameraImage:', error);
        // Draw error message on canvas
        context.fillStyle = '#111';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = '14px Montserrat';
        context.fillStyle = '#f44336';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Error processing image: ' + error.message, canvas.width / 2, canvas.height / 2);
    }
}

// Display detection model image
function displayDetectionImage(message) {
    try {
        console.log('Received detection model message:', message);
        
        // Process sensor_msgs/Image format
        if (message.data && message.width && message.height) {
            console.log('Processing raw detection image data');
            
            // Create a canvas to convert the raw data to an image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = message.width;
            tempCanvas.height = message.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Create ImageData object
            const imageData = tempCtx.createImageData(message.width, message.height);
            
            // Fill the ImageData based on the encoding
            if (message.encoding === 'rgb8' || message.encoding === 'bgr8') {
                console.log('Processing RGB8/BGR8 detection image');
                const data = new Uint8Array(message.data);
                const isRgb = message.encoding === 'rgb8';
                
                for (let i = 0; i < data.length; i += 3) {
                    const j = i / 3 * 4;
                    if (isRgb) {
                        imageData.data[j] = data[i];         // R
                        imageData.data[j + 1] = data[i + 1]; // G
                        imageData.data[j + 2] = data[i + 2]; // B
                    } else {
                        imageData.data[j] = data[i + 2];     // R (from B)
                        imageData.data[j + 1] = data[i + 1]; // G
                        imageData.data[j + 2] = data[i];     // B (from R)
                    }
                    imageData.data[j + 3] = 255;             // Alpha
                }
            } else if (message.encoding === 'mono8') {
                console.log('Processing mono8 detection image');
                const data = new Uint8Array(message.data);
                
                for (let i = 0; i < data.length; i++) {
                    const j = i * 4;
                    imageData.data[j] = data[i];     // R
                    imageData.data[j + 1] = data[i]; // G
                    imageData.data[j + 2] = data[i]; // B
                    imageData.data[j + 3] = 255;     // Alpha
                }
            } else {
                console.error('Unsupported detection image encoding:', message.encoding);
                detectionContainer.innerHTML = '<div style="color: #ff9800; text-align: center; padding-top: 60px; font-family: Montserrat, sans-serif;">Unsupported image encoding: ' + message.encoding + '</div>';
                return;
            }
            
            // Put the image data on the temporary canvas
            tempCtx.putImageData(imageData, 0, 0);
            
            // Use the temporary canvas as the image source
            const img = new Image();
            img.onload = function() {
                // Clear previous content
                detectionContainer.innerHTML = '';
                
                // Create canvas for detection image
                const canvas = document.createElement('canvas');
                canvas.width = detectionContainer.clientWidth;
                canvas.height = detectionContainer.clientHeight;
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                
                const ctx = canvas.getContext('2d');
                
                // Calculate dimensions to maintain aspect ratio
                const imgAspect = img.width / img.height;
                const canvasAspect = canvas.width / canvas.height;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (imgAspect > canvasAspect) {
                    // Image is wider than canvas
                    drawHeight = canvas.height;
                    drawWidth = drawHeight * imgAspect;
                    offsetX = (canvas.width - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    // Image is taller than canvas
                    drawWidth = canvas.width;
                    drawHeight = drawWidth / imgAspect;
                    offsetX = 0;
                    offsetY = (canvas.height - drawHeight) / 2;
                }
                
                // Fill background
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image with proper aspect ratio
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                detectionContainer.appendChild(canvas);
            };
            
            img.onerror = function(err) {
                console.error('Error loading detection image:', err);
                detectionContainer.innerHTML = '<div style="color: #f44336; text-align: center; padding-top: 60px; font-family: Montserrat, sans-serif;">Error loading detection image</div>';
            };
            
            img.src = tempCanvas.toDataURL('image/png');
        } else {
            console.error('Invalid detection image message format:', message);
            detectionContainer.innerHTML = '<div style="color: #f44336; text-align: center; padding-top: 60px; font-family: Montserrat, sans-serif;">Invalid detection image format</div>';
        }
    } catch (error) {
        console.error('Error in displayDetectionImage:', error);
        detectionContainer.innerHTML = '<div style="color: #f44336; text-align: center; padding-top: 60px; font-family: Montserrat, sans-serif;">Error processing detection image: ' + error.message + '</div>';
    }
}

// Update speed display with animation
function updateSpeedDisplay(element, speed) {
    const formattedSpeed = speed.toFixed(1);
    element.textContent = formattedSpeed;
    
    // Add animation effect
    element.classList.remove('speed-change');
    void element.offsetWidth; // Trigger reflow
    element.classList.add('speed-change');
}

// Update odometer display
function updateOdometerDisplay(value) {
    totalDistance = value;
    totalOdometerElement.textContent = totalDistance.toFixed(1);
}

// Mock data for demonstration when not connected to ROS
function startMockData() {
    clearCanvases();
    
    // Mock text for camera feeds
    function drawMockCameraText(ctx, text) {
        ctx.font = '16px Montserrat';
        ctx.fillStyle = '#3399ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
    
    drawMockCameraText(ctx1, 'Camera 1 feed will appear here');
    drawMockCameraText(ctx2, 'Camera 2 feed will appear here');
    
    // Mock detection model text
    detectionContainer.innerHTML = '<div style="color: #3399ff; text-align: center; padding-top: 60px; font-family: Montserrat, sans-serif;">Detection model feed will appear here</div>';
    
    // Generate mock data periodically if not connected
    const mockInterval = setInterval(() => {
        if (isConnected) {
            clearInterval(mockInterval);
            return;
        }
        
        // Mock camera speed data
        const cameraSpeed = Math.random() * 60 + 20;
        updateSpeedDisplay(cameraSpeedElement, cameraSpeed);
        
        // Mock LIDAR speed data
        const lidarSpeed = Math.random() * 60 + 20;
        updateSpeedDisplay(lidarSpeedElement, lidarSpeed);
        
        // Mock odometer data
        totalDistance += ((cameraSpeed + lidarSpeed) / 2 / 3600) * 2; // Simulate distance traveled in 2 seconds at average speed
        totalOdometerElement.textContent = totalDistance.toFixed(1);
        
        // Draw some random shapes on camera canvases for visual effect
        simulateCameraFeed(ctx1, camera1Canvas.width, camera1Canvas.height);
        simulateCameraFeed(ctx2, camera2Canvas.width, camera2Canvas.height);
        
    }, 2000);
}

// Simulate camera feed with moving elements
function simulateCameraFeed(ctx, width, height) {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    
    // Draw a road-like background
    ctx.fillStyle = '#333';
    ctx.fillRect(0, height * 0.6, width, height * 0.4);
    
    // Draw road markings
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.setLineDash([30, 20]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.8);
    ctx.lineTo(width, height * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw some random "vehicles" or objects
    const numObjects = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < numObjects; i++) {
        const x = Math.random() * width;
        const y = Math.random() * (height * 0.6) + (height * 0.3);
        const size = Math.random() * 30 + 20;
        
        ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
        ctx.fillRect(x, y, size, size);
    }
}

// Handle window resize
function handleResize() {
    initCanvasSizes();
    
    // Redraw mock data if not connected
    if (!isConnected) {
        clearCanvases();
        
        function drawMockCameraText(ctx, text) {
            ctx.font = '16px Montserrat';
            ctx.fillStyle = '#3399ff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
        
        drawMockCameraText(ctx1, 'Camera 1 feed will appear here');
        drawMockCameraText(ctx2, 'Camera 2 feed will appear here');
    }
}

// Auto-connect to ROS on page load (optional)
function tryAutoConnect() {
    // Check if auto-connect is enabled (could be a checkbox in the UI)
    const autoConnect = false; // Set to true to enable auto-connect
    
    if (autoConnect) {
        setTimeout(() => {
            if (!isConnected) {
                connectToROS();
            }
        }, 1000);
    }
}

// Test canvas functionality
function testCanvasFunctionality() {
    console.log('Testing canvas functionality');
    
    // Test Camera 1 canvas
    if (camera1Canvas && ctx1) {
        console.log('Testing Camera 1 canvas');
        try {
            // Draw a test pattern
            const gradient = ctx1.createLinearGradient(0, 0, camera1Canvas.width, camera1Canvas.height);
            gradient.addColorStop(0, '#3399ff');
            gradient.addColorStop(1, '#00c6ff');
            
            ctx1.fillStyle = gradient;
            ctx1.fillRect(0, 0, camera1Canvas.width, camera1Canvas.height);
            
            // Draw text
            ctx1.font = '16px Montserrat';
            ctx1.fillStyle = 'white';
            ctx1.textAlign = 'center';
            ctx1.textBaseline = 'middle';
            ctx1.fillText('Canvas Test - Camera 1', camera1Canvas.width / 2, camera1Canvas.height / 2);
            
            console.log('Camera 1 canvas test successful');
        } catch (err) {
            console.error('Error testing Camera 1 canvas:', err);
        }
    } else {
        console.error('Camera 1 canvas or context not available');
    }
    
    // Test Camera 2 canvas
    if (camera2Canvas && ctx2) {
        console.log('Testing Camera 2 canvas');
        try {
            // Draw a test pattern
            const gradient = ctx2.createLinearGradient(0, 0, camera2Canvas.width, camera2Canvas.height);
            gradient.addColorStop(0, '#00c6ff');
            gradient.addColorStop(1, '#3399ff');
            
            ctx2.fillStyle = gradient;
            ctx2.fillRect(0, 0, camera2Canvas.width, camera2Canvas.height);
            
            // Draw text
            ctx2.font = '16px Montserrat';
            ctx2.fillStyle = 'white';
            ctx2.textAlign = 'center';
            ctx2.textBaseline = 'middle';
            ctx2.fillText('Canvas Test - Camera 2', camera2Canvas.width / 2, camera2Canvas.height / 2);
            
            console.log('Camera 2 canvas test successful');
        } catch (err) {
            console.error('Error testing Camera 2 canvas:', err);
        }
    } else {
        console.error('Camera 2 canvas or context not available');
    }
}

// Initialize canvas sizes on page load and window resize
window.addEventListener('load', () => {
    initCanvasSizes();
    testCanvasFunctionality(); // Test canvas functionality
    startMockData();
    tryAutoConnect();
});

window.addEventListener('resize', handleResize);

// Set up event listeners for buttons
console.log('Setting up event listeners');
document.getElementById('connect-btn').addEventListener('click', connectToROS);
document.getElementById('disconnect-btn').addEventListener('click', disconnectFromROS);

// Reset trip odometer functionality could be added here
// For example:
// document.getElementById('reset-trip-btn').addEventListener('click', () => {
//     tripDistance = 0.0;
//     tripOdometerElement.textContent = '0.0';
// }); 