// Ash Element
// Powder that results from burning wood and other flammable materials

const AshElement = {
    name: 'ash',
    label: 'Ash',
    description: 'Powdery remains left after materials burn',
    category: 'solid-powder',
    defaultColor: '#A9A9A9',
    
    // Physical properties
    density: 0.2, // Very light
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
    temperature: 40, // Slightly warm from recent burning
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.age = 0;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Age the ash
        if (grid[y][x].age !== undefined) {
            grid[y][x].age++;
            
            // Gradually cool down
            if (grid[y][x].temperature > 25) {
                grid[y][x].temperature -= 0.1;
            }
        } else {
            grid[y][x].age = 0;
        }
        
        // Ash falls with gravity
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
        
        // Ash can become solid ash under pressure
        if (y > 0 && grid[y-1][x] && 
            (grid[y-1][x].type === 'ash' || grid[y-1][x].type === 'solid-ash' || 
             grid[y-1][x].isSolid)) {
            
            // Count how many particles are pressing down
            let pressureCount = 0;
            for (let checkY = y-1; checkY >= 0 && checkY >= y-5; checkY--) {
                if (isInBounds(x, checkY) && grid[checkY][x]) {
                    pressureCount++;
                } else {
                    break;
                }
            }
            
            // If enough pressure, convert to solid ash
            if (pressureCount >= 4 && Math.random() < 0.01) {
                grid[y][x] = {
                    type: 'solid-ash',
                    color: '#696969', // Darker gray for solid ash
                    temperature: grid[y][x].temperature,
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: true
                };
                return;
            }
        }
        
        // Ash + Water interaction
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
            
            // Ash + Water = Muddy water
            if (grid[ny][nx].type === 'water') {
                // Change water color to be muddy
                grid[ny][nx].color = '#6b5c4d';
                
                // Ash dissolves in water
                if (Math.random() < 0.3) {
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Optional custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add some texture to the ash
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        
        // Draw 2-3 small specks
        const speckCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < speckCount; i++) {
            const speckX = x * cellSize + Math.random() * cellSize;
            const speckY = y * cellSize + Math.random() * cellSize;
            const speckSize = Math.max(1, Math.random() * cellSize / 5);
            ctx.fillRect(speckX, speckY, speckSize, speckSize);
        }
    }
};

// Make the element available globally
window.AshElement = AshElement; 