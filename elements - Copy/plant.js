// Plant element module
window.PlantElement = {
    name: 'plant',
    defaultColor: '#228B22',
    density: 0.7,
    durability: 0.3,
    flammable: true,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    
    // Process plant particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const plant = grid[y][x];
        plant.processed = true;
        
        // Plants need water to grow
        let hasWaterNearby = false;
        const waterRadius = 3;
        
        // Check for water within a radius
        for (let dy = -waterRadius; dy <= waterRadius; dy++) {
            for (let dx = -waterRadius; dx <= waterRadius; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (!isInBounds(newX, newY)) continue;
                
                const neighbor = grid[newY][newX];
                if (neighbor && neighbor.type === 'water') {
                    hasWaterNearby = true;
                    break;
                }
            }
            if (hasWaterNearby) break;
        }
        
        // Plants only grow if there's water nearby
        if (hasWaterNearby && Math.random() < 0.15) {
            // Try to grow upward or diagonally up
            const growthDirections = [
                { dx: 0, dy: -1 },  // up
                { dx: -1, dy: -1 }, // up-left
                { dx: 1, dy: -1 }   // up-right
            ];
            
            // Shuffle directions for more natural growth
            for (let i = growthDirections.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [growthDirections[i], growthDirections[j]] = [growthDirections[j], growthDirections[i]];
            }
            
            // Try to grow in one of the directions
            for (const dir of growthDirections) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (isInBounds(newX, newY) && !grid[newY][newX]) {
                    grid[newY][newX] = {
                        type: 'plant',
                        color: this.defaultColor,
                        temperature: this.defaultTemperature,
                        processed: false,
                        flammable: true,
                        burning: false
                    };
                    break;
                }
            }
        }
        
        // If plant is burning, let it spread fire rapidly
        if (plant.burning) {
            // Decrease burn duration
            plant.burnDuration--;
            
            // When fully burned, plant disappears (doesn't turn to ash)
            if (plant.burnDuration <= 0) {
                grid[y][x] = null;
                return;
            }
            
            // Create fire particles above the burning plant
            if (y > 0 && !grid[y-1][x] && Math.random() < 0.3) {
                grid[y-1][x] = this.createFireParticle();
            }
            
            // Plants spread fire to other plants very easily (90% chance)
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
                if (neighbor && neighbor.type === 'plant' && !neighbor.burning && Math.random() < 0.9) {
                    neighbor.burning = true;
                    neighbor.burnDuration = 60; // Plant burn duration
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
            burnDuration: 20,
            flammable: false
        };
    },
    
    // Custom rendering for plants
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base plant color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add plant details
        const stemWidth = CELL_SIZE / 5;
        const stemX = x * CELL_SIZE + (CELL_SIZE - stemWidth) / 2;
        const stemY = y * CELL_SIZE;
        const stemHeight = CELL_SIZE;
        
        // Draw stem
        ctx.fillStyle = '#006400'; // Darker green for stem
        ctx.fillRect(stemX, stemY, stemWidth, stemHeight);
        
        // Draw leaves
        ctx.fillStyle = particle.color;
        
        // Left leaf
        ctx.beginPath();
        ctx.ellipse(
            x * CELL_SIZE + CELL_SIZE * 0.3, 
            y * CELL_SIZE + CELL_SIZE * 0.4, 
            CELL_SIZE * 0.25, 
            CELL_SIZE * 0.15, 
            -Math.PI / 4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // Right leaf
        ctx.beginPath();
        ctx.ellipse(
            x * CELL_SIZE + CELL_SIZE * 0.7, 
            y * CELL_SIZE + CELL_SIZE * 0.4, 
            CELL_SIZE * 0.25, 
            CELL_SIZE * 0.15, 
            Math.PI / 4, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        
        // If plant is burning, add fire effect
        if (particle.burning) {
            // Add burning overlay
            ctx.fillStyle = 'rgba(255, 69, 0, 0.5)';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Add some sparks/flames
            ctx.fillStyle = '#FFFF00';
            const sparkCount = 2;
            for (let i = 0; i < sparkCount; i++) {
                const sparkX = x * CELL_SIZE + Math.random() * CELL_SIZE;
                const sparkY = y * CELL_SIZE + Math.random() * CELL_SIZE / 2;
                const sparkSize = CELL_SIZE / 6;
                
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.flammable = true;
        particle.burnDuration = 60; // Will be used when plant catches fire
        return particle;
    }
}; 