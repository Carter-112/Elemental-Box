// Balloon Element
// A gas that floats up and reacts to temperature

const BalloonElement = {
    name: 'balloon',
    label: 'Balloon',
    description: 'Floats up, turns to powder when cold, and pops when hot',
    category: 'gas',
    defaultColor: '#FF6B8A',
    
    // Physical properties
    density: 0.1,
    isGas: true,
    isLiquid: false,
    isPowder: false,
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
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.size = 0.8 + (Math.random() * 0.4); // Random size variation
        particle.age = 0;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Add age to track lifetime
        if (grid[y][x].age !== undefined) {
            grid[y][x].age++;
        } else {
            grid[y][x].age = 0;
        }
        
        // Temperature effects
        if (grid[y][x].temperature <= 5) {
            // Very cold - balloon condenses into solid powder
            grid[y][x] = {
                type: 'balloon-powder',
                color: grid[y][x].color || this.defaultColor,
                temperature: grid[y][x].temperature,
                processed: true,
                isGas: false,
                isLiquid: false,
                isPowder: true,
                isSolid: false,
                previousState: 'balloon' // Remember it was a balloon
            };
            return;
        } else if (grid[y][x].temperature >= 80) {
            // Very hot - balloon pops
            grid[y][x] = null;
            
            // Create tiny balloon fragments
            const fragmentCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < fragmentCount; i++) {
                const nx = x + Math.floor(Math.random() * 3) - 1;
                const ny = y + Math.floor(Math.random() * 3) - 1;
                
                if (isInBounds(nx, ny) && !grid[ny][nx]) {
                    grid[ny][nx] = {
                        type: 'balloon-powder',
                        color: '#FF6B8A',
                        temperature: grid[y][x] ? grid[y][x].temperature : 25,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: true,
                        isSolid: false,
                        size: 0.5
                    };
                }
            }
            return;
        }
        
        // Gas movement - rises upward
        if (y > 0) {
            // Try to move directly up
            if (!grid[y - 1][x]) {
                grid[y - 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try diagonally up
            const randomDirection = Math.random() < 0.5;
            if (randomDirection && x > 0 && !grid[y - 1][x - 1]) {
                grid[y - 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x < grid[0].length - 1 && !grid[y - 1][x + 1]) {
                grid[y - 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try the other diagonal
            if (randomDirection && x < grid[0].length - 1 && !grid[y - 1][x + 1]) {
                grid[y - 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x > 0 && !grid[y - 1][x - 1]) {
                grid[y - 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // If can't rise, try to move sideways
        const sideDirection = Math.random() < 0.5 ? -1 : 1;
        if (x + sideDirection >= 0 && x + sideDirection < grid[0].length && !grid[y][x + sideDirection]) {
            grid[y][x + sideDirection] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Check for interactions that can pop the balloon
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
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Sharp objects pop the balloon
            if (grid[ny][nx].type === 'glass-shard') {
                grid[y][x] = null;
                return;
            }
            
            // Fire pops the balloon
            if (grid[ny][nx].type === 'fire') {
                grid[y][x] = null;
                return;
            }
            
            // Heat from nearby elements
            if (grid[ny][nx].temperature > 50) {
                grid[y][x].temperature += 5;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        const size = particle.size || 0.9;
        const radius = (cellSize * size) / 2;
        
        // Calculate center of cell
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Draw balloon body
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw knot at bottom
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY + radius * 0.8, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
};

// Define the balloon powder as a separate internal element
window.BalloonPowderElement = {
    name: 'balloon-powder',
    label: 'Balloon Powder',
    description: 'Condensed balloon material that falls',
    category: 'solid-powder',
    defaultColor: '#FF6B8A',
    
    // Physical properties
    density: 0.5,
    isGas: false,
    isLiquid: false,
    isPowder: true,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Process the balloon powder's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Temperature effects - if warmed up, turn back into balloon
        if (grid[y][x].temperature > 15) {
            grid[y][x] = {
                type: 'balloon',
                color: grid[y][x].color || this.defaultColor,
                temperature: grid[y][x].temperature,
                processed: true,
                isGas: true,
                isLiquid: false,
                isPowder: false,
                isSolid: false
            };
            return;
        }
        
        // Balloon powder falls with gravity
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
    },
    
    // Custom rendering function for balloon powder
    render: function(ctx, x, y, particle, cellSize) {
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Draw fragmented balloon bits
        const pieceCount = 3;
        for (let i = 0; i < pieceCount; i++) {
            const pieceSize = cellSize / 3;
            const pieceX = x * cellSize + (i % 2) * cellSize * 0.5;
            const pieceY = y * cellSize + Math.floor(i / 2) * cellSize * 0.5;
            
            ctx.beginPath();
            ctx.arc(pieceX + pieceSize/2, pieceY + pieceSize/2, pieceSize/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Make the element available globally
window.BalloonElement = BalloonElement; 