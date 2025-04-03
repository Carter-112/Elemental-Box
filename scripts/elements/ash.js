// Ash Element
// Powdered remains after burning

const AshElement = {
    name: 'ash',
    label: 'Ash',
    description: 'Powdered remains from burning materials',
    category: 'solid powder',
    defaultColor: '#555555',
    
    // Physical properties
    density: 0.5,
    isGas: false,
    isLiquid: false,
    isPowder: true,
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
    temperature: 50, // Slightly warm from recent burning
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Cool down over time
        if (grid[y][x].temperature > 25) {
            grid[y][x].temperature -= 0.2;
        }
        
        // Ash movement - falls with gravity like other powders
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to move diagonally down
            const direction = Math.random() < 0.5 ? -1 : 1;
            const nx = x + direction;
            
            if (isInBounds(nx, y + 1) && !grid[y + 1][nx]) {
                grid[y + 1][nx] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Pile behavior - try the other diagonal
            if (isInBounds(x - direction, y + 1) && !grid[y + 1][x - direction]) {
                grid[y + 1][x - direction] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Water can wash away ash
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
            
            // Ash mixes with water
            if (grid[ny][nx].type === 'water' && Math.random() < 0.1) {
                // Darken the water slightly
                grid[ny][nx].color = this.blendColors(grid[ny][nx].color || '#4286f4', '#333333', 0.2);
                
                // Remove the ash
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Draw ash with a slight variation in color
        const variation = Math.random() * 10;
        const r = Math.floor(85 + variation);
        const g = Math.floor(85 + variation);
        const b = Math.floor(85 + variation);
        const ashColor = particle.color || `rgb(${r}, ${g}, ${b})`;
        
        ctx.fillStyle = ashColor;
        
        // Draw as a small pile of particles
        const particleCount = 3 + Math.floor(Math.random() * 3);
        const particleSize = cellSize / 5;
        
        for (let i = 0; i < particleCount; i++) {
            const px = x * cellSize + (cellSize / 2) + (Math.random() * cellSize / 2) - cellSize / 4;
            const py = y * cellSize + (cellSize / 2) + (Math.random() * cellSize / 2) - cellSize / 4;
            
            ctx.beginPath();
            ctx.arc(px, py, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    // Helper function to blend colors
    blendColors: function(color1, color2, ratio) {
        // Convert hex to RGB
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Convert RGB to hex
        const rgb2hex = (rgb) => {
            return '#' + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
        };
        
        // Handle RGB format
        if (color1.startsWith('rgb')) {
            const match = color1.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                color1 = rgb2hex({
                    r: parseInt(match[1]),
                    g: parseInt(match[2]),
                    b: parseInt(match[3])
                });
            }
        }
        
        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);
        
        if (!c1 || !c2) return color1;
        
        const blended = {
            r: Math.round(c1.r * (1 - ratio) + c2.r * ratio),
            g: Math.round(c1.g * (1 - ratio) + c2.g * ratio),
            b: Math.round(c1.b * (1 - ratio) + c2.b * ratio)
        };
        
        return rgb2hex(blended);
    }
};

// Make the element available globally
window.AshElement = AshElement; 