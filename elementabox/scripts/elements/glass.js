// Glass element module
window.GlassElement = {
    name: 'glass',
    defaultColor: 'rgba(200, 230, 255, 0.7)', // Transparent blue-tint
    density: 2.5,             // Medium-high density
    durability: 0.2,          // Very fragile
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.1,          // Slightly sticky
    isLiquid: false,
    isGas: false,
    isPowder: false,
    transparency: 0.7,        // High transparency
    
    // Process glass particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const glass = grid[y][x];
        glass.processed = true;
        
        // Check if we can fall
        if (!this.isSupported(x, y, grid, isInBounds)) {
            // Glass can break when falling
            if (Math.random() < 0.15 && y > 0) { // 15% chance to break when falling
                this.breakGlass(x, y, grid, isInBounds);
                return;
            }
            
            this.tryToFall(x, y, grid, isInBounds);
            return;
        }
        
        // Check for impacts that could break the glass
        if (this.checkForImpact(x, y, grid, isInBounds)) {
            this.breakGlass(x, y, grid, isInBounds);
            return;
        }
        
        // Glass conducts heat but can shatter from thermal shock
        this.conductHeat(x, y, grid, isInBounds);
        
        // Glass can melt at high temperatures
        if (glass.temperature >= 850) {
            // 5% chance to melt per frame at high temperature
            if (Math.random() < 0.05) {
                grid[y][x] = this.createMoltenGlassParticle();
                return;
            }
        }
    },
    
    // Check if the glass is supported
    isSupported: function(x, y, grid, isInBounds) {
        // If at the bottom of the grid, it's supported by the ground
        if (y >= grid.length - 1) return true;
        
        // Check if supported from below
        if (grid[y+1][x] && this.isSolidSupport(grid[y+1][x].type)) {
            return true;
        }
        
        // Check if supports exist on sides (glass can form windows/panes)
        let supportCount = 0;
        
        // Check left, right
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX] && this.isSolidSupport(grid[newY][newX].type)) {
                supportCount++;
            }
        }
        
        // Glass can stay in place if supported by at least 2 sides
        // or if it's part of a window structure
        return supportCount >= 2 || this.isPartOfWindow(x, y, grid, isInBounds);
    },
    
    // Check if glass is part of a vertical window structure
    isPartOfWindow: function(x, y, grid, isInBounds) {
        // Check if there's glass above and glass below, forming a window pane
        let glassAbove = false;
        let glassBelow = false;
        
        // Check above
        if (y > 0 && grid[y-1][x] && grid[y-1][x].type === 'glass') {
            glassAbove = true;
        }
        
        // Check below
        if (y < grid.length - 1 && grid[y+1][x] && grid[y+1][x].type === 'glass') {
            glassBelow = true;
        }
        
        // If glass is connected both above and below, it's part of a window
        return glassAbove && glassBelow;
    },
    
    // Check if a material type can support glass
    isSolidSupport: function(type) {
        return ['brick', 'stone', 'metal', 'steel', 'wood', 'glass'].includes(type);
    },
    
    // Check for impacts that might break the glass
    checkForImpact: function(x, y, grid, isInBounds) {
        // Check nearby cells for fast-moving particles
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                const neighbor = grid[newY][newX];
                
                // Check if a heavy particle is moving toward the glass
                if (neighbor.density && neighbor.density > 3 && neighbor.velocity) {
                    // If the particle is moving fast, glass can break
                    const speed = Math.sqrt(
                        Math.pow(neighbor.velocity.x || 0, 2) + 
                        Math.pow(neighbor.velocity.y || 0, 2)
                    );
                    
                    if (speed > 2) {
                        return Math.random() < 0.5; // 50% chance to break on impact
                    }
                }
                
                // Check for explosions
                if (neighbor.isExplosion) {
                    return true;  // Explosions always break glass
                }
            }
        }
        
        return false;
    },
    
    // Try to make glass fall
    tryToFall: function(x, y, grid, isInBounds) {
        // Check if we can fall directly down
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            
            // Add velocity when falling to increase chance of breaking on impact
            if (!grid[y+1][x].velocity) {
                grid[y+1][x].velocity = { x: 0, y: 1 };
            } else {
                grid[y+1][x].velocity.y += 0.5;
            }
            
            return;
        }
        
        // Try to slide down to the left or right
        const directions = [
            { dx: -1, dy: 1 }, // down-left
            { dx: 1, dy: 1 }   // down-right
        ];
        
        // Randomize direction to avoid bias
        if (Math.random() < 0.5) {
            directions.reverse();
        }
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                grid[newY][newX] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Break glass into shards
    breakGlass: function(x, y, grid, isInBounds) {
        // Remove the glass
        const glass = grid[y][x];
        grid[y][x] = null;
        
        // Create glass shards
        const directions = [
            { dx: -1, dy: -1 }, // up-left
            { dx: 0, dy: -1 },  // up
            { dx: 1, dy: -1 },  // up-right
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: 0 },   // right
            { dx: -1, dy: 1 },  // down-left
            { dx: 0, dy: 1 },   // down
            { dx: 1, dy: 1 }    // down-right
        ];
        
        // Create 3-6 shards
        const shardCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < shardCount; i++) {
            // Pick a random direction
            const randIndex = Math.floor(Math.random() * directions.length);
            const dir = directions[randIndex];
            
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                grid[newY][newX] = this.createGlassShard(dir);
            }
        }
        
        // Create a breaking sound effect (if we had audio capability)
        // playSound('glass_break');
    },
    
    // Create a glass shard particle
    createGlassShard: function(direction) {
        return {
            type: 'glass_shard',
            color: 'rgba(200, 230, 255, 0.8)',  // Similar to glass but more visible
            temperature: this.defaultTemperature,
            processed: false,
            flammable: false,
            density: 2.0,  // Lighter than solid glass
            isPowder: true,  // Shards behave like powder
            durability: 0.1,  // Very fragile
            // Add velocity in the direction the shard is going
            velocity: {
                x: direction.dx * (1 + Math.random()),
                y: direction.dy * (1 + Math.random())
            },
            // Shards gradually disappear
            lifetime: 100 + Math.floor(Math.random() * 100),
            age: 0
        };
    },
    
    // Heat conductivity for glass
    conductHeat: function(x, y, grid, isInBounds) {
        const glass = grid[y][x];
        let totalTemp = glass.temperature;
        let count = 1;
        
        // Check all 8 directions for heat sources
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
                
                // Check for thermal shock (rapid temperature change)
                if (Math.abs(grid[newY][newX].temperature - glass.temperature) > 300) {
                    if (Math.random() < 0.15) { // 15% chance to break from thermal shock
                        this.breakGlass(x, y, grid, isInBounds);
                        return;
                    }
                }
            }
        }
        
        // Calculate new temperature
        const avgTemp = totalTemp / count;
        glass.temperature = glass.temperature * 0.7 + avgTemp * 0.3; // Glass conducts heat slowly
    },
    
    // Create molten glass particle when glass melts
    createMoltenGlassParticle: function() {
        return {
            type: 'lava',
            color: '#FF9A6A', // Orange-tinted for molten glass
            temperature: 900,
            processed: false,
            flammable: false,
            density: 2.0, // Slightly less dense than solid glass
            isLiquid: true,
            isMoltenGlass: true // Special flag
        };
    },
    
    // Custom rendering for glass
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base glass appearance - semi-transparent
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add glass reflections
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.3, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE * 0.3);
        ctx.fill();
        
        // Add a slight border to show the edges of the glass
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Show temperature effects
        if (particle.temperature > 400) {
            const temp = Math.min(1, (particle.temperature - 400) / 450);
            
            // Glass glows red-orange as it heats up
            let r = 200 + Math.floor(55 * temp);
            let g = 100 + Math.floor(100 * temp);
            let b = 50 + Math.floor(50 * temp);
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + temp * 0.5})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
        
        // Show cracks if the glass is damaged
        if (particle.damaged) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            
            // Draw random cracks
            const centerX = x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = y * CELL_SIZE + CELL_SIZE / 2;
            
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const length = CELL_SIZE * 0.4;
                
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + Math.cos(angle) * length,
                    centerY + Math.sin(angle) * length
                );
            }
            
            ctx.stroke();
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.damaged = false;
        return particle;
    }
}; 