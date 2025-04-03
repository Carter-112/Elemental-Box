// Element Registry module
// This module handles registration, processing, and rendering of all elements

// Import all element modules
// import { SandElement } from './elements/sand.js';
// import { WaterElement } from './elements/water.js';
// import { SmokeElement } from './elements/smoke.js';
// import { FireElement } from './elements/fire.js';
// import { LavaElement } from './elements/lava.js';
// import { IceElement } from './elements/ice.js';
// import { PlantElement } from './elements/plant.js';
// import { MetalElement } from './elements/metal.js';
// import { SteelElement } from './elements/steel.js';
// import { OilElement } from './elements/oil.js';
// import { AcidElement } from './elements/acid.js';
// import { GlassElement } from './elements/glass.js';
// import { GlassShardElement } from './elements/glass-shard.js';
// import { StaticChargeElement } from './elements/static-charge.js';
// import { StoneElement } from './elements/stone.js';
// import { BrickElement } from './elements/brick.js';
// import { WoodElement } from './elements/wood.js';
// import { ResinElement } from './elements/resin.js';
// import { CrystalElement } from './elements/crystal.js';
// import { SteamElement } from './elements/steam.js';

// Import new elements we've added
// import { WindElement } from './elements/wind.js';
// import { HeatElement } from './elements/heat.js';
// import { ColdElement } from './elements/cold.js';
// import { SaltElement } from './elements/salt.js';
// import { SnowElement } from './elements/snow.js';
// import { GunpowderElement } from './elements/gunpowder.js';
// import { C4Element } from './elements/c4.js';
// import { TorchElement } from './elements/torch.js';
// import { GlueElement } from './elements/glue.js';
// import { NapalmElement } from './elements/napalm.js';
// import { TarElement } from './elements/tar.js';
// import { SludgeElement } from './elements/sludge.js';
// import { ExplosivePowderElement } from './elements/explosive-powder.js';
// import { DynamiteElement } from './elements/dynamite.js';
// import { FertilizerElement } from './elements/fertilizer.js';
// import { BacteriaElement } from './elements/bacteria.js';
// import { FuseElement } from './elements/fuse.js';
// import { WireElement } from './elements/wire.js';
// import { SwitchElement } from './elements/switch.js';
// import { BulbElement } from './elements/bulb.js';
// import { BatteryElement } from './elements/battery.js';
// import { FaucetElement } from './elements/faucet.js';
// import { EraserElement } from './elements/eraser.js';

// The ElementRegistry manages all elements
class ElementRegistry {
    constructor() {
        this.elements = {};
        this.environmentalTools = {};
    }

    // Initialize the registry with a grid reference
    initialize(grid, config = {}) {
        this.grid = grid;
        
        // Merge provided config with defaults
        this.config = { ...this.config, ...config };
        
        // Register all elements
        this.registerAllElements();
        
        // Initialize Cold, Heat, and Wind as environmental tools instead of regular elements
        this.initializeEnvironmentalTools();
        
        console.log('Element Registry initialized with', Object.keys(this.elements).length, 'elements');
        return this;
    }
    
    // Register a single element
    registerElement(element) {
        if (!element || !element.name) {
            console.error('Attempted to register invalid element:', element);
            return;
        }
        
        this.elements[element.name] = element;
    }
    
    // Register all elements
    registerAllElements() {
        // Load element scripts
        this.loadElementScripts();
        
        // Register environmental tools separately
        if (window.WindElement) this.registerEnvironmentalTool(window.WindElement);
        if (window.HeatElement) this.registerEnvironmentalTool(window.HeatElement);
        if (window.ColdElement) this.registerEnvironmentalTool(window.ColdElement);
    }
    
    // Load element scripts dynamically
    loadElementScripts() {
        // Define all the element script filenames to load
        const elementScripts = [
            'sand', 'water', 'smoke', 'fire', 'lava', 'ice', 'plant', 'metal', 'steel',
            'oil', 'acid', 'glass', 'glass-shard', 'static-charge', 'stone', 'brick',
            'wood', 'resin', 'crystal', 'steam', 'wind', 'heat', 'cold', 'salt', 'snow',
            'gunpowder', 'c4', 'torch', 'glue', 'napalm', 'tar', 'sludge',
            'explosive-powder', 'dynamite', 'fertilizer', 'bacteria', 'fuse',
            'wire', 'switch', 'bulb', 'battery', 'faucet', 'eraser'
        ];
        
        // Register each element if it exists in the global scope
        elementScripts.forEach(name => {
            const pascalName = name.split('-')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                .join('');
                
            const elementName = pascalName + 'Element';
            if (window[elementName]) {
                this.registerElement(window[elementName]);
            } else {
                console.warn(`Element ${elementName} not found in global scope`);
            }
        });
    }
    
