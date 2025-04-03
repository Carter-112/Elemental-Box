// Stone Element
// A solid that is durable and heat resistant

const StoneElement = {
    name: 'stone',
    label: 'Stone',
    description: 'A solid, durable material resistant to heat',
    category: 'solid',
    defaultColor: '#777777', // Gray color
    
    // Physical properties
    density: 2.7,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Ensure stone stays in place
    hasGravity: false,
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
        particle.temperature = this.temperature;
        particle.isStatic = true;
        particle.hasGravity = false;
        
        // Add slight random variations to color
        const variation = Math.floor(Math.random() * 40) - 20;
        const r = Math.min(Math.max(119 + variation, 90), 150);
        const g = Math.min(Math.max(119 + variation, 90), 150);
        const b = Math.min(Math.max(119 + variation, 90), 150);
        particle.color = `rgb(${r}, ${g}, ${b})`;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Stone doesn't fall - it's a static solid
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Track temperature exchange with surroundings
        let totalTemp = grid[y][x].temperature;
        let count = 1;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Temperature exchange with neighbors
            if (grid[ny][nx].temperature !== undefined) {
                totalTemp += grid[ny][nx].temperature;
                count++;
            }
            
            // Stone is attacked by acid very slowly
            if (grid[ny][nx].type === 'acid' && Math.random() < 0.01) {
                // Acid is consumed when corroding stone
                grid[ny][nx].acidity = (grid[ny][nx].acidity || 1) - 0.1;
                
                if (grid[ny][nx].acidity <= 0) {
                    grid[ny][nx] = null;
                }
                
                // Stone is very resistant to acid, but can still be damaged
                if (grid[y][x].integrity === undefined) {
                    grid[y][x].integrity = 100;
                }
                
                grid[y][x].integrity -= 1;
                
                // If stone is completely corroded, it disappears
                if (grid[y][x].integrity <= 0) {
                    grid[y][x] = null;
                    return;
                }
            }
            
            // Extreme heat can melt stone to lava
            if (grid[ny][nx].temperature > 1500) {
                grid[y][x].temperature += 2;
            }
        }
        
        // Update stone temperature
        const avgTemp = totalTemp / count;
        grid[y][x].temperature = grid[y][x].temperature * 0.95 + avgTemp * 0.05;
        
        // Stone melts to lava at very high temperatures
        if (grid[y][x].temperature > 1600 && Math.random() < 0.05) {
            grid[y][x] = {
                type: 'lava',
                color: '#FF4500', // Orange-red lava
                processed: true,
                temperature: 1600,
                isGas: false,
                isLiquid: true,
                isPowder: false,
                isSolid: false,
                density: 2.5
            };
            return;
        }
    },
    
    // Render the stone
    render: function(x, y, ctx, cellSize) {
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add stone texture (small random speckles)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        
        // Draw small random dots for texture
        const dotCount = 5;
        for (let i = 0; i < dotCount; i++) {
            const dotX = x * cellSize + Math.random() * cellSize;
            const dotY = y * cellSize + Math.random() * cellSize;
            const dotSize = cellSize * (0.02 + Math.random() * 0.03);
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.StoneElement = StoneElement;
} 