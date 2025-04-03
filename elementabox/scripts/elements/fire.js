// Fire Element
// A gas that rises, produces smoke, and interacts with flammable materials

const FireElement = {
    name: 'fire',
    label: 'Fire',
    description: 'Rises upward, produces heat and smoke, and can ignite flammable materials',
    category: 'gas',
    defaultColor: '#FF4500',
    
    // Physical properties
    density: 0.2,
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
    temperature: 400, // Fire is hot!
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.lifetime = 100 + Math.floor(Math.random() * 100); // Fire has a limited lifetime
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Fire gets hotter the longer it exists (up to a point)
        if (grid[y][x].temperature < 800) {
            grid[y][x].temperature += 0.5;
        }
        
        // Fire lifetime decreases each tick
        grid[y][x].lifetime--;
        
        // Fire burns out eventually
        if (grid[y][x].lifetime <= 0) {
            // Chance to leave ash
            if (Math.random() < 0.1) {
                grid[y][x] = {
                    type: 'ash',
                    color: '#696969',
                    temperature: 80, // Hot ash
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
        
        // Create smoke occasionally
        if (Math.random() < 0.1 && y > 0 && !grid[y-1][x]) {
            grid[y-1][x] = {
                type: 'smoke',
                color: '#A9A9A9',
                temperature: 150,
                processed: true,
                isGas: true,
                isLiquid: false,
                isPowder: false,
                isSolid: false,
                lifetime: 150 + Math.floor(Math.random() * 100)
            };
        }
        
        // Fire movement - rises with random movement
        const directions = [
            { dx: 0, dy: -1, weight: 10 }, // Up (most likely)
            { dx: -1, dy: -1, weight: 3 }, // Up-left
            { dx: 1, dy: -1, weight: 3 },  // Up-right
            { dx: -1, dy: 0, weight: 1 },  // Left
            { dx: 1, dy: 0, weight: 1 }    // Right
        ];
        
        // Calculate total weight
        const totalWeight = directions.reduce((sum, dir) => sum + dir.weight, 0);
        let randomValue = Math.random() * totalWeight;
        
        // Select a direction based on weighted probability
        let selectedDir = directions[0];
        for (const dir of directions) {
            randomValue -= dir.weight;
            if (randomValue <= 0) {
                selectedDir = dir;
                break;
            }
        }
        
        const newX = x + selectedDir.dx;
        const newY = y + selectedDir.dy;
        
        // Only move if the target cell is empty and in bounds
        if (isInBounds(newX, newY) && !grid[newY][newX]) {
            grid[newY][newX] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Check for interactions with other elements
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // up-left
            { dx: 1, dy: -1 },  // up-right
            { dx: -1, dy: 1 },  // down-left
            { dx: 1, dy: 1 }    // down-right
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            const neighbor = grid[ny][nx];
            
            // Heat up nearby elements
            if (neighbor.temperature !== undefined) {
                neighbor.temperature += 5;
            }
            
            // Ignite flammable materials
            if (neighbor.flammable && !neighbor.burning && Math.random() < 0.1) {
                neighbor.burning = true;
                neighbor.burnDuration = neighbor.burnDuration || 100;
            }
            
            // Special interactions
            switch (neighbor.type) {
                case 'water':
                    // Fire is extinguished by water
                    grid[y][x] = null;
                    // 50% chance water turns to steam
                    if (Math.random() < 0.5) {
                        grid[ny][nx] = {
                            type: 'steam',
                            color: '#DCDCDC',
                            temperature: 105,
                            processed: true,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false,
                            lifetime: 150
                        };
                    } else {
                        // Water heats up
                        grid[ny][nx].temperature += 20;
                    }
                    return;
                    
                case 'ice':
                    // Fire melts ice to water
                    grid[ny][nx] = {
                        type: 'water',
                        color: '#4286f4',
                        temperature: 40, // Warm water
                        processed: true,
                        isGas: false,
                        isLiquid: true,
                        isPowder: false,
                        isSolid: false
                    };
                    // Fire is diminished
                    grid[y][x].lifetime -= 10;
                    break;
                    
                case 'oil':
                    // Oil catches fire easily
                    grid[ny][nx] = {
                        type: 'fire',
                        color: '#FF4500',
                        temperature: 400,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifetime: 150
                    };
                    break;
                    
                case 'gunpowder':
                case 'explosive-powder':
                    // Triggers explosion
                    grid[ny][nx] = null;
                    grid[y][x] = null;
                    
                    // Create more fire in a radius (explosion effect)
                    const explosionRadius = neighbor.type === 'gunpowder' ? 3 : 5;
                    for (let ey = -explosionRadius; ey <= explosionRadius; ey++) {
                        for (let ex = -explosionRadius; ex <= explosionRadius; ex++) {
                            const distance = Math.sqrt(ex*ex + ey*ey);
                            if (distance > explosionRadius) continue;
                            
                            const explosionX = nx + ex;
                            const explosionY = ny + ey;
                            
                            if (!isInBounds(explosionX, explosionY)) continue;
                            
                            // Clear existing particles (explosion destroys things)
                            grid[explosionY][explosionX] = null;
                            
                            // Add fire (with probability inversely proportional to distance)
                            if (Math.random() < (1 - distance/explosionRadius)) {
                                grid[explosionY][explosionX] = {
                                    type: 'fire',
                                    color: '#FF4500',
                                    temperature: 500,
                                    processed: true,
                                    isGas: true,
                                    isLiquid: false,
                                    isPowder: false,
                                    isSolid: false,
                                    lifetime: 50 + Math.floor(Math.random() * 50)
                                };
                            }
                        }
                    }
                    return;
            }
        }
    },
    
    // Custom rendering function for fire
    render: function(ctx, x, y, particle, cellSize) {
        // Make fire semi-transparent and with a glow effect
        const fireColor = particle.color || this.defaultColor;
        
        // Base fire
        ctx.fillStyle = fireColor;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add a subtle glow by drawing a second, larger rect
        ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
        ctx.fillRect(
            (x * cellSize) - 1, 
            (y * cellSize) - 1, 
            cellSize + 2, 
            cellSize + 2
        );
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.FireElement = FireElement; 