    // Register environmental tool
    registerEnvironmentalTool(tool) {
        this.environmentalTools[tool.name] = tool;
    }
    
    // Get element by name
    getElement(name) {
        return this.elements[name] || null;
    }
    
    // Get all registered element names
    getElementNames() {
        return Object.keys(this.elements);
    }
    
    // Get default properties for an element
    getElementDefaults(elementType) {
        const element = this.getElement(elementType);
        if (!element) return null;
        
        return {
            type: element.name,
            color: element.defaultColor,
            density: element.density,
            flammable: element.flammable,
            isLiquid: element.isLiquid,
            isGas: element.isGas,
            isPowder: element.isPowder
        };
    }
    
    // Create a new particle of specified type
    createParticle(elementType, x, y) {
        const element = this.getElement(elementType);
        if (!element) {
            console.error(`Element type "${elementType}" not found`);
            return null;
        }
        
        // Get default properties
        const particle = {
            ...this.getElementDefaults(elementType),
            processed: false
        };
        
        // Apply any element-specific initialization
        if (element.updateOnCreate) {
            return element.updateOnCreate(particle);
        }
        
        return particle;
    }
    
    // Process all elements for a simulation step
    processParticles(isInBounds, getRandomCell) {
        if (!this.grid) {
            console.error('Grid not initialized in ElementRegistry');
            return;
        }
        
        // Process environmental effects
        this.applyEnvironmentalEffects(isInBounds, getRandomCell);
        
        // Apply physics like gravity
        this.applyGravity();
        
        // Apply heat distribution
        this.applyHeatDistribution();
        
        // Random phenomena like lightning
        this.spawnRandomPhenomena(isInBounds, getRandomCell);
    }
    
    // Process a particle at the specified location
    processParticleAt(x, y, isInBounds) {
        if (!this.grid || !isInBounds(x, y) || !this.grid[y][x]) return;
        
        const particle = this.grid[y][x];
        if (particle.processed) return;
        
        const element = this.getElement(particle.type);
        if (element && element.process) {
            element.process(x, y, particle);
        }
        
        particle.processed = true;
    }
    
    // Apply environmental effects like wind, heat
    applyEnvironmentalEffects(isInBounds, getRandomCell) {
        // Apply active environmental tools
        Object.values(this.environmentalTools).forEach(tool => {
            if (tool.isActive) {
                const { x, y } = getRandomCell();
                this.applyEnvironmentalTool(tool.name, x, y, tool.radius || 5, this.grid, isInBounds);
            }
        });
    }
    
    // Apply gravity to all particles
    applyGravity() {
        // Implementation for gravity
    }
    
    // Heat distribution between particles
    applyHeatDistribution() {
        // Implementation for heat distribution
    }
    
    // Random phenomena generation
    spawnRandomPhenomena(isInBounds, getRandomCell) {
        // Implementation for random phenomena
    }
    
    // Apply an environmental tool effect
    applyEnvironmentalTool(toolName, x, y, radius, grid, isInBounds) {
        const tool = this.environmentalTools[toolName];
        if (tool && tool.apply) {
            tool.apply(x, y, radius, grid, isInBounds);
        }
    }
    
