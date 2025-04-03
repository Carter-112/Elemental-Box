// Snow element module
window.SnowElement = {
    name: 'snow',
    defaultColor: '#f8f8ff', // White with slight blue tint
    density: 0.1,           // Very light
    durability: 0.05,        // Very fragile
    flammable: false,
    defaultTemperature: -5,   // Below freezing
    stickiness: 0.1,         // Slightly sticky to form snowballs
    isLiquid: false,
    isGas: false,
    isPowder: true,
    
    // Process snow particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const snow = grid[y][x];
        snow.processed = true;
        
        // Check for melting
        if (this.shouldMelt(x, y, snow, grid, isInBounds)) {
            grid[y][x] = this.createWater(snow.temperature);
            return;
        }
        
        // Snow behaves like powder with some stickiness
        this.moveLikeLightPowder(x, y, grid, isInBounds);
        
        // Snow can pile up and compact
        this.checkForCompaction(x, y, grid, isInBounds);
    },
    
    // Check if snow should melt
    shouldMelt: function(x, y, snow, grid, isInBounds) {
        // Snow melts above 0°C
        if (snow.temperature > 0) {
            // Melting chance increases with temperature
            const meltChance = Math.min(0.8, (snow.temperature / 10) * 0.2);
            return Math.random() < meltChance;
        }
        
        // Check for heat sources nearby
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
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Heat transfer from hot neighbors can melt snow
            if (neighbor.temperature > 50) {
                return Math.random() < 0.3;
            }
            
            // Being next to water can melt snow
            if (neighbor.type === 'water' && neighbor.temperature > 0) {
                return Math.random() < 0.1;
            }
        }
        
        return false;
    },
    
    // Move like a light powder (more affected by obstacles and wind)
    moveLikeLightPowder: function(x, y, grid, isInBounds) {
        if (y >= grid.length - 1) return; // At bottom of grid
        
        // Add some randomness to movement to simulate snow falling
        const randomFactor = Math.random();
        
        // Check if we can move straight down
        if (!grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Try to slide down diagonally
        const diagX = randomFactor < 0.5 ? [x-1, x+1] : [x+1, x-1];
        
        for (const newX of diagX) {
            if (isInBounds(newX, y+1) && !grid[y+1][newX]) {
                grid[y+1][newX] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // If snow has been falling and hits something, it might drift to the side
        if (y > 0 && grid[y-1][x] && grid[y-1][x].type === 'snow') {
            const sideX = randomFactor < 0.5 ? x-1 : x+1;
            
            if (isInBounds(sideX, y) && !grid[y][sideX]) {
                grid[y][sideX] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Check for snow compaction (multiple snow particles piling up can compact)
    checkForCompaction: function(x, y, grid, isInBounds) {
        // Snow can't compact at the bottom row
        if (y >= grid.length - 1) return;
        
        // Check for snow particles above
        let snowPileHeight = 0;
        
        for (let checkY = y - 1; checkY >= 0 && snowPileHeight < 5; checkY--) {
            if (!isInBounds(x, checkY)) break;
            
            if (grid[checkY][x] && grid[checkY][x].type === 'snow') {
                snowPileHeight++;
            } else {
                break;
            }
        }
        
        // Check for snow particles below
        for (let checkY = y + 1; checkY < grid.length && snowPileHeight < 5; checkY++) {
            if (!isInBounds(x, checkY)) break;
            
            if (grid[checkY][x] && grid[checkY][x].type === 'snow') {
                snowPileHeight++;
            } else {
                break;
            }
        }
        
        // If we have enough snow piled up, there's a small chance to compact
        if (snowPileHeight >= 4 && Math.random() < 0.01) {
            // Snow compacts to either ice or compacted snow
            if (Math.random() < 0.3) {
                grid[y][x] = this.createIce();
            } else {
                // Just make it more stable
                grid[y][x].compacted = true;
                grid[y][x].density = 0.3;
                grid[y][x].color = '#E6E8FA'; // Slightly darker snow
            }
        }
    },
    
    // Create water (when snow melts)
    createWater: function(temperature) {
        return {
            type: 'water',
            color: '#4286f4',
            temperature: Math.max(1, temperature || 1), // At least 1°C
            processed: false,
            isLiquid: true,
            density: 1.0
        };
    },
    
    // Create ice (when snow compacts)
    createIce: function() {
        return {
            type: 'ice',
            color: '#a0e6ff',
            temperature: -5,
            processed: false,
            isLiquid: false,
            isGas: false,
            isPowder: false,
            density: 0.92
        };
    },
    
    // Custom rendering for snow
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw snowflake pattern
        ctx.fillStyle = '#FFFFFF';
        
        if (particle.compacted) {
            // Compacted snow has a denser, more uniform appearance
            const dotSize = CELL_SIZE / 8;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if ((i + j) % 2 === 0) {
                        ctx.fillRect(
                            x * CELL_SIZE + CELL_SIZE * (i+1)/4 - dotSize/2,
                            y * CELL_SIZE + CELL_SIZE * (j+1)/4 - dotSize/2,
                            dotSize,
                            dotSize
                        );
                    }
                }
            }
        } else {
            // Fresh snow looks more like snowflakes
            // Draw a simple snowflake shape
            const centerX = x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = y * CELL_SIZE + CELL_SIZE / 2;
            const armLength = CELL_SIZE * 0.3;
            
            // Horizontal and vertical arms
            ctx.fillRect(centerX - armLength/2, centerY - 1, armLength, 2);
            ctx.fillRect(centerX - 1, centerY - armLength/2, 2, armLength);
            
            // Diagonal arms
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-armLength/2, -1, armLength, 2);
            ctx.fillRect(-1, -armLength/2, 2, armLength);
            ctx.restore();
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.compacted = false;
        return particle;
    }
}; 