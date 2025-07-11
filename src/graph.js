// Graph data structure implementation for route optimization
class Graph {
    constructor() {
        this.nodes = new Map();
        this.edges = new Map();
        this.nodeCount = 0;
    }

    // Add a node to the graph
    addNode(id, name, x, y, type = 'normal') {
        const node = {
            id,
            name,
            x,
            y,
            type,
            neighbors: new Map()
        };
        this.nodes.set(id, node);
        this.nodeCount++;
        return node;
    }

    // Add an edge between two nodes
    addEdge(fromId, toId, weight, trafficMultiplier = 1) {
        const from = this.nodes.get(fromId);
        const to = this.nodes.get(toId);
        
        if (!from || !to) {
            throw new Error(`Node not found: ${fromId} or ${toId}`);
        }

        const edgeId = `${fromId}-${toId}`;
        const edge = {
            id: edgeId,
            from: fromId,
            to: toId,
            weight,
            baseWeight: weight,
            trafficMultiplier,
            trafficLevel: 'normal' // normal, moderate, heavy
        };

        // Add edge to edges map
        this.edges.set(edgeId, edge);
        
        // Add bidirectional connections
        from.neighbors.set(toId, edge);
        to.neighbors.set(fromId, {...edge, from: toId, to: fromId});
        
        return edge;
    }

    // Get all nodes
    getNodes() {
        return Array.from(this.nodes.values());
    }

    // Get all edges
    getEdges() {
        return Array.from(this.edges.values());
    }

    // Get node by ID
    getNode(id) {
        return this.nodes.get(id);
    }

    // Get edge by ID
    getEdge(id) {
        return this.edges.get(id);
    }

    // Get neighbors of a node
    getNeighbors(nodeId) {
        const node = this.nodes.get(nodeId);
        return node ? Array.from(node.neighbors.values()) : [];
    }

    // Update traffic conditions for an edge
    updateTrafficCondition(edgeId, trafficLevel) {
        const edge = this.edges.get(edgeId);
        if (!edge) return false;

        const trafficMultipliers = {
            'normal': 1,
            'moderate': 1.5,
            'heavy': 2.5
        };

        edge.trafficLevel = trafficLevel;
        edge.trafficMultiplier = trafficMultipliers[trafficLevel] || 1;
        edge.weight = edge.baseWeight * edge.trafficMultiplier;

        // Update corresponding neighbor connections
        const fromNode = this.nodes.get(edge.from);
        const toNode = this.nodes.get(edge.to);
        
        if (fromNode && fromNode.neighbors.has(edge.to)) {
            fromNode.neighbors.get(edge.to).weight = edge.weight;
            fromNode.neighbors.get(edge.to).trafficLevel = trafficLevel;
            fromNode.neighbors.get(edge.to).trafficMultiplier = edge.trafficMultiplier;
        }
        
        if (toNode && toNode.neighbors.has(edge.from)) {
            toNode.neighbors.get(edge.from).weight = edge.weight;
            toNode.neighbors.get(edge.from).trafficLevel = trafficLevel;
            toNode.neighbors.get(edge.from).trafficMultiplier = edge.trafficMultiplier;
        }

        return true;
    }

    // Find nodes within a certain distance
    findNodesInRadius(centerNodeId, radius) {
        const centerNode = this.nodes.get(centerNodeId);
        if (!centerNode) return [];

        const nodesInRadius = [];
        
        for (const node of this.nodes.values()) {
            if (node.id === centerNodeId) continue;
            
            const distance = this.calculateEuclideanDistance(
                centerNode.x, centerNode.y,
                node.x, node.y
            );
            
            if (distance <= radius) {
                nodesInRadius.push({
                    node,
                    distance
                });
            }
        }
        
        return nodesInRadius.sort((a, b) => a.distance - b.distance);
    }

    // Calculate Euclidean distance between two points
    calculateEuclideanDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    // Get edge weight considering traffic
    getEdgeWeight(fromId, toId) {
        const node = this.nodes.get(fromId);
        if (!node || !node.neighbors.has(toId)) return Infinity;
        
        const edge = node.neighbors.get(toId);
        return edge.weight;
    }

