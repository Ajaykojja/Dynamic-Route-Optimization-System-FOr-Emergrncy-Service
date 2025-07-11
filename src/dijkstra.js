// Dijkstra's algorithm implementation for shortest path finding
class PriorityQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(element, priority) {
        const node = { element, priority };
        let added = false;

        for (let i = 0; i < this.queue.length; i++) {
            if (node.priority < this.queue[i].priority) {
                this.queue.splice(i, 0, node);
                added = true;
                break;
            }
        }

        if (!added) {
            this.queue.push(node);
        }
    }

    dequeue() {
        return this.queue.shift();
    }

    isEmpty() {
        return this.queue.length === 0;
    }

    size() {
        return this.queue.length;
    }
}

class DijkstraAlgorithm {
    constructor(graph) {
        this.graph = graph;
        this.distances = new Map();
        this.previous = new Map();
        this.visited = new Set();
    }

    // Find shortest path between source and destination
    findShortestPath(sourceId, destinationId) {
        if (!this.graph.getNode(sourceId) || !this.graph.getNode(destinationId)) {
            return null;
        }

        // Initialize distances and previous nodes
        this.initializeDistances(sourceId);
        
        const priorityQueue = new PriorityQueue();
        priorityQueue.enqueue(sourceId, 0);

        const startTime = performance.now();

        while (!priorityQueue.isEmpty()) {
            const current = priorityQueue.dequeue();
            const currentNodeId = current.element;

            // Skip if already visited
            if (this.visited.has(currentNodeId)) {
                continue;
            }

            // Mark as visited
            this.visited.add(currentNodeId);

            // If we reached the destination, construct and return the path
            if (currentNodeId === destinationId) {
                const path = this.constructPath(destinationId);
                const totalDistance = this.distances.get(destinationId);
                const processingTime = performance.now() - startTime;
                
                return {
                    path,
                    totalDistance,
                    processingTime: Math.round(processingTime * 100) / 100,
                    nodesExplored: this.visited.size
                };
            }

            // Check all neighbors
            const neighbors = this.graph.getNeighbors(currentNodeId);
            
            for (const edge of neighbors) {
                const neighborId = edge.to;
                const edgeWeight = edge.weight;
                
                if (!this.visited.has(neighborId)) {
                    const newDistance = this.distances.get(currentNodeId) + edgeWeight;
                    
                    if (newDistance < this.distances.get(neighborId)) {
                        this.distances.set(neighborId, newDistance);
                        this.previous.set(neighborId, currentNodeId);
                        priorityQueue.enqueue(neighborId, newDistance);
                    }
                }
            }
        }

        // No path found
        return null;
    }

    // Initialize distances for all nodes
    initializeDistances(sourceId) {
        this.distances.clear();
        this.previous.clear();
        this.visited.clear();

        const nodes = this.graph.getNodes();
        
        for (const node of nodes) {
            this.distances.set(node.id, Infinity);
            this.previous.set(node.id, null);
        }
        
        this.distances.set(sourceId, 0);
    }

    // Construct path from source to destination
    constructPath(destinationId) {
        const path = [];
        let currentNode = destinationId;

        while (currentNode !== null) {
            path.unshift(currentNode);
            currentNode = this.previous.get(currentNode);
        }

        return path;
    }

    // Find paths to all nodes from source (useful for finding nearest emergency services)
    findAllPaths(sourceId) {
        if (!this.graph.getNode(sourceId)) {
            return null;
        }

        this.initializeDistances(sourceId);
        
        const priorityQueue = new PriorityQueue();
        priorityQueue.enqueue(sourceId, 0);
        const allPaths = new Map();

        while (!priorityQueue.isEmpty()) {
            const current = priorityQueue.dequeue();
            const currentNodeId = current.element;

            if (this.visited.has(currentNodeId)) {
                continue;
            }

            this.visited.add(currentNodeId);

            // Store path to current node
            const pathToCurrentNode = this.constructPath(currentNodeId);
            allPaths.set(currentNodeId, {
                path: pathToCurrentNode,
                distance: this.distances.get(currentNodeId)
            });

            // Check all neighbors
            const neighbors = this.graph.getNeighbors(currentNodeId);
            
            for (const edge of neighbors) {
                const neighborId = edge.to;
                const edgeWeight = edge.weight;
                
                if (!this.visited.has(neighborId)) {
                    const newDistance = this.distances.get(currentNodeId) + edgeWeight;
                    
                    if (newDistance < this.distances.get(neighborId)) {
                        this.distances.set(neighborId, newDistance);
                        this.previous.set(neighborId, currentNodeId);
                        priorityQueue.enqueue(neighborId, newDistance);
                    }
                }
            }
        }

        return allPaths;
    }

