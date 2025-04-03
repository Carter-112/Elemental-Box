// Resin Element
// A solid material that holds structure

const ResinElement = {
    name: 'resin',
    label: 'Resin',
    description: 'A solid amber-like material',
    category: 'solid',
    defaultColor: '#DAA520', // Golden amber color
    
    // Physical properties
    density: 1.5,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,
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
        particle.hardness = 0.9; // High hardness
        particle.clarity = 0.7; // Partially transparent
        particle.burning = false; // Whether it's on fire
        particle.burnTimer = 0; // How long it's been burning
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].hardness === undefined) {
            grid[y][x].hardness = 0.9;
        }
        
        if (grid[y][x].clarity === undefined) {
            grid[y][x].clarity = 0.7;
        }
        
        if (grid[y][x].burning === undefined) {
            grid[y][x].burning = false;
        }
        
        if (grid[y][x].burnTimer === undefined) {
            grid[y][x].burnTimer = 0;
        }
        
        // Resin can preserve elements inside it (like amber with insects)
        // This is handled when something tries to move into a resin space
        
        // Check for interactions with fire and heat
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
        
        // Check for fire sources
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Resin can catch fire from nearby fire
            if (!grid[y][x].burning && 
                (grid[ny][nx].type === 'fire' || 
                (grid[ny][nx].burning && grid[ny][nx].temperature > 100))) {
                grid[y][x].burning = true;
                grid[y][x].temperature = Math.max(grid[y][x].temperature, 120);
            }
        }
        
        // Temperature effects
        if (grid[y][x].temperature > 100 && !grid[y][x].burning) {
            if (Math.random() < 0.05) {
                grid[y][x].burning = true;
            }
        } else if (grid[y][x].temperature > 200) {
            // Resin melts and becomes sticky at high temperatures
            grid[y][x].hardness = Math.max(0.3, grid[y][x].hardness - 0.01);
            
            // Update color based on hardness
            const hardnessFactor = grid[y][x].hardness;
            const r = 218 - Math.floor((1 - hardnessFactor) * 50);
            const g = 165 - Math.floor((1 - hardnessFactor) * 50);
            const b = 32 + Math.floor((1 - hardnessFactor) * 30);
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // If too soft, convert to a sticky liquid
            if (grid[y][x].hardness <= 0.3) {
                grid[y][x] = {
                    type: 'glue',
                    color: '#D2B48C',
                    temperature: grid[y][x].temperature,
                    processed: true,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false,
                    viscosity: 0.9,
                    stickiness: 0.95
                };
                return;
            }
        }
        
        // Resin burning behavior
        if (grid[y][x].burning) {
            // Increase temperature
            grid[y][x].temperature = Math.min(grid[y][x].temperature + 2, 250);
            
            // Change color as it burns
            const burnProgress = Math.min(1.0, grid[y][x].burnTimer / 150);
            const r = 218;
            const g = Math.max(50, 165 - Math.floor(burnProgress * 100));
            const b = Math.max(20, 32 - Math.floor(burnProgress * 20));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // Increment burn timer
            grid[y][x].burnTimer++;
            
            // Create fire particles above
            if (y > 0 && Math.random() < 0.1) {
                const fireX = x;
                const fireY = y - 1;
                
                if (!grid[fireY][fireX]) {
                    grid[fireY][fireX] = {
                        type: 'fire',
                        color: '#FF9900',
                        temperature: grid[y][x].temperature + 20,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifetime: 3 + Math.floor(Math.random() * 5)
                    };
                }
            }
            
            // Create smoke occasionally
            if (y > 1 && Math.random() < 0.03) {
                const smokeX = x + (Math.random() < 0.5 ? -1 : 1);
                const smokeY = y - 2;
                
                if (isInBounds(smokeX, smokeY) && !grid[smokeY][smokeX]) {
                    grid[smokeY][smokeX] = {
                        type: 'smoke',
                        color: '#444444',
                        temperature: grid[y][x].temperature - 50,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                }
            }
            
            // Resin burns for a long time before being consumed
            if (grid[y][x].burnTimer > 200) {
                // Create ash
                grid[y][x] = {
                    type: 'ash',
                    color: '#222222',
                    temperature: grid[y][x].temperature - 50,
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: true,
                    isSolid: false
                };
                return;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Get properties
        const clarity = particle.clarity || 0.7;
        const burning = particle.burning || false;
        
        // Create base color with transparency
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add inner highlight to give resin depth
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(
            x * cellSize + cellSize * 0.3, 
            y * cellSize + cellSize * 0.3, 
            cellSize * 0.2, 
            0, Math.PI * 2
        );
        ctx.fill();
        
        // If burning, add fire effect
        if (burning) {
            const burnProgress = (particle.burnTimer || 0) / 200;
            
            // Flicker effect
            const flickerHeight = Math.random() * cellSize * 0.4 * (1 - burnProgress);
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
            
            // Show cracks in resin when burning
            ctx.strokeStyle = 'rgba(50, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            
            const crackCount = Math.floor(burnProgress * 5) + 1;
            for (let i = 0; i < crackCount; i++) {
                const startX = x * cellSize + Math.random() * cellSize;
                const startY = y * cellSize + Math.random() * cellSize;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(
                    startX + (Math.random() * 2 - 1) * cellSize * 0.4,
                    startY + (Math.random() * 2 - 1) * cellSize * 0.4
                );
                ctx.stroke();
            }
        }
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.ResinElement = ResinElement; 