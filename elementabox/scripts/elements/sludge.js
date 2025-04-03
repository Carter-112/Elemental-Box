// Sludge Element
// A dirty, muddy liquid that moves slowly and has high density

const SludgeElement = {
    name: 'sludge',
    label: 'Sludge',
    description: 'A slow-moving, dense, muddy liquid',
    category: 'liquid',
    defaultColor: '#5D4037',
    
    // Physical properties
    density: 2.2, // Very dense
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
        particle.viscosity = 0.95; // Very high viscosity (0-1)
        particle.contaminationLevel = 0.8; // How dirty/toxic it is (0-1)
        particle.hasDebris = Math.random() < 0.3; // 30% chance to contain visible debris
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
            grid[y][x].viscosity = 0.95;
        }
        
        if (grid[y][x].contaminationLevel === undefined) {
            grid[y][x].contaminationLevel = 0.8;
        }
        
        if (grid[y][x].hasDebris === undefined) {
            grid[y][x].hasDebris = Math.random() < 0.3;
        }
        
        // Temperature affects viscosity
        if (grid[y][x].temperature > 50) {
            // Heat makes sludge more fluid
            grid[y][x].viscosity = Math.max(0.75, grid[y][x].viscosity - 0.001);
        } else if (grid[y][x].temperature < 0) {
            // Cold makes sludge more solid
            grid[y][x].viscosity = Math.min(0.99, grid[y][x].viscosity + 0.001);
            
            // Extremely cold temperatures can turn sludge to solid
            if (grid[y][x].temperature < -10 && Math.random() < 0.01) {
                // Convert to mud solid
                grid[y][x] = {
                    type: 'stone',
                    color: '#3E2723',
                    temperature: grid[y][x].temperature,
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: true,
                    isStatic: true
                };
                return;
            }
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
        
        // Process neighbor interactions
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Sludge can contaminate water
            if (grid[ny][nx].type === 'water') {
                // Change water color to be muddy
                const contaminatedColor = `rgba(93, 64, 55, ${grid[y][x].contaminationLevel * 0.5})`;
                grid[ny][nx].color = contaminatedColor;
                grid[ny][nx].contaminated = true;
                
                // Decrease sludge contamination level
                grid[y][x].contaminationLevel = Math.max(0.1, grid[y][x].contaminationLevel - 0.05);
                
                // Update sludge color based on remaining contamination
                const r = 93;
                const g = 64;
                const b = 55;
                const a = 0.5 + (grid[y][x].contaminationLevel * 0.5);
                grid[y][x].color = `rgba(${r}, ${g}, ${b}, ${a})`;
                
                // If sludge loses too much contamination, it becomes more watery
                if (grid[y][x].contaminationLevel < 0.3) {
                    grid[y][x].viscosity = Math.max(0.6, grid[y][x].viscosity - 0.1);
                }
            }
            
            // Sludge kills plants
            if (grid[ny][nx].type === 'plant') {
                if (Math.random() < grid[y][x].contaminationLevel * 0.1) {
                    // Gradually kill the plant
                    if (!grid[ny][nx].contaminated) {
                        grid[ny][nx].contaminated = true;
                        grid[ny][nx].health = (grid[ny][nx].health || 1.0) - 0.2;
                        
                        // Update plant color to look sickly
                        const healthFactor = Math.max(0, grid[ny][nx].health || 0);
                        const r = 51 + Math.floor((1 - healthFactor) * 100);
                        const g = Math.max(80, 170 - Math.floor((1 - healthFactor) * 90));
                        const b = 68;
                        grid[ny][nx].color = `rgb(${r}, ${g}, ${b})`;
                        
                        // Dead plant
                        if (grid[ny][nx].health <= 0) {
                            grid[ny][nx] = null;
                        }
                    }
                }
            }
        }
        
        // Sludge movement - affected by viscosity and density
        if (y < grid.length - 1) {
            // Only move if random check passes based on viscosity
            // Higher viscosity = less likely to move
            if (Math.random() > grid[y][x].viscosity) {
                // Try to move directly down
                if (!grid[y + 1][x]) {
                    grid[y + 1][x] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
                
                // Very high density means it can displace less dense liquids below
                if (grid[y + 1][x] && grid[y + 1][x].isLiquid && 
                    grid[y + 1][x].density && grid[y + 1][x].density < grid[y][x].density) {
                    // Swap positions
                    const temp = grid[y][x];
                    grid[y][x] = grid[y + 1][x];
                    grid[y + 1][x] = temp;
                    return;
                }
            }
        }
        
        // Horizontal spread is extremely slow
        if (Math.random() > grid[y][x].viscosity * 1.5) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const nx = x + direction;
            
            if (isInBounds(nx, y) && !grid[y][nx]) {
                grid[y][nx] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base sludge color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add muddy texture with bubbles and debris
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        
        // Draw 2-3 random mud specks
        const speckCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < speckCount; i++) {
            const speckX = x * cellSize + Math.random() * cellSize;
            const speckY = y * cellSize + Math.random() * cellSize;
            const speckSize = Math.max(1, Math.random() * cellSize / 6);
            ctx.beginPath();
            ctx.arc(speckX, speckY, speckSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Occasionally add visible debris
        if (particle.hasDebris) {
            ctx.fillStyle = '#8D6E63'; // Lighter brown for debris
            
            const debrisType = Math.floor(Math.random() * 3);
            if (debrisType === 0) {
                // Draw a small stick
                ctx.fillRect(
                    x * cellSize + cellSize * 0.3, 
                    y * cellSize + cellSize * 0.4, 
                    cellSize * 0.4, 
                    cellSize * 0.1
                );
            } else if (debrisType === 1) {
                // Draw a small stone
                ctx.beginPath();
                ctx.arc(
                    x * cellSize + cellSize * 0.6, 
                    y * cellSize + cellSize * 0.6, 
                    cellSize * 0.15, 
                    0, Math.PI * 2
                );
                ctx.fill();
            } else {
                // Draw a small leaf
                ctx.fillStyle = '#4E342E';
                ctx.beginPath();
                ctx.ellipse(
                    x * cellSize + cellSize * 0.5, 
                    y * cellSize + cellSize * 0.5, 
                    cellSize * 0.2, 
                    cellSize * 0.1, 
                    Math.PI * 0.25, 
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }
        
        // Add a bubble occasionally
        if (Math.random() < 0.1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            const bubbleSize = cellSize / 8;
            const bubbleX = x * cellSize + Math.random() * (cellSize - bubbleSize);
            const bubbleY = y * cellSize + Math.random() * (cellSize - bubbleSize);
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Make the element available globally
window.SludgeElement = SludgeElement; 