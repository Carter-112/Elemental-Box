// Bubble Element
// Bubbles that rise in liquids and can be popped by sharp objects

const BubbleElement = {
    name: 'bubble',
    label: 'Bubble',
    description: 'Bubbles that rise in liquids and can be popped by sharp objects',
    category: 'gas',
    defaultColor: '#FFFFFF', // White with transparency
    
    // Physical properties
    density: 0.01, // Very light
    isGas: true,
    isLiquid: false,
    isPowder: false,
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
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.lifetime = 200 + Math.floor(Math.random() * 300); // Bubbles last for a moderate amount of time
        particle.size = 0.5 + (Math.random() * 0.5); // Random size variation
        particle.opacity = 0.3 + (Math.random() * 0.3); // Random opacity
        particle.wobblePhase = Math.random() * Math.PI * 2; // Random starting phase for wobble
        particle.wobbleSpeed = 0.05 + (Math.random() * 0.05); // Random wobble speed
        particle.wobbleAmount = 0.5 + (Math.random() * 0.5); // Random wobble amount
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Decrease lifetime
        grid[y][x].lifetime--;
        
        // Bubbles pop at the surface or when lifetime expires
        if (grid[y][x].lifetime <= 0) {
            grid[y][x] = null;
            return;
        }
        
        // Check if bubble should pop
        if (this.shouldPop(x, y, grid, isInBounds)) {
            this.popBubble(x, y, grid, isInBounds);
            return;
        }
        
        // Update wobble phase for rendering
        grid[y][x].wobblePhase += grid[y][x].wobbleSpeed;
        if (grid[y][x].wobblePhase > Math.PI * 2) {
            grid[y][x].wobblePhase -= Math.PI * 2;
        }
        
        // Bubbles rise faster in liquids, slower in air
        const isInLiquid = this.isInLiquid(x, y, grid, isInBounds);
        
        // Rise behavior
        if (y > 0) {
            // Try to move directly up
            if (!grid[y - 1][x]) {
                grid[y - 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // In liquid, try harder to find a way up (wobble more)
            if (isInLiquid) {
                // Try diagonal paths
                const directionBias = Math.sin(grid[y][x].wobblePhase) * grid[y][x].wobbleAmount;
                const tryLeftFirst = directionBias < 0;
                
                if (tryLeftFirst) {
                    // Try left then right
                    if (x > 0 && !grid[y - 1][x - 1]) {
                        grid[y - 1][x - 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    } else if (x < grid[0].length - 1 && !grid[y - 1][x + 1]) {
                        grid[y - 1][x + 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    }
                } else {
                    // Try right then left
                    if (x < grid[0].length - 1 && !grid[y - 1][x + 1]) {
                        grid[y - 1][x + 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    } else if (x > 0 && !grid[y - 1][x - 1]) {
                        grid[y - 1][x - 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    }
                }
                
                // In liquids, if cannot move up, try to move sideways on a horizontal path
                if (Math.random() < 0.4) {
                    const goLeft = Math.random() < 0.5 + directionBias;
                    
                    if (goLeft && x > 0 && !grid[y][x - 1]) {
                        grid[y][x - 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    } else if (!goLeft && x < grid[0].length - 1 && !grid[y][x + 1]) {
                        grid[y][x + 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    }
                }
            } else {
                // In air, slower rise and less wobble
                if (Math.random() < 0.3) {
                    // Try diagonal paths with less eagerness
                    const goLeft = Math.random() < 0.5;
                    
                    if (goLeft && x > 0 && !grid[y - 1][x - 1]) {
                        grid[y - 1][x - 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    } else if (!goLeft && x < grid[0].length - 1 && !grid[y - 1][x + 1]) {
                        grid[y - 1][x + 1] = grid[y][x];
                        grid[y][x] = null;
                        return;
                    }
                }
            }
        }
        
        // Bubble grows slightly over time in certain conditions
        if (isInLiquid && Math.random() < 0.01 && grid[y][x].size < 1.0) {
            grid[y][x].size += 0.01;
        }
        
        // Check for merging with other bubbles
        if (isInLiquid && Math.random() < 0.1) {
            this.tryMergeWithNearbyBubbles(x, y, grid, isInBounds);
        }
    },
    
    // Check if bubble is in a liquid
    isInLiquid: function(x, y, grid, isInBounds) {
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, 
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, 
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        let liquidCount = 0;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            if (grid[ny][nx].isLiquid) {
                liquidCount++;
            }
        }
        
        // Consider it in liquid if at least 3 neighbors are liquid
        return liquidCount >= 3;
    },
    
    // Check if bubble should pop
    shouldPop: function(x, y, grid, isInBounds) {
        // Pop if not surrounded by enough liquid or solid support
        const isInLiquid = this.isInLiquid(x, y, grid, isInBounds);
        
        // Pop if at the top of the grid
        if (y === 0) return true;
        
        // Pop if not in liquid and has no solid or liquid support below
        if (!isInLiquid) {
            // Check if there's support below
            if (y < grid.length - 1 && (!grid[y + 1][x] || (!grid[y + 1][x].isLiquid && !grid[y + 1][x].isSolid))) {
                // Chance to pop if unsupported
                if (Math.random() < 0.1) return true;
            }
        }
        
        // Check for sharp objects or high pressure that can pop the bubble
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, 
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, 
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Pop if touching a sharp object
            if (grid[ny][nx].type === 'glass-shard' || 
                grid[ny][nx].type === 'needle' || 
                grid[ny][nx].type === 'wire' || 
                grid[ny][nx].type === 'thorn') {
                return true;
            }
            
            // Pop if temperature is too high
            if (grid[ny][nx].temperature && grid[ny][nx].temperature > 100) {
                if (Math.random() < 0.2) return true;
            }
            
            // Pop if near explosion
            if (grid[ny][nx].type === 'fire' && grid[ny][nx].explosive) {
                return true;
            }
        }
        
        // Random chance to pop anyway
        return Math.random() < 0.001;
    },
    
    // Pop the bubble
    popBubble: function(x, y, grid, isInBounds) {
        // Remove the bubble
        grid[y][x] = null;
        
        // Optionally, create a tiny splash effect if popping in liquid
        if (this.isInLiquid(x, y, grid, isInBounds)) {
            const neighbors = [
                { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, 
                { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
            ];
            
            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (!isInBounds(nx, ny) || !grid[ny][nx] || !grid[ny][nx].isLiquid) continue;
                
                // 25% chance to move liquid into an empty space
                if (Math.random() < 0.25) {
                    const oppositeX = x - dir.dx;
                    const oppositeY = y - dir.dy;
                    
                    if (isInBounds(oppositeX, oppositeY) && !grid[oppositeY][oppositeX]) {
                        grid[oppositeY][oppositeX] = grid[ny][nx];
                        grid[ny][nx] = null;
                    }
                }
            }
        }
    },
    
    // Try to merge with nearby bubbles
    tryMergeWithNearbyBubbles: function(x, y, grid, isInBounds) {
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, 
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, 
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx] || grid[ny][nx].type !== 'bubble') continue;
            
            // Found another bubble, merge them by making this one bigger and removing the other
            grid[y][x].size = Math.min(1.2, grid[y][x].size + (grid[ny][nx].size * 0.6));
            grid[y][x].lifetime = Math.max(grid[y][x].lifetime, grid[ny][nx].lifetime);
            grid[ny][nx] = null;
            return; // Only merge with one bubble at a time
        }
    },
    
    // Render the bubble
    render: function(ctx, x, y, particle, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Set transparency
        const opacity = particle.opacity || 0.4;
        ctx.globalAlpha = opacity;
        
        // Calculate size with wobble effect
        const baseSize = (particle.size || 0.8) * cellSize * 0.45;
        const wobbleEffect = particle.wobblePhase ? 
            Math.sin(particle.wobblePhase) * (particle.wobbleAmount || 0.1) * cellSize * 0.1 : 0;
        
        const size = baseSize + wobbleEffect;
        
        // Draw bubble outline
        ctx.beginPath();
        ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
        
        // Create a subtle gradient for the bubble
        const gradient = ctx.createRadialGradient(
            centerX - size * 0.3, 
            centerY - size * 0.3, 
            0,
            centerX, 
            centerY, 
            size
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(240, 240, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(200, 200, 255, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Add a thin bubble outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Add a highlight spot
        const highlightSize = size * 0.3;
        const highlightX = centerX - size * 0.4;
        const highlightY = centerY - size * 0.4;
        
        ctx.beginPath();
        ctx.arc(highlightX, highlightY, highlightSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.BubbleElement = BubbleElement; 