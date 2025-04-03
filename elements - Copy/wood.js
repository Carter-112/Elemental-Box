// Wood element module
window.WoodElement = {
    name: 'wood',
    defaultColor: '#8B4513',
    density: 0.6,
    durability: 0.7,
    flammable: true,
    defaultTemperature: 25,
    stickiness: 0.05,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    
    // Process wood particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const wood = grid[y][x];
        wood.processed = true;
        
        // Wood is static but can burn
        if (wood.burning) {
            // Decrease burn duration
            wood.burnDuration--;
            
            // When fully burned, turn to ash
            if (wood.burnDuration <= 0) {
                grid[y][x] = this.createAshParticle();
                return;
            }
            
            // Create fire particles above the burning wood
            if (y > 0 && !grid[y-1][x] && Math.random() < 0.2) {
                grid[y-1][x] = this.createFireParticle();
            }
            
            // Spread fire to adjacent flammable materials
            this.spreadFire(x, y, grid, isInBounds);
        } else {
            // Check if wood should catch fire
            if (this.shouldCatchFire(x, y, grid, isInBounds)) {
                wood.burning = true;
                wood.burnDuration = 400; // Wood burns longer than most materials
            }
        }
    },
    
    // Check if wood should catch fire
    shouldCatchFire: function(x, y, grid, isInBounds) {
        // Check surrounding cells for fire or high temp
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
            
            // Catch fire from adjacent fire
            if (neighbor.type === 'fire') {
                return Math.random() < 0.1; // 10% chance
            }
            
            // Catch fire from adjacent burning particles
            if (neighbor.burning && neighbor.burnDuration > 0) {
                return Math.random() < 0.05; // 5% chance
            }
            
            // Catch fire from lava
            if (neighbor.type === 'lava') {
                return Math.random() < 0.15; // 15% chance
            }
            
            // Catch fire at high temperatures
            if (neighbor.temperature > 100) {
                return Math.random() < 0.01; // 1% chance
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
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Ignite flammable materials
            if (neighbor.flammable && !neighbor.burning && Math.random() < 0.03) {
                neighbor.burning = true;
                neighbor.burnDuration = this.getBurnDuration(neighbor.type);
            }
        }
    },
    
    // Get burn duration for different materials
    getBurnDuration: function(type) {
        switch (type) {
            case 'wood': return 400;
            case 'plant': return 60;
            case 'oil': return 120;
            case 'fuse': return 100;
            default: return 100;
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
    
    // Create ash particle when wood burns out
    createAshParticle: function() {
        return {
            type: 'ash',
            color: '#707070',
            temperature: 100, // Still hot from burning
            processed: false,
            flammable: false,
            density: 0.3,
            isPowder: true
        };
    },
    
    // Custom rendering for wood
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base wood color
        ctx.fillStyle = particle.burning ? 
            `rgb(${Math.floor(139 + (255-139) * (1 - particle.burnDuration/400))}, ${Math.floor(69 + (0-69) * (1 - particle.burnDuration/400))}, ${Math.floor(19 + (0-19) * (1 - particle.burnDuration/400))})` : 
            particle.color;
        
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Wood grain
        ctx.fillStyle = particle.burning ? 'rgba(255, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)';
        
        // Horizontal grain lines
        const grainCount = 3;
        const grainHeight = CELL_SIZE / (grainCount * 2);
        
        for (let i = 0; i < grainCount; i++) {
            const grainY = y * CELL_SIZE + CELL_SIZE * (i + 0.5) / grainCount - grainHeight / 2;
            ctx.fillRect(x * CELL_SIZE, grainY, CELL_SIZE, grainHeight);
        }
        
        // If wood is burning, add fire effect
        if (particle.burning) {
            // Add red-orange glow based on burn stage
            const intensity = Math.min(0.8, (1 - particle.burnDuration/400) * 0.8);
            
            ctx.fillStyle = `rgba(255, 69, 0, ${intensity})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Add embers/sparks
            if (Math.random() < 0.3) {
                const sparkCount = 2;
                ctx.fillStyle = '#FFFF00';
                
                for (let i = 0; i < sparkCount; i++) {
                    const sparkX = x * CELL_SIZE + Math.random() * CELL_SIZE;
                    const sparkY = y * CELL_SIZE + Math.random() * CELL_SIZE;
                    const sparkSize = CELL_SIZE * 0.1;
                    
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.flammable = true;
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 