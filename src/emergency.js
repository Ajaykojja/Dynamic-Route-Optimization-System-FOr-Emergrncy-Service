// Emergency services management system
class EmergencyServicesManager {
    constructor(graph) {
        this.graph = graph;
        this.emergencyServices = new Map();
        this.activeEmergencies = new Map();
        this.responseHistory = [];
        this.serviceTypes = {
            'hospital': {
                name: 'Hospital',
                icon: '🏥',
                color: '#e74c3c',
                avgResponseTime: 8,
                capacity: 50
            },
            'fire': {
                name: 'Fire Station',
                icon: '🚒',
                color: '#e67e22',
                avgResponseTime: 6,
                capacity: 30
            },
            'police': {
                name: 'Police Station',
                icon: '🚔',
                color: '#3498db',
                avgResponseTime: 5,
                capacity: 20
            }
        };
    }

    // Initialize emergency services from graph nodes
    initializeEmergencyServices() {
        const nodes = this.graph.getNodes();
        
        for (const node of nodes) {
            if (this.serviceTypes[node.type]) {
                const service = this.createEmergencyService(node);
                this.emergencyServices.set(node.id, service);
            }
        }

        this.logEmergencyEvent(`Initialized ${this.emergencyServices.size} emergency services`);
        return this;
    }

    // Create emergency service object
    createEmergencyService(node) {
        const serviceType = this.serviceTypes[node.type];
        
        return {
            id: node.id,
            name: node.name,
            type: node.type,
            location: { x: node.x, y: node.y },
            icon: serviceType.icon,
            color: serviceType.color,
            capacity: serviceType.capacity,
            currentLoad: Math.floor(Math.random() * serviceType.capacity * 0.6), // Random initial load
            avgResponseTime: serviceType.avgResponseTime,
            isActive: true,
            lastResponseTime: null,
            totalResponses: 0,
            equipment: this.generateEquipment(node.type),
            staff: this.generateStaff(node.type)
        };
    }

    // Generate equipment list for emergency service
    generateEquipment(serviceType) {
        const equipment = {
            'hospital': [
                'Ambulances', 'Emergency Room', 'Surgery Suite', 'ICU', 'X-Ray Machine',
                'Defibrillators', 'Ventilators', 'Blood Bank'
            ],
            'fire': [
                'Fire Trucks', 'Ladder Truck', 'Rescue Equipment', 'Hazmat Suits',
                'Fire Extinguishers', 'Oxygen Tanks', 'Thermal Cameras'
            ],
            'police': [
                'Patrol Cars', 'Motorcycles', 'K-9 Units', 'SWAT Equipment',
                'Communication Systems', 'Forensics Kit', 'Traffic Control'
            ]
        };

        return equipment[serviceType] || [];
    }

    // Generate staff information
    generateStaff(serviceType) {
        const staffTypes = {
            'hospital': {
                'Doctors': Math.floor(Math.random() * 20) + 10,
                'Nurses': Math.floor(Math.random() * 40) + 20,
                'Paramedics': Math.floor(Math.random() * 15) + 5,
                'Support Staff': Math.floor(Math.random() * 25) + 10
            },
            'fire': {
                'Firefighters': Math.floor(Math.random() * 25) + 15,
                'Fire Chief': 1,
                'Emergency Medical Technicians': Math.floor(Math.random() * 8) + 4,
                'Hazmat Specialists': Math.floor(Math.random() * 5) + 2
            },
            'police': {
                'Police Officers': Math.floor(Math.random() * 30) + 20,
                'Detectives': Math.floor(Math.random() * 8) + 5,
                'Traffic Officers': Math.floor(Math.random() * 10) + 5,
                'K-9 Officers': Math.floor(Math.random() * 4) + 2
            }
        };

        return staffTypes[serviceType] || {};
    }

