// Glue element module
window.GlueElement = {
    name: 'glue',
    defaultColor: '#f4f4e0', // Off-white
    density: 1.2,           // Slightly denser than water
    durability: 0.4,
    flammable: true,
    defaultTemperature: 25,
    stickiness: 1.0,         // Very sticky
    isLiquid: true,
    isGas: false,
    isPowder: false,
    
    // Process glue particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const glue = grid[y][x];
        glue.processed = true;
        
        // Glue can dry and harden over time
        if (this.shouldDry(x, y, glue, grid, isInBounds)) {
            this.hardenGlue(x, y, grid);
            return;
        }
        
        // Glue moves like a liquid, but stickier
        this.moveLikeStickyLiquid(x, y, grid, isInBounds);
        
        // Glue sticks to particles it touches
        this.stickToParticles(x, y, grid, isInBounds);
    },
    
    // Check if glue should dry and harden
    shouldDry: function(x, y, glue, grid, isInBounds) {
        // Initialize or increment dry counter
        glue.dryCounter = glue.dryCounter || 0;
        
        // Glue dries faster in higher temperatures
        const dryIncrement = glue.temperature > 50 ? 2 : 1;
        glue.dryCounter += dryIncrement;
        
        // Check surrounding air (empty spaces) to determine drying speed
        let airExposure = 0;
        
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            // Count empty spaces as air exposure
            if (!grid[newY][newX]) {
                airExposure++;
            }
        }
        
        // Adjust drying counter based on air exposure
        glue.dryCounter += airExposure * 0.1;
        
        // Determine if it's dry enough to harden
        return glue.dryCounter >= 50;
    },
    
    // Harden glue into a solid
    hardenGlue: function(x, y, grid) {
        // Create hardened glue
        grid[y][x] = {
            type: 'glue',
            color: '#e9e9d5', // Slightly darker when dry
            temperature: grid[y][x].temperature,
            processed: true,
            isLiquid: false,
            isGas: false,
            isPowder: false,
            density: 1.0,
            stickiness: 0.7, // Still sticky but less than liquid glue
            hardened: true,
            joiningParticles: grid[y][x].joiningParticles || []
        };
    },
    
    // Move like a liquid but with stickiness
    moveLikeStickyLiquid: function(x, y, grid, isInBounds) {
        // Skip if hardened
        if (grid[y][x].hardened) return;
        
        // Don't move if joining particles (actively sticking things together)
        if (grid[y][x].joiningParticles && grid[y][x].joiningParticles.length > 1) {
            return;
        }
        
        // Liquid movement - try to fall down first
        if (y < grid.length - 1 && !grid[y+1][x]) {
            // Fall rate depends on stickiness - glue falls slower
            if (Math.random() < 0.7) { // 70% chance to fall (water would be 90%)
                grid[y+1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Try to spread horizontally, but less likely than water
        if (Math.random() < 0.3) { // 30% chance to spread (water would be 50%)
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
    
    // Stick to particles that the glue touches
    stickToParticles: function(x, y, grid, isInBounds) {
        // Skip if already hardened
        if (grid[y][x].hardened) return;
        
        // Check surrounding cells
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
        
        // Track particles that are being joined by this glue
        grid[y][x].joiningParticles = grid[y][x].joiningParticles || [];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Skip other glue particles
            if (neighbor.type === 'glue') continue;
            
            // Skip gas particles (can't stick to gases)
            if (neighbor.isGas) continue;
            
            // Add to joining particles
            const particleId = `${newX},${newY}`;
            if (!grid[y][x].joiningParticles.includes(particleId)) {
                grid[y][x].joiningParticles.push(particleId);
            }
            
            // Add stickiness to the particle (make it harder to move)
            neighbor.sticky = true;
            
            // If joining more than one particle, start drying faster
            if (grid[y][x].joiningParticles.length > 1) {
                // Accelerate drying
                grid[y][x].dryCounter = (grid[y][x].dryCounter || 0) + 2;
            }
        }
    },
    
    // Custom rendering for glue
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Different appearance based on whether it's hardened
        if (particle.hardened) {
            // Hardened glue
            ctx.fillStyle = particle.color;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Add texture for hardened glue
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(
                x * CELL_SIZE + CELL_SIZE * 0.25, 
                y * CELL_SIZE + CELL_SIZE * 0.25, 
                CELL_SIZE * 0.5, 
                CELL_SIZE * 0.5
            );
        } else {
            // Liquid glue
            ctx.fillStyle = particle.color;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Glossy shine effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE * 0.3,
                y * CELL_SIZE + CELL_SIZE * 0.3,
                CELL_SIZE * 0.2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // Show connections if joining particles
        if (particle.joiningParticles && particle.joiningParticles.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            
            particle.joiningParticles.forEach(id => {
                const [nx, ny] = id.split(',').map(Number);
                const centerX = x * CELL_SIZE + CELL_SIZE / 2;
                const centerY = y * CELL_SIZE + CELL_SIZE / 2;
                const targetX = nx * CELL_SIZE + CELL_SIZE / 2;
                const targetY = ny * CELL_SIZE + CELL_SIZE / 2;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(targetX, targetY);
                ctx.stroke();
            });
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.dryCounter = 0;
        particle.hardened = false;
        particle.joiningParticles = [];
        return particle;
    }
}; 