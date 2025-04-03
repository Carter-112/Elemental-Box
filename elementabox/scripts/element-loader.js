// Element Loader module
// This module serves as the bridge between the ElementRegistry and the main application

// import ElementRegistry from './element-registry.js';

const ElementLoader = {
    // The active element that's currently selected
    activeElement: 'sand',
    
    // Brush size for drawing elements
    brushSize: 1,
    
    // Reference to the isInBounds function
    isInBounds: null,
    
    // Initialize the element system
    initialize: function(grid, config) {
        // Save the isInBounds function reference
        if (config && config.isInBounds) {
            this.isInBounds = config.isInBounds;
        }
        
        // Initialize the ElementRegistry with our grid
        if (window.ElementRegistry && typeof window.ElementRegistry.initialize === 'function') {
            window.ElementRegistry.initialize(grid, config);
        } else {
            console.error("ElementRegistry not available for initialization");
        }
        
        // Set up the UI elements for selecting elements
        this.setupElementUI();
        
        // Set up environmental tools
        this.setupEnvironmentalTools();
        
        console.log('ElementLoader initialized');
        return this;
    },
    
    // Set up the UI for selecting different elements
    setupElementUI: function() {
        // Get the element container
        const elementContainer = document.getElementById('element-buttons');
        if (!elementContainer) {
            console.error('Element container not found');
            return;
        }
        
        // Clear existing elements
        elementContainer.innerHTML = '';
        
        // Get all element names from registry
        const elementNames = window.ElementRegistry ? window.ElementRegistry.getElementNames() : [];
        
        // List of environmental elements to exclude from particle selection
        const excludedElements = ['wind', 'heat', 'cold'];
        
        // Define categories and their labels
        const categories = {
            gas: { label: 'Gas', elements: [] },
            solid: { label: 'Solid', elements: [] },
            solidPowder: { label: 'Solid Powder', elements: [] },
            liquid: { label: 'Liquid', elements: [] },
            environmental: { label: 'Environmental Tools', elements: [] },
            other: { label: 'Other', elements: [] }
        };
        
        // Categorize elements based on their properties
        elementNames.forEach(elementName => {
            // Skip environmental elements that should only appear as tools
            if (excludedElements.includes(elementName)) {
                return;
            }
            
            const element = window.ElementRegistry ? window.ElementRegistry.getElement(elementName) : null;
            if (!element) return;
            
            // Determine category based on element properties
            if (element.isGas) {
                categories.gas.elements.push(elementName);
            } else if (element.isLiquid) {
                categories.liquid.elements.push(elementName);
            } else if (element.isPowder) {
                categories.solidPowder.elements.push(elementName);
            } else if (element.isSolid !== false) { // Default to solid if not explicitly marked otherwise
                categories.solid.elements.push(elementName);
            } else {
                categories.other.elements.push(elementName);
            }
        });
        
        // Create UI for each category with elements
        Object.values(categories).forEach(category => {
            if (category.elements.length === 0) return;
            
            // Create category container
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'element-category';
            
            // Create category heading
            const heading = document.createElement('h3');
            heading.textContent = category.label;
            heading.className = 'category-heading';
            categoryContainer.appendChild(heading);
            
            // Create elements container for this category
            const elementsContainer = document.createElement('div');
            elementsContainer.className = 'category-elements';
            
            // Sort elements alphabetically within category
            category.elements.sort();
            
            // Create buttons for each element in this category
            category.elements.forEach(elementName => {
                const element = window.ElementRegistry.getElement(elementName);
                
                // Create button
                const button = document.createElement('button');
                button.className = 'element-button';
                button.setAttribute('data-element', elementName);
                
                // Create color indicator
                const colorIndicator = document.createElement('div');
                colorIndicator.className = 'element-color';
                colorIndicator.style.backgroundColor = element.defaultColor;
                
                // Handle special cases for visibility (like smoke, glass, etc.)
                if (element.isGas || (element.transparency && element.transparency > 0.5)) {
                    colorIndicator.style.border = '1px solid #ccc';
                }
                
                button.appendChild(colorIndicator);
                
                // Add element name
                const nameSpan = document.createElement('span');
                nameSpan.className = 'element-name';
                nameSpan.textContent = this.capitalizeFirstLetter(elementName.replace(/-/g, ' '));
                button.appendChild(nameSpan);
                
                // Add hover text with more details
                button.title = `${this.capitalizeFirstLetter(elementName.replace(/-/g, ' '))}\nType: ${category.label}`;
                
                // Add click handler
                button.addEventListener('click', () => {
                    this.setActiveElement(elementName);
                    
                    // Update active button
                    document.querySelectorAll('.element-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    button.classList.add('active');
                });
                
                // Add button to category container
                elementsContainer.appendChild(button);
            });
            
            categoryContainer.appendChild(elementsContainer);
            elementContainer.appendChild(categoryContainer);
        });
        
        // Set the initial active element
        this.setActiveElement('sand');
        document.querySelector(`.element-button[data-element='sand']`)?.classList.add('active');
        
        // Set up brush size control
        this.setupBrushSizeControl();
    },
    
    // Set up the brush size control
    setupBrushSizeControl: function() {
        const brushSizeControl = document.getElementById('brush-size');
        if (!brushSizeControl) return;
        
        // Set initial value
        brushSizeControl.value = this.brushSize;
        
        // Add change event
        brushSizeControl.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value, 10);
            document.getElementById('brush-size-value').textContent = this.brushSize;
        });
    },
    
    // Capitalize the first letter of a string
    capitalizeFirstLetter: function(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    // Set the active element
    setActiveElement: function(elementName) {
        if (!window.ElementRegistry || !window.ElementRegistry.getElement(elementName)) {
            console.error(`Element "${elementName}" not found`);
            return;
        }
        
        // If any environmental tool is active, deactivate it
        if (window.ElementRegistry) {
            const envTools = window.ElementRegistry.getAllEnvironmentalTools();
            let toolDeactivated = false;
            
            for (const toolName of envTools) {
                const tool = window.ElementRegistry.getEnvironmentalTool(toolName);
                if (tool && tool.isActive) {
                    // Deactivate the tool
                    tool.isActive = false;
                    toolDeactivated = true;
                    
                    // Also remove the 'active' class from the tool button
                    const toolButton = document.querySelector(`.env-tool-button[data-tool='${toolName}']`);
                    if (toolButton) {
                        toolButton.classList.remove('active');
                    }
                }
            }
            
            // If a tool was deactivated, make sure the element button is visually active
            if (toolDeactivated) {
                document.querySelectorAll('.element-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const elementButton = document.querySelector(`.element-button[data-element='${elementName}']`);
                if (elementButton) {
                    elementButton.classList.add('active');
                }
            }
        }
        
        this.activeElement = elementName;
        console.log('Active element set to:', elementName);
    },
    
    // Get the active element
    getActiveElement: function() {
        return this.activeElement;
    },
    
    // Create a particle of the active element type
    createParticle: function(type = null) {
        const elementType = type || this.activeElement;
        
        // Create the particle using the ElementRegistry
        const particle = window.ElementRegistry ? window.ElementRegistry.createParticle(elementType) : null;
        return particle;
    },
    
    // Create particles in a brush pattern of the specified size
    createParticlesWithBrush: function(centerX, centerY, grid, isInBounds, type = null) {
        // Check if any environmental tool is active - if so, don't spawn particles
        if (window.ElementRegistry) {
            const envTools = window.ElementRegistry.getAllEnvironmentalTools();
            for (const toolName of envTools) {
                const tool = window.ElementRegistry.getEnvironmentalTool(toolName);
                if (tool && tool.isActive) {
                    // Environmental tool is active, don't spawn particles
                    return;
                }
            }
        }
        
        // Get the override checkbox state
        const overrideMode = document.getElementById('override-toggle')?.checked || false;
        
        const radius = Math.floor(this.brushSize / 2);
        const activeType = type || this.activeElement;
        const gridCenterX = Math.floor(centerX);
        const gridCenterY = Math.floor(centerY);
        
        // Special handling for eraser - always override
        const isEraser = activeType === 'eraser';
        
        // Create particles in a circle pattern around the center
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx*dx + dy*dy > radius*radius) continue;
                const gridX = gridCenterX + dx;
                const gridY = gridCenterY + dy;
                
                // Check if position is valid
                if (!isInBounds(gridX, gridY)) continue;
                
                // For eraser, simply remove the particle
                if (isEraser) {
                    grid[gridY][gridX] = null;
                    continue;
                }
                
                // If override is not enabled, only place if cell is empty
                if (!overrideMode && grid[gridY][gridX] !== null) continue;
                
                // Create and place the particle
                const particle = this.createParticle(activeType);
                if (particle) {
                    grid[gridY][gridX] = particle;
                }
            }
        }
    },
    
    // Process all particles using the ElementRegistry
    processParticles: function(isInBounds, getRandomCell) {
        if (window.ElementRegistry && typeof window.ElementRegistry.processParticles === 'function') {
            window.ElementRegistry.processParticles(isInBounds, getRandomCell);
        }
    },
    
    // Render all particles using the ElementRegistry
    renderParticles: function(ctx) {
        if (window.ElementRegistry && typeof window.ElementRegistry.renderParticles === 'function') {
            window.ElementRegistry.renderParticles(ctx);
        }
    },
    
    // Get the color for an element type
    getElementColor: function(elementType) {
        return window.ElementRegistry ? window.ElementRegistry.getElementColor(elementType) : '#FFFFFF';
    },
    
    // Add this new function for setting up environmental tools
    setupEnvironmentalTools: function() {
        // Get the tools container
        const toolsContainer = document.getElementById('environmental-tools');
        if (!toolsContainer) {
            console.error('Environmental tools container not found');
            return;
        }
        
        // Reference to active environmental tool
        let activeEnvTool = null;
        
        // Initialize wind direction
        let windDirection = 'right';
        
        // Add click listeners to environmental tool buttons
        const toolButtons = toolsContainer.querySelectorAll('.env-tool-button');
        toolButtons.forEach(button => {
            const toolName = button.getAttribute('data-tool');
            
            button.addEventListener('click', () => {
                // Toggle active state of this tool
                if (button.classList.contains('active')) {
                    // Deactivate if already active
                    button.classList.remove('active');
                    activeEnvTool = null;
                    
                    // Deactivate in registry but don't auto-spawn
                    if (window.ElementRegistry) {
                        const tool = window.ElementRegistry.getEnvironmentalTool(toolName);
                        if (tool) {
                            tool.isActive = false;
                            tool.isApplying = false;  // Add this flag to control when effects are applied
                        }
                    }
                    
                    // Re-enable previously selected element (restore the last active element button)
                    const activeElementButton = document.querySelector(`.element-button[data-element='${this.activeElement}']`);
                    if (activeElementButton) {
                        activeElementButton.classList.add('active');
                    }
                } else {
                    // Deactivate any active tool
                    toolButtons.forEach(btn => {
                        btn.classList.remove('active');
                        // Deactivate all tools completely
                        const btnToolName = btn.getAttribute('data-tool');
                        if (window.ElementRegistry && btnToolName) {
                            const btnTool = window.ElementRegistry.getEnvironmentalTool(btnToolName);
                            if (btnTool) {
                                btnTool.isActive = false;
                                btnTool.isApplying = false;
                            }
                        }
                    });
                    
                    // Deactivate all element buttons
                    document.querySelectorAll('.element-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Activate this tool but don't auto-spawn
                    button.classList.add('active');
                    activeEnvTool = toolName;
                    
                    // Activate in registry
                    if (window.ElementRegistry) {
                        // First deactivate all tools
                        const allTools = window.ElementRegistry.getAllEnvironmentalTools();
                        allTools.forEach(name => {
                            const tool = window.ElementRegistry.getEnvironmentalTool(name);
                            if (tool) {
                                tool.isActive = false;
                                tool.isApplying = false;
                            }
                        });
                        
                        // Then activate selected tool, but wait for mouse press to apply
                        const tool = window.ElementRegistry.getEnvironmentalTool(toolName);
                        if (tool) {
                            tool.isActive = true;
                            tool.isApplying = false;  // Set to true only when mouse is pressed
                        }
                    }
                }
            });
        });
        
        // Mouse movement tracking for wind direction
        let lastX = 0, lastY = 0;
        let isFirstMouseMove = true;
        
        // Track mouse movement across the entire document
        document.addEventListener('mousemove', (e) => {
            // Skip first move event to establish a baseline position
            if (isFirstMouseMove) {
                isFirstMouseMove = false;
                lastX = e.clientX;
                lastY = e.clientY;
                return;
            }
            
            // Calculate movement direction
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            
            // Only update direction if movement is significant
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                // Determine direction based on the dominant axis and direction
                let newDirection;
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal movement is dominant
                    newDirection = dx > 0 ? 'right' : 'left';
                } else {
                    // Vertical movement is dominant
                    newDirection = dy > 0 ? 'down' : 'up';
                }
                
                // Only update if the direction has changed
                if (newDirection !== windDirection) {
                    windDirection = newDirection;
                    
                    // Update the direction in registry
                    if (window.ElementRegistry) {
                        const tool = window.ElementRegistry.getEnvironmentalTool('wind');
                        if (tool) {
                            tool.direction = windDirection;
                        }
                    }
                }
                
                // Update last position
                lastX = e.clientX;
                lastY = e.clientY;
            }
        });

        // Add mouse down/up handlers to control when effects are applied
        document.addEventListener('mousedown', (e) => {
            if (activeEnvTool && window.ElementRegistry) {
                const tool = window.ElementRegistry.getEnvironmentalTool(activeEnvTool);
                if (tool) {
                    tool.isApplying = true;
                }
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (window.ElementRegistry) {
                const allTools = window.ElementRegistry.getAllEnvironmentalTools();
                allTools.forEach(name => {
                    const tool = window.ElementRegistry.getEnvironmentalTool(name);
                    if (tool) {
                        tool.isApplying = false;
                    }
                });
            }
        });

        // Also stop applying on mouse leave
        document.addEventListener('mouseleave', (e) => {
            if (window.ElementRegistry) {
                const allTools = window.ElementRegistry.getAllEnvironmentalTools();
                allTools.forEach(name => {
                    const tool = window.ElementRegistry.getEnvironmentalTool(name);
                    if (tool) {
                        tool.isApplying = false;
                    }
                });
            }
        });
    }
};

// export default ElementLoader;
window.ElementLoader = ElementLoader; 