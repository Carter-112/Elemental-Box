// Fuse Element
// A flammable solid that burns slowly and can trigger explosives

const FuseElement = {
    name: 'fuse',
    label: 'Fuse',
    description: 'A flammable line that burns slowly, used to trigger explosives',
    category: 'solid',
    defaultColor: '#A0522D', // Brown
    
    // Physical properties
    density: 0.7,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Ensure fuse stays in place
    hasGravity: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true,
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.burning = false;
        particle.burnProgress = 0;
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
        
        // Fuse doesn't fall - it stays in place
        
        // If fuse is burning, update burning progress
        if (grid[y][x].burning) {
            // Increase burn progress
            grid[y][x].burnProgress += 0.05;
            
            // Change color as it burns
            const progress = Math.min(1, grid[y][x].burnProgress);
            const r = Math.floor(160 + (95 * progress));
            const g = Math.floor(82 - (82 * progress));
            const b = Math.floor(45 - (45 * progress));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // Create smoke as it burns
            if (Math.random() < 0.2) {
                // Try to place smoke above
                if (isInBounds(x, y - 1) && !grid[y - 1][x]) {
                    grid[y - 1][x] = {
                        type: 'smoke',
                        color: '#888888',
                        processed: true,
                        temperature: 120,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifespan: 20 + Math.random() * 30
                    };
                }
            }
            
            // Ignite neighbors that are also fuses or other flammables
            const neighbors = [
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
            ];
            
            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
                
                // Ignite other fuses
                if (grid[ny][nx].type === 'fuse' && !grid[ny][nx].burning) {
                    grid[ny][nx].burning = true;
                    grid[ny][nx].burnProgress = 0;
                }
                
                // Ignite other flammables with a delay
                if (grid[ny][nx].flammable && !grid[ny][nx].burning && 
                    grid[y][x].burnProgress > 0.7 && Math.random() < 0.3) {
                    grid[ny][nx].burning = true;
                    
                    // Trigger fuse on dynamite or other explosives
                    if (grid[ny][nx].type === 'dynamite') {
                        grid[ny][nx].fuseActive = true;
                    }
                }
            }
            
            // Burn out eventually
            if (grid[y][x].burnProgress >= 1.0) {
                // Replace with smoke
                grid[y][x] = {
                    type: 'smoke',
                    color: '#777777',
                    processed: true,
                    temperature: 100,
                    isGas: true,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: false,
                    lifespan: 20 + Math.random() * 20
                };
                return;
            }
        } else {
            // Check if neighboring cells can ignite the fuse
            const neighbors = [
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
                { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
            ];
            
            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
                
                // Ignite from fire, lava, or other burning things
                if ((grid[ny][nx].type === 'fire' || 
                     grid[ny][nx].type === 'lava' || 
                     grid[ny][nx].burning) && 
                    Math.random() < 0.5) {
                    grid[y][x].burning = true;
                    grid[y][x].burnProgress = 0;
                    return;
                }
                
                // Extreme heat can also ignite
                if (grid[ny][nx].temperature && grid[ny][nx].temperature > 150 && 
                    Math.random() < 0.1) {
                    grid[y][x].burning = true;
                    grid[y][x].burnProgress = 0;
                    return;
                }
            }
        }
    },
    
    // Render the fuse
    render: function(x, y, ctx, cellSize) {
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw fuse texture
        ctx.strokeStyle = '#8B4513'; // Darker brown
        ctx.lineWidth = cellSize * 0.2;
        
        ctx.beginPath();
        ctx.moveTo(x * cellSize, y * cellSize + cellSize / 2);
        ctx.lineTo(x * cellSize + cellSize, y * cellSize + cellSize / 2);
        ctx.stroke();
        
        // If burning, add red glow and embers
        if (this.burning) {
            // Red glow
            const glow = ctx.createRadialGradient(
                x * cellSize + cellSize * this.burnProgress, 
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize * this.burnProgress, 
                y * cellSize + cellSize / 2,
                cellSize * 0.5
            );
            glow.addColorStop(0, 'rgba(255, 100, 0, 0.7)');
            glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = glow;
            ctx.fillRect(
                x * cellSize + cellSize * (this.burnProgress - 0.5), 
                y * cellSize, 
                cellSize, 
                cellSize
            );
        }
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.FuseElement = FuseElement;
} 