// Sand Element
// A basic solid powder that falls and can be transformed by heat

const SandElement = {
    name: 'sand',
    label: 'Sand',
    description: 'A basic powder that falls with gravity',
    category: 'solid-powder',
    defaultColor: '#e6c78c',
    
    // Physical properties
    density: 0.8,
    isGas: false,
    isLiquid: false,
    isPowder: true,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Sand falls with gravity
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to slide to bottom-left or bottom-right
            const randomDirection = Math.random() < 0.5;
            
            if (randomDirection && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try the other diagonal if the first one was blocked
            if (randomDirection && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Check for temperature effects - sand turns to glass at high temperatures
        if (grid[y][x].temperature > 1500) {
            // Convert to glass
            grid[y][x] = {
                type: 'glass',
                color: '#F0F8FF', // Glass color
                temperature: grid[y][x].temperature,
                processed: true,
                isGas: false,
                isLiquid: false,
                isPowder: false,
                isSolid: true,
                transparency: 0.7  // Glass is partially transparent
            };
            return;
        }
    },
    
    // Optional custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Use the default renderer by not implementing anything special
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
};

// Make the element available globally
window.SandElement = SandElement; 