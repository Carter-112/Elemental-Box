// Resin element module
window.ResinElement = {
    name: 'resin',
    defaultColor: '#FFC107', // Amber color
    density: 1.1,            // Slightly heavier than water
    durability: 0.5,         // Moderate durability
    flammable: true,
    defaultTemperature: 25,
    stickiness: 0.9,         // Very sticky
    isLiquid: true,          // Starts as a viscous liquid
    isGas: false,
    isPowder: false,
    viscosity: 0.85,         // Very viscous
    hardeningRate: 0.001,    // Slow hardening rate
    
    // Process resin particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const resin = grid[y][x];
        resin.processed = true;
        
        // Initialize hardening progress if not set
        if (resin.hardness === undefined) {
            resin.hardness = 0;
        }
        
        // Handle hardening over time
        this.handleHardening(x, y, grid, resin);
        
        // If not fully hardened, flow like a viscous liquid
        if (resin.hardness < 1) {
            this.flowAsViscousLiquid(x, y, grid, isInBounds);
        }
        
        // Handle temperature effects
        this.handleTemperatureEffects(x, y, grid, isInBounds);
        
        // Check if it should burn
        if (resin.flammable && !resin.isHardened) {
            this.checkForIgnition(x, y, grid, isInBounds);
        }
        
        // Check for interactions with other elements
        this.handleElementInteractions(x, y, grid, isInBounds);
    },
    
    // Handle hardening of resin over time
    handleHardening: function(x, y, grid, resin) {
        // Resin hardens over time
        if (resin.hardness < 1) {
            // Base hardening rate
            let hardeningIncrement = this.hardeningRate;
            
            // Hardening is faster in higher temperatures
            if (resin.temperature > 30) {
                hardeningIncrement *= 1 + (resin.temperature - 30) / 100;
            }
            
            // Very high temperatures might soften it again
            if (resin.temperature > 150) {
                hardeningIncrement = -hardeningIncrement * 0.5;
            }
            
            // Update hardness
            resin.hardness = Math.min(1, Math.max(0, resin.hardness + hardeningIncrement));
            
            // Update properties as it hardens
            this.updatePropertiesBasedOnHardness(resin);
        }
    },
    
    // Update resin properties based on hardness
    updatePropertiesBasedOnHardness: function(resin) {
        // As resin hardens, it becomes less liquid and more solid
        if (resin.hardness >= 0.9) {
            // Fully hardened resin
            resin.isLiquid = false;
            resin.isHardened = true;
            resin.stickiness = 0.1; // Less sticky when hardened
            resin.color = this.getColorBasedOnHardness(resin.hardness);
            resin.flammable = true; // Still flammable, but less
            resin.durability = 0.7; // Becomes more durable
        } else {
            // Partially hardened resin
            resin.isLiquid = true;
            resin.stickiness = 0.9 - (resin.hardness * 0.5); // Gets less sticky as it hardens
            resin.color = this.getColorBasedOnHardness(resin.hardness);
            resin.viscosity = this.viscosity + (resin.hardness * 0.15); // Gets more viscous
        }
    },
    
    // Get color based on hardness
    getColorBasedOnHardness: function(hardness) {
        // Resin starts as amber color and darkens as it hardens
        if (hardness < 0.2) {
            return '#FFC107'; // Amber (liquid)
        } else if (hardness < 0.5) {
            return '#FFB000'; // Darker amber
        } else if (hardness < 0.9) {
            return '#E69500'; // Even darker
        } else {
            return '#CC7722'; // Hardened resin color
        }
    },
    
    // Flow as a viscous liquid
    flowAsViscousLiquid: function(x, y, grid, isInBounds) {
        const resin = grid[y][x];
        
        // Chance to not flow based on viscosity and hardness
        const flowResistance = this.viscosity + (resin.hardness * 0.5);
        if (Math.random() < flowResistance) {
            return;
        }
        
        // Check if we can fall directly down
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = resin;
            grid[y][x] = null;
            return;
        }
        
        // Try to displace lighter elements below
        if (y < grid.length - 1 && grid[y+1][x] && 
            grid[y+1][x].density && grid[y+1][x].density < this.density) {
            // Swap positions with lighter element
            const lighter = grid[y+1][x];
            grid[y+1][x] = resin;
            grid[y][x] = lighter;
            lighter.processed = true;
            return;
        }
        
        // Try to flow horizontally and diagonally
        const directions = [
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 1 },  // down-left
            { dx: 1, dy: 1 },   // down-right
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: 0 }    // right
        ];
        
        // Shuffle directions to avoid bias
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        // Try to flow in each direction
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY)) {
                if (!grid[newY][newX]) {
                    grid[newY][newX] = resin;
                    grid[y][x] = null;
                    return;
                } else if (grid[newY][newX].density && grid[newY][newX].density < this.density) {
                    // Swap positions with lighter element
                    const lighter = grid[newY][newX];
                    grid[newY][newX] = resin;
                    grid[y][x] = lighter;
                    lighter.processed = true;
                    return;
                }
            }
        }
        
        // If resin has been stationary for a while, increase hardening rate
        if (!resin.stationaryFrames) {
            resin.stationaryFrames = 0;
        }
        resin.stationaryFrames++;
        
        if (resin.stationaryFrames > 30) {
            resin.hardness = Math.min(1, resin.hardness + this.hardeningRate * 2);
        }
    },
    
    // Handle temperature effects
    handleTemperatureEffects: function(x, y, grid, isInBounds) {
        const resin = grid[y][x];
        let totalTemp = resin.temperature;
        let count = 1;
        
        // Check surrounding cells for temperature influence
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                totalTemp += grid[newY][newX].temperature;
                count++;
                
                // If neighboring cell is very hot, chance to melt back to liquid
                if (grid[newY][newX].temperature > 200 && resin.hardness > 0 && Math.random() < 0.05) {
                    resin.hardness = Math.max(0, resin.hardness - 0.1);
                    this.updatePropertiesBasedOnHardness(resin);
                }
            }
        }
        
        // Update temperature
        resin.temperature = totalTemp / count;
        
        // Very high temperatures cause resin to melt then burn
        if (resin.temperature > 250) {
            // Start to bubble and smoke
            if (Math.random() < 0.1) {
                // Find an empty cell above to create smoke
                if (y > 0 && !grid[y-1][x]) {
                    grid[y-1][x] = {
                        type: 'smoke',
                        color: '#888888',
                        temperature: resin.temperature,
                        processed: false,
                        density: 0.3,
                        isGas: true
                    };
                }
            }
            
            // Eventually catch fire
            if (Math.random() < 0.05) {
                grid[y][x] = {
                    type: 'fire',
                    color: '#FF9900',
                    temperature: 300,
                    processed: false,
                    flammable: false,
                    burnDuration: 80 + Math.floor(Math.random() * 40) // Resin burns longer
                };
            }
        }
    },
    
    // Check for ignition from nearby fire or high heat
    checkForIgnition: function(x, y, grid, isInBounds) {
        const resin = grid[y][x];
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // up-left
            { dx: 1, dy: -1 },  // up-right
            { dx: -1, dy: 1 },  // down-left
            { dx: 1, dy: 1 }    // down-right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                const neighbor = grid[newY][newX];
                
                // Catch fire from nearby fire, lava, or very hot particles
                if ((neighbor.type === 'fire' || 
                     neighbor.type === 'lava' || 
                     neighbor.temperature > 250) && 
                     Math.random() < 0.1) {
                    
                    // Hardened resin is less likely to catch fire
                    if (resin.hardness > 0.5 && Math.random() < resin.hardness) {
                        continue;
                    }
                    
                    // Convert to fire
                    grid[y][x] = {
                        type: 'fire',
                        color: '#FF9900',
                        temperature: 300,
                        processed: false,
                        flammable: false,
                        burnDuration: 80 + Math.floor(Math.random() * 40) // Resin burns longer
                    };
                    return;
                }
            }
        }
    },
    
    // Handle interactions with other elements
    handleElementInteractions: function(x, y, grid, isInBounds) {
        const resin = grid[y][x];
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                const neighbor = grid[newY][newX];
                
                // Resin can trap insects, small particles
                if ((neighbor.type === 'bacteria' || 
                     neighbor.isPowder) && 
                     Math.random() < resin.stickiness) {
                    
                    // Chance to embed the particle in the resin
                    if (Math.random() < 0.3) {
                        // Mark the embedded particle
                        neighbor.embeddedInResin = true;
                        
                        // Increase hardening around the embedded particle
                        resin.hardness = Math.min(1, resin.hardness + 0.1);
                    }
                }
                
                // Accelerate hardening if touching wood (mimicking tree sap behavior)
                if (neighbor.type === 'wood' && Math.random() < 0.2) {
                    resin.hardness = Math.min(1, resin.hardness + this.hardeningRate * 5);
                }
                
                // Dissolve in acid
                if (neighbor.type === 'acid') {
                    if (Math.random() < 0.2) {
                        grid[y][x] = null;
                        
                        // Acid is slightly consumed
                        neighbor.acidity = Math.max(0, (neighbor.acidity || 1) - 0.2);
                        if (neighbor.acidity <= 0) {
                            grid[newY][newX] = null;
                        }
                    }
                    return;
                }
            }
        }
    },
    
    // Custom rendering for resin
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base resin color based on hardness
        ctx.fillStyle = particle.color || this.getColorBasedOnHardness(particle.hardness || 0);
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add visual details based on hardness
        if (particle.hardness !== undefined) {
            if (particle.hardness < 0.5) {
                // Liquid resin has bubbles and swirls
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                
                // Draw bubbles
                const bubbleCount = 3;
                for (let i = 0; i < bubbleCount; i++) {
                    const bubbleX = x * CELL_SIZE + (CELL_SIZE * 0.2) + (CELL_SIZE * 0.6 * (i / bubbleCount));
                    const bubbleY = y * CELL_SIZE + (CELL_SIZE * 0.3) + (CELL_SIZE * 0.4 * Math.sin(i));
                    const bubbleSize = CELL_SIZE * (0.1 + 0.05 * Math.sin(Date.now() / 1000 + i));
                    
                    ctx.beginPath();
                    ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                // Hardened resin has inclusions and cracks
                // Add shiny reflection
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
                ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.3, y * CELL_SIZE);
                ctx.lineTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE * 0.3);
                ctx.fill();
                
                // Add depth with darker edges
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.beginPath();
                ctx.moveTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
                ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE * 0.7);
                ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.7, y * CELL_SIZE + CELL_SIZE);
                ctx.fill();
                
                // Add embedded particles if any
                if (particle.embeddedItems) {
                    for (const item of particle.embeddedItems) {
                        // Draw tiny representations of embedded items
                        ctx.fillStyle = item.color || '#555555';
                        const itemX = x * CELL_SIZE + CELL_SIZE * (0.3 + Math.random() * 0.4);
                        const itemY = y * CELL_SIZE + CELL_SIZE * (0.3 + Math.random() * 0.4);
                        const itemSize = CELL_SIZE * 0.15;
                        
                        ctx.fillRect(itemX, itemY, itemSize, itemSize);
                    }
                }
            }
        }
        
        // Show temperature effects
        if (particle.temperature > 100) {
            const heatIntensity = Math.min(0.5, (particle.temperature - 100) / 300);
            ctx.fillStyle = `rgba(255, 100, 50, ${heatIntensity})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.hardness = 0;
        particle.stationaryFrames = 0;
        particle.isLiquid = this.isLiquid;
        particle.stickiness = this.stickiness;
        particle.color = this.defaultColor;
        return particle;
    }
}; 