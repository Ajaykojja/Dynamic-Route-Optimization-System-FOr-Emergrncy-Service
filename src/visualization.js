// Map visualization and UI management
class MapVisualization {
    constructor(mapContainer, graph) {
        this.mapContainer = mapContainer;
        this.graph = graph;
        this.nodes = new Map();
        this.edges = new Map();
        this.currentPath = null;
        this.selectedSource = null;
        this.selectedDestination = null;
        this.animationFrameId = null;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        
        this.initializeVisualization();
    }

    // Initialize the map visualization
    initializeVisualization() {
        this.mapContainer.innerHTML = '';
        this.mapContainer.style.position = 'relative';
        this.mapContainer.style.overflow = 'hidden';
        
        // Create map background
        this.createMapBackground();
        
        // Draw initial graph
        this.drawGraph();
        
        // Add event listeners
        this.addEventListeners();
    }

    // Create map background
    createMapBackground() {
        const background = document.createElement('div');
        background.className = 'map-background';
        background.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #f8f9fa 25%, transparent 25%, transparent 75%, #f8f9fa 75%, #f8f9fa),
                        linear-gradient(45deg, #f8f9fa 25%, transparent 25%, transparent 75%, #f8f9fa 75%, #f8f9fa);
            background-size: 20px 20px;
            background-position: 0 0, 10px 10px;
            opacity: 0.3;
        `;
        this.mapContainer.appendChild(background);
    }

    // Draw the complete graph
    drawGraph() {
        this.clearGraph();
        this.drawEdges();
        this.drawNodes();
    }

    // Clear existing graph elements
    clearGraph() {
        const existingElements = this.mapContainer.querySelectorAll('.node, .edge, .node-label');
        existingElements.forEach(element => element.remove());
        this.nodes.clear();
        this.edges.clear();
    }

    // Draw all edges
    drawEdges() {
        const edges = this.graph.getEdges();
        
        edges.forEach(edge => {
            const fromNode = this.graph.getNode(edge.from);
            const toNode = this.graph.getNode(edge.to);
            
            if (fromNode && toNode) {
                const edgeElement = this.createEdgeElement(edge, fromNode, toNode);
                this.mapContainer.appendChild(edgeElement);
                this.edges.set(edge.id, edgeElement);
            }
        });
    }

    // Create edge element
    createEdgeElement(edge, fromNode, toNode) {
        const edgeElement = document.createElement('div');
        edgeElement.className = `edge ${edge.trafficLevel}`;
        edgeElement.dataset.edgeId = edge.id;
        edgeElement.dataset.from = edge.from;
        edgeElement.dataset.to = edge.to;
        
        // Calculate edge position and rotation
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        edgeElement.style.cssText = `
            position: absolute;
            left: ${fromNode.x}px;
            top: ${fromNode.y}px;
            width: ${length}px;
            height: 2px;
            background: ${this.getTrafficColor(edge.trafficLevel)};
            transform-origin: 0 50%;
            transform: rotate(${angle}deg);
            z-index: 1;
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        
        // Add hover effect
        edgeElement.addEventListener('mouseenter', () => {
            edgeElement.style.height = '4px';
            edgeElement.style.boxShadow = `0 0 10px ${this.getTrafficColor(edge.trafficLevel)}`;
            this.showEdgeTooltip(edge, edgeElement);
        });
        
        edgeElement.addEventListener('mouseleave', () => {
            edgeElement.style.height = '2px';
            edgeElement.style.boxShadow = 'none';
            this.hideTooltip();
        });
        
        return edgeElement;
    }

    // Get color for traffic level
    getTrafficColor(trafficLevel) {
        const colors = {
            'normal': '#4CAF50',
            'moderate': '#FF9800',
            'heavy': '#F44336'
        };
        return colors[trafficLevel] || '#95a5a6';
    }

    // Draw all nodes
    drawNodes() {
        const nodes = this.graph.getNodes();
        
        nodes.forEach(node => {
            const nodeElement = this.createNodeElement(node);
            const labelElement = this.createNodeLabel(node);
            
            this.mapContainer.appendChild(nodeElement);
            this.mapContainer.appendChild(labelElement);
            
            this.nodes.set(node.id, {
                element: nodeElement,
                label: labelElement,
                node: node
            });
        });
    }

    // Create node element
    createNodeElement(node) {
        const nodeElement = document.createElement('div');
        nodeElement.className = `node ${node.type}`;
        nodeElement.dataset.nodeId = node.id;
        nodeElement.textContent = this.getNodeIcon(node.type);
        
        nodeElement.style.cssText = `
            position: absolute;
            left: ${node.x - 10}px;
            top: ${node.y - 10}px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${this.getNodeColor(node.type)};
            border: 3px solid ${this.getNodeBorderColor(node.type)};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
            font-size: 10px;
            font-weight: bold;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        
        // Add click handler
        nodeElement.addEventListener('click', () => {
            this.handleNodeClick(node);
        });
        
        // Add hover effect
        nodeElement.addEventListener('mouseenter', () => {
            nodeElement.style.transform = 'scale(1.3)';
            nodeElement.style.boxShadow = `0 4px 16px ${this.getNodeColor(node.type)}`;
            this.showNodeTooltip(node, nodeElement);
        });
        
        nodeElement.addEventListener('mouseleave', () => {
            nodeElement.style.transform = 'scale(1)';
            nodeElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            this.hideTooltip();
        });
        
        return nodeElement;
    }

    // Create node label
    createNodeLabel(node) {
        const labelElement = document.createElement('div');
        labelElement.className = 'node-label';
        labelElement.textContent = node.name;
        
        labelElement.style.cssText = `
            position: absolute;
            left: ${node.x - 30}px;
            top: ${node.y - 35}px;
            background: rgba(44, 62, 80, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            z-index: 15;
            pointer-events: none;
            max-width: 120px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        return labelElement;
    }

    // Get node icon
    getNodeIcon(type) {
        const icons = {
            'hospital': '🏥',
            'fire': '🚒',
            'police': '🚔',
            'residential': '🏠',
            'commercial': '🏢',
            'industrial': '🏭',
            'highway': '🛣️',
            'airport': '✈️',
            'university': '🎓',
            'normal': '📍'
        };
        return icons[type] || '📍';
    }

    // Get node color
    getNodeColor(type) {
        const colors = {
            'hospital': '#e74c3c',
            'fire': '#e67e22',
            'police': '#3498db',
            'residential': '#2ecc71',
            'commercial': '#9b59b6',
            'industrial': '#34495e',
            'highway': '#f39c12',
            'airport': '#1abc9c',
            'university': '#8e44ad',
            'normal': '#95a5a6'
        };
        return colors[type] || '#95a5a6';
    }

    // Get node border color
    getNodeBorderColor(type) {
        const colors = {
            'hospital': '#c0392b',
            'fire': '#d35400',
            'police': '#2980b9',
            'residential': '#27ae60',
            'commercial': '#8e44ad',
            'industrial': '#2c3e50',
            'highway': '#e67e22',
            'airport': '#16a085',
            'university': '#732d91',
            'normal': '#7f8c8d'
        };
        return colors[type] || '#7f8c8d';
    }

    // Handle node click
    handleNodeClick(node) {
        if (!this.selectedSource) {
            this.setSource(node.id);
        } else if (!this.selectedDestination && node.id !== this.selectedSource) {
            this.setDestination(node.id);
        } else {
            this.clearSelection();
            this.setSource(node.id);
        }
    }

    // Set source node
    setSource(nodeId) {
        this.clearSelection();
        this.selectedSource = nodeId;
        
        const nodeData = this.nodes.get(nodeId);
        if (nodeData) {
            nodeData.element.classList.add('source');
            nodeData.element.style.background = '#27ae60';
            nodeData.element.style.borderColor = '#229954';
        }
        
        // Update UI
        const sourceSelect = document.getElementById('source-select');
        if (sourceSelect) {
            sourceSelect.value = nodeId;
        }
    }

    // Set destination node
    setDestination(nodeId) {
        this.selectedDestination = nodeId;
        
        const nodeData = this.nodes.get(nodeId);
        if (nodeData) {
            nodeData.element.classList.add('destination');
            nodeData.element.style.background = '#e74c3c';
            nodeData.element.style.borderColor = '#c0392b';
        }
        
        // Update UI
        const destinationSelect = document.getElementById('destination-select');
        if (destinationSelect) {
            destinationSelect.value = nodeId;
        }
    }

    // Clear selection
    clearSelection() {
        // Reset source
        if (this.selectedSource) {
            const sourceData = this.nodes.get(this.selectedSource);
            if (sourceData) {
                sourceData.element.classList.remove('source');
                sourceData.element.style.background = this.getNodeColor(sourceData.node.type);
                sourceData.element.style.borderColor = this.getNodeBorderColor(sourceData.node.type);
            }
        }
        
        // Reset destination
        if (this.selectedDestination) {
            const destData = this.nodes.get(this.selectedDestination);
            if (destData) {
                destData.element.classList.remove('destination');
                destData.element.style.background = this.getNodeColor(destData.node.type);
                destData.element.style.borderColor = this.getNodeBorderColor(destData.node.type);
            }
        }
        
        this.selectedSource = null;
        this.selectedDestination = null;
        this.clearPath();
    }

    // Highlight path
    highlightPath(path) {
        this.clearPath();
        
        if (!path || path.length < 2) return;
        
        this.currentPath = path;
        
        // Highlight edges in path
        for (let i = 0; i < path.length - 1; i++) {
            const fromId = path[i];
            const toId = path[i + 1];
            const edgeId = `${fromId}-${toId}`;
            
            const edgeElement = this.edges.get(edgeId);
            if (edgeElement) {
                edgeElement.classList.add('optimal');
                edgeElement.style.background = '#9b59b6';
                edgeElement.style.height = '4px';
                edgeElement.style.zIndex = '5';
                edgeElement.style.boxShadow = '0 0 10px rgba(155, 89, 182, 0.5)';
            }
        }
        
        // Animate path
        this.animatePath(path);
    }

    // Animate path
    animatePath(path) {
        if (!path || path.length < 2) return;
        
        const pathIndicator = document.createElement('div');
        pathIndicator.className = 'path-indicator';
        pathIndicator.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: #fff;
            border: 2px solid #9b59b6;
            border-radius: 50%;
            z-index: 20;
            box-shadow: 0 0 10px rgba(155, 89, 182, 0.8);
            transition: all 0.3s ease;
        `;
        
        this.mapContainer.appendChild(pathIndicator);
        
        let currentIndex = 0;
        
        const animateStep = () => {
            if (currentIndex >= path.length) {
                pathIndicator.remove();
                return;
            }
            
            const nodeId = path[currentIndex];
            const node = this.graph.getNode(nodeId);
            
            if (node) {
                pathIndicator.style.left = `${node.x - 4}px`;
                pathIndicator.style.top = `${node.y - 4}px`;
            }
            
            currentIndex++;
            
            if (currentIndex < path.length) {
                setTimeout(animateStep, 500);
            } else {
                setTimeout(() => pathIndicator.remove(), 1000);
            }
        };
        
        animateStep();
    }

    // Clear path highlight
    clearPath() {
        if (this.currentPath) {
            // Remove optimal class from edges
            const optimalEdges = this.mapContainer.querySelectorAll('.edge.optimal');
            optimalEdges.forEach(edge => {
                edge.classList.remove('optimal');
                const edgeId = edge.dataset.edgeId;
                const edgeData = this.graph.getEdge(edgeId);
                if (edgeData) {
                    edge.style.background = this.getTrafficColor(edgeData.trafficLevel);
                    edge.style.height = '2px';
                    edge.style.zIndex = '1';
                    edge.style.boxShadow = 'none';
                }
            });
            
            this.currentPath = null;
        }
        
        // Remove path indicators
        const pathIndicators = this.mapContainer.querySelectorAll('.path-indicator');
        pathIndicators.forEach(indicator => indicator.remove());
    }

    // Update traffic visualization
    updateTrafficVisualization() {
        const edges = this.graph.getEdges();
        
        edges.forEach(edge => {
            const edgeElement = this.edges.get(edge.id);
            if (edgeElement) {
                edgeElement.className = `edge ${edge.trafficLevel}`;
                edgeElement.style.background = this.getTrafficColor(edge.trafficLevel);
                
                // Add brief animation for traffic updates
                edgeElement.style.transition = 'background-color 0.5s ease';
            }
        });
    }

    // Show node tooltip
    showNodeTooltip(node, element) {
        this.hideTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        tooltip.innerHTML = `
            <strong>${node.name}</strong><br>
            <span>Type: ${node.type}</span><br>
            <span>Location: (${node.x}, ${node.y})</span>
        `;
        
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(44, 62, 80, 0.95);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 25;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
            max-width: 200px;
            line-height: 1.4;
        `;
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        const containerRect = this.mapContainer.getBoundingClientRect();
        
        tooltip.style.left = `${rect.left - containerRect.left + 30}px`;
        tooltip.style.top = `${rect.top - containerRect.top - 50}px`;
        
        this.mapContainer.appendChild(tooltip);
        this.currentTooltip = tooltip;
    }

    // Show edge tooltip
    showEdgeTooltip(edge, element) {
        this.hideTooltip();
        
        const fromNode = this.graph.getNode(edge.from);
        const toNode = this.graph.getNode(edge.to);
        
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        tooltip.innerHTML = `
            <strong>${fromNode.name} → ${toNode.name}</strong><br>
            <span>Distance: ${edge.baseWeight} units</span><br>
            <span>Traffic: ${edge.trafficLevel}</span><br>
            <span>Current Weight: ${edge.weight}</span>
        `;
        
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(44, 62, 80, 0.95);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 25;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
            max-width: 200px;
            line-height: 1.4;
        `;
        
        // Position tooltip near the edge
        const rect = element.getBoundingClientRect();
        const containerRect = this.mapContainer.getBoundingClientRect();
        
        tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - containerRect.top - 80}px`;
        
        this.mapContainer.appendChild(tooltip);
        this.currentTooltip = tooltip;
    }

    // Hide tooltip
    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    // Add event listeners
    addEventListeners() {
        // Listen for traffic updates
        if (typeof window !== 'undefined') {
            window.addEventListener('trafficUpdated', () => {
                this.updateTrafficVisualization();
            });
        }
        
        // Handle container resize
        const resizeObserver = new ResizeObserver(() => {
            this.handleResize();
        });
        
        resizeObserver.observe(this.mapContainer);
    }

    // Handle resize
    handleResize() {
        // Redraw graph to fit new container size
        this.drawGraph();
        
        // Restore current path if exists
        if (this.currentPath) {
            this.highlightPath(this.currentPath);
        }
    }

    // Get selected nodes
    getSelectedNodes() {
        return {
            source: this.selectedSource,
            destination: this.selectedDestination
        };
    }

    // Zoom functionality
    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.5, Math.min(3, this.scale));
        
        this.mapContainer.style.transform = `scale(${this.scale}) translate(${this.offset.x}px, ${this.offset.y}px)`;
    }

    // Reset zoom
    resetZoom() {
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.mapContainer.style.transform = 'scale(1) translate(0px, 0px)';
    }

    // Export visualization state
    exportState() {
        return {
            selectedSource: this.selectedSource,
            selectedDestination: this.selectedDestination,
            currentPath: this.currentPath,
            scale: this.scale,
            offset: this.offset
        };
    }

    // Import visualization state
    importState(state) {
        if (state.selectedSource) {
            this.setSource(state.selectedSource);
        }
        
        if (state.selectedDestination) {
            this.setDestination(state.selectedDestination);
        }
        
        if (state.currentPath) {
            this.highlightPath(state.currentPath);
        }
        
        this.scale = state.scale || 1;
        this.offset = state.offset || { x: 0, y: 0 };
        
        this.mapContainer.style.transform = `scale(${this.scale}) translate(${this.offset.x}px, ${this.offset.y}px)`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapVisualization;
}