// Ice Element
// A solid that melts when heated

const IceElement = {
    name: 'ice',
    label: 'Ice',
    description: 'Cold solid that melts into water when heated',
    category: 'solid',
    defaultColor: '#BFEAFF', // Light blue
    
    // Physical properties
    density: 0.9,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Ensure ice stays in place
    hasGravity: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: -5, // Cold temperature
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.isStatic = true;
        particle.hasGravity = false;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Ice maintains its cold temperature unless heated
        if (grid[y][x].temperature > 0 && Math.random() < 0.1) {
            grid[y][x].temperature = Math.max(grid[y][x].temperature - 0.2, -5);
        }
        
        // Ice doesn't fall - it's a solid block
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Track heat exchange with surroundings
        let totalTemp = grid[y][x].temperature;
        let count = 1;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Heat exchange with neighbors
            if (grid[ny][nx].temperature !== undefined) {
                totalTemp += grid[ny][nx].temperature;
                count++;
            }
            
            // Ice freezes adjacent water
            if (grid[ny][nx].type === 'water' && grid[y][x].temperature < 0 && Math.random() < 0.05) {
                grid[ny][nx] = {
                    type: 'ice',
                    color: this.defaultColor,
                    processed: true,
                    temperature: -2,
                    isGas: false,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: true,
                    isStatic: true,
                    hasGravity: false,
                    density: 0.9
                };
            }
        }
        
        // Update temperature based on surroundings
        const avgTemp = totalTemp / count;
        grid[y][x].temperature = grid[y][x].temperature * 0.8 + avgTemp * 0.2;
        
        // Melt ice into water if temperature rises above freezing
        if (grid[y][x].temperature > 0) {
            // Gradually melt - increase liquid content
            if (!grid[y][x].meltProgress) {
                grid[y][x].meltProgress = 0;
            }
            
            // Progress melting based on temperature
            grid[y][x].meltProgress += 0.01 * grid[y][x].temperature;
            
            // Visual feedback - change color as it melts
            const meltLevel = Math.min(grid[y][x].meltProgress, 1);
            const r = Math.floor(191 + (120 * meltLevel));
            const g = Math.floor(234 + (10 * meltLevel));
            const b = 255;
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // When fully melted, turn to water
            if (grid[y][x].meltProgress >= 1) {
                grid[y][x] = {
                    type: 'water',
                    color: '#5099DB',
                    processed: true,
                    temperature: 1, // Cold water
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false,
                    density: 1.0
                };
                return;
            }
        }
    },
    
    // Render the ice
    render: function(x, y, ctx, cellSize) {
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add frosty texture to the ice
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        
        // Draw some frost patterns
        const patternCount = 3;
        for (let i = 0; i < patternCount; i++) {
            const px = x * cellSize + Math.random() * cellSize;
            const py = y * cellSize + Math.random() * cellSize;
            const size = cellSize * (0.05 + Math.random() * 0.1);
            
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.IceElement = IceElement;
} 