// Glass Shard Element
// A sharp powder that can pop bubbles and balloons

const GlassShardElement = {
    name: 'glass-shard',
    label: 'Glass Shard',
    description: 'Sharp fragments of glass that can pop bubbles and balloons',
    category: 'solid-powder',
    defaultColor: '#E0F8FF', // Light blue/transparent color
    
    // Physical properties
    density: 0.9,
    isGas: false,
    isLiquid: false,
    isPowder: true,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default
    transparency: 0.6, // Glass shards are somewhat transparent
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.sharpness = 100; // Full sharpness
        particle.temperature = this.temperature;
        
        // Random size variations for shards
        particle.size = 0.7 + (Math.random() * 0.6);
        
        // Random rotation for visual variety
        particle.rotation = Math.random() * 360;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Glass shards fall with gravity like other powders
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to slide to bottom-left or bottom-right
            const randomDirection = Math.random() < 0.5;
            
            if (randomDirection && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Check for interactions with surrounding cells
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // top-left
            { dx: 1, dy: -1 },  // top-right
            { dx: -1, dy: 1 },  // bottom-left
            { dx: 1, dy: 1 }    // bottom-right
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Pop bubbles and balloons
            if (grid[ny][nx].type === 'bubble') {
                // Pop the bubble, creating a small air burst
                grid[ny][nx] = null;
                
                // Air burst effect - create a small outward push
                this.createAirBurst(nx, ny, 2, grid, isInBounds);
                
                // Reduce sharpness with use
                grid[y][x].sharpness -= 5;
                return;
            }
            
            if (grid[ny][nx].type === 'balloon') {
                // Pop the balloon with a louder effect
                grid[ny][nx] = null;
                
                // Air burst effect - create a larger outward push
                this.createAirBurst(nx, ny, 3, grid, isInBounds);
                
                // Reduce sharpness more with balloon pop
                grid[y][x].sharpness -= 10;
                return;
            }
            
            // Glass shards can scratch other glass to create more tiny shards
            if (grid[ny][nx].type === 'glass' && Math.random() < 0.01) {
                // Rarely create a new glass shard from scratching glass
                const emptyNeighbors = [];
                
                for (const checkDir of neighbors) {
                    const checkX = nx + checkDir.dx;
                    const checkY = ny + checkDir.dy;
                    
                    if (isInBounds(checkX, checkY) && !grid[checkY][checkX]) {
                        emptyNeighbors.push({ x: checkX, y: checkY });
                    }
                }
                
                if (emptyNeighbors.length > 0) {
                    const targetCell = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                    
                    // Create a small glass shard
                    grid[targetCell.y][targetCell.x] = {
                        type: 'glass-shard',
                        color: this.defaultColor,
                        processed: true,
                        sharpness: 80, // Slightly less sharp
                        size: 0.5 + (Math.random() * 0.3), // Smaller shard
                        rotation: Math.random() * 360,
                        temperature: grid[ny][nx].temperature,
                        transparency: this.transparency,
                        isGas: false,
                        isLiquid: false,
                        isPowder: true,
                        isSolid: false
                    };
                    
                    // Reduce sharpness with scratching
                    grid[y][x].sharpness -= 2;
                }
            }
        }
        
        // Glass shards lose sharpness over time from abrasion
        if (Math.random() < 0.0001) {
            grid[y][x].sharpness -= 1;
        }
        
        // If the shard gets too dull, it becomes normal sand
        if (grid[y][x].sharpness <= 0) {
            grid[y][x] = {
                type: 'sand',
                color: '#E6C78C', // Sand color
                processed: true,
                temperature: grid[y][x].temperature,
                isGas: false,
                isLiquid: false,
                isPowder: true,
                isSolid: false
            };
            return;
        }
        
        // Heat can melt glass shards back into glass
        if (grid[y][x].temperature > 800) {
            grid[y][x] = {
                type: 'glass',
                color: '#E0F8FF',
                processed: true,
                temperature: grid[y][x].temperature,
                isGas: false,
                isLiquid: false,
                isPowder: false,
                isSolid: true,
                transparency: 0.7
            };
            return;
        }
    },
    
    // Create an air burst effect from popping bubbles/balloons
    createAirBurst: function(x, y, radius, grid, isInBounds) {
        // Push particles away from the burst point
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance > radius || distance === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
                
                // Particles will be pushed in the direction from center
                const pushX = Math.floor(nx + (dx / distance));
                const pushY = Math.floor(ny + (dy / distance));
                
                // Only push if target cell is empty
                if (isInBounds(pushX, pushY) && !grid[pushY][pushX] && 
                    // Don't push heavy particles
                    (!grid[ny][nx].density || grid[ny][nx].density < 1.5)) {
                    
                    grid[pushY][pushX] = grid[ny][nx];
                    grid[ny][nx] = null;
                }
            }
        }
    },
    
    // Render the glass shard
    render: function(ctx, x, y, particle, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Set transparency
        ctx.globalAlpha = 0.6;
        
        // Small random variations in color
        const colorVariation = Math.floor(Math.random() * 15);
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Draw the shard as an irregular polygon
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Use particle's rotation if available, or generate random
        const rotation = particle.rotation || Math.random() * 360;
        ctx.rotate(rotation * Math.PI / 180);
        
        // Use particle's size if available
        const size = (particle.size || 1) * cellSize * 0.4;
        
        // Draw an irregular polygon for the shard
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.7, size * 0.3);
        ctx.lineTo(size * 0.2, size);
        ctx.lineTo(-size * 0.5, size * 0.7);
        ctx.lineTo(-size * 0.7, -size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // Add a highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.GlassShardElement = GlassShardElement; 