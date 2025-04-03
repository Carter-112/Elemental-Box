// Oil Element
// A flammable liquid that burns until gone

const OilElement = {
    name: 'oil',
    label: 'Oil',
    description: 'A flammable liquid that burns with heat',
    category: 'liquid',
    defaultColor: '#4A3728',
    
    // Physical properties
    density: 0.8, // Less dense than water
    isGas: false,
    isLiquid: true,
    isPowder: false,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true,
    conductive: false,
    explosive: false,
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.burning = false; // Whether it's currently on fire
        particle.burnTimer = 0; // How long it's been burning
        particle.amount = 1.0; // Full amount initially
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].burning === undefined) {
            grid[y][x].burning = false;
        }
        
        if (grid[y][x].burnTimer === undefined) {
            grid[y][x].burnTimer = 0;
        }
        
        if (grid[y][x].amount === undefined) {
            grid[y][x].amount = 1.0;
        }
        
        // Check if oil should ignite
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
        
        // Check temperature and neighbors
        if (!grid[y][x].burning) {
            // Ignite if temperature is high enough
            if (grid[y][x].temperature >= 80) {
                grid[y][x].burning = true;
            }
            
            // Check neighbors for fire and other burning oil
            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
                
                if (grid[ny][nx].type === 'fire' || 
                    (grid[ny][nx].type === 'oil' && grid[ny][nx].burning) ||
                    (grid[ny][nx].type === 'napalm' && grid[ny][nx].burning)) {
                    grid[y][x].burning = true;
                    break;
                }
            }
        }
        
        // Oil burning behavior
        if (grid[y][x].burning) {
            // Increase temperature
            grid[y][x].temperature = Math.min(grid[y][x].temperature + 2, 150);
            
            // Create fire particles above oil
            if (y > 0 && Math.random() < 0.2) {
                const fireX = x;
                const fireY = y - 1;
                
                if (isInBounds(fireX, fireY) && !grid[fireY][fireX]) {
                    grid[fireY][fireX] = {
                        type: 'fire',
                        color: '#FF9900',
                        temperature: grid[y][x].temperature + 20,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifetime: 5 + Math.floor(Math.random() * 5)
                    };
                }
            }
            
            // Create smoke occasionally
            if (y > 1 && Math.random() < 0.05) {
                const smokeX = x + (Math.random() < 0.5 ? -1 : 1);
                const smokeY = y - 2;
                
                if (isInBounds(smokeX, smokeY) && !grid[smokeY][smokeX]) {
                    grid[smokeY][smokeX] = {
                        type: 'smoke',
                        color: '#555555',
                        temperature: grid[y][x].temperature - 20,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                }
            }
            
            // Change color as it burns
            const burnProgress = Math.min(1.0, grid[y][x].burnTimer / 100);
            const r = 74 + Math.floor(burnProgress * 181);
            const g = 55 + Math.floor(burnProgress * 55);
            const b = 40 + Math.floor(burnProgress * 10);
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // Oil gets consumed as it burns
            grid[y][x].amount -= 0.005;
            grid[y][x].burnTimer++;
            
            // If oil is consumed, it disappears
            if (grid[y][x].amount <= 0) {
                // Small chance to leave some ash
                if (Math.random() < 0.1) {
                    grid[y][x] = {
                        type: 'ash',
                        color: '#777777',
                        temperature: grid[y][x].temperature - 30,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: true,
                        isSolid: false
                    };
                } else {
                    grid[y][x] = null;
                }
                return;
            }
        }
        
        // Spread heat to neighbors
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Heat transfer
            if (grid[ny][nx].temperature !== undefined && grid[y][x].burning) {
                const heatTransfer = (grid[y][x].temperature - grid[ny][nx].temperature) * 0.1;
                if (heatTransfer > 0) {
                    grid[ny][nx].temperature += heatTransfer;
                }
            }
        }
        
        // Oil doesn't mix with water, it floats on top
        if (y < grid.length - 1 && grid[y + 1][x] && grid[y + 1][x].type === 'water') {
            // Try to move to the sides on top of water
            const leftX = x - 1;
            const rightX = x + 1;
            
            if (isInBounds(leftX, y) && !grid[y][leftX]) {
                grid[y][leftX] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (isInBounds(rightX, y) && !grid[y][rightX]) {
                grid[y][rightX] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // If can't move to sides, and there's water below, try to swap positions
            if (Math.random() < 0.1) {
                const temp = grid[y][x];
                grid[y][x] = grid[y + 1][x];
                grid[y + 1][x] = temp;
                return;
            }
        }
        
        // Oil movement - falls with gravity
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Oil spread - tries to move horizontally if can't move down
        if (Math.random() < 0.4) {
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
        // Base oil color with some transparency
        const baseColor = particle.color || this.defaultColor;
        ctx.fillStyle = baseColor;
        
        // Adjust opacity based on amount left
        const opacity = 0.8 * (particle.amount || 1.0);
        ctx.globalAlpha = Math.max(0.1, opacity);
        
        // Draw the main body
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
        
        // Add burning effect if it's on fire
        if (particle.burning) {
            // Flicker effect
            const flickerHeight = Math.random() * cellSize * 0.3;
            const gradient = ctx.createLinearGradient(
                x * cellSize + cellSize / 2,
                y * cellSize,
                x * cellSize + cellSize / 2,
                y * cellSize - flickerHeight
            );
            
            gradient.addColorStop(0, 'rgba(255, 153, 0, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            
            // Draw flame shape
            ctx.beginPath();
            ctx.moveTo(x * cellSize, y * cellSize);
            ctx.lineTo(x * cellSize + cellSize / 2, y * cellSize - flickerHeight);
            ctx.lineTo(x * cellSize + cellSize, y * cellSize);
            ctx.closePath();
            ctx.fill();
        }
    }
};

// Make the element available globally
window.OilElement = OilElement; 