// Metal element module
window.MetalElement = {
    name: 'metal',
    defaultColor: '#A9A9A9',
    density: 7.8,  // High density to make it sink in water and most liquids
    durability: 0.9, // Very durable
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.1,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    conductivity: 0.8, // High thermal conductivity
    
    // Process metal particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const metal = grid[y][x];
        metal.processed = true;
        
        // Check if we can fall
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = metal;
            grid[y][x] = null;
            return;
        }
        
        // Check if we can slide down to the left or right
        const directions = [
            { dx: -1, dy: 1 }, // down-left
            { dx: 1, dy: 1 }   // down-right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                grid[newY][newX] = metal;
                grid[y][x] = null;
                return;
            }
        }
        
        // Metal can displace some lighter materials
        if (y < grid.length - 1) {
            const particleBelow = grid[y+1][x];
            if (particleBelow && 
                (particleBelow.type === 'water' || 
                 particleBelow.type === 'oil' || 
                 particleBelow.type === 'smoke' ||
                 this.shouldDisplace(particleBelow))) {
                
                // Swap positions
                grid[y][x] = particleBelow;
                grid[y+1][x] = metal;
                particleBelow.processed = true;
                return;
            }
        }
        
        // Metal conducts heat well, so we average temperature with neighbors
        this.conductHeat(x, y, grid, isInBounds);
        
        // Metal can melt at high temperatures (1000+ degrees)
        if (metal.temperature >= 1000) {
            // 5% chance to melt per frame when at melting temperature
            if (Math.random() < 0.05) {
                grid[y][x] = this.createMoltenMetalParticle();
            }
        }
    },
    
    // Helper function to determine if metal should displace a particle
    shouldDisplace: function(particle) {
        // Metal displaces particles with lower density
        return particle.density !== undefined && particle.density < this.density;
    },
    
    // Heat conductivity for metal
    conductHeat: function(x, y, grid, isInBounds) {
        const metal = grid[y][x];
        let totalTemp = metal.temperature;
        let count = 1;
        
        // Check all 8 directions
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
        
        // Collect temperatures from neighbors
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                totalTemp += grid[newY][newX].temperature;
                count++;
            }
        }
        
        // Calculate new temperature with conductivity factor
        const avgTemp = totalTemp / count;
        metal.temperature = metal.temperature * (1 - this.conductivity) + avgTemp * this.conductivity;
    },
    
    // Create a molten metal particle when metal melts
    createMoltenMetalParticle: function() {
        return {
            type: 'lava', // Using lava to represent molten metal
            color: '#FF4500',
            temperature: 1200,
            processed: false,
            flammable: false,
            density: 6.9, // Slightly less dense than solid metal
            isLiquid: true,
            isMoltenMetal: true // Special flag to track molten metal
        };
    },
    
    // Custom render function for metal
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base metal color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add metallic sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.3, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE * 0.3);
        ctx.fill();
        
        // Temperature-based color change
        if (particle.temperature > 400) {
            const redFactor = Math.min(1.0, (particle.temperature - 400) / 600);
            ctx.fillStyle = `rgba(255, ${Math.floor(69 * (1 - redFactor))}, 0, ${Math.min(0.7, redFactor)})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 