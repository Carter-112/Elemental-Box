// Dynamite element module
window.DynamiteElement = {
    name: 'dynamite',
    defaultColor: '#b83232', // Red color
    density: 1.1,
    durability: 0.6,
    flammable: true,
    burnTemperature: 180, // Higher ignition temperature than powder
    defaultTemperature: 25,
    stickiness: 0.1,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    explosionRadius: 15, // Large explosion radius
    explosionForce: 2.0, // Strong explosive force
    fuseLength: 150, // Frames before detonation once lit
    
    // Process dynamite particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const dynamite = grid[y][x];
        dynamite.processed = true;
        
        // Initialize fuseTimer if needed
        if (dynamite.fuseLit && dynamite.fuseTimer === undefined) {
            dynamite.fuseTimer = this.fuseLength;
        }
        
        // Handle lit fuse countdown
        if (dynamite.fuseLit) {
            this.processFuse(x, y, dynamite, grid, isInBounds);
            return;
        }
        
        // Check if fuse should be lit
        if (this.shouldLightFuse(x, y, dynamite, grid, isInBounds)) {
            dynamite.fuseLit = true;
            dynamite.fuseTimer = this.fuseLength;
            return;
        }
        
        // Check for direct detonation conditions (extreme heat/explosion)
        if (this.shouldDetonateImmediately(x, y, dynamite, grid, isInBounds)) {
            this.explode(x, y, grid, isInBounds);
            return;
        }
        
        // If not supported, dynamite can fall
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
        }
    },
    
    // Process when fuse is lit
    processFuse: function(x, y, dynamite, grid, isInBounds) {
        // Decrease fuse timer
        dynamite.fuseTimer--;
        
        // Create smoke/spark effects as fuse burns
        if (dynamite.fuseTimer % 5 === 0) {
            this.createFuseEffects(x, y, dynamite, grid, isInBounds);
        }
        
        // Explode when timer reaches zero
        if (dynamite.fuseTimer <= 0) {
            this.explode(x, y, grid, isInBounds);
        }
    },
    
    // Create visual effects for burning fuse
    createFuseEffects: function(x, y, dynamite, grid, isInBounds) {
        // Calculate fuse progress
        const fuseProgress = 1 - (dynamite.fuseTimer / this.fuseLength);
        
        // Create sparks and smoke above the dynamite
        if (y > 0 && !grid[y-1][x]) {
            // Smoke with increasing probability as fuse burns
            if (Math.random() < 0.3 + fuseProgress * 0.5) {
                grid[y-1][x] = {
                    type: 'smoke',
                    color: '#aaaaaa',
                    temperature: 100,
                    processed: false,
                    isGas: true,
                    density: 0.1,
                    lifetime: 20 + Math.floor(Math.random() * 30),
                    age: 0
                };
            }
        }
        
        // Make the dynamite slightly hotter as fuse burns
        dynamite.temperature = Math.min(this.burnTemperature - 10, 
                                       this.defaultTemperature + fuseProgress * 100);
    },
    
    // Check if fuse should be lit
    shouldLightFuse: function(x, y, dynamite, grid, isInBounds) {
        // If already too hot, skip fuse and go straight to detonation
        if (dynamite.temperature >= this.burnTemperature) {
            return false; // Will detonate directly
        }
        
        // Check for ignition sources nearby
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
            
            // Fire ignites the fuse
            if (neighbor.type === 'fire') {
                return true;
            }
            
            // Torch ignites the fuse
            if (neighbor.type === 'torch') {
                return true;
            }
            
            // Hot neighbors have a chance to ignite
            if (neighbor.temperature && neighbor.temperature > this.burnTemperature * 0.7) {
                return Math.random() < 0.3; // 30% chance per frame if hot enough
            }
            
            // Other burning particles can ignite
            if (neighbor.burning && neighbor.burnDuration > 0) {
                return Math.random() < 0.2; // 20% chance
            }
            
            // Fuse connections (if implemented)
            if (neighbor.type === 'fuse' && neighbor.burning) {
                return true;
            }
        }
        
        return false;
    },
    
    // Check for immediate detonation (no fuse)
    shouldDetonateImmediately: function(x, y, dynamite, grid, isInBounds) {
        // Extreme heat causes immediate detonation
        if (dynamite.temperature >= this.burnTemperature) {
            return true;
        }
        
        // Shockwave from another explosion
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Nearby explosions trigger immediate detonation
            if (neighbor.exploding || neighbor.scheduledDetonation) {
                return true;
            }
        }
        
        return false;
    },
    
    // Check if dynamite is supported
    isSupported: function(x, y, grid, isInBounds) {
        // Check if at bottom of grid
        if (y >= grid.length - 1) return true;
        
        // Check if there's something below
        return grid[y+1][x] !== null;
    },
    
    // Try to fall if not supported
    tryToFall: function(x, y, grid, isInBounds) {
        // Only fall straight down (dynamite doesn't slide like powder)
        if (y < grid.length - 1 && !grid[y+1][x]) {
            grid[y+1][x] = grid[y][x];
            grid[y][x] = null;
        }
    },
    
    // Handle explosion
    explode: function(x, y, grid, isInBounds) {
        // Remove the exploding dynamite
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
                    if (distance < radius * 0.3 && Math.random() < effect * 0.9) {
                        // Create fire in empty spaces near explosion center
                        grid[newY][newX] = {
                            type: 'fire',
                            color: '#ff6600',
                            temperature: 700,
                            processed: true,
                            burnDuration: 20 + Math.floor(Math.random() * 15),
                            age: 0
                        };
                    } else if (Math.random() < effect * 0.7) {
                        // Create smoke in outer areas
                        grid[newY][newX] = {
                            type: 'smoke',
                            color: '#666666',
                            temperature: 200,
                            processed: false,
                            isGas: true,
                            density: 0.1,
                            lifetime: 150 + Math.floor(Math.random() * 150),
                            age: 0
                        };
                    }
                    continue;
                }
                
                // Heat up nearby cells
                if (cell.temperature !== undefined) {
                    cell.temperature += 500 * effect;
                }
                
                // Destroy or damage cells based on distance and durability
                if (distance < radius * 0.8) {
                    const destructionThreshold = cell.durability || 0.5;
                    
                    if (effect > destructionThreshold * 1.5) {
                        // Complete destruction
                        grid[newY][newX] = null;
                        
                        // Chance to create debris or fire
                        if (Math.random() < 0.4) {
                            grid[newY][newX] = {
                                type: 'debris',
                                color: '#555555',
                                density: 0.6,
                                temperature: 150,
                                processed: false,
                                isPowder: true,
                                lifetime: 300 + Math.floor(Math.random() * 150),
                                age: 0
                            };
                        }
                    } else if (effect > destructionThreshold * 0.8 && Math.random() < effect) {
                        // Damage but don't destroy
                        // Maybe convert to a damaged version or set on fire
                        if (cell.flammable) {
                            cell.burning = true;
                            cell.burnDuration = cell.burnDuration || 150;
                        }
                    }
                }
                
                // Chain reaction: detonate other explosive materials
                if ((cell.type === 'explosivePowder' || cell.type === 'dynamite' || 
                    cell.type === 'c4' || cell.explosionRadius) && !cell.scheduledDetonation) {
                    
                    // Set it to detonate on next frame for better visual effect
                    cell.scheduledDetonation = true;
                    
                    // Dynamite can skip fuse if close enough to explosion
                    if (cell.type === 'dynamite' && cell.fuseLit) {
                        const remainingFuseRatio = cell.fuseTimer / this.fuseLength;
                        // Closer explosions have more chance to skip remaining fuse
                        if (Math.random() < effect * 2 * (1 - remainingFuseRatio)) {
                            cell.fuseTimer = 1; // Will explode next frame
                        }
                    }
                }
                
                // Apply physics force to movable objects
                if ((cell.isPowder || cell.isLiquid) && !cell.anchored) {
                    const angle = Math.atan2(j, i);
                    const pushForce = force * effect;
                    
                    // Add velocity or create if doesn't exist
                    if (!cell.velocity) {
                        cell.velocity = { x: 0, y: 0 };
                    }
                    
                    cell.velocity.x += Math.cos(angle) * -pushForce * 3;
                    cell.velocity.y += Math.sin(angle) * -pushForce * 3;
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
    
    // Custom rendering for dynamite
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw dynamite stick appearance
        
        // Add stick part at bottom (brown)
        ctx.fillStyle = '#8B4513'; // Brown for the stick
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.3,
            y * CELL_SIZE + CELL_SIZE * 0.6,
            CELL_SIZE * 0.4,
            CELL_SIZE * 0.4
        );
        
        // Add fuse on top
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.1);
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.5, y * CELL_SIZE + CELL_SIZE * 0.2);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.5, y * CELL_SIZE);
        ctx.stroke();
        
        // If fuse is lit, show burning effect
        if (particle.fuseLit) {
            // Calculate fuse progress
            const fuseProgress = 1 - (particle.fuseTimer / this.fuseLength);
            
            // Brighter color as it gets closer to detonation
            const r = 255;
            const g = Math.floor(255 * (1 - fuseProgress * 0.7));
            const b = Math.floor(100 * (1 - fuseProgress));
            
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            
            // Show fuse burning
            const sparkSize = CELL_SIZE * 0.15 * (1 + Math.random() * 0.5);
            
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE * 0.5,
                y * CELL_SIZE,
                sparkSize,
                0,
                Math.PI * 2
            );
            ctx.fill();
            
            // Add glowing effect as it gets closer to exploding
            if (fuseProgress > 0.7) {
                const glowAlpha = (fuseProgress - 0.7) / 0.3 * 0.5;
                ctx.fillStyle = `rgba(255, 200, 0, ${glowAlpha})`;
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
            
            // Critical blinking in final moments
            if (fuseProgress > 0.9 && Math.random() < 0.5) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
        
        // If scheduled for detonation, show bright flash
        if (particle.scheduledDetonation) {
            ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.fuseLit = false;
        particle.fuseTimer = undefined;
        particle.scheduledDetonation = false;
        
        // Initialize velocity if not set
        if (!particle.velocity) {
            particle.velocity = { x: 0, y: 0 };
        }
        
        return particle;
    }
}; 