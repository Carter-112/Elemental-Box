// Torch element module
window.TorchElement = {
    name: 'torch',
    defaultColor: '#FF4500', // Orange-red
    density: 2.0,
    durability: 0.6,
    flammable: false, // The torch itself doesn't burn away
    defaultTemperature: 300,
    stickiness: 0.8, // Sticks to surfaces
    isLiquid: false,
    isGas: false,
    isPowder: false,
    
    // Process torch particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const torch = grid[y][x];
        torch.processed = true;
        
        // Torch stays in place
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
        }
        
        // Create fire above the torch
        this.createFlame(x, y, grid, isInBounds);
    },
    
    // Check if torch is supported
    isSupported: function(x, y, grid, isInBounds) {
        // If at the bottom of the grid, it's supported by the ground
        if (y >= grid.length - 1) return true;
        
        // Check if supported from below
        if (grid[y+1][x]) {
            return true;
        }
        
        // Check for support on sides (stickiness allows it to attach to walls)
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: -1, dy: 1 }, // down-left
            { dx: 1, dy: 1 },  // down-right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                // Torch can stick to solid objects
                if (!grid[newY][newX].isGas && !grid[newY][newX].isLiquid) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // Make torch fall if not supported
    tryToFall: function(x, y, grid, isInBounds) {
        if (y >= grid.length - 1) return; // At bottom of grid
        
        // Move directly down if possible
        if (!grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
    },
    
    // Create fire flame above the torch
    createFlame: function(x, y, grid, isInBounds) {
        // Check if we can create fire above
        if (y <= 0 || !isInBounds(x, y-1)) return;
        
        // 20% chance to create flame per frame
        if (Math.random() < 0.2 && !grid[y-1][x]) {
            grid[y-1][x] = {
                type: 'fire',
                color: '#ff6600',
                temperature: 400,
                processed: false,
                burnDuration: 30,
                flameSource: 'torch'
            };
        }
        
        // Random chance to heat up nearby particles
        const directions = [
            { dx: -1, dy: -1 }, // up-left
            { dx: 0, dy: -1 },  // up
            { dx: 1, dy: -1 },  // up-right
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: 0 },   // right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Heat up neighboring particles
            if (neighbor.temperature !== undefined) {
                neighbor.temperature += 5;
            }
            
            // Ignite flammable neighbors
            if (neighbor.flammable && !neighbor.burning && Math.random() < 0.05) {
                neighbor.burning = true;
                neighbor.burnDuration = neighbor.burnDuration || 100;
            }
        }
    },
    
    // Custom rendering for torch
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Draw torch body
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw torch handle (darker)
        ctx.fillStyle = '#8B4513'; // SaddleBrown
        const handleHeight = CELL_SIZE * 0.6;
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.3, 
            y * CELL_SIZE + CELL_SIZE - handleHeight,
            CELL_SIZE * 0.4, 
            handleHeight
        );
        
        // Draw flame-like top
        ctx.fillStyle = '#FFCC00';
        
        // Flickering effect
        const time = Date.now() % 1000 / 1000;
        const flicker = Math.sin(time * Math.PI * 2) * 0.1;
        
        // Draw flame shape
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.3, y * CELL_SIZE + CELL_SIZE * 0.3);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.5, y * CELL_SIZE + CELL_SIZE * (0.1 - flicker));
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.7, y * CELL_SIZE + CELL_SIZE * 0.3);
        ctx.fill();
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 