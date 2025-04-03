// C4 element module
window.C4Element = {
    name: 'c4',
    defaultColor: '#F5F5DC', // Light beige
    density: 1.6,            // Medium density
    durability: 0.4,         // More durable than gunpowder
    flammable: true,
    defaultTemperature: 25,
    stickiness: 0.7,         // Highly sticky to form charges
    isLiquid: false,
    isGas: false,
    isPowder: false,
    explosionRadius: 8,      // Powerful explosion (larger than gunpowder)
    
    // Process C4 particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const c4 = grid[y][x];
        c4.processed = true;
        
        // Check for detonation
        if (this.shouldDetonate(x, y, c4, grid, isInBounds)) {
            this.explode(x, y, grid, isInBounds);
            return;
        }
        
        // C4 is sticky and can attach to surfaces
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
        }
    },
    
    // Check if C4 should detonate
    shouldDetonate: function(x, y, c4, grid, isInBounds) {
        // C4 requires heat or direct trigger to detonate
        if (c4.temperature >= 180) {
            return true;
        }
        
        // Check for detonation sources nearby
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
            if (!neighbor) continue;
            
            // Explosions nearby detonate C4
            if (neighbor.isExplosion) {
                return true;
            }
            
            // Electrical current can detonate C4
            if ((neighbor.type === 'wire' && neighbor.active) || 
                (neighbor.type === 'battery' && neighbor.connected)) {
                return Math.random() < 0.5; // 50% chance
            }
            
            // Other detonating C4 triggers this one (chain reaction)
            if (neighbor.type === 'c4' && neighbor.detonating) {
                return true;
            }
        }
        
        return false;
    },
    
    // Check if C4 is supported
    isSupported: function(x, y, grid, isInBounds) {
        // If at the bottom of the grid, it's supported by the ground
        if (y >= grid.length - 1) return true;
        
        // Check if supported from below
        if (grid[y+1][x]) {
            return true;
        }
        
        // Check for support on all sides (stickiness allows it to attach to walls)
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            // No check for down since we already did that
            { dx: -1, dy: -1 }, // up-left
            { dx: 1, dy: -1 },  // up-right
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                // C4 can stick to any non-gas substance
                if (!grid[newY][newX].isGas) {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // Make C4 fall
    tryToFall: function(x, y, grid, isInBounds) {
        if (y >= grid.length - 1) return; // At bottom of grid
        
        // Move directly down if possible
        if (!grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // If C4 is still falling and hits something, it has a chance to attach
        if (grid[y][x].falling) {
            // If we landed on something, we're no longer falling
            grid[y][x].falling = false;
            return;
        }
    },
    
    // Explode C4
    explode: function(x, y, grid, isInBounds) {
        // Mark as detonating first for chain reactions
        grid[y][x].detonating = true;
        
        // Powerful explosion
        let radius = this.explosionRadius;
        
        // Brief delay for chain reactions and visual effect
        setTimeout(() => {
            // Remove the particle
            grid[y][x] = null;
            
            // Create explosion particles and destroy nearby particles
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    // Only affect points within the circular radius
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance > radius) continue;
                    
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    if (!isInBounds(newX, newY)) continue;
                    
                    // Create explosion effect (fire particles)
                    if (distance < radius * 0.8 && Math.random() < 0.8) {
                        grid[newY][newX] = {
                            type: 'fire',
                            color: '#ffdd00',
                            temperature: 800,
                            processed: true,
                            burnDuration: 3 + Math.random() * 8,
                            isExplosion: true
                        };
                    } 
                    // Destroy nearby particles with higher probability than gunpowder
                    else if (grid[newY][newX] && Math.random() < (1.2 - distance/radius)) {
                        // Even sturdy materials have a chance to be destroyed
                        if (grid[newY][newX].type === 'stone' || 
                            grid[newY][newX].type === 'metal' || 
                            grid[newY][newX].type === 'brick') {
                            if (Math.random() < 0.6) {
                                grid[newY][newX] = null;
                            }
                        } else if (grid[newY][newX].type === 'steel') {
                            if (Math.random() < 0.3) {
                                grid[newY][newX] = null;
                            }
                        } else {
                            // Everything else is destroyed
                            grid[newY][newX] = null;
                        }
                    }
                }
            }
            
            // Create smoke and debris after explosion
            for (let i = 0; i < 20; i++) {
                const debrisX = x + Math.floor(Math.random() * radius * 2 - radius);
                const debrisY = y + Math.floor(Math.random() * radius * 2 - radius);
                
                if (isInBounds(debrisX, debrisY) && !grid[debrisY][debrisX]) {
                    if (Math.random() < 0.7) {
                        // Create smoke
                        grid[debrisY][debrisX] = {
                            type: 'smoke',
                            color: '#777777',
                            temperature: 150,
                            processed: false,
                            isGas: true,
                            density: 0.1,
                            lifetime: 100 + Math.floor(Math.random() * 100),
                            age: 0
                        };
                    } else {
                        // Create debris particles
                        grid[debrisY][debrisX] = {
                            type: 'glass_shard', // Reusing glass shard for debris
                            color: '#555555',
                            temperature: 100,
                            processed: false,
                            isPowder: true,
                            density: 1.4,
                            lifetime: 100 + Math.floor(Math.random() * 50),
                            age: 0,
                            velocity: {
                                x: (Math.random() - 0.5) * 2,
                                y: (Math.random() - 0.5) * 2
                            }
                        };
                    }
                }
            }
            
            // Create shockwave (air displacement)
            const shockwaveRadius = radius * 1.5;
            for (let dy = -shockwaveRadius; dy <= shockwaveRadius; dy++) {
                for (let dx = -shockwaveRadius; dx <= shockwaveRadius; dx++) {
                    const distance = Math.sqrt(dx*dx + dy*dy);
                    if (distance > shockwaveRadius || distance < radius * 0.8) continue;
                    
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    if (!isInBounds(newX, newY)) continue;
                    
                    // Move light particles in the shockwave
                    if (grid[newY][newX] && 
                        (grid[newY][newX].isGas || grid[newY][newX].density < 0.5)) {
                        // Calculate direction away from explosion
                        const dirX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
                        const dirY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);
                        
                        const targetX = newX + dirX;
                        const targetY = newY + dirY;
                        
                        // Move particle if target is empty
                        if (isInBounds(targetX, targetY) && !grid[targetY][targetX]) {
                            grid[targetY][targetX] = grid[newY][newX];
                            grid[newY][newX] = null;
                        }
                    }
                }
            }
        }, 50); // Small delay
    },
    
    // Custom rendering for C4
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add texture to C4
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        
        // Draw a grid pattern for texture
        const lineWidth = CELL_SIZE / 8;
        ctx.fillRect(x * CELL_SIZE + CELL_SIZE / 3, y * CELL_SIZE, lineWidth, CELL_SIZE);
        ctx.fillRect(x * CELL_SIZE + CELL_SIZE * 2 / 3, y * CELL_SIZE, lineWidth, CELL_SIZE);
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE / 3, CELL_SIZE, lineWidth);
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE * 2 / 3, CELL_SIZE, lineWidth);
        
        // If C4 is about to detonate, show visual warning
        if (particle.detonating) {
            ctx.fillStyle = 'rgba(255, 50, 0, 0.7)';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            
            // Add flashing effect
            const flashCycle = (Date.now() % 300) / 300;
            if (flashCycle < 0.5) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.detonating = false;
        particle.falling = true; // Start as falling
        return particle;
    }
}; 