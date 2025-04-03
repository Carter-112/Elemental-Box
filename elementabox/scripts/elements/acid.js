// Acid Element
// A liquid that melts through everything but steel

const AcidElement = {
    name: 'acid',
    label: 'Acid',
    description: 'A corrosive liquid that melts through most materials except steel',
    category: 'liquid',
    defaultColor: '#8FBC8F',
    
    // Physical properties
    density: 1.2,
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
    corrosive: true,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.potency = 1.0; // Full strength acid
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Acid potency decreases over time
        if (grid[y][x].potency !== undefined) {
            if (grid[y][x].potency <= 0.1) {
                // Acid becomes too diluted and turns to water
                grid[y][x] = {
                    type: 'water',
                    color: '#4286f4',
                    temperature: grid[y][x].temperature,
                    processed: true,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false
                };
                return;
            }
        } else {
            grid[y][x].potency = 1.0;
        }
        
        // Acid movement - falls with gravity
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Acid spread - tries to move horizontally if can't move down
        const spreadDistance = 3; // How far acid can spread
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
                if (grid[y][nx] && (grid[y][nx].type !== 'acid' || grid[y][nx].processed)) {
                    break;
                }
            }
        }
        
        // Acid corrodes through materials
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
            
            // Acid doesn't corrode steel
            if (grid[ny][nx].type === 'steel') continue;
            
            // Acid produces gas when melting materials
            if (grid[ny][nx].type !== 'acid' && grid[ny][nx].type !== 'water') {
                // Corrode the material
                grid[ny][nx] = null;
                
                // Produce acid gas in a random direction
                const gasDirections = [
                    { dx: -1, dy: -1 }, // top left
                    { dx: 0, dy: -1 },  // top
                    { dx: 1, dy: -1 },  // top right
                    { dx: -1, dy: 0 },  // left
                    { dx: 1, dy: 0 },   // right
                ];
                
                const gasDir = gasDirections[Math.floor(Math.random() * gasDirections.length)];
                const gasX = x + gasDir.dx;
                const gasY = y + gasDir.dy;
                
                if (isInBounds(gasX, gasY) && !grid[gasY][gasX]) {
                    grid[gasY][gasX] = {
                        type: 'smoke',
                        color: '#A6BAA9', // Acid gas color
                        temperature: grid[y][x].temperature + 10,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                }
                
                // Reduce acid potency after corrosion
                grid[y][x].potency -= 0.2;
                
                // Adjust color based on potency
                const potencyFactor = grid[y][x].potency;
                const r = Math.floor(143 * (1 - potencyFactor) + 143 * potencyFactor);
                const g = Math.floor(134 * (1 - potencyFactor) + 188 * potencyFactor);
                const b = Math.floor(228 * (1 - potencyFactor) + 143 * potencyFactor);
                grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
                
                return;
            }
        }
    },
    
    // Optional custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Acid is slightly transparent and has a bubbling effect
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add bubbles
        if (Math.random() < 0.3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            const bubbleSize = cellSize / 4;
            const bubbleX = x * cellSize + Math.random() * (cellSize - bubbleSize);
            const bubbleY = y * cellSize + Math.random() * (cellSize - bubbleSize);
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.AcidElement = AcidElement; 