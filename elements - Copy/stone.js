// Stone element module
window.StoneElement = {
    name: 'stone',
    defaultColor: '#808080',  // Gray
    density: 2.7,             // Heavier than sand, similar to brick
    durability: 0.85,         // Very durable
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.1,          // Slightly sticky
    isLiquid: false,
    isGas: false,
    isPowder: false,
    
    // Process stone particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const stone = grid[y][x];
        stone.processed = true;
        
        // Stone can fall if not supported
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
            return;
        }
        
        // Stone can melt at very high temperatures (higher than metal)
        if (stone.temperature >= 1200) {
            // 5% chance to melt per frame at high temperature
            if (Math.random() < 0.05) {
                grid[y][x] = this.createLavaParticle();
                return;
            }
        }
        
        // Stone conducts heat, but less than metal
        this.conductHeat(x, y, grid, isInBounds);
    },
    
    // Check if the stone is supported
    isSupported: function(x, y, grid, isInBounds) {
        // If at the bottom of the grid, it's supported by the ground
        if (y >= grid.length - 1) return true;
        
        // Check if supported from below
        if (grid[y+1][x] && this.isSolidSupport(grid[y+1][x].type)) {
            return true;
        }
        
        // Check if part of a larger structure supported from sides
        // This allows for horizontal structures like arches and overhangs
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
        
        // For stone to be supported horizontally, it needs support from both sides
        // This is more restrictive than "stickier" materials like glue or resin
        return leftSupport && rightSupport;
    },
    
    // Check if a material type can support stone
    isSolidSupport: function(type) {
        return ['stone', 'brick', 'metal', 'steel', 'ice', 'crystal'].includes(type);
    },
    
    // Make stone fall if unsupported
    tryToFall: function(x, y, grid, isInBounds) {
        // Check if we can fall directly down
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Check if we can fall diagonally
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
    
    // Create lava when stone melts
    createLavaParticle: function() {
        return {
            type: 'lava',
            color: '#FF4500',
            temperature: 1200,
            processed: false,
            flammable: false,
            density: 1.8,
            isLiquid: true
        };
    },
    
    // Heat conductivity for stone
    conductHeat: function(x, y, grid, isInBounds) {
        const stone = grid[y][x];
        let totalTemp = stone.temperature;
        let count = 1;
        
        // Stone conducts heat to adjacent cells
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
        const conductivity = 0.3; // Stone conducts heat less than metal
        stone.temperature = stone.temperature * (1 - conductivity) + avgTemp * conductivity;
    },
    
    // Custom rendering for stone
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base stone color 
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add stone texture with cracks and variations
        // Create a unique pseudo-random pattern for this position
        const seed = x * 10000 + y;
        const rand = (n) => ((seed * (n + 1)) % 2341) / 2341;
        
        // Add cracks
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 1;
        
        // Draw a few random cracks
        const crackCount = Math.floor(rand(1) * 3);
        for (let i = 0; i < crackCount; i++) {
            ctx.beginPath();
            const startX = x * CELL_SIZE + rand(i*2) * CELL_SIZE;
            const startY = y * CELL_SIZE + rand(i*3) * CELL_SIZE;
            ctx.moveTo(startX, startY);
            
            // Create zigzag crack
            const points = 2 + Math.floor(rand(i*5) * 3);
            for (let j = 0; j < points; j++) {
                const nextX = startX + (rand(i*7+j) - 0.5) * CELL_SIZE;
                const nextY = startY + (rand(i*11+j) - 0.5) * CELL_SIZE;
                ctx.lineTo(nextX, nextY);
            }
            
            ctx.stroke();
        }
        
        // Add variations in stone color
        const patchCount = 1 + Math.floor(rand(4) * 3);
        for (let i = 0; i < patchCount; i++) {
            // Create patches of slightly different shades
            const shade = -15 + rand(i*13) * 30;
            ctx.fillStyle = this.adjustColor(particle.color, shade);
            
            const patchSize = CELL_SIZE * (0.2 + rand(i*17) * 0.3);
            const patchX = x * CELL_SIZE + rand(i*19) * (CELL_SIZE - patchSize);
            const patchY = y * CELL_SIZE + rand(i*23) * (CELL_SIZE - patchSize);
            
            ctx.globalAlpha = 0.4;
            ctx.fillRect(patchX, patchY, patchSize, patchSize);
            ctx.globalAlpha = 1.0;
        }
        
        // Show heat effect if stone is very hot
        if (particle.temperature > 600) {
            const heatIntensity = Math.min(0.6, (particle.temperature - 600) / 1000);
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