    // Find nearest emergency services
    findNearestServices(sourceNodeId, serviceType = 'general', maxResults = 5) {
        const dijkstra = new DijkstraAlgorithm(this.graph);
        const nearestServices = dijkstra.findNearestEmergencyServices(sourceNodeId, serviceType, maxResults);
        
        // Enhance with emergency service details
        const enhancedServices = nearestServices.map(service => {
            const emergencyService = this.emergencyServices.get(service.node.id);
            
            return {
                ...service,
                details: emergencyService,
                availability: this.calculateAvailability(emergencyService),
                responseTime: this.calculateResponseTime(service.distance, emergencyService)
            };
        });

        return enhancedServices.sort((a, b) => {
            // Sort by a combination of distance and availability
            const scoreA = a.distance + (a.availability < 0.5 ? 50 : 0);
            const scoreB = b.distance + (b.availability < 0.5 ? 50 : 0);
            return scoreA - scoreB;
        });
    }

    // Calculate service availability
    calculateAvailability(service) {
        if (!service) return 0;
        
        const loadPercentage = service.currentLoad / service.capacity;
        return Math.max(0, 1 - loadPercentage);
    }

    // Calculate response time
    calculateResponseTime(distance, service) {
        if (!service) return distance;
        
        const baseTime = service.avgResponseTime;
        const distanceTime = distance * 0.8; // Assume 0.8 minutes per unit distance
        const loadFactor = service.currentLoad / service.capacity;
        
        return Math.round(baseTime + distanceTime + (loadFactor * 3));
    }

    // Simulate emergency response
    simulateEmergencyResponse(serviceId, emergencyLocation, emergencyType) {
        const service = this.emergencyServices.get(serviceId);
        if (!service) {
            this.logEmergencyEvent(`Error: Service ${serviceId} not found`);
            return null;
        }

        const emergencyId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = new Date();
        
        const emergency = {
            id: emergencyId,
            serviceId,
            service,
            location: emergencyLocation,
            type: emergencyType,
            status: 'dispatched',
            startTime,
            estimatedArrival: new Date(startTime.getTime() + service.avgResponseTime * 60000),
            responseTime: null,
            completionTime: null
        };

        // Add to active emergencies
        this.activeEmergencies.set(emergencyId, emergency);
        
        // Update service load
        service.currentLoad = Math.min(service.capacity, service.currentLoad + 1);
        service.totalResponses++;

        this.logEmergencyEvent(`Emergency response dispatched: ${service.name} -> ${emergencyType}`);

        // Simulate response completion
        setTimeout(() => {
            this.completeEmergencyResponse(emergencyId);
        }, service.avgResponseTime * 1000); // Convert to milliseconds for simulation

        return emergency;
    }

