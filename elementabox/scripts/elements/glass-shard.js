// Glass Shard element module
window.GlassShardElement = {
    name: 'glass_shard',
    defaultColor: 'rgba(200, 230, 255, 0.8)', // Transparent blue-tint, slightly more visible than glass
    density: 2.0,            // Lighter than solid glass
    durability: 0.1,         // Very fragile
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,           // Not sticky
    isLiquid: false,
    isGas: false,
    isPowder: true,          // Behaves like powder
    transparency: 0.6,       // High transparency
    
    // Process glass shard particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const shard = grid[y][x];
        shard.processed = true;
        
        // Aging mechanism - shards eventually disappear
        if (shard.age !== undefined) {
            shard.age++;
            
            // Gradually fade out
            if (shard.age > shard.lifetime * 0.7) {
                // Calculate opacity based on remaining lifetime
                const remainingLife = shard.lifetime - shard.age;
                const maxRemainingLife = shard.lifetime * 0.3;
                const opacity = Math.max(0, remainingLife / maxRemainingLife) * 0.8;
                
                // Update color with new opacity
                const baseColor = 'rgba(200, 230, 255,';
                shard.color = `${baseColor} ${opacity})`;
            }
            
            // Remove when lifetime is exceeded
            if (shard.age >= shard.lifetime) {
                grid[y][x] = null;
                return;
            }
        } else {
            // Initialize age and lifetime if not set
            shard.age = 0;
            shard.lifetime = 100 + Math.floor(Math.random() * 100);
        }
        
        // Apply velocity if shard has it
        if (shard.velocity) {
            this.applyVelocity(x, y, grid, isInBounds);
            return;
        }
        
        // Try to fall like powder
        this.tryToFallAsPowder(x, y, grid, isInBounds);
    },
    
    // Apply velocity to shard movement
    applyVelocity: function(x, y, grid, isInBounds) {
        const shard = grid[y][x];
        
        // Calculate new position based on velocity
        const newX = Math.round(x + shard.velocity.x);
        const newY = Math.round(y + shard.velocity.y);
        
        // Apply gravity
        shard.velocity.y += 0.1;
        
        // Apply air resistance
        shard.velocity.x *= 0.97;
        shard.velocity.y *= 0.97;
        
        // Check if we can move to the new position
        if (isInBounds(newX, newY) && !grid[newY][newX]) {
            // Move the shard
            grid[newY][newX] = shard;
            grid[y][x] = null;
        } else {
            // Hit something, bounce or stop
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                // Chance to break further on impact
                if (Math.random() < 0.3) {
                    grid[y][x] = null;
                    return;
                }
                
                // Bounce with reduced energy
                shard.velocity.x *= -0.5;
                shard.velocity.y *= -0.5;
                
                // If very slow, stop applying velocity
                if (Math.abs(shard.velocity.x) < 0.1 && Math.abs(shard.velocity.y) < 0.1) {
                    shard.velocity = null;
                }
            }
        }
    },
    
    // Try to fall as powder
    tryToFallAsPowder: function(x, y, grid, isInBounds) {
        // Check if we can fall directly down
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Try to slide down diagonally
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
        
        // Try to slide horizontally if the shard is on a slope
        if (y < grid.length - 1) {
            // Check for slopes on either side
            const leftSlope = isInBounds(x-1, y) && !grid[y][x-1] && 
                              isInBounds(x-1, y+1) && grid[y+1][x-1];
                              
            const rightSlope = isInBounds(x+1, y) && !grid[y][x+1] && 
                               isInBounds(x+1, y+1) && grid[y+1][x+1];
            
            if (leftSlope && (!rightSlope || Math.random() < 0.5)) {
                grid[y][x-1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (rightSlope) {
                grid[y][x+1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Chance to settle and stop moving
        if (Math.random() < 0.01) {
            const shard = grid[y][x];
            shard.settled = true;
        }
    },
    
    // Custom rendering for glass shard
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base glass shard appearance - semi-transparent
        ctx.fillStyle = particle.color;
        
        // Draw the shard as a smaller, irregular shape
        const centerX = x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = y * CELL_SIZE + CELL_SIZE / 2;
        const size = CELL_SIZE * 0.8;  // Slightly smaller than a full cell
        
        ctx.beginPath();
        
        // Create a jagged, shard-like shape
        const points = [];
        const sharpness = 0.7; // How sharp the points are (0-1)
        
        // Generate a unique shape for this shard
        const seed = (x * 37 + y * 13) % 100; // Simple hash for consistency
        
        for (let i = 0; i < 5; i++) { // 5-sided shard
            const angle = (i / 5) * Math.PI * 2;
            const distance = size * (0.4 + 0.6 * Math.sin(seed + i * 5)); // Vary the distance
            
            points.push({
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance
            });
        }
        
        // Draw the shape
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        // Add glass reflections
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.closePath();
        ctx.fill();
        
        // Add a slight border to show the edges of the shard
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // Show age effects (fading)
        if (particle.age && particle.lifetime) {
            const ageRatio = particle.age / particle.lifetime;
            if (ageRatio > 0.7) {
                const alpha = 1 - ((ageRatio - 0.7) / 0.3);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        if (!particle.age) particle.age = 0;
        if (!particle.lifetime) particle.lifetime = 100 + Math.floor(Math.random() * 100);
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 