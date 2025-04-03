// Fire element module
window.FireElement = {
    name: 'fire',
    defaultColor: '#FF4500',
    density: 0.1,
    durability: 0.1,
    flammable: false,
    defaultTemperature: 150,
    stickiness: 0,
    isLiquid: false,
    isGas: true,
    isPowder: false,
    isSolid: false,
    category: 'Gas',
    
    // Process fire particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const particle = grid[y][x];
        particle.processed = true;
        
        // Fire has a limited lifetime
        particle.burnDuration = particle.burnDuration || 100;
        particle.burnDuration--;
        
        // Generate smoke occasionally 
        if (Math.random() < 0.1 && y > 0 && !grid[y-1][x]) {
            grid[y-1][x] = window.ElementRegistry.createParticle('smoke');
        }
        
        // Fire disappears after burning out
        if (particle.burnDuration <= 0) {
            grid[y][x] = Math.random() < 0.3 ? window.ElementRegistry.createParticle('smoke') : null;
            return;
        }
        
        // Fire changes color as it burns out
        const redness = Math.min(255, 255 * (particle.burnDuration / 100));
        const yellowness = Math.min(255, 200 * (particle.burnDuration / 100));
        particle.color = `rgb(${redness}, ${yellowness}, 0)`;
        
        // Ignite flammable materials around it
        this.igniteNeighbors(x, y, grid, isInBounds);
        
        // Fire rises upward
        if (y > 0 && Math.random() < 0.8) {
            const moveDirections = [
                { dx: 0, dy: -1, weight: 10 },  // Up (most likely)
                { dx: -1, dy: -1, weight: 3 },  // Up-left
                { dx: 1, dy: -1, weight: 3 },   // Up-right
                { dx: -1, dy: 0, weight: 1 },   // Left
                { dx: 1, dy: 0, weight: 1 }     // Right
            ];
            
            // Calculate total weight
            const totalWeight = moveDirections.reduce((sum, dir) => sum + dir.weight, 0);
            
            // Pick a random direction based on weights
            let random = Math.random() * totalWeight;
            let selectedDir = moveDirections[0];
            
            for (const dir of moveDirections) {
                if (random < dir.weight) {
                    selectedDir = dir;
                    break;
                }
                random -= dir.weight;
            }
            
            const newX = x + selectedDir.dx;
            const newY = y + selectedDir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                // Move the fire
                grid[newY][newX] = grid[y][x];
                grid[y][x] = null;
            }
        }
    },
    
    // Ignite flammable materials around the fire
    igniteNeighbors: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 },  // Left
            { dx: 1, dy: 0 },   // Right
            { dx: 0, dy: -1 },  // Up
            { dx: 0, dy: 1 },   // Down
            { dx: -1, dy: -1 }, // Up-left
            { dx: 1, dy: -1 },  // Up-right
            { dx: -1, dy: 1 },  // Down-left
            { dx: 1, dy: 1 }    // Down-right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
            
            const neighbor = grid[newY][newX];
            
            // Heat up neighbors
            if (neighbor.temperature) {
                neighbor.temperature += 5;
            }
            
            // Only ignite flammable neighbors
            if (!neighbor.flammable || neighbor.burning) continue;
            
            // Different materials have different ignition chances
            let ignitionChance = 0.05; // Default 5% chance
            
            // Adjust ignition chance based on material
            switch (neighbor.type) {
                case 'wood': ignitionChance = 0.01; break;
                case 'oil': ignitionChance = 0.1; break;
                case 'plant': ignitionChance = 0.05; break;
                case 'gunpowder': ignitionChance = 0.2; break;
                case 'explosive-powder': ignitionChance = 0.3; break;
                case 'fuse': ignitionChance = 0.15; break;
            }
            
            // Try to ignite the neighbor
            if (Math.random() < ignitionChance) {
                neighbor.burning = true;
                neighbor.burnDuration = 100; // Default burn duration
            }
        }
    },
    
    // Render the fire particle with glowing effect
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color from particle
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add a glow effect
        const intensity = (particle.burnDuration || 100) / 100;
        const glowRadius = CELL_SIZE * 2 * intensity;
        
        const gradient = ctx.createRadialGradient(
            (x + 0.5) * CELL_SIZE, (y + 0.5) * CELL_SIZE, CELL_SIZE / 4,
            (x + 0.5) * CELL_SIZE, (y + 0.5) * CELL_SIZE, glowRadius
        );
        
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            (x - 1) * CELL_SIZE, 
            (y - 1) * CELL_SIZE, 
            CELL_SIZE * 3, 
            CELL_SIZE * 3
        );
        
        return true; // Custom rendering handled
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.burnDuration = 100;
        return particle;
    }
}; 