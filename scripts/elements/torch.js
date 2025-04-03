// Torch Element
// A solid that permanently emits fire and light

const TorchElement = {
    name: 'torch',
    label: 'Torch',
    description: 'A solid that permanently emits fire and light',
    category: 'solid',
    defaultColor: '#8B4513', // Brown wooden base
    
    // Physical properties
    density: 1.5,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Doesn't move
    isSpawner: true, // Spawns fire particles
    isElectrical: false,
    
    // Behavior properties
    flammable: false, // The torch itself doesn't burn
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 400, // Hot by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.active = true; // Torch is active by default
        particle.flickerTimer = Math.floor(Math.random() * 100); // For flame animation
        particle.lightRadius = 7; // How far the light reaches
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].active === undefined) {
            grid[y][x].active = true;
        }
        if (grid[y][x].flickerTimer === undefined) {
            grid[y][x].flickerTimer = Math.floor(Math.random() * 100);
        }
        if (grid[y][x].lightRadius === undefined) {
            grid[y][x].lightRadius = 7;
        }
        
        // Increment flicker timer for animation
        grid[y][x].flickerTimer++;
        
        // Process torch only if it's active
        if (grid[y][x].active) {
            // Spawn fire above the torch if there's space
            if (isInBounds(x, y - 1) && !grid[y - 1][x]) {
                // Create fire particle
                grid[y - 1][x] = {
                    type: 'fire',
                    color: '#FF4500',
                    temperature: 400,
                    processed: true,
                    lifetime: 20 + Math.floor(Math.random() * 20), // Short-lived flame
                    isGas: true,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: false,
                    flammable: false
                };
                
                // Add some velocity to the flame for better effect
                grid[y - 1][x].velocity = {
                    x: (Math.random() * 0.4) - 0.2, // Random horizontal drift
                    y: -0.3 - (Math.random() * 0.2)  // Upward movement
                };
            }
            
            // Heat up neighboring cells to simulate radiant heat
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (isInBounds(nx, ny) && grid[ny][nx]) {
                        // Heat up neighboring cells
                        if (grid[ny][nx].temperature !== undefined) {
                            grid[ny][nx].temperature += 1;
                            
                            // Chance to ignite flammable neighbors
                            if (grid[ny][nx].flammable && 
                                grid[ny][nx].temperature >= grid[ny][nx].ignitionTemp &&
                                !grid[ny][nx].burning) {
                                grid[ny][nx].burning = true;
                                if (grid[ny][nx].burnTimer !== undefined) {
                                    grid[ny][nx].burnTimer = 0;
                                }
                            }
                        }
                    }
                }
            }
            
            // Special interactions
            // 1. Water can temporarily extinguish the torch
            let waterNearby = false;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (isInBounds(nx, ny) && grid[ny][nx] && grid[ny][nx].type === 'water') {
                        waterNearby = true;
                        
                        // Water close to torch evaporates more quickly
                        if (Math.random() < 0.2) {
                            // Convert water to steam
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
            
            // If water is directly touching the torch, temporarily deactivate it
            if (waterNearby) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        if (isInBounds(nx, ny) && grid[ny][nx] && grid[ny][nx].type === 'water') {
                            // Extinguish the torch temporarily
                            grid[y][x].active = false;
                            
                            // The torch will reactivate after some time
                            setTimeout(() => {
                                if (grid[y] && grid[y][x] && grid[y][x].type === 'torch') {
                                    grid[y][x].active = true;
                                }
                            }, 2000); // 2 seconds
                            
                            break;
                        }
                    }
                    if (!grid[y][x].active) break;
                }
            }
        } else {
            // Torch is inactive, but can be reactivated by fire
            let fireNearby = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (isInBounds(nx, ny) && grid[ny][nx] && 
                        (grid[ny][nx].type === 'fire' || 
                         (grid[ny][nx].burning && grid[ny][nx].temperature > 300))) {
                        fireNearby = true;
                        break;
                    }
                }
                if (fireNearby) break;
            }
            
            // Fire nearby can reactivate the torch
            if (fireNearby) {
                grid[y][x].active = true;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Draw torch base (wood)
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Add wood grain texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        const grainWidth = cellSize * 0.1;
        for (let i = 0; i < 3; i++) {
            const grainX = x * cellSize + cellSize * 0.2 + i * grainWidth * 2;
            ctx.fillRect(
                grainX,
                y * cellSize,
                grainWidth,
                cellSize
            );
        }
        
        // Draw the torch head
        if (particle.active) {
            // Torch head (cloth/fuel part)
            ctx.fillStyle = '#DD9933';
            ctx.beginPath();
            ctx.arc(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize * 0.2,
                cellSize * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Draw flames
            const flickerOffset = Math.sin(particle.flickerTimer * 0.2) * cellSize * 0.1;
            const flickerSize = 0.9 + Math.sin(particle.flickerTimer * 0.3) * 0.2;
            
            // Main flame
            const flameGradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize - cellSize * 0.1 + flickerOffset,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize - cellSize * 0.1 + flickerOffset,
                cellSize * flickerSize
            );
            
            flameGradient.addColorStop(0, 'rgba(255, 255, 0, 0.9)');
            flameGradient.addColorStop(0.4, 'rgba(255, 120, 0, 0.8)');
            flameGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.ellipse(
                x * cellSize + cellSize / 2,
                y * cellSize - cellSize * 0.1 + flickerOffset,
                cellSize * 0.4,
                cellSize * 0.7 * flickerSize,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Inner flame (brighter)
            const innerFlameGradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize - cellSize * 0.15 + flickerOffset * 0.5,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize - cellSize * 0.15 + flickerOffset * 0.5,
                cellSize * 0.5 * flickerSize
            );
            
            innerFlameGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            innerFlameGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.8)');
            innerFlameGradient.addColorStop(1, 'rgba(255, 120, 0, 0)');
            
            ctx.fillStyle = innerFlameGradient;
            ctx.beginPath();
            ctx.ellipse(
                x * cellSize + cellSize / 2,
                y * cellSize - cellSize * 0.15 + flickerOffset * 0.5,
                cellSize * 0.2,
                cellSize * 0.4 * flickerSize,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Light glow effect
            const lightGradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                particle.lightRadius * cellSize
            );
            
            lightGradient.addColorStop(0, 'rgba(255, 200, 50, 0.2)');
            lightGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.05)');
            lightGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = lightGradient;
            ctx.fillRect(
                x * cellSize - particle.lightRadius * cellSize,
                y * cellSize - particle.lightRadius * cellSize,
                particle.lightRadius * cellSize * 2,
                particle.lightRadius * cellSize * 2
            );
            
            // Add occasional spark particles
            if (Math.random() < 0.1) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
                const sparkX = x * cellSize + cellSize / 2 + (Math.random() * cellSize - cellSize / 2) * 0.5;
                const sparkY = y * cellSize - cellSize * 0.3 + flickerOffset * 0.7;
                const sparkSize = cellSize * 0.05;
                
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Inactive torch (extinguished but still shows the torch head)
            ctx.fillStyle = '#663311'; // Darker, wet-looking fuel
            ctx.beginPath();
            ctx.arc(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize * 0.2,
                cellSize * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Smoke effect for recently extinguished torch
            if (Math.random() < 0.3) {
                ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
                const smokeX = x * cellSize + cellSize / 2 + (Math.random() * cellSize - cellSize / 2) * 0.3;
                const smokeY = y * cellSize - cellSize * 0.3;
                const smokeSize = cellSize * (0.1 + Math.random() * 0.1);
                
                ctx.beginPath();
                ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
};

// Make the element available globally
window.TorchElement = TorchElement; 