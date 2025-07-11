// Main application controller
class EmergencyRouteSystem {
    constructor() {
        this.graph = new Graph();
        this.dijkstra = null;
        this.trafficManager = null;
        this.emergencyManager = null;
        this.visualization = null;
        this.systemLog = [];
        this.isInitialized = false;
        
        this.init();
    }

    // Initialize the system
    async init() {
        try {
            this.log('Initializing Emergency Route Optimization System...', 'info');
            
            // Initialize graph with sample data
            this.graph.initializeSampleGraph();
            this.log(`Graph initialized with ${this.graph.nodeCount} nodes`, 'success');
            
            // Initialize algorithm
            this.dijkstra = new DijkstraAlgorithm(this.graph);
            this.log('Dijkstra algorithm initialized', 'success');
            
            // Initialize traffic management
            this.trafficManager = new TrafficManager(this.graph);
            this.trafficManager.initializeTrafficPatterns();
            this.log('Traffic management system initialized', 'success');
            
            // Initialize emergency services
            this.emergencyManager = new EmergencyServicesManager(this.graph);
            this.emergencyManager.initializeEmergencyServices();
            this.log('Emergency services initialized', 'success');
            
            // Initialize visualization
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                this.visualization = new MapVisualization(mapContainer, this.graph);
                this.log('Map visualization initialized', 'success');
            }
            
            // Set up UI
            this.setupUI();
            this.log('User interface initialized', 'success');
            
            // Start traffic simulation
            this.trafficManager.startSimulation();
            this.log('Traffic simulation started', 'info');
            
            this.isInitialized = true;
            this.log('System initialization complete', 'success');
            
            // Update status indicators
            this.updateStatusIndicators();
            
        } catch (error) {
            this.log(`Initialization error: ${error.message}`, 'error');
            console.error('Initialization error:', error);
        }
    }

    // Set up user interface
    setupUI() {
        this.populateNodeSelects();
        this.setupEventListeners();
        this.setupStatusMonitoring();
    }

    // Populate node selection dropdowns
    populateNodeSelects() {
        const nodes = this.graph.getNodes();
        const sourceSelect = document.getElementById('source-select');
        const destinationSelect = document.getElementById('destination-select');
        
        if (sourceSelect && destinationSelect) {
            // Clear existing options
            sourceSelect.innerHTML = '<option value="">Select Source</option>';
            destinationSelect.innerHTML = '<option value="">Select Destination</option>';
            
            // Add node options
            nodes.forEach(node => {
                const option1 = document.createElement('option');
                option1.value = node.id;
                option1.textContent = `${node.name} (${node.type})`;
                sourceSelect.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = node.id;
                option2.textContent = `${node.name} (${node.type})`;
                destinationSelect.appendChild(option2);
            });
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Find route button
        const findRouteBtn = document.getElementById('find-route-btn');
        if (findRouteBtn) {
            findRouteBtn.addEventListener('click', () => {
                this.findOptimalRoute();
            });
        }
        
        // Traffic simulation button
        const simulateTrafficBtn = document.getElementById('simulate-traffic-btn');
        if (simulateTrafficBtn) {
            simulateTrafficBtn.addEventListener('click', () => {
                this.toggleTrafficSimulation();
            });
        }
        
        // Source/destination selects
        const sourceSelect = document.getElementById('source-select');
        const destinationSelect = document.getElementById('destination-select');
        
        if (sourceSelect) {
            sourceSelect.addEventListener('change', (e) => {
                if (e.target.value && this.visualization) {
                    this.visualization.setSource(e.target.value);
                }
            });
        }
        
        if (destinationSelect) {
            destinationSelect.addEventListener('change', (e) => {
                if (e.target.value && this.visualization) {
                    this.visualization.setDestination(e.target.value);
                }
            });
        }
        
        // Emergency type select
        const emergencySelect = document.getElementById('emergency-type');
        if (emergencySelect) {
            emergencySelect.addEventListener('change', () => {
                this.updateEmergencyServices();
            });
        }
        
        // Custom event listeners
        this.setupCustomEventListeners();
    }

    // Set up custom event listeners
    setupCustomEventListeners() {
        if (typeof window !== 'undefined') {
            // Traffic updates
            window.addEventListener('trafficUpdated', (e) => {
                this.handleTrafficUpdate(e.detail);
            });
            
            // Emergency events
            window.addEventListener('emergencyCompleted', (e) => {
                this.handleEmergencyCompletion(e.detail);
            });
            
            // Log events
            window.addEventListener('trafficLog', (e) => {
                this.handleLogEvent(e.detail);
            });
            
            window.addEventListener('emergencyLog', (e) => {
                this.handleLogEvent(e.detail);
            });
        }
    }

    // Find optimal route
    findOptimalRoute() {
        try {
            const sourceSelect = document.getElementById('source-select');
            const destinationSelect = document.getElementById('destination-select');
            const emergencyType = document.getElementById('emergency-type')?.value || 'general';
            
            if (!sourceSelect || !destinationSelect) {
                this.log('Source or destination select not found', 'error');
                return;
            }
            
            const sourceId = sourceSelect.value;
            const destinationId = destinationSelect.value;
            
            if (!sourceId || !destinationId) {
                this.log('Please select both source and destination', 'warning');
                return;
            }
            
            if (sourceId === destinationId) {
                this.log('Source and destination cannot be the same', 'warning');
                return;
            }
            
            this.log(`Finding optimal route from ${sourceId} to ${destinationId}...`, 'info');
            
            // Find shortest path
            const result = this.dijkstra.findShortestPath(sourceId, destinationId);
            
            if (!result) {
                this.log('No route found between selected locations', 'error');
                return;
            }
            
            this.log(`Route found! Distance: ${result.totalDistance}, Processing time: ${result.processingTime}ms`, 'success');
            
            // Update visualization
            if (this.visualization) {
                this.visualization.highlightPath(result.path);
            }
            
            // Update route information
            this.updateRouteInformation(result, emergencyType);
            
            // Find nearby emergency services
            this.findNearbyEmergencyServices(sourceId, destinationId, emergencyType);
            
            return result;
            
        } catch (error) {
            this.log(`Route finding error: ${error.message}`, 'error');
            console.error('Route finding error:', error);
        }
    }

    // Update route information display
    updateRouteInformation(result, emergencyType) {
        const routeDetails = this.dijkstra.getRouteDetails(result.path);
        
        // Update distance
        const distanceElement = document.getElementById('route-distance');
        if (distanceElement) {
            distanceElement.textContent = `${result.totalDistance} units`;
        }
        
        // Update estimated time
        const timeElement = document.getElementById('route-time');
        if (timeElement) {
            const estimatedTime = Math.round(result.totalDistance * 1.2); // Estimate based on distance
            timeElement.textContent = `${estimatedTime} minutes`;
        }
        
        // Update traffic info
        const trafficElement = document.getElementById('traffic-info');
        if (trafficElement && routeDetails) {
            const trafficLevels = Object.keys(routeDetails.trafficConditions);
            const dominantTraffic = trafficLevels.reduce((a, b) => 
                routeDetails.trafficConditions[a] > routeDetails.trafficConditions[b] ? a : b
            );
            trafficElement.textContent = dominantTraffic.charAt(0).toUpperCase() + dominantTraffic.slice(1);
        }
        
        // Update emergency services info
        const emergencyElement = document.getElementById('emergency-services');
        if (emergencyElement) {
            emergencyElement.textContent = `${emergencyType} services available`;
        }
    }

    // Find nearby emergency services
    findNearbyEmergencyServices(sourceId, destinationId, emergencyType) {
        const nearbyServices = this.emergencyManager.findNearestServices(sourceId, emergencyType, 5);
        
        const emergencyList = document.getElementById('emergency-list');
        if (emergencyList) {
            emergencyList.innerHTML = '';
            
            nearbyServices.forEach(service => {
                const serviceElement = document.createElement('div');
                serviceElement.className = 'emergency-item';
                serviceElement.innerHTML = `
                    <div class="name">${service.details.icon} ${service.node.name}</div>
                    <div class="distance">${Math.round(service.distance)} units away</div>
                    <div class="availability">Availability: ${Math.round(service.availability * 100)}%</div>
                    <div class="response-time">Response Time: ${service.responseTime} min</div>
                `;
                
                serviceElement.addEventListener('click', () => {
                    this.showServiceDetails(service.details);
                });
                
                emergencyList.appendChild(serviceElement);
            });
        }
    }

    // Show service details
    showServiceDetails(service) {
        const details = this.emergencyManager.getServiceDetails(service.id);
        this.log(`Service Details - ${details.name}: ${details.availability * 100}% available, ${details.activeResponses} active responses`, 'info');
    }

    // Toggle traffic simulation
    toggleTrafficSimulation() {
        if (this.trafficManager.isSimulating) {
            this.trafficManager.stopSimulation();
            this.log('Traffic simulation stopped', 'info');
        } else {
            this.trafficManager.startSimulation();
            this.log('Traffic simulation started', 'info');
        }
        
        this.updateStatusIndicators();
    }

    // Handle traffic update
    handleTrafficUpdate(detail) {
        this.log(`Traffic updated: ${detail.pattern} pattern, ${detail.updatedEdges} edges updated`, 'info');
        this.updateStatusIndicators();
    }

    // Handle emergency completion
    handleEmergencyCompletion(detail) {
        this.log(`Emergency completed: ${detail.service.name} responded in ${detail.responseTime} minutes`, 'success');
    }

    // Handle log events
    handleLogEvent(detail) {
        this.log(detail.message, detail.type);
    }

    // Update emergency services based on type
    updateEmergencyServices() {
        const emergencyType = document.getElementById('emergency-type')?.value || 'general';
        const sourceId = document.getElementById('source-select')?.value;
        
        if (sourceId) {
            this.findNearbyEmergencyServices(sourceId, null, emergencyType);
        }
    }

    // Update status indicators
    updateStatusIndicators() {
        const trafficStatus = document.getElementById('traffic-status');
        if (trafficStatus) {
            if (this.trafficManager && this.trafficManager.isSimulating) {
                trafficStatus.className = 'status-dot active';
            } else {
                trafficStatus.className = 'status-dot warning';
            }
        }
    }

    // Setup status monitoring
    setupStatusMonitoring() {
        setInterval(() => {
            this.updateSystemStatus();
        }, 10000); // Update every 10 seconds
    }

    // Update system status
    updateSystemStatus() {
        if (!this.isInitialized) return;
        
        const trafficStats = this.trafficManager.getTrafficStatistics();
        const emergencyStats = this.emergencyManager.getEmergencyStatistics();
        
        // Log periodic status
        this.log(`System Status - Traffic: ${trafficStats.congestionLevel.toFixed(1)}% congestion, Emergency: ${emergencyStats.activeEmergencies} active`, 'info');
    }

    // Log system messages
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        this.systemLog.push(logEntry);
        
        // Keep only last 100 entries
        if (this.systemLog.length > 100) {
            this.systemLog.shift();
        }
        
        // Update UI log
        this.updateSystemLogUI(logEntry);
        
        // Console log
        const consoleMessage = `[${timestamp}] ${message}`;
        switch (type) {
            case 'error':
                console.error(consoleMessage);
                break;
            case 'warning':
                console.warn(consoleMessage);
                break;
            case 'success':
                console.log(`✓ ${consoleMessage}`);
                break;
            default:
                console.log(consoleMessage);
        }
    }

    // Update system log UI
    updateSystemLogUI(logEntry) {
        const systemLogContainer = document.getElementById('system-log');
        if (!systemLogContainer) return;
        
        const logElement = document.createElement('div');
        logElement.className = `log-entry ${logEntry.type}`;
        logElement.textContent = `[${logEntry.timestamp}] ${logEntry.message}`;
        
        systemLogContainer.appendChild(logElement);
        
        // Auto-scroll to bottom
        systemLogContainer.scrollTop = systemLogContainer.scrollHeight;
        
        // Remove old entries if too many
        while (systemLogContainer.children.length > 50) {
            systemLogContainer.removeChild(systemLogContainer.firstChild);
        }
    }

    // Get system statistics
    getSystemStatistics() {
        if (!this.isInitialized) return null;
        
        return {
            graph: {
                nodes: this.graph.nodeCount,
                edges: this.graph.getEdges().length
            },
            traffic: this.trafficManager.getTrafficStatistics(),
            emergency: this.emergencyManager.getEmergencyStatistics(),
            system: {
                initialized: this.isInitialized,
                logEntries: this.systemLog.length,
                uptime: Date.now() - this.startTime
            }
        };
    }

    // Export system data
    exportData() {
        return {
            graph: this.graph.exportForVisualization(),
            traffic: this.trafficManager.getTrafficHistory(),
            emergency: this.emergencyManager.getResponseHistory(),
            visualization: this.visualization ? this.visualization.exportState() : null,
            log: this.systemLog
        };
    }

    // Import system data
    importData(data) {
        try {
            if (data.visualization && this.visualization) {
                this.visualization.importState(data.visualization);
            }
            
            if (data.log) {
                this.systemLog = data.log;
            }
            
            this.log('System data imported successfully', 'success');
            
        } catch (error) {
            this.log(`Data import error: ${error.message}`, 'error');
        }
    }

    // Simulate emergency scenario
    simulateEmergencyScenario() {
        const nodes = this.graph.getNodes();
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
        const emergencyTypes = ['medical', 'fire', 'police'];
        const emergencyType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
        
        // Find nearest service
        const services = this.emergencyManager.findNearestServices(randomNode.id, emergencyType, 1);
        
        if (services.length > 0) {
            const service = services[0];
            this.emergencyManager.simulateEmergencyResponse(
                service.node.id,
                randomNode.name,
                emergencyType
            );
            
            this.log(`Emergency scenario: ${emergencyType} at ${randomNode.name}, ${service.node.name} responding`, 'warning');
        }
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            memoryUsage: this.systemLog.length,
            activeSimulations: this.trafficManager.isSimulating ? 1 : 0,
            averageRouteTime: this.calculateAverageRouteTime(),
            systemHealth: this.isInitialized ? 'healthy' : 'error'
        };
    }

    // Calculate average route time
    calculateAverageRouteTime() {
        // This would be implemented based on historical route calculations
        return 0;
    }

    // Shutdown system
    shutdown() {
        this.log('Shutting down Emergency Route System...', 'info');
        
        if (this.trafficManager) {
            this.trafficManager.stopSimulation();
        }
        
        this.isInitialized = false;
        this.log('System shutdown complete', 'info');
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emergencyRouteSystem = new EmergencyRouteSystem();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyRouteSystem;
}