    // Initialize a sample city graph
    initializeSampleGraph() {
        // Clear existing graph
        this.nodes.clear();
        this.edges.clear();
        this.nodeCount = 0;

        // Add nodes representing key locations in the city
        const locations = [
            { id: 'downtown', name: 'Downtown', x: 300, y: 200, type: 'normal' },
            { id: 'hospital1', name: 'General Hospital', x: 150, y: 100, type: 'hospital' },
            { id: 'hospital2', name: 'Emergency Medical Center', x: 500, y: 300, type: 'hospital' },
            { id: 'firestation1', name: 'Fire Station Alpha', x: 200, y: 350, type: 'fire' },
            { id: 'firestation2', name: 'Fire Station Beta', x: 400, y: 150, type: 'fire' },
            { id: 'police1', name: 'Police Station North', x: 250, y: 50, type: 'police' },
            { id: 'police2', name: 'Police Station South', x: 350, y: 400, type: 'police' },
            { id: 'residential1', name: 'Maple Street', x: 100, y: 250, type: 'residential' },
            { id: 'residential2', name: 'Oak Avenue', x: 450, y: 250, type: 'residential' },
            { id: 'commercial1', name: 'Shopping District', x: 200, y: 200, type: 'commercial' },
            { id: 'commercial2', name: 'Business Park', x: 400, y: 350, type: 'commercial' },
            { id: 'industrial1', name: 'Industrial Zone', x: 50, y: 150, type: 'industrial' },
            { id: 'highway1', name: 'Highway Junction', x: 450, y: 50, type: 'highway' },
            { id: 'airport', name: 'City Airport', x: 550, y: 100, type: 'airport' },
            { id: 'university', name: 'City University', x: 300, y: 350, type: 'university' }
        ];

        // Add all nodes to the graph
        locations.forEach(location => {
            this.addNode(location.id, location.name, location.x, location.y, location.type);
        });

        // Add edges representing roads with different base weights (distances)
        const connections = [
            // Downtown connections
            { from: 'downtown', to: 'hospital1', weight: 8 },
            { from: 'downtown', to: 'commercial1', weight: 3 },
            { from: 'downtown', to: 'firestation2', weight: 6 },
            { from: 'downtown', to: 'residential2', weight: 7 },
            { from: 'downtown', to: 'university', weight: 5 },
            
            // Hospital connections
            { from: 'hospital1', to: 'police1', weight: 4 },
            { from: 'hospital1', to: 'industrial1', weight: 5 },
            { from: 'hospital1', to: 'residential1', weight: 6 },
            { from: 'hospital2', to: 'residential2', weight: 4 },
            { from: 'hospital2', to: 'commercial2', weight: 3 },
            { from: 'hospital2', to: 'airport', weight: 8 },
            
            // Fire station connections
            { from: 'firestation1', to: 'residential1', weight: 5 },
            { from: 'firestation1', to: 'commercial1', weight: 7 },
            { from: 'firestation1', to: 'police2', weight: 4 },
            { from: 'firestation1', to: 'university', weight: 3 },
            { from: 'firestation2', to: 'police1', weight: 6 },
            { from: 'firestation2', to: 'highway1', weight: 9 },
            { from: 'firestation2', to: 'commercial2', weight: 8 },
            
            // Police station connections
            { from: 'police1', to: 'highway1', weight: 7 },
            { from: 'police1', to: 'commercial1', weight: 4 },
            { from: 'police2', to: 'commercial2', weight: 3 },
            { from: 'police2', to: 'university', weight: 2 },
            
            // Residential connections
            { from: 'residential1', to: 'commercial1', weight: 4 },
            { from: 'residential1', to: 'industrial1', weight: 6 },
            { from: 'residential2', to: 'commercial2', weight: 5 },
            { from: 'residential2', to: 'airport', weight: 7 },
            
            // Commercial connections
            { from: 'commercial1', to: 'commercial2', weight: 9 },
            { from: 'commercial2', to: 'university', weight: 4 },
            { from: 'commercial2', to: 'airport', weight: 6 },
            
            // Highway and airport connections
            { from: 'highway1', to: 'airport', weight: 5 },
            { from: 'highway1', to: 'residential2', weight: 10 },
            { from: 'industrial1', to: 'commercial1', weight: 8 },
            
            // Additional connections for better connectivity
            { from: 'hospital1', to: 'firestation1', weight: 12 },
            { from: 'hospital2', to: 'firestation2', weight: 10 },
            { from: 'police1', to: 'police2', weight: 15 },
            { from: 'university', to: 'airport', weight: 11 }
        ];

        // Add all connections to the graph
        connections.forEach(connection => {
            this.addEdge(connection.from, connection.to, connection.weight);
        });

        return this;
    }

    // Export graph data for visualization
    exportForVisualization() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: Array.from(this.edges.values())
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Graph;
}