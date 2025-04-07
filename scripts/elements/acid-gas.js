// Acid Gas Element
// A gas that rises from acid when it dissolves materials

const AcidGasElement = {
    name: 'acid-gas',
    label: 'Acid Gas',
    description: 'Toxic gas that rises from acid when it dissolves materials',
    category: 'gas',
    defaultColor: '#A6BAA9', // Pale green
    
    // Physical properties
    density: 0.3,
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
    corrosive: true,
    temperature: 30, // Slightly above room temperature
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.lifetime = 100 + Math.floor(Math.random() * 100); // Random lifetime
        particle.opacity = 0.8;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].lifetime === undefined) {
            grid[y][x].lifetime = 100 + Math.floor(Math.random() * 100);
        }
        if (grid[y][x].opacity === undefined) {
            grid[y][x].opacity = 0.8;
        }
        
        // Decrease lifetime
        grid[y][x].lifetime--;
        
        // Fade out as lifetime decreases
        grid[y][x].opacity = Math.max(0.1, grid[y][x].lifetime / 200);
        
        // Disappear when lifetime is up
        if (grid[y][x].lifetime <= 0) {
            grid[y][x] = null;
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
            
            // Try to move diagonally up
            const direction = Math.random() < 0.5 ? -1 : 1;
            const nx = x + direction;
            
            if (isInBounds(nx, y - 1) && !grid[y - 1][nx]) {
                grid[y - 1][nx] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try the other diagonal
            if (isInBounds(x - direction, y - 1) && !grid[y - 1][x - direction]) {
                grid[y - 1][x - direction] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Horizontal drift
        if (Math.random() < 0.2) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const nx = x + direction;
            
            if (isInBounds(nx, y) && !grid[y][nx]) {
                grid[y][nx] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Acid gas is corrosive to some materials
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
            
            // Acid gas doesn't corrode steel or glass
            if (grid[ny][nx].type === 'steel' || grid[ny][nx].type === 'glass') continue;
            
            // Acid gas has a small chance to corrode some materials
            if (['wood', 'plant', 'paper', 'fabric'].includes(grid[ny][nx].type)) {
                if (Math.random() < 0.01) {
                    grid[ny][nx] = null;
                    grid[y][x].lifetime -= 10; // Gas is consumed in the process
                }
            }
            
            // Acid gas is neutralized by water
            if (grid[ny][nx].type === 'water') {
                if (Math.random() < 0.5) {
                    // Water becomes slightly acidic
                    grid[ny][nx].color = '#C4E0E5';
                    
                    // Remove the gas
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Acid gas is semi-transparent
        ctx.globalAlpha = particle.opacity || 0.8;
        
        // Base color
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Draw as a cloud of particles
        const particleCount = 3 + Math.floor(Math.random() * 3);
        const particleSize = cellSize / 4;
        
        for (let i = 0; i < particleCount; i++) {
            const px = x * cellSize + (Math.random() * cellSize);
            const py = y * cellSize + (Math.random() * cellSize);
            
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.AcidGasElement = AcidGasElement;
