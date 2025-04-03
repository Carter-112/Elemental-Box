// Acid element module
window.AcidElement = {
    name: 'acid',
    defaultColor: '#39FF14',  // Bright green color
    density: 1.2,             // Slightly denser than water
    durability: 0.5,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.1,
    isLiquid: true,
    isGas: false,
    isPowder: false,
    corrosiveStrength: 0.8,   // How corrosive the acid is
    
    // Process acid particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const acid = grid[y][x];
        acid.processed = true;
        
        // Reduce acid potency over time
        if (!acid.potency) {
            acid.potency = 1.0;  // Initialize potency if not set
        } else {
            acid.potency -= 0.001;  // Slowly reduce potency
        }
        
        // Acid evaporates when it loses its potency
        if (acid.potency <= 0) {
            grid[y][x] = null;
            
            // Chance to create smoke as acid evaporates
            if (y > 0 && !grid[y-1][x] && Math.random() < 0.3) {
                grid[y-1][x] = this.createSmokeParticle();
            }
            return;
        }
        
        // Attempt to dissolve adjacent materials
        this.dissolveAdjacent(x, y, grid, isInBounds);
        
        // Check if we can fall
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = acid;
            grid[y][x] = null;
            return;
        }
        
        // Acid flows like water, but more aggressively
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
                grid[newY][newX] = acid;
                grid[y][x] = null;
                return;
            }
        }
        
        // Acid can displace lighter liquids
        if (y < grid.length - 1) {
            const particleBelow = grid[y+1][x];
            if (particleBelow && 
                ((particleBelow.isLiquid && particleBelow.density < this.density) || 
                 particleBelow.isGas)) {
                
                // Swap positions
                grid[y][x] = particleBelow;
                grid[y+1][x] = acid;
                particleBelow.processed = true;
                return;
            }
        }
    },
    
    // Dissolve adjacent materials
    dissolveAdjacent: function(x, y, grid, isInBounds) {
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
        
        const acid = grid[y][x];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
            
            const target = grid[newY][newX];
            
            // Skip if it's another acid particle
            if (target.type === 'acid') continue;
            
            // Materials that are resistant to acid
            if (target.type === 'glass' || 
                target.type === 'crystal' || 
                target.type === 'static' ||
                target.type === 'eraser') {
                continue;
            }
            
            // Metal and steel are highly resistant but can be dissolved with repeated exposure
            if ((target.type === 'metal' || target.type === 'steel') && Math.random() > acid.potency * 0.2) {
                continue;
            }
            
            // Calculate chance to dissolve based on corrosive strength, potency, and material durability
            const targetDurability = target.durability || 0.5;
            const dissolveChance = acid.potency * this.corrosiveStrength * (1 - targetDurability * 0.5);
            
            if (Math.random() < dissolveChance) {
                // Dissolve the material
                grid[newY][newX] = null;
                
                // Reduce potency when dissolving something
                acid.potency -= 0.1;
                
                // Chance to create gas when acid reacts with some materials
                if (Math.random() < 0.3 && !grid[newY-1] && !grid[newY-1][newX]) {
                    grid[newY-1][newX] = this.createSmokeParticle();
                }
                
                // If potency gets too low, remove the acid
                if (acid.potency <= 0) {
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Create smoke particle
    createSmokeParticle: function() {
        return {
            type: 'smoke',
            color: '#ADFF2F',  // Greenish smoke
            temperature: 25,
            processed: false,
            burnDuration: 60,
            flammable: false,
            density: 0.3,
            isGas: true
        };
    },
    
    // Custom rendering for acid
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base acid color with potency affecting opacity
        const potency = particle.potency || 1.0;
        ctx.fillStyle = `rgba(57, 255, 20, ${0.6 + potency * 0.4})`;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add bubbling effect 
        const numBubbles = Math.floor(potency * 3) + 1;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        for (let i = 0; i < numBubbles; i++) {
            // Use a deterministic but "random-looking" position based on frame count
            const bubbleX = x * CELL_SIZE + (Math.sin(Date.now() * 0.01 + i * 1.5) * 0.4 + 0.5) * CELL_SIZE;
            const bubbleY = y * CELL_SIZE + (Math.cos(Date.now() * 0.01 + i * 1.5) * 0.4 + 0.5) * CELL_SIZE;
            const bubbleSize = CELL_SIZE * (0.1 + Math.sin(Date.now() * 0.02 + i) * 0.05);
            
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add glow effect based on potency
        if (potency > 0.6) {
            ctx.fillStyle = `rgba(57, 255, 20, ${(potency - 0.6) * 0.3})`;
            ctx.fillRect(
                x * CELL_SIZE - CELL_SIZE * 0.15, 
                y * CELL_SIZE - CELL_SIZE * 0.15, 
                CELL_SIZE * 1.3, 
                CELL_SIZE * 1.3
            );
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.potency = 1.0;  // Full potency when created
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 