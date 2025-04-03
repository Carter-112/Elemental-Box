// Battery Element
// A power source that can power wires and connected components

const BatteryElement = {
    name: 'battery',
    label: 'Battery',
    description: 'A power source that provides electricity to connected wires',
    category: 'electrical',
    defaultColor: '#8B8000', // Dark yellow
    
    // Physical properties
    density: 2.0,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,
    isSpawner: false,
    isElectrical: true,
    
    // Behavior properties
    flammable: false,
    conductive: true,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    powered: true,   // Batteries are always powered by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.powered = true;
        particle.powerLevel = 10; // Full power
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Batteries don't move
        
        // Check for connections to wires
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        // Power adjacent wires
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            const neighbor = grid[ny][nx];
            
            // Power any adjacent wires
            if (neighbor.type === 'wire') {
                neighbor.powered = true;
                neighbor.powerLevel = grid[y][x].powerLevel - 1; // Power diminishes slightly
                
                // Visual feedback - powered wires get a yellow tint
                if (!neighbor.originalColor) {
                    neighbor.originalColor = neighbor.color;
                    neighbor.color = '#FFD700'; // Gold color for powered wire
                }
            }
            
            // Special electrical interactions
            if (neighbor.type === 'bulb' && neighbor.powered) {
                // Direct connection to bulbs light them up
                if (!neighbor.lit) {
                    neighbor.lit = true;
                    neighbor.color = '#FFFF00'; // Bright yellow for lit bulb
                }
            }
        }
        
        // Battery damage effects
        if (grid[y][x].temperature > 150) {
            // Batteries can explode when too hot
            if (Math.random() < 0.05) {
                // Create explosion
                grid[y][x] = null;
                
                // Explosion radius
                const explosionRadius = 3;
                
                // Create fire and static charges in a radius
                for (let ey = -explosionRadius; ey <= explosionRadius; ey++) {
                    for (let ex = -explosionRadius; ex <= explosionRadius; ex++) {
                        const distance = Math.sqrt(ex*ex + ey*ey);
                        if (distance > explosionRadius) continue;
                        
                        const explosionX = x + ex;
                        const explosionY = y + ey;
                        
                        if (!isInBounds(explosionX, explosionY)) continue;
                        
                        // Clear existing particles
                        grid[explosionY][explosionX] = null;
                        
                        // Create fire or static charge
                        if (Math.random() < 0.5) {
                            grid[explosionY][explosionX] = {
                                type: 'fire',
                                color: '#FF4500',
                                temperature: 300,
                                processed: true,
                                isGas: true,
                                isLiquid: false,
                                isPowder: false,
                                isSolid: false,
                                lifetime: 50
                            };
                        } else {
                            grid[explosionY][explosionX] = {
                                type: 'static-charge',
                                color: '#FFFF33',
                                temperature: 50,
                                processed: true,
                                isGas: false,
                                isLiquid: false,
                                isPowder: false,
                                isSolid: false,
                                lifetime: 20,
                                conductive: true
                            };
                        }
                    }
                }
                return;
            }
        }
    },
    
    // Optional custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Draw battery body
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw battery terminals
        const terminalSize = Math.max(1, Math.floor(cellSize / 4));
        
        // Positive terminal (red)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(
            x * cellSize + (cellSize / 2), 
            y * cellSize + (cellSize / 4) - (terminalSize / 2),
            terminalSize,
            terminalSize
        );
        
        // Negative terminal (black)
        ctx.fillStyle = '#000000';
        ctx.fillRect(
            x * cellSize + (cellSize / 2), 
            y * cellSize + (3 * cellSize / 4) - (terminalSize / 2),
            terminalSize,
            terminalSize
        );
    }
};

// Make the element available globally
window.BatteryElement = BatteryElement; 