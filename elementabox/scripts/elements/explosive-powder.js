// Explosive Powder element module
window.ExplosivePowderElement = {
    name: 'explosivePowder',
    defaultColor: '#757546', // Brownish-yellow
    density: 0.9,
    durability: 0.3,
    flammable: true,
    burnTemperature: 80, // Ignites at relatively low temperature
    defaultTemperature: 25,
    stickiness: 0.05,
    isLiquid: false,
    isGas: false,
    isPowder: true,
    explosionRadius: 8, // Medium explosion radius
    explosionForce: 1.2, // Decent explosive force
    impactSensitivity: 0.6, // Quite sensitive to impacts (0-1 scale)
    
    // Process explosive powder particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const powder = grid[y][x];
        powder.processed = true;
        
        // Check for detonation conditions
        if (this.shouldDetonate(x, y, powder, grid, isInBounds)) {
            this.explode(x, y, grid, isInBounds);
            return;
        }
        
        // Handle falling/movement as powder
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
        }
    },
    
    // Check if powder should detonate
    shouldDetonate: function(x, y, powder, grid, isInBounds) {
        // Detonate on high temperature
        if (powder.temperature >= this.burnTemperature) {
            return true;
        }
        
        // Check for nearby flame/fire
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
            
            // Detonate from flame contact
            if (neighbor.type === 'fire') {
                return true;
            }
            
            // Detonate from explosion nearby
            if (neighbor.exploding) {
                return true;
            }
            
            // Detonate from high temperature neighbors
            if (neighbor.temperature && neighbor.temperature > this.burnTemperature) {
                return Math.random() < 0.7; // 70% chance
            }
        }
        
        // Check for impact (if it just fell)
        if (powder.justFell && Math.random() < this.impactSensitivity * 0.3) {
            return true;
        }
        
        return false;
    },
    
    // Check if particle is supported
    isSupported: function(x, y, grid, isInBounds) {
        // Check if at bottom of grid
        if (y >= grid.length - 1) return true;
        
        // Check if there's something below
        return grid[y+1][x] !== null;
    },
    
    // Try to move/fall as a powder
    tryToFall: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 1 },  // down-left
            { dx: 1, dy: 1 }    // down-right
        ];
        
        // Randomize direction preference for more natural pile formation
        if (Math.random() < 0.5) {
            const temp = directions[1];
            directions[1] = directions[2];
            directions[2] = temp;
        }
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            if (!grid[newY][newX]) {
                // Move the particle and mark it as having fallen (for impact sensitivity)
                grid[newY][newX] = grid[y][x];
                grid[y][x] = null;
                grid[newY][newX].justFell = true;
                
                // Check for impact detonation if falling onto a hard surface
                if (newY < grid.length - 1 && grid[newY+1][newX]) {
                    const surfaceBelow = grid[newY+1][newX];
                    if (!surfaceBelow.isPowder && !surfaceBelow.isLiquid && Math.random() < this.impactSensitivity * 0.1) {
                        // Schedule detonation on next frame
                        grid[newY][newX].scheduledDetonation = true;
                    }
                }
                
                return;
            }
        }
        
        // Clear the justFell flag if it didn't move
        if (grid[y][x]) {
            grid[y][x].justFell = false;
        }
    },
    
    // Handle explosion
    explode: function(x, y, grid, isInBounds) {
        // Remove the exploding particle
        grid[y][x] = null;
        
        // Create explosion effect (fire + destruction + force)
        const radius = this.explosionRadius;
        const force = this.explosionForce;
        
        // Loop through all cells within explosion radius
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const distance = Math.sqrt(i*i + j*j);
                
                // Skip cells outside blast radius
                if (distance > radius) continue;
                
                const newX = x + i;
                const newY = y + j;
                
                if (!isInBounds(newX, newY)) continue;
                
                // Calculate explosion effect based on distance (inverse square law)
                const effect = 1 - (distance / radius);
                
                // Handle each cell in the blast radius
                const cell = grid[newY][newX];
                
                // Empty cells get fire or smoke
                if (!cell) {
                    if (distance < radius * 0.5 && Math.random() < effect * 0.8) {
                        // Create fire in empty spaces near explosion center
                        grid[newY][newX] = {
                            type: 'fire',
                            color: '#ff6600',
                            temperature: 500,
                            processed: true,
                            burnDuration: 15 + Math.floor(Math.random() * 10),
                            age: 0
                        };
                    } else if (Math.random() < effect * 0.6) {
                        // Create smoke in outer areas
                        grid[newY][newX] = {
                            type: 'smoke',
                            color: '#888888',
                            temperature: 150,
                            processed: false,
                            isGas: true,
                            density: 0.1,
                            lifetime: 100 + Math.floor(Math.random() * 100),
                            age: 0
                        };
                    }
                    continue;
                }
                
                // Heat up nearby cells
                if (cell.temperature !== undefined) {
                    cell.temperature += 300 * effect;
                }
                
                // Destroy or damage cells based on distance and durability
                if (distance < radius * 0.7) {
                    const destructionThreshold = cell.durability || 0.5;
                    
                    if (effect > destructionThreshold * 2) {
                        // Complete destruction
                        grid[newY][newX] = null;
                        
                        // Chance to create debris or fire
                        if (Math.random() < 0.3) {
                            grid[newY][newX] = {
                                type: 'debris',
                                color: '#555555',
                                density: 0.6,
                                temperature: 100,
                                processed: false,
                                isPowder: true,
                                lifetime: 200 + Math.floor(Math.random() * 100),
                                age: 0
                            };
                        }
                    } else if (effect > destructionThreshold && Math.random() < effect) {
                        // Damage but don't destroy
                        // Maybe convert to a damaged version or set on fire
                        if (cell.flammable) {
                            cell.burning = true;
                            cell.burnDuration = cell.burnDuration || 100;
                        }
                    }
                }
                
                // Chain reaction: detonate other explosive materials
                if (cell.type === 'explosivePowder' || cell.type === 'dynamite' || 
                    cell.type === 'c4' || cell.explosionRadius) {
                    // Set it to detonate on next frame for better visual effect
                    cell.scheduledDetonation = true;
                }
                
                // Apply physics force to movable objects
                if (cell.isPowder || cell.isLiquid) {
                    const angle = Math.atan2(j, i);
                    const pushForce = force * effect;
                    
                    // Add velocity or create if doesn't exist
                    if (!cell.velocity) {
                        cell.velocity = { x: 0, y: 0 };
                    }
                    
                    cell.velocity.x += Math.cos(angle) * -pushForce * 2;
                    cell.velocity.y += Math.sin(angle) * -pushForce * 2;
                }
                
                // Apply velocity to particles
                if (cell.velocity && (Math.abs(cell.velocity.x) > 0.1 || Math.abs(cell.velocity.y) > 0.1)) {
                    const vx = Math.round(cell.velocity.x);
                    const vy = Math.round(cell.velocity.y);
                    
                    // Only move if target cell is empty
                    const targetX = newX + vx;
                    const targetY = newY + vy;
                    
                    if (isInBounds(targetX, targetY) && !grid[targetY][targetX]) {
                        grid[targetY][targetX] = cell;
                        grid[newY][newX] = null;
                    }
                    
                    // Dampen velocity for next frame
                    cell.velocity.x *= 0.8;
                    cell.velocity.y *= 0.8;
                }
            }
        }
    },
    
    // Custom rendering for explosive powder
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add grainy texture for powder
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        
        const grainCount = 5;
        const grainSize = CELL_SIZE / 10;
        
        for (let i = 0; i < grainCount; i++) {
            const grainX = Math.random() * CELL_SIZE;
            const grainY = Math.random() * CELL_SIZE;
            
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + grainX,
                y * CELL_SIZE + grainY,
                grainSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // If particle is hot, add visual indicator
        if (particle.temperature > this.burnTemperature * 0.8) {
            const heatRatio = Math.min(1, (particle.temperature - this.burnTemperature * 0.8) / (this.burnTemperature * 0.5));
            
            ctx.fillStyle = `rgba(255, 0, 0, ${heatRatio * 0.5})`;
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE/2,
                y * CELL_SIZE + CELL_SIZE/2,
                CELL_SIZE/2 * heatRatio,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        
        // If scheduled for detonation, show bright flash
        if (particle.scheduledDetonation) {
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.justFell = false;
        particle.scheduledDetonation = false;
        
        // Initialize velocity if not set
        if (!particle.velocity) {
            particle.velocity = { x: 0, y: 0 };
        }
        
        return particle;
    }
}; 