    // Complete emergency response
    completeEmergencyResponse(emergencyId) {
        const emergency = this.activeEmergencies.get(emergencyId);
        if (!emergency) return;

        const completionTime = new Date();
        const responseTime = Math.round((completionTime - emergency.startTime) / 60000); // Convert to minutes

        emergency.status = 'completed';
        emergency.completionTime = completionTime;
        emergency.responseTime = responseTime;

        // Update service load
        emergency.service.currentLoad = Math.max(0, emergency.service.currentLoad - 1);
        emergency.service.lastResponseTime = responseTime;

        // Move to history
        this.responseHistory.push(emergency);
        this.activeEmergencies.delete(emergencyId);

        // Keep only last 100 responses in history
        if (this.responseHistory.length > 100) {
            this.responseHistory.shift();
        }

        this.logEmergencyEvent(`Emergency response completed: ${emergency.service.name} (${responseTime} min)`);

        // Dispatch completion event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('emergencyCompleted', {
                detail: emergency
            }));
        }

        return emergency;
    }

    // Get emergency service details
    getServiceDetails(serviceId) {
        const service = this.emergencyServices.get(serviceId);
        if (!service) return null;

        return {
            ...service,
            availability: this.calculateAvailability(service),
            activeResponses: Array.from(this.activeEmergencies.values())
                .filter(emergency => emergency.serviceId === serviceId).length,
            recentResponses: this.responseHistory
                .filter(response => response.serviceId === serviceId)
                .slice(-5)
        };
    }

    // Get all emergency services
    getAllServices() {
        return Array.from(this.emergencyServices.values()).map(service => ({
            ...service,
            availability: this.calculateAvailability(service),
            status: this.getServiceStatus(service)
        }));
    }

    // Get service status
    getServiceStatus(service) {
        const availability = this.calculateAvailability(service);
        
        if (availability > 0.7) {
            return 'available';
        } else if (availability > 0.3) {
            return 'busy';
        } else {
            return 'critical';
        }
    }

    // Get emergency statistics
    getEmergencyStatistics() {
        const services = Array.from(this.emergencyServices.values());
        const activeCount = this.activeEmergencies.size;
        const totalResponses = services.reduce((sum, service) => sum + service.totalResponses, 0);
        const avgResponseTime = this.responseHistory.length > 0 ?
            this.responseHistory.reduce((sum, response) => sum + response.responseTime, 0) / this.responseHistory.length :
            0;

        const serviceStats = {};
        for (const [type, config] of Object.entries(this.serviceTypes)) {
            const typeServices = services.filter(s => s.type === type);
            serviceStats[type] = {
                count: typeServices.length,
                totalCapacity: typeServices.reduce((sum, s) => sum + s.capacity, 0),
                currentLoad: typeServices.reduce((sum, s) => sum + s.currentLoad, 0),
                avgAvailability: typeServices.reduce((sum, s) => sum + this.calculateAvailability(s), 0) / typeServices.length
            };
        }

        return {
            totalServices: services.length,
            activeEmergencies: activeCount,
            totalResponses,
            avgResponseTime: Math.round(avgResponseTime),
            serviceStats
        };
    }

    // Update service capacity
    updateServiceCapacity(serviceId, newCapacity) {
        const service = this.emergencyServices.get(serviceId);
        if (!service) return false;

        service.capacity = newCapacity;
        this.logEmergencyEvent(`Updated capacity for ${service.name}: ${newCapacity}`);
        return true;
    }

    // Log emergency events
    logEmergencyEvent(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] Emergency: ${message}`;
        
        if (typeof console !== 'undefined') {
            console.log(logMessage);
        }
        
        // Dispatch log event for UI
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('emergencyLog', {
                detail: {
                    message: logMessage,
                    timestamp,
                    type: 'emergency'
                }
            }));
        }
    }

    // Get response history
    getResponseHistory(limit = 10) {
        return this.responseHistory.slice(-limit);
    }

    // Clear response history
    clearResponseHistory() {
        this.responseHistory = [];
        this.logEmergencyEvent('Response history cleared');
        return this;
    }

    // Generate emergency report
    generateEmergencyReport() {
        const stats = this.getEmergencyStatistics();
        const recentResponses = this.getResponseHistory(20);
        
        return {
            timestamp: new Date(),
            statistics: stats,
            recentResponses,
            serviceDetails: this.getAllServices(),
            recommendations: this.generateRecommendations(stats)
        };
    }

    // Generate recommendations based on statistics
    generateRecommendations(stats) {
        const recommendations = [];
        
        // Check for overloaded services
        for (const [type, serviceStats] of Object.entries(stats.serviceStats)) {
            if (serviceStats.avgAvailability < 0.3) {
                recommendations.push({
                    type: 'capacity',
                    priority: 'high',
                    message: `${type} services are operating at high capacity. Consider increasing resources.`
                });
            }
        }

        // Check response times
        if (stats.avgResponseTime > 15) {
            recommendations.push({
                type: 'response_time',
                priority: 'medium',
                message: 'Average response time is higher than optimal. Review routing and resource allocation.'
            });
        }

        // Check service distribution
        const serviceDistribution = Object.values(stats.serviceStats).map(s => s.count);
        const minServices = Math.min(...serviceDistribution);
        const maxServices = Math.max(...serviceDistribution);
        
        if (maxServices - minServices > 2) {
            recommendations.push({
                type: 'distribution',
                priority: 'low',
                message: 'Consider balancing emergency service distribution across the city.'
            });
        }

        return recommendations;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyServicesManager;
}