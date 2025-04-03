// Oil element module
window.OilElement = {
    name: 'oil',
    defaultColor: '#8B4513',
    density: 0.85,  // Less dense than water, so will float on top
    durability: 0.2,
    flammable: true,
    defaultTemperature: 25,
    stickiness: 0.3,
    isLiquid: true,
    isGas: false,
    isPowder: false,
    
    // Process oil particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const oil = grid[y][x];
        oil.processed = true;
        
        // If oil is burning, process burning behavior
        if (oil.burning) {
            // Decrease burn duration
            oil.burnDuration--;
            
            // When fully burned, oil disappears
            if (oil.burnDuration <= 0) {
                grid[y][x] = null;
                
                // Create smoke when oil burns out
                if (y > 0 && !grid[y-1][x]) {
                    grid[y-1][x] = this.createSmokeParticle();
                }
                return;
            }
            
            // Oil spreads fire to nearby flammable materials and creates smoke
            if (Math.random() < 0.4 && y > 0 && !grid[y-1][x]) {
                grid[y-1][x] = this.createFireParticle();
            }
            
            // Chance to create smoke while burning
            if (Math.random() < 0.1 && y > 1 && !grid[y-2][x]) {
                grid[y-2][x] = this.createSmokeParticle();
            }
            
            // Spread fire to adjacent flammable materials
            this.spreadFire(x, y, grid, isInBounds);
            return;
        }
        
        // Check if we're on fire or adjacent to fire
        if (oil.temperature > 150 || this.isAdjacentToFire(x, y, grid, isInBounds)) {
            oil.burning = true;
            oil.burnDuration = 120; // Oil burns longer than other materials
            return;
        }
        
        // Check if we can fall
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = oil;
            grid[y][x] = null;
            return;
        }
        
        // Oil spreads horizontally more readily than water
        const directions = [
            { dx: -1, dy: 1 }, // down-left
            { dx: 1, dy: 1 },  // down-right
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];
        
        // Shuffle the directions for more natural movement
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        // Try to move in one of the directions
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                grid[newY][newX] = oil;
                grid[y][x] = null;
                return;
            }
        }
        
        // Oil floats on water and other denser liquids
        if (y < grid.length - 1) {
            const particleBelow = grid[y+1][x];
            if (particleBelow && 
                ((particleBelow.type === 'water' && particleBelow.density > this.density) || 
                 this.shouldFloat(particleBelow))) {
                
                // Swap positions
                grid[y][x] = particleBelow;
                grid[y+1][x] = oil;
                particleBelow.processed = true;
                return;
            }
        }
        
        // Oil can also be displaced by denser materials from above
        if (y > 0) {
            const particleAbove = grid[y-1][x];
            if (particleAbove && this.shouldSink(particleAbove)) {
                // Swap positions
                grid[y][x] = particleAbove;
                grid[y-1][x] = oil;
                particleAbove.processed = true;
                return;
            }
        }
    },
    
    // Helper function to determine if oil should float on a particle
    shouldFloat: function(particle) {
        return particle.density !== undefined && particle.density > this.density && particle.isLiquid;
    },
    
    // Helper function to determine if a particle should sink through oil
    shouldSink: function(particle) {
        return particle.density !== undefined && particle.density > this.density && !particle.isGas;
    },
    
    // Check if adjacent to fire
    isAdjacentToFire: function(x, y, grid, isInBounds) {
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
                if (neighbor.type === 'fire' || 
                    (neighbor.burning && neighbor.burnDuration > 0)) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // Spread fire to adjacent flammable materials
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
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                const neighbor = grid[newY][newX];
                if (neighbor.flammable && !neighbor.burning && Math.random() < 0.5) {
                    neighbor.burning = true;
                    neighbor.burnDuration = neighbor.type === 'oil' ? 120 : 60;
                }
            }
        }
    },
    
    // Create fire particle
    createFireParticle: function() {
        return {
            type: 'fire',
            color: '#FF4500',
            temperature: 150,
            processed: false,
            burnDuration: 30,
            flammable: false
        };
    },
    
    // Create smoke particle
    createSmokeParticle: function() {
        return {
            type: 'smoke',
            color: '#555555',
            temperature: 100,
            processed: false,
            burnDuration: 80,
            flammable: false,
            density: 0.3,
            isGas: true
        };
    },
    
    // Custom rendering for oil
    render: function(ctx, x, y, particle, CELL_SIZE) {
        if (particle.burning) {
            // Burning oil has a more orange-red color
            const burnIntensity = Math.min(1, particle.burnDuration / 120);
            const r = 255;
            const g = Math.floor(165 * burnIntensity);
            const b = 0;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        } else {
            // Normal oil is dark brown with a slight shine
            ctx.fillStyle = particle.color;
        }
        
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add shine effect to oil
        if (!particle.burning) {
            // Glossy highlight for oil
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE * 0.7, 
                y * CELL_SIZE + CELL_SIZE * 0.3, 
                CELL_SIZE * 0.2, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        } else {
            // Fire effect on burning oil
            const flameHeight = CELL_SIZE * 0.5;
            const flameWidth = CELL_SIZE * 0.6;
            
            // Create gradient for flame
            const gradient = ctx.createLinearGradient(
                x * CELL_SIZE + CELL_SIZE/2, 
                y * CELL_SIZE, 
                x * CELL_SIZE + CELL_SIZE/2, 
                y * CELL_SIZE - flameHeight
            );
            gradient.addColorStop(0, 'rgba(255, 140, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE + (CELL_SIZE - flameWidth)/2, y * CELL_SIZE);
            ctx.quadraticCurveTo(
                x * CELL_SIZE + CELL_SIZE/2, 
                y * CELL_SIZE - flameHeight * 1.5, 
                x * CELL_SIZE + (CELL_SIZE + flameWidth)/2, 
                y * CELL_SIZE
            );
            ctx.fill();
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.flammable = true;
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 