// Tar Element
// A thick black liquid that burns slowly and sticks to things

const TarElement = {
    name: 'tar',
    label: 'Tar',
    description: 'A thick, black liquid that burns slowly and sticks to things',
    category: 'liquid',
    defaultColor: '#111111',
    
    // Physical properties
    density: 1.2, // Denser than water
    isGas: false,
    isLiquid: true,
    isPowder: false,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true, // Burns slowly
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    viscosity: 0.85, // Very viscous, flows slowly
    temperature: 25, // Room temperature
    ignitionTemp: 120, // Temperature at which it catches fire
    burnRate: 0.05, // Burns slowly
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.burning = false;
        particle.burnTimer = 0;
        particle.stickiness = 0.95; // High stickiness value
        particle.viscosity = 0.85;
        particle.velocity = { x: 0, y: 0.1 }; // Slow downward movement
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
        if (grid[y][x].stickiness === undefined) {
            grid[y][x].stickiness = 0.95;
        }
        if (grid[y][x].viscosity === undefined) {
            grid[y][x].viscosity = 0.85;
        }
        if (grid[y][x].velocity === undefined) {
            grid[y][x].velocity = { x: 0, y: 0.1 };
        }
        
        // Temperature effects
        if (grid[y][x].temperature >= grid[y][x].ignitionTemp && !grid[y][x].burning) {
            grid[y][x].burning = true;
            grid[y][x].burnTimer = 0;
        }
        
        // Handle burning state
        if (grid[y][x].burning) {
            // Increase temperature while burning
            grid[y][x].temperature += 1;
            
            // Increment burn timer
            grid[y][x].burnTimer++;
            
            // Chance to spread fire to flammable neighbors
            if (grid[y][x].burnTimer % 10 === 0) {
                // Look at neighboring cells
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (isInBounds(nx, ny) && grid[ny][nx]) {
                            // If neighbor is flammable, chance to ignite it
                            if (grid[ny][nx].flammable && !grid[ny][nx].burning && 
                                grid[ny][nx].temperature < grid[ny][nx].ignitionTemp) {
                                // Heat up neighbor
                                grid[ny][nx].temperature += 10;
                                
                                // Small chance to directly ignite
                                if (Math.random() < 0.1) {
                                    grid[ny][nx].burning = true;
                                    grid[ny][nx].burnTimer = 0;
                                }
                            }
                        }
                    }
                }
            }
            
            // Tar burns for a long time before turning to ash
            if (grid[y][x].burnTimer > 500) { // Long burn time
                // Turn into ash
                grid[y][x] = {
                    type: 'ash',
                    color: '#333333',
                    temperature: Math.min(grid[y][x].temperature, 200),
                    processed: true,
                    isPowder: true,
                    isLiquid: false,
                    isGas: false,
                    isSolid: false
                };
                return;
            }
        }
        
        // Tar movement
        let moved = false;
        
        // Calculate next potential position based on viscosity
        if (Math.random() > grid[y][x].viscosity) {
            // Check below first
            if (isInBounds(x, y + 1) && !grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                moved = true;
            }
            
            // If can't move down, check diagonal down
            if (!moved) {
                const diagonalDir = Math.random() < 0.5 ? -1 : 1;
                
                if (isInBounds(x + diagonalDir, y + 1) && !grid[y + 1][x + diagonalDir]) {
                    grid[y + 1][x + diagonalDir] = grid[y][x];
                    grid[y][x] = null;
                    moved = true;
                }
            }
            
            // If can't move diagonally, try to spread horizontally (more rarely due to viscosity)
            if (!moved && Math.random() > 0.7) {
                const horizontalDir = Math.random() < 0.5 ? -1 : 1;
                
                if (isInBounds(x + horizontalDir, y) && !grid[y][x + horizontalDir]) {
                    grid[y][x + horizontalDir] = grid[y][x];
                    grid[y][x] = null;
                    moved = true;
                }
            }
        }
        
        // If tar didn't move, check if it should stick to or trap something above it
        if (!moved) {
            // Check above for particles that might fall into tar
            if (isInBounds(x, y - 1) && grid[y - 1][x]) {
                const above = grid[y - 1][x];
                
                // If above particle is heavier than tar and not static
                if (!above.isStatic && above.density > grid[y][x].density) {
                    // Chance to slow down the falling particle based on stickiness
                    if (Math.random() < grid[y][x].stickiness) {
                        // Reduce velocity if the particle has it
                        if (above.velocity) {
                            above.velocity.y *= 0.5;
                            above.velocity.x *= 0.3;
                        }
                        
                        // If it's another tar or liquid, chance to merge
                        if (above.type === 'tar' || (above.isLiquid && Math.random() < 0.3)) {
                            // Combine properties
                            grid[y][x].temperature = (grid[y][x].temperature + above.temperature) / 2;
                            grid[y - 1][x] = null;
                        }
                    }
                }
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base tar color
        const baseColor = particle.color || this.defaultColor;
        
        // Draw the tar with a thick, glossy effect
        ctx.fillStyle = baseColor;
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Add glossy highlight effect
        ctx.fillStyle = 'rgba(50, 50, 50, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            x * cellSize + cellSize * 0.5,
            y * cellSize + cellSize * 0.3,
            cellSize * 0.3,
            cellSize * 0.15,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // If burning, add fire effect
        if (particle.burning) {
            // Flicker intensity based on burn timer
            const flickerIntensity = 0.5 + Math.sin(particle.burnTimer * 0.2) * 0.2;
            
            // Fire gradient
            const fireGradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                cellSize * 0.8
            );
            
            fireGradient.addColorStop(0, `rgba(255, 100, 0, ${flickerIntensity * 0.8})`);
            fireGradient.addColorStop(0.6, `rgba(200, 50, 0, ${flickerIntensity * 0.4})`);
            fireGradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
            
            ctx.fillStyle = fireGradient;
            ctx.fillRect(
                x * cellSize - cellSize * 0.25,
                y * cellSize - cellSize * 0.5,
                cellSize * 1.5,
                cellSize * 1.5
            );
            
            // Add smoke particles occasionally
            if (Math.random() < 0.2) {
                ctx.fillStyle = 'rgba(40, 40, 40, 0.3)';
                const smokeX = x * cellSize + Math.random() * cellSize;
                const smokeY = y * cellSize - Math.random() * cellSize * 0.5;
                const smokeSize = cellSize * (0.1 + Math.random() * 0.1);
                
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Add drippy effect at bottom edge
        if (Math.random() < 0.05) {
            const dripX = x * cellSize + Math.random() * cellSize;
            const dripWidth = cellSize * 0.1;
            const dripHeight = cellSize * (0.2 + Math.random() * 0.3);
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(
                dripX - dripWidth / 2,
                y * cellSize + cellSize,
                dripWidth,
                dripHeight
            );
            
            // Add a small rounded bottom to the drip
            ctx.beginPath();
            ctx.arc(
                dripX,
                y * cellSize + cellSize + dripHeight,
                dripWidth / 2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
};

// Make the element available globally
window.TarElement = TarElement; 