// Lava Element
// A very hot liquid that melts through materials and emits heat

const LavaElement = {
    name: 'lava',
    label: 'Lava',
    description: 'Extremely hot molten rock that melts through materials except steel',
    category: 'liquid',
    defaultColor: '#FF4500',
    
    // Physical properties
    density: 3.5, // Increased density to fall faster
    isGas: false,
    isLiquid: true,
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
    corrosive: true,
    temperature: 1200, // Very high temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.viscosity = 0.5; // Reduced viscosity for faster flow
        particle.glowIntensity = 1.0; // Full glow when fresh
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].temperature === undefined) {
            grid[y][x].temperature = this.temperature;
        }
        
        if (grid[y][x].viscosity === undefined) {
            grid[y][x].viscosity = 0.5; // Reduced viscosity
        }
        
        if (grid[y][x].glowIntensity === undefined) {
            grid[y][x].glowIntensity = 1.0;
        }
        
        // Lava slowly cools down over time
        if (grid[y][x].temperature > 700) {
            grid[y][x].temperature -= 0.05; // Slower cooling rate
            
            // Update color and viscosity based on temperature
            const tempFactor = Math.min(1, (grid[y][x].temperature - 700) / 500);
            const r = Math.floor(255 * tempFactor);
            const g = Math.floor(69 * tempFactor);
            const b = 0;
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            grid[y][x].glowIntensity = tempFactor;
            
            // Lava becomes more viscous as it cools
            grid[y][x].viscosity = 0.5 + ((1 - tempFactor) * 0.1);
        }
        
        // If lava gets extremely cold, turn to stone
        if (grid[y][x].temperature < 700) {
            // Convert to stone
            grid[y][x] = {
                type: 'stone',
                color: '#808080',
                temperature: 500, // Still hot but cooling
                processed: true,
                isGas: false,
                isLiquid: false,
                isPowder: false,
                isSolid: true,
                isStatic: true
            };
            return;
        }
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        let totalHeat = 0;
        let cellCount = 0;
        
        // Create wind effect
        if (Math.random() < 0.02) {
            // Find an empty cell to add wind to
            const windDir = { dx: 0, dy: -1 }; // Wind goes up
            const nx = x + windDir.dx;
            const ny = y + windDir.dy;
            
            if (isInBounds(nx, ny) && !grid[ny][nx]) {
                grid[ny][nx] = {
                    type: 'wind',
                    color: 'rgba(255, 255, 255, 0.1)',
                    temperature: grid[y][x].temperature * 0.5,
                    processed: true,
                    isGas: true,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: false
                };
            }
        }
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny)) continue;
            
            if (grid[ny][nx] && grid[ny][nx].temperature !== undefined) {
                // Heat transfer to neighboring cells
                const heatDifference = grid[y][x].temperature - grid[ny][nx].temperature;
                if (heatDifference > 0) {
                    // Lava heats up neighboring cells faster
                    grid[ny][nx].temperature += heatDifference * 0.02;
                    totalHeat += grid[ny][nx].temperature;
                    cellCount++;
                    
                    // Have chance to set flammable neighbors on fire
                    if (grid[ny][nx].flammable && Math.random() < 0.2) {
                        grid[ny][nx] = {
                            type: 'fire',
                            color: '#FF9900',
                            temperature: grid[y][x].temperature * 0.5,
                            processed: true,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false
                        };
                    }
                }
                
                // Interactions with specific elements
                switch (grid[ny][nx].type) {
                    case 'water':
                        // Water + Lava = Steam
                        grid[ny][nx] = {
                            type: 'steam',
                            color: '#DDDDDD',
                            temperature: 200,
                            processed: true,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false
                        };
                        
                        // Cool down the lava slightly
                        grid[y][x].temperature -= 50;
                        break;
                        
                    case 'steel':
                        // Steel is resistant to lava - don't melt it
                        // Just heat it up (already handled via heat transfer)
                        break;
                        
                    case 'ice':
                        // Convert ice directly to steam
                        grid[ny][nx] = {
                            type: 'steam',
                            color: '#DDDDDD',
                            temperature: 150,
                            processed: true,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false
                        };
                        break;
                        
                    case 'stone':
                        // Stone doesn't melt immediately - needs very high heat
                        if (grid[y][x].temperature > 1000 && Math.random() < 0.05) {
                            // Transform stone to lava rather than melting through
                            grid[ny][nx] = {
                                type: 'lava',
                                color: grid[y][x].color,
                                temperature: grid[y][x].temperature * 0.9,
                                viscosity: grid[y][x].viscosity,
                                glowIntensity: 0.8,
                                processed: true,
                                isGas: false,
                                isLiquid: true,
                                isPowder: false,
                                isSolid: false
                            };
                        }
                        break;
                        
                    default:
                        // Melt through ALL other materials except steel
                        if (Math.random() < 0.3 && grid[ny][nx].type !== 'steel') { // Increased melting chance
                            // Create appropriate effects based on material type
                            const isFlammable = grid[ny][nx].flammable || 
                                ['wood', 'plant', 'oil', 'fuse'].includes(grid[ny][nx].type);
                            
                            // Flammable materials catch fire before disappearing
                            if (isFlammable) {
                                grid[ny][nx] = {
                                    type: 'fire',
                                    color: '#FF9900',
                                    temperature: 200,
                                    processed: true,
                                    isGas: true,
                                    isLiquid: false,
                                    isPowder: false,
                                    isSolid: false
                                };
                            } else {
                                // Create a small amount of smoke as the material melts
                                if (Math.random() < 0.5 && isInBounds(nx, ny-1) && !grid[ny-1][nx]) {
                                    grid[ny-1][nx] = {
                                        type: 'smoke',
                                        color: '#999999',
                                        temperature: 150,
                                        processed: true,
                                        isGas: true,
                                        isLiquid: false,
                                        isPowder: false,
                                        isSolid: false
                                    };
                                }
                                
                                // Remove the material (melt through it)
                                grid[ny][nx] = null;
                            }
                            
                            // Lava doesn't lose itself when melting (different from acid)
                            // It only loses temperature
                            
                            // Metals and dense materials cool lava more when they melt
                            const isMetal = ['metal', 'copper'].includes(grid[ny][nx]?.type);
                            const isDense = ['brick', 'glass'].includes(grid[ny][nx]?.type);
                            
                            if (isMetal) {
                                grid[y][x].temperature -= 20; // Reduced cooling
                            } else if (isDense) {
                                grid[y][x].temperature -= 10; // Reduced cooling
                            } else {
                                grid[y][x].temperature -= 5; // Reduced cooling
                            }
                        }
                        break;
                }
            } else {
                // Create heat shimmer effects in empty spaces
                if (Math.random() < 0.05) { // Increased spawn rate for effects
                    const heatLevel = grid[y][x].temperature / 1200;
                    
                    // Higher chance to create fire/smoke above lava
                    if (dir.dy < 0 && Math.random() < 0.2 * heatLevel) { // Increased chance
                        grid[ny][nx] = {
                            type: Math.random() < 0.5 ? 'smoke' : 'fire', // More fire than before
                            color: Math.random() < 0.5 ? '#999999' : '#FF9900',
                            temperature: grid[y][x].temperature * 0.2,
                            processed: true,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false
                        };
                    }
                    
                    // Chance to spawn more lava in neighboring empty cells
                    if (dir.dy === 0 && Math.random() < 0.03) { // Small chance for horizontal spread
                        grid[ny][nx] = {
                            type: 'lava',
                            color: grid[y][x].color,
                            temperature: grid[y][x].temperature * 0.95,
                            viscosity: grid[y][x].viscosity,
                            glowIntensity: grid[y][x].glowIntensity,
                            processed: true,
                            isGas: false,
                            isLiquid: true,
                            isPowder: false,
                            isSolid: false
                        };
                    }
                }
            }
        }
        
        // Lava movement - affected by viscosity
        if (y < grid.length - 1) {
            // Increased chance to move down
            if (Math.random() > grid[y][x].viscosity * 0.6) { // Lower factor for faster falling
                // Try to move directly down
                if (!grid[y + 1][x]) {
                    grid[y + 1][x] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
        }
        
        // Horizontal spread is faster than before
        if (Math.random() > grid[y][x].viscosity * 0.8) { // Lower factor for more spread
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
        // Calculate base color based on temperature
        const glowIntensity = particle.glowIntensity || 1.0;
        
        // Draw base lava color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add glow effect
        if (glowIntensity > 0.1) {
            const glowSize = cellSize * 2.0 * glowIntensity; // Increased glow radius
            const gradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2, 
                y * cellSize + cellSize / 2, 
                0,
                x * cellSize + cellSize / 2, 
                y * cellSize + cellSize / 2, 
                glowSize
            );
            
            gradient.addColorStop(0, `rgba(255, 200, 0, ${0.5 * glowIntensity})`); // Increased glow intensity
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                x * cellSize - glowSize / 2, 
                y * cellSize - glowSize / 2, 
                cellSize + glowSize, 
                cellSize + glowSize
            );
        }
        
        // Add lighter patches to make it look molten
        ctx.fillStyle = `rgba(255, 255, 0, ${0.4 * glowIntensity})`; // Increased brightness
        
        // Add a few random bright spots
        const spotCount = 3 + Math.floor(Math.random() * 3); // More bright spots
        for (let i = 0; i < spotCount; i++) {
            const spotX = x * cellSize + Math.random() * cellSize;
            const spotY = y * cellSize + Math.random() * cellSize;
            const spotSize = Math.max(1, Math.random() * cellSize / 3); // Larger bright spots
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Make the element available globally
window.LavaElement = LavaElement; 