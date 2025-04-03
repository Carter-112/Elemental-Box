// Steam Element
// A gas that rises and turns back to water when cold

const SteamElement = {
    name: 'steam',
    label: 'Steam',
    description: 'Water vapor that rises and condenses back to water when cold',
    category: 'gas',
    defaultColor: '#DDDDDD',
    
    // Physical properties
    density: 0.2, // Very light
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
    temperature: 105, // Hot by default (just above water boiling point)
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.lifetime = 200 + Math.floor(Math.random() * 200); // How long before potentially dissipating
        particle.opacity = 0.6 + (Math.random() * 0.3); // Starting opacity
        particle.velocity = {
            x: (Math.random() * 0.6) - 0.3, // Random horizontal drift
            y: -0.7 - (Math.random() * 0.4)  // Upward movement
        };
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
            grid[y][x].lifetime = 200 + Math.floor(Math.random() * 200);
        }
        
        if (grid[y][x].opacity === undefined) {
            grid[y][x].opacity = 0.6 + (Math.random() * 0.3);
        }
        
        if (grid[y][x].velocity === undefined) {
            grid[y][x].velocity = {
                x: (Math.random() * 0.6) - 0.3,
                y: -0.7 - (Math.random() * 0.4)
            };
        }
        
        // Decrease lifetime
        grid[y][x].lifetime--;
        
        // Steam slowly cools down
        if (grid[y][x].temperature > 30) {
            grid[y][x].temperature -= 0.2;
        }
        
        // Temperature effects - condense back to water when cool
        if (grid[y][x].temperature < 100) {
            // Increasing chance to condense as temperature drops
            const condensationChance = (100 - grid[y][x].temperature) * 0.005;
            
            if (Math.random() < condensationChance) {
                // Convert to water droplet
                grid[y][x] = {
                    type: 'water',
                    color: '#4286f4',
                    temperature: grid[y][x].temperature,
                    processed: true,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false
                };
                return;
            }
        }
        
        // Steam can also dissipate eventually
        if (grid[y][x].lifetime <= 0) {
            grid[y][x] = null;
            return;
        }
        
        // Apply wind effects - simulated as a slight tendency to move in one direction
        const windStrength = 0.1;
        const windDirection = Date.now() * 0.0005; // Changes slowly over time
        grid[y][x].velocity.x += Math.sin(windDirection) * windStrength * 0.05;
        
        // Calculate movement based on velocity
        const moveX = Math.sign(grid[y][x].velocity.x);
        const moveY = Math.sign(grid[y][x].velocity.y);
        
        // Steam movement - rises upward with some horizontal drift
        let moved = false;
        
        // Try to move vertically (upward)
        if (moveY !== 0 && y + moveY >= 0 && y + moveY < grid.length) {
            if (!grid[y + moveY][x]) {
                grid[y + moveY][x] = grid[y][x];
                grid[y][x] = null;
                moved = true;
            }
        }
        
        // If couldn't move vertically, try diagonally
        if (!moved && moveX !== 0 && 
            x + moveX >= 0 && x + moveX < grid[0].length && 
            y + moveY >= 0 && y + moveY < grid.length) {
            
            if (!grid[y + moveY][x + moveX]) {
                grid[y + moveY][x + moveX] = grid[y][x];
                grid[y][x] = null;
                moved = true;
            }
        }
        
        // If couldn't move diagonally, try horizontally
        if (!moved && moveX !== 0 && 
            x + moveX >= 0 && x + moveX < grid[0].length) {
            
            if (!grid[y][x + moveX]) {
                grid[y][x + moveX] = grid[y][x];
                grid[y][x] = null;
                moved = true;
            }
        }
        
        // If steam is blocked from moving, it spreads out more
        if (!moved) {
            // Adjust velocity to try different directions
            grid[y][x].velocity.x = (Math.random() * 0.6) - 0.3;
            grid[y][x].velocity.y = -0.3 - (Math.random() * 0.3);
            
            // Try a random direction as a last resort
            const randomDir = Math.floor(Math.random() * 8);
            const randomDirs = [
                { dx: 0, dy: -1 },  // up
                { dx: 1, dy: -1 },  // up-right
                { dx: 1, dy: 0 },   // right
                { dx: 1, dy: 1 },   // down-right
                { dx: 0, dy: 1 },   // down
                { dx: -1, dy: 1 },  // down-left
                { dx: -1, dy: 0 },  // left
                { dx: -1, dy: -1 }  // up-left
            ];
            
            const tryDir = randomDirs[randomDir];
            const nx = x + tryDir.dx;
            const ny = y + tryDir.dy;
            
            if (isInBounds(nx, ny) && !grid[ny][nx]) {
                grid[ny][nx] = grid[y][x];
                grid[y][x] = null;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Calculate steam color with proper opacity
        const opacity = particle.opacity || 0.7;
        
        // Create a soft cloud-like effect
        const gradient = ctx.createRadialGradient(
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            0,
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            cellSize / 1.5
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            x * cellSize - cellSize * 0.25, 
            y * cellSize - cellSize * 0.25, 
            cellSize * 1.5, 
            cellSize * 1.5
        );
        
        // Add some curly details to the steam
        if (Math.random() < 0.2) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
            ctx.lineWidth = 1;
            
            const curlX = x * cellSize + Math.random() * cellSize;
            const curlY = y * cellSize + Math.random() * cellSize;
            const curlSize = cellSize * 0.3;
            
            ctx.beginPath();
            ctx.arc(
                curlX, 
                curlY, 
                curlSize, 
                0, 
                Math.PI * (0.5 + Math.random())
            );
            ctx.stroke();
        }
    }
};

// Make the element available globally
window.SteamElement = SteamElement; 