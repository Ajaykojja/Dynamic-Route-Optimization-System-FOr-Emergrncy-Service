// Traffic simulation and management system
class TrafficManager {
    constructor(graph) {
        this.graph = graph;
        this.trafficPatterns = new Map();
        this.simulationInterval = null;
        this.simulationSpeed = 5000; // milliseconds
        this.isSimulating = false;
        this.trafficHistory = [];
    }

    // Initialize traffic patterns for different times of day
    initializeTrafficPatterns() {
        const edges = this.graph.getEdges();
        
        // Define traffic patterns based on edge types and locations
        const patterns = {
            'rush_hour_morning': {
                time: '07:00-09:00',
                modifiers: {
                    'downtown': 2.0,
                    'commercial': 1.8,
                    'highway': 2.2,
                    'residential': 1.3,
                    'hospital': 1.5,
                    'university': 1.7
                }
            },
            'rush_hour_evening': {
                time: '17:00-19:00',
                modifiers: {
                    'downtown': 2.5,
                    'commercial': 2.0,
                    'highway': 2.8,
                    'residential': 1.5,
                    'hospital': 1.3,
                    'university': 1.8
                }
            },
            'midday': {
                time: '12:00-14:00',
                modifiers: {
                    'downtown': 1.5,
                    'commercial': 1.8,
                    'highway': 1.3,
                    'residential': 1.0,
                    'hospital': 1.4,
                    'university': 1.6
                }
            },
            'night': {
                time: '22:00-06:00',
                modifiers: {
                    'downtown': 0.8,
                    'commercial': 0.6,
                    'highway': 0.7,
                    'residential': 0.5,
                    'hospital': 1.0,
                    'university': 0.4
                }
            }
        };

        this.trafficPatterns = new Map(Object.entries(patterns));
        return this;
    }

    // Start traffic simulation
    startSimulation() {
        if (this.isSimulating) {
            this.logTrafficEvent('Warning: Traffic simulation already running');
            return;
        }

        this.isSimulating = true;
        this.logTrafficEvent('Traffic simulation started');
        
        // Initial traffic update
        this.updateTrafficConditions();
        
        // Set up periodic updates
        this.simulationInterval = setInterval(() => {
            this.updateTrafficConditions();
        }, this.simulationSpeed);

        return this;
    }

    // Stop traffic simulation
    stopSimulation() {
        if (!this.isSimulating) {
            return;
        }

        this.isSimulating = false;
        
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }

