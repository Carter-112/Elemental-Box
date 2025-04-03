// Gunpowder Element
// A powder that explodes when heated, with a moderate blast radius

const GunpowderElement = {
    name: 'gunpowder',
    label: 'Gunpowder',
    description: 'A powder that explodes when exposed to significant heat',
    category: 'solid-powder',
    defaultColor: '#333333', // Dark gray/black color
    
    // Physical properties
    density: 0.7,
    isGas: false,
    isLiquid: false,
    isPowder: true,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true,
    conductive: false,
    explosive: true,
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.stability = 100; // Full stability
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Check for explosion trigger conditions
        // Gunpowder needs more heat to explode than explosive powder
        const isHot = grid[y][x].temperature > 100; // Less sensitive to heat
        
        // Reduce stability when hot
        if (isHot) {
            grid[y][x].stability -= 3 + (grid[y][x].temperature - 100) / 20;
        }
        
        // If unstable, explode!
        if (grid[y][x].stability <= 0) {
            this.explode(x, y, grid, isInBounds);
            return;
        }
        
        // Gunpowder falls with gravity like other powders
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to slide to bottom-left or bottom-right
            const randomDirection = Math.random() < 0.5;
            
            if (randomDirection && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Check for interactions with surrounding cells
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
            
            // Interactions with fire - quick explosion, but not immediate
            if (grid[ny][nx].type === 'fire') {
                grid[y][x].stability -= 25; // Lose 25% stability when touching fire
                
                // Change color to show it's heating up
                grid[y][x].color = '#663333';
                return;
            }
            
            // Interactions with lava - quicker explosion
            if (grid[ny][nx].type === 'lava') {
                grid[y][x].stability -= 30; // Lose 30% stability when touching lava
                
                // Change color to show it's heating up rapidly
                grid[y][x].color = '#993333';
                return;
            }
            
            // Interactions with other explosives - chain reaction, but slower than explosive powder
            if (grid[ny][nx].type === 'explosive-powder' || grid[ny][nx].type === 'gunpowder' || 
                grid[ny][nx].type === 'c4' || grid[ny][nx].type === 'dynamite') {
                
                // If the neighbor is unstable, this powder becomes more unstable too
                if (grid[ny][nx].stability && grid[ny][nx].stability < 30) {
                    grid[y][x].stability -= 1;
                }
            }
            
            // Transfer heat from hot neighbors
            if (grid[ny][nx].temperature && grid[ny][nx].temperature > grid[y][x].temperature) {
                grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.05;
            }
        }
        
        // Change color based on temperature to show it's heating up
        if (grid[y][x].temperature > 50) {
            const tempRatio = Math.min(1, (grid[y][x].temperature - 50) / 50);
            const r = Math.floor(51 + tempRatio * (153 - 51));
            const g = Math.floor(51 * (1 - tempRatio));
            const b = Math.floor(51 * (1 - tempRatio));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
        }
    },
    
    // Create an explosion
    explode: function(x, y, grid, isInBounds) {
        // Moderate explosion radius (smaller than explosive powder)
        const radius = 4;
        
        // Remove the exploding particle
        grid[y][x] = null;
        
        // Explosion effect - destroy blocks in radius and create fire/smoke
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance > radius) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (!isInBounds(nx, ny)) continue;
                
                // Force decreases with distance
                const force = 1 - (distance / radius);
                
                // Clear existing particles with probability based on force
                if (grid[ny][nx] && Math.random() < force * 0.8) {
                    // Certain materials resist explosion (like steel, stone)
                    if (grid[ny][nx].type === 'steel' || grid[ny][nx].type === 'stone') {
                        // Add damage but don't destroy immediately
                        grid[ny][nx].damage = (grid[ny][nx].damage || 0) + force * 30;
                        if (grid[ny][nx].damage > 100) {
                            grid[ny][nx] = null;
                        }
                    } else {
                        // Other materials are destroyed
                        grid[ny][nx] = null;
                    }
                }
                
                // Create fire and smoke with probability based on force and distance
                if (!grid[ny][nx] && Math.random() < force * 0.5) {
                    const particleType = Math.random() < 0.6 ? 'fire' : 'smoke';
                    
                    grid[ny][nx] = {
                        type: particleType,
                        color: particleType === 'fire' ? '#FF4500' : '#A9A9A9',
                        temperature: particleType === 'fire' ? 400 : 150,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false,
                        lifetime: particleType === 'fire' ? 
                            15 + Math.floor(Math.random() * 25) : 
                            40 + Math.floor(Math.random() * 80)
                    };
                }
            }
        }
    },
    
    // Render the gunpowder
    render: function(ctx, x, y, particle, cellSize) {
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add speckles to gunpowder for visual interest
        if (Math.random() < 0.2) {
            const speckleSize = Math.max(1, Math.floor(cellSize / 8));
            ctx.fillStyle = '#555555';
            const speckleX = x * cellSize + Math.floor(Math.random() * (cellSize - speckleSize));
            const speckleY = y * cellSize + Math.floor(Math.random() * (cellSize - speckleSize));
            ctx.fillRect(speckleX, speckleY, speckleSize, speckleSize);
        }
    }
};

// Make the element available globally
window.GunpowderElement = GunpowderElement; 