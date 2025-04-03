// Lava Element
// A very hot liquid that melts through materials and emits heat

const LavaElement = {
    name: 'lava',
    label: 'Lava',
    description: 'Extremely hot molten rock that melts through materials',
    category: 'liquid',
    defaultColor: '#FF4500',
    
    // Physical properties
    density: 3.0,
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
        particle.viscosity = 0.85; // Very viscous
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
            grid[y][x].viscosity = 0.85;
        }
        
        if (grid[y][x].glowIntensity === undefined) {
            grid[y][x].glowIntensity = 1.0;
        }
        
        // Lava slowly cools down over time
        if (grid[y][x].temperature > 700) {
            grid[y][x].temperature -= 0.1;
            
            // Update color and viscosity based on temperature
            const tempFactor = Math.min(1, (grid[y][x].temperature - 700) / 500);
            const r = Math.floor(255 * tempFactor);
            const g = Math.floor(69 * tempFactor);
            const b = 0;
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            grid[y][x].glowIntensity = tempFactor;
            
            // Lava becomes more viscous as it cools
            grid[y][x].viscosity = 0.85 + ((1 - tempFactor) * 0.1);
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
        
        // Heat transfer to neighboring cells
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
        
        // Process all neighbors
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny)) continue;
            
            // Heat up nearby cells
            if (grid[ny][nx]) {
                if (grid[ny][nx].temperature !== undefined) {
                    const heatTransfer = (grid[y][x].temperature - grid[ny][nx].temperature) * 0.1;
                    if (heatTransfer > 0) {
                        grid[ny][nx].temperature += heatTransfer;
                    }
                }
                
                // Interactions with specific elements
                switch (grid[ny][nx].type) {
                    case 'water':
                        // Water + Lava = Stone + Steam
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
                        
                    case 'stone':
                    case 'sand':
                    case 'glass':
                    case 'brick':
                        // Melt these materials if hot enough
                        if (grid[y][x].temperature > 1000 && Math.random() < 0.2) {
                            grid[ny][nx] = {
                                type: 'lava',
                                color: grid[y][x].color,
                                temperature: grid[y][x].temperature - 50,
                                processed: true,
                                isGas: false,
                                isLiquid: true,
                                isPowder: false,
                                isSolid: false,
                                viscosity: grid[y][x].viscosity,
                                glowIntensity: grid[y][x].glowIntensity * 0.9
                            };
                        }
                        break;
                        
                    case 'wood':
                    case 'plant':
                        // Set flammable materials on fire
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
                }
            } else {
                // Create heat shimmer effects in empty spaces
                if (Math.random() < 0.02) {
                    const heatLevel = grid[y][x].temperature / 1200;
                    
                    // Small chance to create fire/smoke above lava
                    if (dir.dy < 0 && Math.random() < 0.1 * heatLevel) {
                        grid[ny][nx] = {
                            type: Math.random() < 0.7 ? 'smoke' : 'fire',
                            color: Math.random() < 0.7 ? '#999999' : '#FF9900',
                            temperature: grid[y][x].temperature * 0.2,
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
        
        // Lava movement - affected by viscosity
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
        
        // Horizontal spread is even slower
        if (Math.random() > grid[y][x].viscosity * 1.2) {
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
            const glowSize = cellSize * 1.5 * glowIntensity;
            const gradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2, 
                y * cellSize + cellSize / 2, 
                0,
                x * cellSize + cellSize / 2, 
                y * cellSize + cellSize / 2, 
                glowSize
            );
            
            gradient.addColorStop(0, `rgba(255, 200, 0, ${0.4 * glowIntensity})`);
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
        ctx.fillStyle = `rgba(255, 255, 0, ${0.3 * glowIntensity})`;
        
        // Add a few random bright spots
        const spotCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < spotCount; i++) {
            const spotX = x * cellSize + Math.random() * cellSize;
            const spotY = y * cellSize + Math.random() * cellSize;
            const spotSize = Math.max(1, Math.random() * cellSize / 4);
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Make the element available globally
window.LavaElement = LavaElement; 