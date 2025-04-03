// Fertilizer Element
// A powder that enhances plant growth when combined with water

const FertilizerElement = {
    name: 'fertilizer',
    label: 'Fertilizer',
    description: 'A powder that helps plants grow faster when water is present',
    category: 'solid-powder',
    defaultColor: '#946B4D', // Brown color
    
    // Physical properties
    density: 0.7,
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
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default
    nutrients: 100, // Nutrient value for plants
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.nutrients = this.nutrients;
        particle.wetness = 0; // Tracks how much water has been absorbed
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Fertilizer falls with gravity like other powders
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
        }
        
        // Check for interactions with surrounding cells
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // top-left
            { dx: 1, dy: -1 },  // top-right
            { dx: -1, dy: 1 },  // bottom-left
            { dx: 1, dy: 1 }    // bottom-right
        ];
        
        // Wetness gradually decreases over time
        if (grid[y][x].wetness > 0) {
            grid[y][x].wetness -= 0.1;
            
            // Change color based on wetness
            const wetLevel = Math.min(1, grid[y][x].wetness / 10);
            const r = Math.floor(148 * (1 - wetLevel));
            const g = Math.floor(107 * (1 - 0.3 * wetLevel));
            const b = Math.floor(77 * (1 - 0.3 * wetLevel));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
        }
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Interactions with water - becomes wet fertilizer
            if (grid[ny][nx].type === 'water') {
                grid[y][x].wetness = Math.min(10, grid[y][x].wetness + 5);
                
                // Sometimes consume water
                if (Math.random() < 0.2) {
                    grid[ny][nx] = null;
                }
                
                // Change color to darker when wet
                const wetLevel = Math.min(1, grid[y][x].wetness / 10);
                const r = Math.floor(148 * (1 - wetLevel));
                const g = Math.floor(107 * (1 - 0.3 * wetLevel));
                const b = Math.floor(77 * (1 - 0.3 * wetLevel));
                grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            }
            
            // Interactions with plants - accelerates growth if wet
            if (grid[ny][nx].type === 'plant') {
                // Only accelerate growth if fertilizer is wet
                if (grid[y][x].wetness > 5) {
                    // Add growth boost to plant
                    grid[ny][nx].growthBoost = (grid[ny][nx].growthBoost || 0) + 0.1;
                    
                    // Add nutrients to soil
                    grid[ny][nx].nutrients = (grid[ny][nx].nutrients || 0) + 0.5;
                    
                    // Slowly consume nutrients from fertilizer
                    grid[y][x].nutrients -= 0.5;
                    
                    // When nutrients are depleted, the fertilizer disappears
                    if (grid[y][x].nutrients <= 0) {
                        grid[y][x] = null;
                        return;
                    }
                }
            }
            
            // Interactions with soil - enriches soil
            if (grid[ny][nx].type === 'soil') {
                // Only enrich soil if fertilizer is wet
                if (grid[y][x].wetness > 3) {
                    // Add nutrients to soil
                    grid[ny][nx].fertility = (grid[ny][nx].fertility || 0) + 0.5;
                    
                    // Slowly consume nutrients from fertilizer
                    grid[y][x].nutrients -= 0.2;
                    
                    // When nutrients are depleted, the fertilizer disappears
                    if (grid[y][x].nutrients <= 0) {
                        grid[y][x] = null;
                        return;
                    }
                }
            }
        }
    },
    
    // Render the fertilizer with color variation based on wetness
    render: function(ctx, x, y, particle, cellSize) {
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
};

// Make the element available globally
window.FertilizerElement = FertilizerElement; 