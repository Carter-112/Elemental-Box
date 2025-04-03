// Water element module
window.WaterElement = {
    name: 'water',
    defaultColor: '#4286f4',
    density: 1.0,
    durability: 1.0, // Water can be dissolved completely
    flammable: false,
    defaultTemperature: 20,
    stickiness: 0,
    isLiquid: true,
    isGas: false,
    isPowder: false,
    isSolid: false,
    category: 'Liquid',
    
    // Process water particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const particle = grid[y][x];
        particle.processed = true;
        
        // Handle temperature effects
        if (particle.temperature <= 0 && Math.random() < 0.1) {
            // Water freezes into ice
            grid[y][x] = window.ElementRegistry.createParticle('ice');
            return;
        }
        
        if (particle.temperature >= 100 && Math.random() < 0.1) {
            // Water evaporates into steam
            grid[y][x] = window.ElementRegistry.createParticle('steam');
            return;
        }
        
        // Try to move down
        if (y < grid.length - 1) {
            // Move directly down if possible
            if (!grid[y+1][x]) {
                grid[y+1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to spread horizontally, with preference for downward diagonals
            const dx = Math.random() < 0.5 ? [1, -1] : [-1, 1];
            
            // First try down+left or down+right
            for (const newX of dx) {
                if (isInBounds(x + newX, y + 1) && !grid[y+1][x+newX]) {
                    grid[y+1][x+newX] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
            
            // If can't move down, try to spread horizontally
            if (Math.random() < 0.8) { // 80% chance to spread horizontally
                for (const newX of dx) {
                    if (isInBounds(x + newX, y) && !grid[y][x+newX]) {
                        grid[y][x+newX] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    }
                }
            }
        }
    },
    
    // Optional custom rendering - if not provided, default rendering is used
    render: null,
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        // No special properties needed for water on creation
        return particle;
    }
}; 