// Ice element module
window.IceElement = {
    name: 'ice',
    defaultColor: '#ADD8E6',
    density: 0.9,
    durability: 0.3,
    flammable: false,
    defaultTemperature: -10,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    
    // Process ice particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const ice = grid[y][x];
        ice.processed = true;
        
        // Ice stays in place, but can melt
        if (ice.temperature > 0 && Math.random() < 0.1) {
            grid[y][x] = this.createWaterParticle();
            return;
        }
        
        // Ice can freeze nearby water
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            
            // Freeze adjacent water with a small chance
            if (neighbor && neighbor.type === 'water' && Math.random() < 0.05) {
                grid[newY][newX] = {
                    type: 'ice',
                    color: this.defaultColor,
                    temperature: this.defaultTemperature,
                    processed: false,
                    flammable: false
                };
            }
        }
    },
    
    // Create water particle when ice melts
    createWaterParticle: function() {
        return {
            type: 'water',
            color: '#4286f4',
            temperature: 1, // Just above freezing
            processed: false,
            flammable: false
        };
    },
    
    // Custom rendering for ice
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Draw ice
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add ice highlights
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.3;
        
        // Draw random highlight spots
        const spotCount = 2;
        for (let i = 0; i < spotCount; i++) {
            const spotX = x * CELL_SIZE + Math.random() * CELL_SIZE * 0.7;
            const spotY = y * CELL_SIZE + Math.random() * CELL_SIZE * 0.7;
            const spotSize = CELL_SIZE * 0.3;
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        // No special properties needed for ice on creation
        return particle;
    }
}; 