// Smoke Element
// A gas that rises upward and dissipates over time

const SmokeElement = {
    name: 'smoke',
    label: 'Smoke',
    description: 'A gas that rises and slowly dissipates',
    category: 'gas',
    defaultColor: '#888888',
    
    // Physical properties
    density: 0.3, // Light gas
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
    reactive: false,
    corrosive: false,
    temperature: 60, // Slightly warm by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.lifetime = 100 + Math.floor(Math.random() * 150); // How long before dissipating
        particle.opacity = 0.8 + (Math.random() * 0.2); // Starting opacity
        particle.velocity = {
            x: (Math.random() * 0.6) - 0.3, // Random horizontal drift
            y: -0.5 - (Math.random() * 0.5)  // Upward movement
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
            grid[y][x].lifetime = 100 + Math.floor(Math.random() * 150);
        }
        
        if (grid[y][x].opacity === undefined) {
            grid[y][x].opacity = 0.8 + (Math.random() * 0.2);
        }
        
        if (grid[y][x].velocity === undefined) {
            grid[y][x].velocity = {
                x: (Math.random() * 0.6) - 0.3,
                y: -0.5 - (Math.random() * 0.5)
            };
        }
        
        // Decrease lifetime
        grid[y][x].lifetime--;
        
        // Reduce opacity as smoke ages
        if (grid[y][x].lifetime < 50) {
            grid[y][x].opacity = Math.max(0.1, grid[y][x].opacity - 0.01);
        }
        
        // Dissipate when lifetime reaches zero or opacity is too low
        if (grid[y][x].lifetime <= 0 || grid[y][x].opacity <= 0.1) {
            grid[y][x] = null;
            return;
        }
        
        // Smoke cools down over time
        if (grid[y][x].temperature > 25) {
            grid[y][x].temperature -= 0.2;
        }
        
        // Apply wind effects - simulated as a slight tendency to move in one direction
        const windStrength = 0.1;
        const windDirection = Date.now() * 0.001; // Changes slowly over time
        grid[y][x].velocity.x += Math.sin(windDirection) * windStrength * 0.05;
        
        // Calculate movement based on velocity
        const moveX = Math.sign(grid[y][x].velocity.x);
        const moveY = Math.sign(grid[y][x].velocity.y);
        
        // Smoke movement - rises upward with some horizontal drift
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
        
        // If smoke is blocked from moving, it spreads out more
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
        // Calculate smoke color with proper opacity
        const opacity = particle.opacity || 0.8;
        let smokeColor = particle.color || this.defaultColor;
        
        // If color is provided as hex or rgb, convert to rgba
        if (smokeColor.startsWith('#') || smokeColor.startsWith('rgb(')) {
            const temp = smokeColor.startsWith('#') ? 
                hexToRgb(smokeColor) : 
                smokeColor.replace('rgb(', '').replace(')', '').split(',').map(c => parseInt(c.trim()));
            
            smokeColor = `rgba(${temp[0]}, ${temp[1]}, ${temp[2]}, ${opacity})`;
        }
        
        // Draw smoke with gradient for softer edges
        const gradient = ctx.createRadialGradient(
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            0,
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            cellSize / 2
        );
        
        // Parse the color to extract RGB values
        let r, g, b;
        if (smokeColor.startsWith('rgba(')) {
            const parts = smokeColor.replace('rgba(', '').replace(')', '').split(',');
            r = parseInt(parts[0].trim());
            g = parseInt(parts[1].trim());
            b = parseInt(parts[2].trim());
        } else {
            // Default to gray if parsing fails
            r = g = b = 136;
        }
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            x * cellSize - cellSize * 0.25, 
            y * cellSize - cellSize * 0.25, 
            cellSize * 1.5, 
            cellSize * 1.5
        );
        
        // Helper function to convert hex to RGB
        function hexToRgb(hex) {
            // Remove # if present
            hex = hex.replace('#', '');
            
            // Parse the hex values
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            return [r, g, b];
        }
    }
};

// Make the element available globally
window.SmokeElement = SmokeElement; 