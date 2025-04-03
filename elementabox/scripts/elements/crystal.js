// Crystal Element
// A solid that grows over time with temperature-dependent growth

const CrystalElement = {
    name: 'crystal',
    label: 'Crystal',
    description: 'A solid that grows over time, faster when cold and slower when hot',
    category: 'solid',
    defaultColor: '#88CCEE',
    
    // Physical properties
    density: 2.5,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,
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
        particle.growth = 0; // Track growth progress
        particle.growthDirection = Math.floor(Math.random() * 8); // Random growth direction
        particle.integrity = 1.0; // Full integrity when created
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].growth === undefined) {
            grid[y][x].growth = 0;
        }
        
        if (grid[y][x].growthDirection === undefined) {
            grid[y][x].growthDirection = Math.floor(Math.random() * 8);
        }
        
        // Temperature affects growth rate
        let growthRate = 0.01; // Base growth rate
        
        // Colder = faster growth
        if (grid[y][x].temperature < 0) {
            growthRate = 0.04;
        } else if (grid[y][x].temperature < 10) {
            growthRate = 0.02;
        }
        
        // Hotter = slower growth or even breakdown
        if (grid[y][x].temperature > 80) {
            // Too hot - crystal starts to shatter
            if (!grid[y][x].integrity) {
                grid[y][x].integrity = 1.0;
            }
            
            grid[y][x].integrity -= 0.01;
            
            if (grid[y][x].integrity <= 0 || Math.random() < 0.005) {
                // Shatter from the edges
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
                
                // Check if this crystal piece is at the edge
                let isAtEdge = false;
                for (const dir of neighbors) {
                    const nx = x + dir.dx;
                    const ny = y + dir.dy;
                    
                    if (!isInBounds(nx, ny) || !grid[ny][nx] || 
                        (grid[ny][nx].type !== 'crystal')) {
                        isAtEdge = true;
                        break;
                    }
                }
                
                if (isAtEdge) {
                    // Convert to glass shard when shattered
                    grid[y][x] = {
                        type: 'glass-shard',
                        color: '#AADDEE',
                        temperature: grid[y][x].temperature,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: true,
                        isSolid: false
                    };
                    return;
                }
            }
            
            // No growth when hot
            return;
        } else if (grid[y][x].temperature > 50) {
            growthRate = 0.005;
        }
        
        // Grow the crystal
        grid[y][x].growth += growthRate;
        
        if (grid[y][x].growth >= 1.0) {
            // Reset growth progress
            grid[y][x].growth = 0;
            
            // Determine growth direction
            const directions = [
                { dx: 0, dy: -1 },  // up
                { dx: 1, dy: -1 },  // up-right
                { dx: 1, dy: 0 },   // right
                { dx: 1, dy: 1 },   // down-right
                { dx: 0, dy: 1 },   // down
                { dx: -1, dy: 1 },  // down-left
                { dx: -1, dy: 0 },  // left
                { dx: -1, dy: -1 }  // up-left
            ];
            
            // Try to grow in the preferred direction first
            const preferredDir = directions[grid[y][x].growthDirection];
            const nx = x + preferredDir.dx;
            const ny = y + preferredDir.dy;
            
            if (isInBounds(nx, ny) && !grid[ny][nx]) {
                // Grow crystal in the preferred direction
                grid[ny][nx] = {
                    type: 'crystal',
                    color: this.defaultColor,
                    temperature: grid[y][x].temperature,
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: true,
                    isStatic: true,
                    growth: 0,
                    growthDirection: (grid[y][x].growthDirection + Math.floor(Math.random() * 3) - 1 + 8) % 8 // Similar to parent with small variation
                };
                return;
            }
            
            // If can't grow in preferred direction, try other directions
            const shuffledDirs = [...directions];
            for (let i = shuffledDirs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledDirs[i], shuffledDirs[j]] = [shuffledDirs[j], shuffledDirs[i]];
            }
            
            for (const dir of shuffledDirs) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (isInBounds(nx, ny) && !grid[ny][nx]) {
                    // Grow crystal in this direction
                    grid[ny][nx] = {
                        type: 'crystal',
                        color: this.defaultColor,
                        temperature: grid[y][x].temperature,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: true,
                        isStatic: true,
                        growth: 0,
                        growthDirection: Array.prototype.indexOf.call(directions, dir)
                    };
                    return;
                }
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base crystal color
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Draw a faceted crystal shape
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Determine the crystal shape based on growth direction
        const direction = particle.growthDirection || 0;
        
        ctx.beginPath();
        
        // Create a crystalline shape with multiple points
        const points = 5;
        const outerRadius = cellSize * 0.4;
        const innerRadius = cellSize * 0.2;
        
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * 2 * i / (points * 2)) + (direction * Math.PI / 4);
            
            const px = centerX + radius * Math.cos(angle);
            const py = centerY + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Add a highlight effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(centerX - cellSize * 0.1, centerY - cellSize * 0.1);
        ctx.lineTo(centerX + cellSize * 0.1, centerY - cellSize * 0.3);
        ctx.lineTo(centerX + cellSize * 0.2, centerY - cellSize * 0.2);
        ctx.closePath();
        ctx.fill();
    }
};

// Make the element available globally
window.CrystalElement = CrystalElement; 