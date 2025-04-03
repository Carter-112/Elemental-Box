// Sand element module
window.SandElement = {
    name: 'sand',
    defaultColor: '#e6c78c',
    density: 2.0,
    durability: 0.2,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: true,
    isSolid: false, // Not a fixed solid
    category: 'Solid Powder',
    
    // Process sand particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const particle = grid[y][x];
        particle.processed = true;
        
        // Try to move down
        if (y < grid.length - 1) {
            // Move directly down if possible
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
        }
    },
    
    // Optional custom rendering - if not provided, default rendering is used
    render: null,
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        // No special properties needed for sand on creation
        return particle;
    }
}; 