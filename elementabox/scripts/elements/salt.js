// Salt element module
window.SaltElement = {
    name: 'salt',
    defaultColor: '#FFFFFF', // White
    density: 2.2,            // Slightly more dense than sand
    durability: 0.3,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: true,
    
    // Process salt particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const salt = grid[y][x];
        salt.processed = true;
        
        // Salt behaves mostly like sand
        this.moveLikePowder(x, y, grid, isInBounds);
        
        // Salt dissolves in water
        this.checkForWater(x, y, grid, isInBounds);
        
        // Salt lowers freezing point of water
        this.affectAdjacentWater(x, y, grid, isInBounds);
    },
    
    // Move like a powder (sand-like behavior)
    moveLikePowder: function(x, y, grid, isInBounds) {
        if (y >= grid.length - 1) return; // At bottom of grid
        
        // Check if we can move straight down
        if (!grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Try to slide down diagonally
        const diagX = Math.random() < 0.5 ? [x-1, x+1] : [x+1, x-1];
        
        for (const newX of diagX) {
            if (isInBounds(newX, y+1) && !grid[y+1][newX]) {
                grid[y+1][newX] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Check for water to dissolve in
    checkForWater: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Dissolve in water
            if (neighbor.type === 'water') {
                // 10% chance to dissolve per frame when touching water
                if (Math.random() < 0.1) {
                    // Create salt water
                    grid[newY][newX] = this.createSaltWater(neighbor.temperature);
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Affect adjacent water (lower freezing point)
    affectAdjacentWater: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Salt lowers freezing point of water
            if (neighbor.type === 'water' && !neighbor.isSaltWater) {
                neighbor.freezingPoint = -3; // Lower freezing point
                neighbor.isSaltWater = true; // Mark as affected by salt
                
                // Slightly change water color to indicate salt content
                if (!neighbor.color.includes('rgba')) {
                    neighbor.color = 'rgba(66, 134, 244, 0.9)'; // Slightly more transparent
                }
            }
            
            // Salt can melt ice at temperatures where normal water would stay frozen
            if (neighbor.type === 'ice' && neighbor.temperature > -5) {
                // Small chance to melt ice
                if (Math.random() < 0.05) {
                    grid[newY][newX] = this.createSaltWater(-2);
                }
            }
        }
    },
    
    // Create salt water
    createSaltWater: function(temperature) {
        return {
            type: 'water',
            color: 'rgba(66, 134, 244, 0.9)',
            temperature: temperature || 25,
            processed: false,
            isLiquid: true,
            density: 1.1, // Salt water is denser than fresh water
            isSaltWater: true,
            freezingPoint: -5 // Salt water freezes at lower temperature
        };
    },
    
    // Custom rendering for salt
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color for salt
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add crystalline appearance
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        
        // Add a slight pattern for crystal texture
        const patternSize = CELL_SIZE / 4;
        
        // Create a checkerboard pattern
        if ((x + y) % 2 === 0) {
            ctx.fillRect(
                x * CELL_SIZE + patternSize, 
                y * CELL_SIZE + patternSize, 
                patternSize * 2, 
                patternSize * 2
            );
        } else {
            ctx.fillRect(
                x * CELL_SIZE, 
                y * CELL_SIZE, 
                patternSize * 2, 
                patternSize * 2
            );
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 