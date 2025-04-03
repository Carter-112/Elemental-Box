// Water Element
// A basic liquid that flows and reacts to temperature

const WaterElement = {
    name: 'water',
    label: 'Water',
    description: 'A basic liquid that flows and can change state with temperature',
    category: 'liquid',
    defaultColor: '#4286f4',
    
    // Physical properties
    density: 1.0,
    isGas: false,
    isLiquid: true,
    isPowder: false,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: true,
    explosive: false,
    reactive: true,
    corrosive: false,
    temperature: 20, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Temperature effects
        if (grid[y][x].temperature <= 0) {
            // Convert to ice when freezing
            grid[y][x] = {
                type: 'ice',
                color: '#ADD8E6', // Ice color
                temperature: grid[y][x].temperature,
                processed: true,
                isGas: false,
                isLiquid: false,
                isPowder: false,
                isSolid: true
            };
            return;
        } else if (grid[y][x].temperature >= 100) {
            // Convert to steam when boiling
            grid[y][x] = {
                type: 'steam',
                color: '#DCDCDC', // Steam color
                temperature: grid[y][x].temperature,
                processed: true,
                isGas: true,
                isLiquid: false,
                isPowder: false,
                isSolid: false
            };
            return;
        }
        
        // Water movement - falls with gravity
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Water spread - tries to move horizontally if can't move down
        const spreadDistance = 4; // How far water can spread
        const directions = [
            { dx: -1, priority: Math.random() < 0.5 ? 1 : 2 }, // left
            { dx: 1, priority: Math.random() < 0.5 ? 1 : 2 }   // right
        ];
        
        // Sort by priority (randomized)
        directions.sort((a, b) => a.priority - b.priority);
        
        // Try to spread in the prioritized directions
        for (const dir of directions) {
            // Try spreading outward
            for (let distance = 1; distance <= spreadDistance; distance++) {
                const nx = x + (dir.dx * distance);
                
                // Check if out of bounds
                if (!isInBounds(nx, y)) break;
                
                // If there's a space at this level, move there
                if (!grid[y][nx]) {
                    grid[y][nx] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
                
                // If there's a space below this position, flow there
                if (y < grid.length - 1 && !grid[y + 1][nx]) {
                    grid[y + 1][nx] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
                
                // If there's a solid/different density particle, stop spreading in this direction
                if (grid[y][nx] && (grid[y][nx].type !== 'water' || grid[y][nx].processed)) {
                    break;
                }
            }
        }
        
        // Check for reactions with other elements
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Water + Fire = Steam and no more fire
            if (grid[ny][nx].type === 'fire') {
                grid[ny][nx] = null; // Extinguish fire
                if (Math.random() < 0.5) {
                    grid[y][x] = {
                        type: 'steam',
                        color: '#DCDCDC',
                        temperature: 105,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                } else {
                    // Sometimes the water remains
                    grid[y][x].temperature += 20; // Fire heats the water
                }
                return;
            }
            
            // Water + Lava = Stone + Steam
            if (grid[ny][nx].type === 'lava') {
                grid[ny][nx] = {
                    type: 'stone',
                    color: '#888888',
                    temperature: 500, // Hot stone
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: true
                };
                
                grid[y][x] = {
                    type: 'steam',
                    color: '#DCDCDC',
                    temperature: 150,
                    processed: true,
                    isGas: true,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: false
                };
                return;
            }
            
            // Water interacts with different elements
            switch (grid[ny][nx].type) {
                case 'ice':
                    // Water is slowly cooled by ice
                    grid[y][x].temperature -= 1;
                    break;
                    
                case 'salt':
                    // Salt dissolves in water
                    grid[ny][nx] = null;
                    
                    // Water becomes slightly saltier (color change)
                    grid[y][x].color = '#4286e0';
                    grid[y][x].temperature -= 5; // Salt water freezes at a lower temperature
                    break;
                    
                case 'plant':
                    // Water helps plants grow
                    if (Math.random() < 0.01) {
                        // Plant growth handled by plant element
                        grid[ny][nx].hydration = (grid[ny][nx].hydration || 0) + 1;
                        
                        // Consume water sometimes
                        if (Math.random() < 0.2) {
                            grid[y][x] = null;
                            return;
                        }
                    }
                    break;
            }
        }
    },
    
    // Optional custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Water is slightly transparent
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.WaterElement = WaterElement; 