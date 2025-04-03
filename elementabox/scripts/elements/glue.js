// Glue Element
// A slow-moving sticky liquid that solidifies with cold

const GlueElement = {
    name: 'glue',
    label: 'Glue',
    description: 'A sticky liquid that hardens with cold and melts in water',
    category: 'liquid',
    defaultColor: '#F5F5DC',
    
    // Physical properties
    density: 1.3,
    isGas: false,
    isLiquid: true,
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
        particle.viscosity = 0.9; // Very high viscosity (0-1)
        particle.stickiness = 0.8; // How sticky the glue is (0-1)
        particle.solidity = 0; // How solid it is (0-1), 0 = liquid, 1 = solid
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].viscosity === undefined) {
            grid[y][x].viscosity = 0.9;
        }
        
        if (grid[y][x].stickiness === undefined) {
            grid[y][x].stickiness = 0.8;
        }
        
        if (grid[y][x].solidity === undefined) {
            grid[y][x].solidity = 0;
        }
        
        // Temperature affects viscosity and solidity
        if (grid[y][x].temperature < 10) {
            // Cold glue starts to harden
            grid[y][x].solidity = Math.min(1, grid[y][x].solidity + 0.02);
            grid[y][x].viscosity = Math.min(0.99, grid[y][x].viscosity + 0.01);
            
            // Update color to show hardening
            const solidityFactor = grid[y][x].solidity;
            grid[y][x].color = `rgb(${245 - solidityFactor * 40}, ${245 - solidityFactor * 40}, ${220 - solidityFactor * 40})`;
            
            // If fully hardened, become solid
            if (grid[y][x].solidity >= 1.0) {
                grid[y][x].isLiquid = false;
                grid[y][x].isSolid = true;
                return;
            }
        } else if (grid[y][x].temperature > 30) {
            // Warm glue becomes more fluid
            grid[y][x].solidity = Math.max(0, grid[y][x].solidity - 0.02);
            grid[y][x].viscosity = Math.max(0.6, grid[y][x].viscosity - 0.01);
            
            // Update color to show softening
            const solidityFactor = grid[y][x].solidity;
            grid[y][x].color = `rgb(${245 - solidityFactor * 40}, ${245 - solidityFactor * 40}, ${220 - solidityFactor * 40})`;
        }
        
        // Check interactions with other elements
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
        
        // Check neighbor interactions
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Water dissolves glue
            if (grid[ny][nx].type === 'water') {
                // Glue becomes diluted and gradually disappears
                grid[y][x].stickiness -= 0.05;
                grid[y][x].viscosity -= 0.05;
                
                // Water becomes slightly cloudy
                grid[ny][nx].color = '#E6E6FA';
                
                // If too diluted, glue disappears
                if (grid[y][x].stickiness <= 0 || grid[y][x].viscosity <= 0.1) {
                    grid[y][x] = null;
                    return;
                }
            }
            
            // Items can stick to glue
            if (grid[ny][nx] && !grid[ny][nx].isStatic && Math.random() < grid[y][x].stickiness * 0.1) {
                // Make the other particle stick by reducing its movement chance
                if (!grid[ny][nx].stuckInGlue) {
                    grid[ny][nx].stuckInGlue = true;
                    grid[ny][nx].originalMovementChance = 0.2; // Store for later
                    grid[ny][nx].movementChance = 0.01; // Very low chance to move
                }
            }
        }
        
        // Glue movement - affected by viscosity and solidity
        if (grid[y][x].solidity < 0.5) {
            // Can still flow, but slowly
            if (y < grid.length - 1) {
                // Only move down if random check passes based on viscosity
                // Higher viscosity = less likely to move
                if (Math.random() > grid[y][x].viscosity) {
                    // Try to move directly down
                    if (!grid[y + 1][x]) {
                        grid[y + 1][x] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    }
                }
            }
            
            // Horizontal spread is even slower
            if (Math.random() > grid[y][x].viscosity * 1.5) {
                const direction = Math.random() < 0.5 ? -1 : 1;
                const nx = x + direction;
                
                if (isInBounds(nx, y) && !grid[y][nx]) {
                    grid[y][nx] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base glue color with transparency to show stickiness
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Adjust opacity based on solidity - more solid = more opaque
        const solidity = particle.solidity || 0;
        ctx.globalAlpha = 0.6 + (solidity * 0.4);
        
        // Draw the main body
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw sticky strands if glue is still somewhat liquid
        if (solidity < 0.8) {
            ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
            ctx.lineWidth = 1;
            
            // Draw 2-3 random sticky strands
            const strandCount = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < strandCount; i++) {
                const startX = x * cellSize + Math.random() * cellSize;
                const startY = y * cellSize + Math.random() * cellSize / 2;
                const length = cellSize * (0.2 + Math.random() * 0.3);
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX, startY + length);
                ctx.stroke();
            }
        }
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.GlueElement = GlueElement; 