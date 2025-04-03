// Gunpowder element module
window.GunpowderElement = {
    name: 'gunpowder',
    defaultColor: '#444444', // Dark gray
    density: 1.8,            // Medium density
    durability: 0.1,         // Fragile
    flammable: true,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: true,
    explosionRadius: 3,      // Moderate explosion
    
    // Process gunpowder particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const gunpowder = grid[y][x];
        gunpowder.processed = true;
        
        // Check for ignition
        if (this.shouldIgnite(x, y, gunpowder, grid, isInBounds)) {
            this.explode(x, y, grid, isInBounds);
            return;
        }
        
        // Gunpowder behaves like powder
        this.moveLikePowder(x, y, grid, isInBounds);
    },
    
    // Check if gunpowder should ignite
    shouldIgnite: function(x, y, gunpowder, grid, isInBounds) {
        // High temperature can ignite gunpowder
        if (gunpowder.temperature >= 200) {
            return true;
        }
        
        // Check for ignition sources nearby
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
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Fire ignites gunpowder
            if (neighbor.type === 'fire') {
                return Math.random() < 0.7; // 70% chance
            }
            
            // Lava ignites gunpowder
            if (neighbor.type === 'lava') {
                return Math.random() < 0.5; // 50% chance
            }
            
            // Explosions ignite gunpowder
            if (neighbor.isExplosion) {
                return true;
            }
            
            // Burning particles can ignite gunpowder
            if (neighbor.burning && neighbor.burnDuration > 0) {
                return Math.random() < 0.3; // 30% chance
            }
            
            // Other exploding gunpowder ignites this one (chain reaction)
            if (neighbor.type === 'gunpowder' && neighbor.ignited) {
                return true;
            }
        }
        
        return false;
    },
    
    // Move like a powder
    moveLikePowder: function(x, y, grid, isInBounds) {
        if (y >= grid.length - 1) return; // At bottom of grid
        
        // Check if we can move straight down
        if (!grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Try to slide down diagonally
        const diagX = Math.random() < 0.5 ? [x-1, x+1] : [x+1, x-1];
        
        for (const newX of diagX) {
            if (isInBounds(newX, y+1) && !grid[y+1][newX]) {
                grid[y+1][newX] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Explode gunpowder
    explode: function(x, y, grid, isInBounds) {
        // Mark as ignited first for chain reactions
        grid[y][x].ignited = true;
        
        // Explosion radius based on amount of gunpowder
        let radius = this.explosionRadius;
        
        // Add brief delay for chain reactions to look better
        setTimeout(() => {
            // Remove the particle
            grid[y][x] = null;
            
            // Create explosion particles and destroy nearby particles
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    // Only affect points within the circular radius
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance > radius) continue;
                    
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    if (!isInBounds(newX, newY)) continue;
                    
                    // Create explosion effect (fire particles)
                    if (distance < radius * 0.7 && Math.random() < 0.7) {
                        grid[newY][newX] = {
                            type: 'fire',
                            color: '#ff9900',
                            temperature: 500,
                            processed: true,
                            burnDuration: 5 + Math.random() * 10,
                            isExplosion: true
                        };
                    } 
                    // Destroy nearby particles with probability based on distance
                    else if (grid[newY][newX] && Math.random() < (1 - distance/radius)) {
                        // Different materials resist explosions differently
                        if (grid[newY][newX].type === 'stone' || 
                            grid[newY][newX].type === 'metal' || 
                            grid[newY][newX].type === 'steel' || 
                            grid[newY][newX].type === 'brick') {
                            if (Math.random() < 0.3) {
                                grid[newY][newX] = null;
                            }
                        } else {
                            grid[newY][newX] = null;
                        }
                    }
                }
            }
            
            // Create some smoke after explosion
            for (let i = 0; i < 5; i++) {
                const smokeX = x + Math.floor(Math.random() * radius * 2 - radius);
                const smokeY = y + Math.floor(Math.random() * radius * 2 - radius);
                
                if (isInBounds(smokeX, smokeY) && !grid[smokeY][smokeX]) {
                    grid[smokeY][smokeX] = {
                        type: 'smoke',
                        color: '#777777',
                        temperature: 100,
                        processed: false,
                        isGas: true,
                        density: 0.1,
                        lifetime: 100 + Math.floor(Math.random() * 100),
                        age: 0
                    };
                }
            }
        }, 50); // Small delay
    },
    
    // Custom rendering for gunpowder
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add granular texture
        const granuleCount = 3;
        const granuleSize = CELL_SIZE / 6;
        
        ctx.fillStyle = '#222222'; // Darker spots
        
        for (let i = 0; i < granuleCount; i++) {
            const granuleX = x * CELL_SIZE + Math.random() * (CELL_SIZE - granuleSize);
            const granuleY = y * CELL_SIZE + Math.random() * (CELL_SIZE - granuleSize);
            
            ctx.fillRect(granuleX, granuleY, granuleSize, granuleSize);
        }
        
        // If ignited, show ignition effect
        if (particle.ignited) {
            ctx.fillStyle = 'rgba(255, 153, 0, 0.7)';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Add spark effect
            ctx.fillStyle = '#FFFF00';
            const sparkSize = CELL_SIZE / 4;
            const sparkX = x * CELL_SIZE + CELL_SIZE / 2;
            const sparkY = y * CELL_SIZE + CELL_SIZE / 2;
            
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.ignited = false;
        return particle;
    }
}; 