        this.logTrafficEvent('Traffic simulation stopped');
        return this;
    }

    // Update traffic conditions for all edges
    updateTrafficConditions() {
        const edges = this.graph.getEdges();
        const currentTime = new Date();
        const currentPattern = this.getCurrentTrafficPattern();
        
        let updatedEdges = 0;
        const trafficSnapshot = {
            timestamp: currentTime,
            pattern: currentPattern,
            conditions: []
        };

        for (const edge of edges) {
            const newTrafficLevel = this.calculateTrafficLevel(edge, currentPattern);
            
            if (this.graph.updateTrafficCondition(edge.id, newTrafficLevel)) {
                updatedEdges++;
                
                trafficSnapshot.conditions.push({
                    edgeId: edge.id,
                    from: edge.from,
                    to: edge.to,
                    trafficLevel: newTrafficLevel,
                    weight: edge.weight
                });
            }
        }

        // Store traffic history
        this.trafficHistory.push(trafficSnapshot);
        
        // Keep only last 100 snapshots
        if (this.trafficHistory.length > 100) {
            this.trafficHistory.shift();
        }

        this.logTrafficEvent(`Updated traffic conditions for ${updatedEdges} edges (Pattern: ${currentPattern})`);
        
        // Dispatch custom event for UI updates
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('trafficUpdated', {
                detail: {
                    pattern: currentPattern,
                    updatedEdges,
                    timestamp: currentTime
                }
            }));
        }

        return trafficSnapshot;
    }

    // Get current traffic pattern based on time of day
    getCurrentTrafficPattern() {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= 7 && hour < 9) {
            return 'rush_hour_morning';
        } else if (hour >= 17 && hour < 19) {
            return 'rush_hour_evening';
        } else if (hour >= 12 && hour < 14) {
            return 'midday';
        } else if (hour >= 22 || hour < 6) {
            return 'night';
        } else {
            return 'normal';
        }
    }

    // Calculate traffic level for a specific edge
    calculateTrafficLevel(edge, pattern) {
        const fromNode = this.graph.getNode(edge.from);
        const toNode = this.graph.getNode(edge.to);
        
        if (!fromNode || !toNode) {
            return 'normal';
        }

        // Base traffic probability
        let trafficProbability = 0.3;

        // Apply pattern modifiers
        if (pattern && this.trafficPatterns.has(pattern)) {
            const patternData = this.trafficPatterns.get(pattern);
            const fromModifier = patternData.modifiers[fromNode.type] || 1.0;
            const toModifier = patternData.modifiers[toNode.type] || 1.0;
            
            trafficProbability *= (fromModifier + toModifier) / 2;
        }

        // Add randomness for realistic simulation
        const randomFactor = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
        trafficProbability *= randomFactor;

        // Consider edge weight (longer roads more likely to have traffic)
        const lengthFactor = Math.min(edge.baseWeight / 10, 1.5);
        trafficProbability *= lengthFactor;

        // Add some persistence (traffic conditions don't change drastically)
        const currentLevel = edge.trafficLevel;
        if (currentLevel && currentLevel !== 'normal') {
            trafficProbability *= 1.2; // Slight persistence for non-normal conditions
        }

        // Determine traffic level based on probability
        if (trafficProbability > 1.5) {
            return 'heavy';
        } else if (trafficProbability > 0.8) {
            return 'moderate';
        } else {
            return 'normal';
        }
    }

    // Simulate traffic incident
    simulateIncident(edgeId, incidentType = 'accident', duration = 30000) {
        const edge = this.graph.getEdge(edgeId);
        if (!edge) {
            this.logTrafficEvent(`Error: Edge ${edgeId} not found for incident simulation`);
            return false;
        }

        const originalLevel = edge.trafficLevel;
        
        // Set heavy traffic due to incident
        this.graph.updateTrafficCondition(edgeId, 'heavy');
        
        this.logTrafficEvent(`Incident (${incidentType}) on ${edge.from} -> ${edge.to}. Traffic set to heavy.`);
        
        // Restore original traffic level after duration
        setTimeout(() => {
            this.graph.updateTrafficCondition(edgeId, originalLevel);
            this.logTrafficEvent(`Incident cleared on ${edge.from} -> ${edge.to}. Traffic restored to ${originalLevel}.`);
            
            // Dispatch incident cleared event
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('incidentCleared', {
                    detail: {
                        edgeId,
                        incidentType,
                        originalLevel
                    }
                }));
            }
        }, duration);

        // Dispatch incident event
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('trafficIncident', {
                detail: {
                    edgeId,
                    incidentType,
                    duration,
                    edge
                }
            }));
        }

        return true;
    }

    // Get traffic statistics
    getTrafficStatistics() {
        const edges = this.graph.getEdges();
        const stats = {
            total: edges.length,
            normal: 0,
            moderate: 0,
            heavy: 0,
            averageWeight: 0,
            totalWeight: 0
        };

        for (const edge of edges) {
            stats[edge.trafficLevel]++;
            stats.totalWeight += edge.weight;
        }

        stats.averageWeight = stats.totalWeight / stats.total;
        stats.congestionLevel = ((stats.moderate + stats.heavy * 2) / stats.total) * 100;

        return stats;
    }

    // Get traffic history
    getTrafficHistory(limit = 10) {
        return this.trafficHistory.slice(-limit);
    }

    // Clear traffic history
    clearTrafficHistory() {
        this.trafficHistory = [];
        this.logTrafficEvent('Traffic history cleared');
        return this;
    }

    // Log traffic events
    logTrafficEvent(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] Traffic: ${message}`;
        
        if (typeof console !== 'undefined') {
            console.log(logMessage);
        }
        
        // Dispatch log event for UI
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('trafficLog', {
                detail: {
                    message: logMessage,
                    timestamp,
                    type: 'traffic'
                }
            }));
        }
    }

    // Reset all traffic to normal
    resetTrafficToNormal() {
        const edges = this.graph.getEdges();
        let resetCount = 0;

        for (const edge of edges) {
            if (this.graph.updateTrafficCondition(edge.id, 'normal')) {
                resetCount++;
            }
        }

        this.logTrafficEvent(`Reset ${resetCount} edges to normal traffic`);
        return resetCount;
    }

    // Get current traffic status
    getCurrentTrafficStatus() {
        const stats = this.getTrafficStatistics();
        const currentPattern = this.getCurrentTrafficPattern();
        
        return {
            isSimulating: this.isSimulating,
            currentPattern,
            statistics: stats,
            lastUpdate: this.trafficHistory.length > 0 ? 
                this.trafficHistory[this.trafficHistory.length - 1].timestamp : null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrafficManager;
}