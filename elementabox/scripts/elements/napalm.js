// Napalm element module
window.NapalmElement = {
    name: 'napalm',
    defaultColor: '#ff6600', // Orange
    density: 0.9,            // Lighter than water
    durability: 0.2,
    flammable: true,
    burnTemperature: 1200,   // Burns very hot
    defaultTemperature: 25,
    stickiness: 0.6,         // Sticky
    isLiquid: true,
    isGas: false,
    isPowder: false,
    burnDuration: 600,       // Burns for a long time
    
    // Process napalm particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const napalm = grid[y][x];
        napalm.processed = true;
        
        // Handle burning
        if (napalm.burning) {
            this.processBurning(x, y, grid, isInBounds);
            return;
        }
        
        // Check for ignition
        if (this.shouldIgnite(x, y, napalm, grid, isInBounds)) {
            napalm.burning = true;
            napalm.temperature = this.burnTemperature;
            napalm.burnDuration = this.burnDuration;
            return;
        }
        
        // Napalm moves like a sticky liquid
        this.moveLikeStickyLiquid(x, y, grid, isInBounds);
    },
    
    // Process burning napalm
    processBurning: function(x, y, grid, isInBounds) {
        const napalm = grid[y][x];
        
        // Decrease burn duration
        napalm.burnDuration--;
        
        // If burn duration is over, remove the particle
        if (napalm.burnDuration <= 0) {
            grid[y][x] = null;
            return;
        }
        
        // Generate intense heat
        napalm.temperature = this.burnTemperature;
        
        // Create fire particles above
        if (y > 0 && !grid[y-1][x] && Math.random() < 0.4) {
            grid[y-1][x] = {
                type: 'fire',
                color: '#ffdd00', // Bright yellow fire
                temperature: this.burnTemperature,
                processed: true,
                burnDuration: 20 + Math.floor(Math.random() * 30),
                fromNapalm: true
            };
        }
        
        // Napalm ignites neighboring flammable materials
        this.spreadFire(x, y, grid, isInBounds);
        
        // Chance to drip while burning
        if (Math.random() < 0.1) {
            this.tryToDrip(x, y, grid, isInBounds);
        }
    },
    
    // Check if napalm should ignite
    shouldIgnite: function(x, y, napalm, grid, isInBounds) {
        // Ignite at high temperature
        if (napalm.temperature >= 150) {
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
            
            // Fire ignites napalm
            if (neighbor.type === 'fire') {
                return true;
            }
            
            // Lava ignites napalm
            if (neighbor.type === 'lava') {
                return true;
            }
            
            // Burning particles can ignite napalm
            if (neighbor.burning && neighbor.burnDuration > 0) {
                return Math.random() < 0.8; // 80% chance
            }
        }
        
        return false;
    },
    
    // Spread fire to nearby flammable objects
    spreadFire: function(x, y, grid, isInBounds) {
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
            
            // Heat up neighboring particles
            if (neighbor.temperature !== undefined) {
                neighbor.temperature += 15; // Intensive heating
            }
            
            // Ignite flammable neighbors with high probability
            if (neighbor.flammable && !neighbor.burning) {
                if (Math.random() < 0.6) { // 60% chance - napalm is very effective at spreading fire
                    neighbor.burning = true;
                    neighbor.burnDuration = neighbor.burnDuration || 100;
                    neighbor.temperature = Math.max(neighbor.temperature || 25, 300);
                }
            }
            
            // Turn water to steam
            if (neighbor.type === 'water' && Math.random() < 0.2) {
                grid[newY][newX] = {
                    type: 'steam',
                    color: '#ccccff',
                    temperature: 110,
                    processed: false,
                    isGas: true,
                    density: 0.1
                };
            }
        }
    },
    
    // Try to drip burning napalm
    tryToDrip: function(x, y, grid, isInBounds) {
        // Can only drip down
        if (y >= grid.length - 1) return;
        
        // Check below
        if (!grid[y+1][x]) {
            // Create a new burning napalm particle below
            grid[y+1][x] = {
                type: 'napalm',
                color: '#ff6600',
                temperature: this.burnTemperature,
                processed: true,
                isLiquid: true,
                density: this.density,
                burning: true,
                burnDuration: Math.floor(grid[y][x].burnDuration / 2) // Drips get half the burn duration
            };
        } else {
            // Try diagonally down
            const diagX = Math.random() < 0.5 ? x-1 : x+1;
            
            if (isInBounds(diagX, y+1) && !grid[y+1][diagX]) {
                grid[y+1][diagX] = {
                    type: 'napalm',
                    color: '#ff6600',
                    temperature: this.burnTemperature,
                    processed: true,
                    isLiquid: true,
                    density: this.density,
                    burning: true,
                    burnDuration: Math.floor(grid[y][x].burnDuration / 2)
                };
            }
        }
    },
    
    // Move like a sticky liquid
    moveLikeStickyLiquid: function(x, y, grid, isInBounds) {
        // Skip if burning
        if (grid[y][x].burning) return;
        
        // Liquid movement - try to fall down first
        if (y < grid.length - 1 && !grid[y+1][x]) {
            // Fall rate depends on stickiness
            if (Math.random() < 0.75) { // 75% chance to fall (water would be 90%)
                grid[y+1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Try to spread horizontally
        if (Math.random() < 0.4) { // 40% chance to spread (water would be 50%)
            const direction = Math.random() < 0.5 ? -1 : 1;
            const newX = x + direction;
            
            if (isInBounds(newX, y) && !grid[y][newX]) {
                // Check if there's support below or if we're at bottom
                if (y >= grid.length - 1 || grid[y+1][newX]) {
                    grid[y][newX] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Custom rendering for napalm
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.burning ? '#ff9900' : particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        if (particle.burning) {
            // Add flickering fire effect
            const flickerIntensity = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
            
            // Inner fire glow
            ctx.fillStyle = `rgba(255, 255, ${Math.floor(Math.random() * 100)}, ${flickerIntensity})`;
            
            // Draw flame shape
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
            
            // Random flame peaks
            for (let i = 0; i <= CELL_SIZE; i += CELL_SIZE / 4) {
                const flameHeight = Math.random() * CELL_SIZE * 0.5;
                ctx.lineTo(x * CELL_SIZE + i, y * CELL_SIZE - flameHeight);
            }
            
            ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE);
            ctx.closePath();
            ctx.fill();
            
            // Add bright center
            ctx.fillStyle = '#ffff00';
            const centerSize = CELL_SIZE * 0.3 * flickerIntensity;
            ctx.fillRect(
                x * CELL_SIZE + (CELL_SIZE - centerSize) / 2,
                y * CELL_SIZE + (CELL_SIZE - centerSize) / 2,
                centerSize,
                centerSize
            );
        } else {
            // Glossy effect for unburning napalm
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE * 0.3,
                y * CELL_SIZE + CELL_SIZE * 0.3,
                CELL_SIZE * 0.15,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.burning = false;
        return particle;
    }
}; 