    // Render all particles
    renderParticles(ctx) {
        if (!this.grid) return;
        
        // This should match the CELL_SIZE in main.js
        const CELL_SIZE = window.CELL_SIZE || 4; // Default to 4 if global value not set
        
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const particle = this.grid[y][x];
                if (!particle) continue;
                
                // Calculate pixel coordinates
                const pixelX = Math.floor(x * CELL_SIZE);
                const pixelY = Math.floor(y * CELL_SIZE);
                
                // Special rendering for visual effects
                if (particle.isVisualEffect) {
                    switch (particle.type) {
                        case 'heat-effect':
                            // Render heat effect (glowing red-orange particle)
                            ctx.fillStyle = particle.color || 'rgba(255, 150, 0, 0.3)';
                            ctx.beginPath();
                            ctx.arc(
                                pixelX + CELL_SIZE/2, 
                                pixelY + CELL_SIZE/2, 
                                CELL_SIZE/2 * (0.7 + Math.random() * 0.3), 
                                0, 
                                Math.PI * 2
                            );
                            ctx.fill();
                            continue;
                            
                        case 'cold-effect':
                            // Render cold effect (blue-white snowflake or frost particle)
                            ctx.fillStyle = particle.color || 'rgba(220, 240, 255, 0.3)';
                            // Draw a small snowflake/star
                            const centerX = pixelX + CELL_SIZE/2;
                            const centerY = pixelY + CELL_SIZE/2;
                            const size = CELL_SIZE * 0.6;
                            
                            ctx.beginPath();
                            for (let i = 0; i < 6; i++) {
                                const angle = (Math.PI * 2 / 6) * i;
                                const lineX = centerX + Math.cos(angle) * size;
                                const lineY = centerY + Math.sin(angle) * size;
                                
                                ctx.moveTo(centerX, centerY);
                                ctx.lineTo(lineX, lineY);
                            }
                            ctx.strokeStyle = particle.color || 'rgba(220, 240, 255, 0.5)';
                            ctx.stroke();
                            continue;
                            
                        case 'wind-effect':
                            // Render wind effect (directional streaks)
                            ctx.fillStyle = particle.color || 'rgba(255, 255, 255, 0.2)';
                            
                            // Draw a streak in the wind direction
                            let startX = pixelX, startY = pixelY;
                            let endX = startX, endY = startY;
                            
                            switch (particle.direction) {
                                case 'right': 
                                    endX = startX + CELL_SIZE * 1.5; 
                                    break;
                                case 'left': 
                                    endX = startX - CELL_SIZE * 0.5; 
                                    break;
                                case 'down': 
                                    endY = startY + CELL_SIZE * 1.5; 
                                    break;
                                case 'up': 
                                    endY = startY - CELL_SIZE * 0.5; 
                                    break;
                            }
                            
                            ctx.beginPath();
                            ctx.moveTo(startX + CELL_SIZE/2, startY + CELL_SIZE/2);
                            ctx.lineTo(endX + CELL_SIZE/2, endY + CELL_SIZE/2);
                            ctx.lineWidth = CELL_SIZE * 0.3;
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                            ctx.stroke();
                            continue;
                    }
                }
                
                // Standard element rendering
                const element = this.getElement(particle.type);
                if (element && element.render) {
                    element.render(ctx, x, y, particle, CELL_SIZE);
                } else {
                    // Default rendering - ensure perfect grid alignment
                    ctx.fillStyle = particle.color || '#FFFFFF';
                    ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
                }
            }
        }
    }
    
    // Get color for element type
    getElementColor(elementType) {
        const element = this.getElement(elementType);
        return element ? element.defaultColor : '#FFFFFF';
    }
    
    // Get elements by category
    getElementsByCategory(category) {
        const categoryMap = {
            'basic': ['sand', 'water', 'fire', 'stone'],
            'fire': ['fire', 'lava', 'torch', 'fuse'],
            'gas': ['smoke', 'steam'],
            'liquid': ['water', 'oil', 'lava', 'acid', 'tar', 'sludge', 'napalm', 'glue'],
            'powder': ['sand', 'salt', 'gunpowder', 'explosive-powder'],
            'environmental': ['wind', 'heat', 'cold'],
            'explosive': ['gunpowder', 'c4', 'explosive-powder', 'dynamite'],
            'special': ['torch', 'plant', 'metal', 'glass', 'brick', 'battery', 'bulb', 'switch', 'wire']
        };
        
        const elementNames = categoryMap[category] || [];
        return elementNames.map(name => this.getElement(name)).filter(Boolean);
    }
    
    // Get environmental tool
    getEnvironmentalTool(name) {
        return this.environmentalTools[name] || null;
    }
    
    // Get all environmental tools
    getAllEnvironmentalTools() {
        return Object.keys(this.environmentalTools);
    }

    // Initialize the environmental tools
    initializeEnvironmentalTools() {
        // Create Wind tool
        this.environmentalTools['wind'] = {
            name: 'wind',
            label: 'Wind',
            description: 'Creates wind that pushes particles in a direction',
            icon: '🌬️', // Or a CSS class for a custom icon
            isActive: false,
            isApplying: false,
            strength: 5,
            direction: 'right', // 'left', 'right', 'up', 'down'
            apply: function(x, y, radius, grid, isInBounds) {
                if (!this.isActive || !this.isApplying) return;
                
                // Direction multipliers based on current wind direction
                const dirMultX = this.direction === 'right' ? 1 : this.direction === 'left' ? -1 : 0;
                const dirMultY = this.direction === 'down' ? 1 : this.direction === 'up' ? -1 : 0;
                
                // Increase effect count for more wind particles
                const effectCount = 3 + Math.floor(Math.random() * 3);
                // Increase radius for farther wind effect
                const extendedRadius = radius * 2;
                
                for (let i = 0; i < effectCount; i++) {
                    // Random position within the extended radius
                    const offsetX = Math.floor(Math.random() * (extendedRadius * 2 + 1)) - extendedRadius;
                    const offsetY = Math.floor(Math.random() * (extendedRadius * 2 + 1)) - extendedRadius;
                    const nx = x + offsetX;
                    const ny = y + offsetY;
                    
                    if (!isInBounds(nx, ny)) continue;
                    
                    // If there's already a particle, push it in the wind direction
                    if (grid[ny][nx]) {
                        // Skip static/solid elements
                        if (grid[ny][nx].type === 'stone' || grid[ny][nx].type === 'metal') continue;
                        
                        // Calculate target position in the wind direction
                        const targetX = nx + dirMultX;
                        const targetY = ny + dirMultY;
                        
                        if (isInBounds(targetX, targetY)) {
                            // Move particles in the wind direction if space is available
                            if (!grid[targetY][targetX]) {
                                grid[targetY][targetX] = grid[ny][nx];
                                grid[ny][nx] = null;
                            } 
                            // Special handling for heat and cold effects - allow them to stack with other particles
                            else if ((grid[ny][nx].type === 'heat-effect' || grid[ny][nx].type === 'cold-effect') && 
                                    grid[targetY][targetX].type !== 'heat-effect' && 
                                    grid[targetY][targetX].type !== 'cold-effect' &&
                                    grid[targetY][targetX].type !== grid[ny][nx].type) {
                                
                                // If the particle is a heat or cold effect, allow it to "pass through" other particles
                                // by giving velocity to the existing particle
                                if (grid[ny][nx].type === 'heat-effect') {
                                    // Apply heat effect to the target cell's particle
                                    grid[targetY][targetX].velocityY = grid[targetY][targetX].velocityY || 0;
                                    grid[targetY][targetX].velocityY -= 0.2; // Make it rise slightly
                                } else if (grid[ny][nx].type === 'cold-effect') {
                                    // Apply cold effect to the target cell's particle
                                    grid[targetY][targetX].velocityY = grid[targetY][targetX].velocityY || 0;
                                    grid[targetY][targetX].velocityY += 0.2; // Make it fall slightly
                                }
                                
                                // Velocity in wind direction
                                grid[targetY][targetX].velocityX = grid[targetY][targetX].velocityX || 0;
                                grid[targetY][targetX].velocityX += dirMultX * 0.5;
                                
                                // Remove the effect particle
                                grid[ny][nx] = null;
                            }
                        }
                    } else if (Math.random() < 0.2) {
                        // Create a wind effect particle
                        grid[ny][nx] = {
                            type: 'wind-effect',
                            color: 'rgba(255, 255, 255, 0.3)',
                            isVisualEffect: true,
                            lifetime: 1 + Math.floor(Math.random() * 1), // Shorter lifetime (around 1 second)
                            processed: false,
                            direction: this.direction,
                            // Make the wind particle move in the wind direction with increased velocity
                            velocityX: dirMultX * (2 + Math.random() * 1),
                            velocityY: dirMultY * (2 + Math.random() * 1)
                        };
                    }
                }
            }
        };
        
        // Create Heat tool
        this.environmentalTools['heat'] = {
            name: 'heat',
            label: 'Heat',
            description: 'Increases temperature in an area',
            icon: '🔥', // Or a CSS class for a custom icon
            isActive: false,
            isApplying: false,
            strength: 5,
            apply: function(x, y, radius, grid, isInBounds) {
                if (!this.isActive || !this.isApplying) return;
                
                const effectCount = 1 + Math.floor(Math.random() * 2);
                
                for (let i = 0; i < effectCount; i++) {
                    // Random position within the radius
                    const offsetX = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                    const offsetY = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                    const nx = x + offsetX;
                    const ny = y + offsetY;
                    
                    if (!isInBounds(nx, ny)) continue;
                    
                    // If there's already a particle, heat it up
                    if (grid[ny][nx]) {
                        // Heat effect: make particles rise and move randomly
                        if (grid[ny][nx].type === 'water') {
                            // Convert water to steam at random intervals
                            if (Math.random() < 0.1) {
                                grid[ny][nx] = window.ElementRegistry.createElement('steam');
                            }
                        } else if (grid[ny][nx].type === 'sand') {
                            // Heat sand particles (no transformation yet)
                            grid[ny][nx].color = 'rgb(255, 180, 100)';
                        } else if (grid[ny][nx].type === 'ice') {
                            // Convert ice to water
                            grid[ny][nx] = window.ElementRegistry.createElement('water');
                        } else if (grid[ny][nx].type === 'cold-effect') {
                            // Neutralize cold effect
                            grid[ny][nx] = null;
                        } else if (grid[ny][nx].type === 'heat-effect' || grid[ny][nx].type === 'wind-effect') {
                            // Don't affect other effect particles
                            continue; 
                        } else {
                            // For other particles, try to make them rise if possible
                            if (isInBounds(nx, ny-1) && !grid[ny-1][nx] && Math.random() < 0.4) {
                                grid[ny-1][nx] = grid[ny][nx];
                                grid[ny][nx] = null;
                            }
                        }
                    } else if (Math.random() < 0.2) {
                        // Create a heat effect particle
                        grid[ny][nx] = {
                            type: 'heat-effect',
                            color: `rgba(${200 + Math.floor(Math.random() * 55)}, ${50 + Math.floor(Math.random() * 50)}, 0, ${0.4 + Math.random() * 0.3})`,
                            isVisualEffect: true,
                            lifetime: 2 + Math.floor(Math.random() * 2), // Shorter lifetime (around 3 seconds)
                            processed: false,
                            // Add stronger upward movement for heat
                            velocityY: -1.5 - Math.random() * 0.8, 
                            velocityX: (Math.random() - 0.5) * 0.5
                        };
                    }
                }
            }
        };
        
        // Create Cold tool
        this.environmentalTools['cold'] = {
            name: 'cold',
            label: 'Cold',
            description: 'Decreases temperature in an area',
            icon: '❄️', // Or a CSS class for a custom icon
            isActive: false,
            isApplying: false,
            strength: 5,
            apply: function(x, y, radius, grid, isInBounds) {
                if (!this.isActive || !this.isApplying) return;
                
                const effectCount = 1 + Math.floor(Math.random() * 2);
                
                for (let i = 0; i < effectCount; i++) {
                    // Random position within the radius
                    const offsetX = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                    const offsetY = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
                    const nx = x + offsetX;
                    const ny = y + offsetY;
                    
                    if (!isInBounds(nx, ny)) continue;
                    
                    // If there's already a particle, cool it down
                    if (grid[ny][nx]) {
                        // Cold effect: make particles fall and slow down
                        if (grid[ny][nx].type === 'water') {
                            // Convert water to ice at random intervals
                            if (Math.random() < 0.1) {
                                grid[ny][nx] = window.ElementRegistry.createElement('ice');
                            }
                        } else if (grid[ny][nx].type === 'steam') {
                            // Convert steam to water
                            grid[ny][nx] = window.ElementRegistry.createElement('water');
                        } else if (grid[ny][nx].type === 'heat-effect') {
                            // Neutralize heat effect
                            grid[ny][nx] = null;
                        } else if (grid[ny][nx].type === 'cold-effect' || grid[ny][nx].type === 'wind-effect') {
                            // Don't affect other effect particles
                            continue; 
                        } else {
                            // For other particles, try to make them fall if possible
                            if (isInBounds(nx, ny+1) && !grid[ny+1][nx] && Math.random() < 0.4) {
                                grid[ny+1][nx] = grid[ny][nx];
                                grid[ny][nx] = null;
                            }
                        }
                    } else if (Math.random() < 0.2) {
                        // Create a cold effect particle
                        grid[ny][nx] = {
                            type: 'cold-effect',
                            color: `rgba(${100 + Math.floor(Math.random() * 50)}, ${180 + Math.floor(Math.random() * 50)}, 255, ${0.4 + Math.random() * 0.3})`,
                            isVisualEffect: true,
                            lifetime: 2 + Math.floor(Math.random() * 2), // Shorter lifetime (around 3 seconds)
                            processed: false,
                            // Add stronger downward movement for cold
                            velocityY: 1.5 + Math.random() * 0.8,
                            velocityX: (Math.random() - 0.5) * 0.5
                        };
                    }
                }
            }
        };
    }
}

// Create a global instance of ElementRegistry
window.ElementRegistry = new ElementRegistry();

// Export the ElementRegistry instance for ES modules
// export default window.ElementRegistry; 