    // Find nearest emergency services of a specific type
    findNearestEmergencyServices(sourceId, serviceType, maxResults = 5) {
        const allPaths = this.findAllPaths(sourceId);
        if (!allPaths) return [];

        const emergencyServices = [];
        const nodes = this.graph.getNodes();

        for (const node of nodes) {
            if (this.isEmergencyService(node, serviceType) && node.id !== sourceId) {
                const pathInfo = allPaths.get(node.id);
                if (pathInfo) {
                    emergencyServices.push({
                        node,
                        path: pathInfo.path,
                        distance: pathInfo.distance,
                        estimatedTime: this.calculateEstimatedTime(pathInfo.distance)
                    });
                }
            }
        }

        // Sort by distance and return top results
        return emergencyServices
            .sort((a, b) => a.distance - b.distance)
            .slice(0, maxResults);
    }

    // Check if a node is an emergency service of the specified type
    isEmergencyService(node, serviceType) {
        const serviceTypes = {
            'medical': ['hospital'],
            'fire': ['fire'],
            'police': ['police'],
            'general': ['hospital', 'fire', 'police']
        };

        const requiredTypes = serviceTypes[serviceType] || [];
        return requiredTypes.some(type => node.type === type);
    }

    // Calculate estimated time based on distance (assuming average speed)
    calculateEstimatedTime(distance) {
        const averageSpeed = 50; // km/h for emergency vehicles
        const timeInHours = distance / averageSpeed;
        const timeInMinutes = timeInHours * 60;
        return Math.round(timeInMinutes);
    }

    // Calculate alternative routes (K-shortest paths approximation)
    findAlternativeRoutes(sourceId, destinationId, maxRoutes = 3) {
        const routes = [];
        const originalGraph = this.graph;

        // Find primary route
        const primaryRoute = this.findShortestPath(sourceId, destinationId);
        if (primaryRoute) {
            routes.push(primaryRoute);
        }

        // Find alternative routes by temporarily removing edges from the primary path
        for (let i = 0; i < Math.min(maxRoutes - 1, primaryRoute?.path.length - 1 || 0); i++) {
            const pathSegment = primaryRoute.path.slice(i, i + 2);
            if (pathSegment.length === 2) {
                const [from, to] = pathSegment;
                
                // Temporarily increase weight of this edge
                const edge = this.graph.getEdge(`${from}-${to}`);
                if (edge) {
                    const originalWeight = edge.weight;
                    this.graph.updateTrafficCondition(`${from}-${to}`, 'heavy');
                    
                    // Find alternative route
                    const alternativeRoute = this.findShortestPath(sourceId, destinationId);
                    if (alternativeRoute && alternativeRoute.totalDistance !== primaryRoute.totalDistance) {
                        routes.push(alternativeRoute);
                    }
                    
                    // Restore original weight
                    edge.weight = originalWeight;
                }
            }
        }

        return routes;
    }

    // Get detailed route information
    getRouteDetails(path) {
        if (!path || path.length < 2) return null;

        const details = {
            segments: [],
            totalDistance: 0,
            totalTime: 0,
            trafficConditions: {}
        };

        for (let i = 0; i < path.length - 1; i++) {
            const fromId = path[i];
            const toId = path[i + 1];
            const fromNode = this.graph.getNode(fromId);
            const toNode = this.graph.getNode(toId);
            
            if (fromNode && toNode) {
                const edge = fromNode.neighbors.get(toId);
                if (edge) {
                    const segment = {
                        from: fromNode.name,
                        to: toNode.name,
                        distance: edge.weight,
                        trafficLevel: edge.trafficLevel,
                        estimatedTime: this.calculateEstimatedTime(edge.weight)
                    };
                    
                    details.segments.push(segment);
                    details.totalDistance += edge.weight;
                    details.totalTime += segment.estimatedTime;
                    
                    // Track traffic conditions
                    if (!details.trafficConditions[edge.trafficLevel]) {
                        details.trafficConditions[edge.trafficLevel] = 0;
                    }
                    details.trafficConditions[edge.trafficLevel]++;
                }
            }
        }

        return details;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DijkstraAlgorithm;
}