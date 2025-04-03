// Brick Element
// A solid building block that can withstand high temperatures

const BrickElement = {
    name: 'brick',
    label: 'Brick',
    description: 'A solid building block that retains structure',
    category: 'solid',
    defaultColor: '#B03A2E',
    
    // Physical properties
    density: 1.8,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,    // Make sure it's static
    hasGravity: false, // Ensure it doesn't have gravity
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
        // Ensure brick stays in place
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
        
        // Ensure brick doesn't fall by skipping fall checks
        // Brick should be static and not subject to gravity
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Handle temperature changes from nearby elements
        let totalTemp = grid[y][x].temperature;
        let count = 1;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Sum temperatures of neighbors for averaging
            if (grid[ny][nx].temperature !== undefined) {
                totalTemp += grid[ny][nx].temperature;
                count++;
            }
        }
        
        // Average the temperature with neighbors (slight thermal conductivity)
        const avgTemp = totalTemp / count;
        grid[y][x].temperature = grid[y][x].temperature * 0.8 + avgTemp * 0.2;
        
        // Change color slightly based on temperature
        if (grid[y][x].temperature > 100) {
            const tempFactor = Math.min(1, (grid[y][x].temperature - 100) / 900);
            const r = Math.floor(176 + (79 * tempFactor));
            const g = Math.floor(58 - (58 * tempFactor));
            const b = Math.floor(46 - (46 * tempFactor));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
        }
    },
    
    // Render the element
    render: function(x, y, ctx, cellSize) {
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add brick pattern effect
        const brickPattern = (Math.floor(y / 2) % 2 === 0) ? 
            (x % 2 === 0) : (x % 2 === 1);
        
        if (brickPattern) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
        
        // Add mortar lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.BrickElement = BrickElement;
} 