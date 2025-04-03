// Napalm Element
// A sticky liquid that burns intensely and self-ignites

const NapalmElement = {
    name: 'napalm',
    label: 'Napalm',
    description: 'A sticky, highly flammable gel that burns intensely and self-ignites',
    category: 'liquid',
    defaultColor: '#FF5500',
    
    // Physical properties
    density: 0.9,
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
    temperature: 40, // Slightly warm by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.burning = false; // Whether it's currently on fire
        particle.burnTimer = 0; // How long it's been burning
        particle.viscosity = 0.7; // Medium viscosity
        particle.stickiness = 0.9; // Very sticky
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
        
        if (grid[y][x].viscosity === undefined) {
            grid[y][x].viscosity = 0.7;
        }
        
        if (grid[y][x].stickiness === undefined) {
            grid[y][x].stickiness = 0.9;
        }
        
        // Self-ignition check - napalm will self-ignite occasionally
        if (!grid[y][x].burning && Math.random() < 0.002) {
            grid[y][x].burning = true;
            grid[y][x].temperature += 50;
        }
        
        // Napalm will also ignite at higher temperatures
        if (!grid[y][x].burning && grid[y][x].temperature > 70) {
            grid[y][x].burning = true;
        }
        
        // Napalm burning behavior
        if (grid[y][x].burning) {
            // Increase temperature
            grid[y][x].temperature = Math.min(grid[y][x].temperature + 1, 200);
            
            // Change color to more intense as it burns
            const burnProgress = Math.min(1.0, grid[y][x].burnTimer / 200);
            const r = 255;
            const g = Math.floor(85 * (1 - burnProgress));
            const b = 0;
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // Increment burn timer
            grid[y][x].burnTimer++;
            
            // Create fire particles above
            if (y > 0 && Math.random() < 0.3) {
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
                        lifetime: 5 + Math.floor(Math.random() * 5)
                    };
                }
            }
            
            // Create smoke particles occasionally
            if (y > 1 && Math.random() < 0.1) {
                const smokeX = x + (Math.random() < 0.5 ? -1 : 1);
                const smokeY = y - 2;
                
                if (isInBounds(smokeX, smokeY) && !grid[smokeY][smokeX]) {
                    grid[smokeY][smokeX] = {
                        type: 'smoke',
                        color: '#444444',
                        temperature: grid[y][x].temperature - 10,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                }
            }
            
            // Ignite nearby flammable materials
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
            
            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
                
                // Ignite other napalm
                if (grid[ny][nx].type === 'napalm' && !grid[ny][nx].burning) {
                    grid[ny][nx].burning = true;
                    grid[ny][nx].processed = true; // Mark as processed to avoid chain reaction in one tick
                }
                
                // Heat up and potentially ignite other flammable materials
                if (grid[ny][nx].flammable) {
                    grid[ny][nx].temperature += 10;
                }
                
                // Interact with water - napalm usually continues to burn even in contact with water
                if (grid[ny][nx].type === 'water') {
                    if (Math.random() < 0.05) {
                        // Very small chance water actually puts out napalm
                        if (grid[ny][nx].temperature < 0) { // Only if water is very cold
                            grid[y][x].burning = false;
                            grid[y][x].temperature -= 10;
                        }
                    } else {
                        // Heat up the water
                        grid[ny][nx].temperature += 5;
                        
                        // Small chance to evaporate the water
                        if (grid[ny][nx].temperature > 80 && Math.random() < 0.1) {
                            grid[ny][nx] = {
                                type: 'steam',
                                color: '#DDDDDD',
                                temperature: 110,
                                processed: true,
                                isGas: true,
                                isLiquid: false,
                                isPowder: false,
                                isSolid: false
                            };
                        }
                    }
                }
            }
            
            // Napalm eventually burns out
            if (grid[y][x].burnTimer > 300) {
                // Small chance to leave ash
                if (Math.random() < 0.3) {
                    grid[y][x] = {
                        type: 'ash',
                        color: '#555555',
                        temperature: grid[y][x].temperature - 50,
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
        
        // Napalm movement - affected by viscosity
        if (y < grid.length - 1) {
            // Only move if random check passes based on viscosity
            if (Math.random() > grid[y][x].viscosity) {
                // Try to move directly down
                if (!grid[y + 1][x]) {
                    grid[y + 1][x] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
        }
        
        // Horizontal spread is also affected by viscosity
        if (Math.random() > grid[y][x].viscosity * 1.2) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const nx = x + direction;
            
            if (isInBounds(nx, y) && !grid[y][nx]) {
                grid[y][nx] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Check if napalm can stick to other objects
        if (y < grid.length - 1 && grid[y + 1][x] && grid[y + 1][x].type !== 'napalm') {
            // Has something below to stick to
            if (Math.random() < grid[y][x].stickiness * 0.1) {
                // This napalm is now "stuck" and won't flow sideways
                grid[y][x].viscosity = 0.95;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base napalm color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add burning effect if it's on fire
        if (particle.burning) {
            // Flicker effect
            const flickerSize = Math.random() * cellSize * 0.5;
            const gradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                cellSize / 2 + flickerSize
            );
            
            gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                x * cellSize - flickerSize, 
                y * cellSize - flickerSize, 
                cellSize + flickerSize * 2, 
                cellSize + flickerSize * 2
            );
            
            // Add small flame particles
            const flameCount = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < flameCount; i++) {
                const flameX = x * cellSize + Math.random() * cellSize;
                const flameY = y * cellSize - Math.random() * cellSize * 0.5;
                const flameSize = 1 + Math.random() * 3;
                
                ctx.fillStyle = Math.random() < 0.5 ? '#FFFF00' : '#FF6600';
                ctx.beginPath();
                ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Add glossy effect for non-burning napalm
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(
                x * cellSize + cellSize * 0.3,
                y * cellSize + cellSize * 0.3,
                cellSize * 0.15,
                0, Math.PI * 2
            );
            ctx.fill();
        }
    }
};

// Make the element available globally
window.NapalmElement = NapalmElement; 