// Brick element module
window.BrickElement = {
    name: 'brick',
    defaultColor: '#B22222',  // Firebrick red
    density: 2.2,             // Heavier than sand
    durability: 0.8,          // Very durable
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.2,          // Slightly sticky for building
    isLiquid: false,
    isGas: false,
    isPowder: false,
    
    // Process brick particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const brick = grid[y][x];
        brick.processed = true;
        
        // Bricks can fall if not supported
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
        }
        
        // Bricks can conduct heat, but less efficiently than metal
        this.conductHeat(x, y, grid, isInBounds);
    },
    
    // Check if the brick is supported
    isSupported: function(x, y, grid, isInBounds) {
        // If at the bottom of the grid, it's supported by the ground
        if (y >= grid.length - 1) return true;
        
        // Check if supported from below
        if (grid[y+1][x] && this.isSolidSupport(grid[y+1][x].type)) {
            return true;
        }
        
        // Check if supported from sides (when adjacent to other bricks/solid materials)
        // This allows for horizontal structures like arches
        let leftSupport = false;
        let rightSupport = false;
        
        // Check left
        if (isInBounds(x-1, y) && grid[y][x-1] && this.isSolidSupport(grid[y][x-1].type)) {
            leftSupport = true;
        }
        
        // Check right
        if (isInBounds(x+1, y) && grid[y][x+1] && this.isSolidSupport(grid[y][x+1].type)) {
            rightSupport = true;
        }
        
        // Need both sides for horizontal support
        return leftSupport && rightSupport;
    },
    
    // Check if the given type is a solid support
    isSolidSupport: function(type) {
        return ['brick', 'stone', 'metal', 'steel', 'glass', 'wood', 'ice'].includes(type);
    },
    
    // Try to make the brick fall
    tryToFall: function(x, y, grid, isInBounds) {
        // Check if we can fall
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
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
    
    // Heat conductivity for brick (lower than metal)
    conductHeat: function(x, y, grid, isInBounds) {
        const brick = grid[y][x];
        let totalTemp = brick.temperature;
        let count = 1;
        
        // Check orthogonal directions (not diagonals - brick conducts heat less)
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
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
        const conductivity = 0.4; // Brick conducts heat moderately
        brick.temperature = brick.temperature * (1 - conductivity) + avgTemp * conductivity;
    },
    
    // Custom rendering for brick
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Basic brick color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add brick texture with mortar lines
        const mortalColor = '#DDD0C8'; // Light gray for mortar
        
        // Horizontal mortar line
        ctx.fillStyle = mortalColor;
        ctx.fillRect(
            x * CELL_SIZE, 
            y * CELL_SIZE + CELL_SIZE / 2 - CELL_SIZE / 10, 
            CELL_SIZE, 
            CELL_SIZE / 5
        );
        
        // Vertical mortar line (positioned based on even/odd pattern)
        const verticalOffset = (x + y) % 2 === 0 ? CELL_SIZE / 2 : 0;
        ctx.fillRect(
            x * CELL_SIZE + verticalOffset, 
            y * CELL_SIZE, 
            CELL_SIZE / 5, 
            CELL_SIZE
        );
        
        // Add subtle variations to brick color
        if (Math.random() < 0.5) {
            ctx.fillStyle = this.adjustColor(particle.color, -20 + Math.random() * 40);
            
            // Create small patches of varied color
            const patchSize = CELL_SIZE / 3;
            const patchX = x * CELL_SIZE + Math.random() * (CELL_SIZE - patchSize);
            const patchY = y * CELL_SIZE + Math.random() * (CELL_SIZE - patchSize);
            
            ctx.globalAlpha = 0.5;
            ctx.fillRect(patchX, patchY, patchSize, patchSize);
            ctx.globalAlpha = 1.0;
        }
        
        // Show heat effect if brick is hot
        if (particle.temperature > 200) {
            const heatIntensity = Math.min(0.7, (particle.temperature - 200) / 800);
            ctx.fillStyle = `rgba(255, 50, 0, ${heatIntensity})`;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    },
    
    // Adjust color brightness
    adjustColor: function(hex, amount) {
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 