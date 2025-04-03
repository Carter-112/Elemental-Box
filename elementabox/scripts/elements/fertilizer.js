// Fertilizer element module
window.FertilizerElement = {
    name: 'fertilizer',
    defaultColor: '#8a6642', // Brown-ish
    density: 0.7,
    durability: 0.3,
    flammable: true,
    burnTemperature: 120,
    defaultTemperature: 25,
    stickiness: 0.05,
    isLiquid: false,
    isGas: false,
    isPowder: true,
    explosionRadius: 10, // Medium-large explosion radius
    explosionForce: 1.5, // Medium-strong explosive force
    growthFactor: 0.3, // How much it enhances plant growth (0-1)
    dissolveRate: 0.03, // How quickly it dissolves in water
    
    // Process fertilizer particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const fertilizer = grid[y][x];
        fertilizer.processed = true;
        
        // Check for explosion conditions
        if (this.shouldExplode(x, y, fertilizer, grid, isInBounds)) {
            this.explode(x, y, grid, isInBounds);
            return;
        }
        
        // Check if should dissolve in water
        if (this.shouldDissolve(x, y, grid, isInBounds)) {
            this.dissolveInWater(x, y, grid, isInBounds);
            return;
        }
        
        // Handle falling/movement as powder
        if (!this.isSupported(x, y, grid, isInBounds)) {
            this.tryToFall(x, y, grid, isInBounds);
        }
        
        // Fertilize nearby plants/soil
        this.fertilizeNearby(x, y, grid, isInBounds);
    },
    
    // Check if fertilizer should explode
    shouldExplode: function(x, y, fertilizer, grid, isInBounds) {
        // Explode at high temperature
        if (fertilizer.temperature >= this.burnTemperature) {
            return true;
        }
        
        // Check nearby cells for fire or explosions
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
            
            // Direct fire contact has high chance to detonate
            if (neighbor.type === 'fire') {
                return Math.random() < 0.4; // 40% chance per frame
            }
            
            // Other explosions trigger fertilizer
            if (neighbor.exploding || neighbor.scheduledDetonation) {
                return true;
            }
            
            // Hot neighbors can trigger explosion
            if (neighbor.temperature && neighbor.temperature > this.burnTemperature) {
                return Math.random() < 0.2; // 20% chance per frame
            }
        }
        
        return false;
    },
    
    // Check if fertilizer should dissolve in water
    shouldDissolve: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        // Count how many water cells are adjacent
        let waterCount = 0;
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            if (neighbor.type === 'water') {
                waterCount++;
                
                // Mark water as fertilized
                if (!neighbor.fertilized) {
                    neighbor.fertilized = 0;
                }
            }
        }
        
        // Chance to dissolve based on how much water is touching it
        return Math.random() < this.dissolveRate * waterCount;
    },
    
    // Dissolve fertilizer into water
    dissolveInWater: function(x, y, grid, isInBounds) {
        // Remove the fertilizer particle
        grid[y][x] = null;
        
        // Increase fertilization level of nearby water
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
            if (!neighbor || neighbor.type !== 'water') continue;
            
            if (!neighbor.fertilized) {
                neighbor.fertilized = 0;
            }
            
            // Increase fertilization level and cap at 1.0
            neighbor.fertilized = Math.min(1.0, neighbor.fertilized + 0.3);
            
            // Change water color slightly to indicate fertilization
            const blueValue = Math.max(180, 255 - Math.floor(neighbor.fertilized * 75));
            neighbor.color = `rgba(100, 150, ${blueValue}, 0.8)`;
        }
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
                // Move the particle
                grid[newY][newX] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Fertilize nearby plants and soil
    fertilizeNearby: function(x, y, grid, isInBounds) {
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
            
            // Fertilize plants - speed up growth
            if (neighbor.type === 'plant' || neighbor.type === 'grass' || neighbor.type === 'seed') {
                // Add growth boost property
                if (!neighbor.growthBoost) {
                    neighbor.growthBoost = 0;
                }
                
                // Add a small boost each time (capped)
                neighbor.growthBoost = Math.min(1.0, neighbor.growthBoost + this.growthFactor * 0.1);
                
                // If it's a seed, give it a chance to sprout immediately
                if (neighbor.type === 'seed' && Math.random() < this.growthFactor * 0.2) {
                    neighbor.type = 'plant';
                    neighbor.color = '#3a7d44'; // Green
                    neighbor.age = 10; // Start a bit older
                }
                
                // If we fertilize a plant, occasionally consume the fertilizer
                if (Math.random() < 0.05) {
                    grid[y][x] = null;
                    return;
                }
            }
            
            // Make dirt better for planting
            if (neighbor.type === 'dirt' || neighbor.type === 'soil') {
                if (!neighbor.fertility) {
                    neighbor.fertility = 0.5; // Base fertility
                }
                
                // Increase fertility but cap it
                neighbor.fertility = Math.min(1.0, neighbor.fertility + this.growthFactor * 0.05);
                
                // Darker color to show rich soil
                neighbor.color = this.blendColors(neighbor.color, '#3d2817', neighbor.fertility * 0.3);
                
                // Chance to consume fertilizer when absorbed by soil
                if (Math.random() < 0.01) {
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Handle explosion
    explode: function(x, y, grid, isInBounds) {
        // Remove the exploding fertilizer
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
                
                // Empty cells get fire, smoke, or fertilizer dust
                if (!cell) {
                    if (distance < radius * 0.4 && Math.random() < effect * 0.8) {
                        // Create fire in empty spaces near explosion center
                        grid[newY][newX] = {
                            type: 'fire',
                            color: '#ff6600',
                            temperature: 500,
                            processed: true,
                            burnDuration: 15 + Math.floor(Math.random() * 10),
                            age: 0
                        };
                    } else if (Math.random() < effect * 0.5) {
                        // Create smoke in outer areas
                        grid[newY][newX] = {
                            type: 'smoke',
                            color: '#a0a060', // Greenish smoke
                            temperature: 150,
                            processed: false,
                            isGas: true,
                            density: 0.1,
                            lifetime: 100 + Math.floor(Math.random() * 100),
                            age: 0
                        };
                    } else if (distance > radius * 0.6 && Math.random() < effect * 0.3) {
                        // Scatter some fertilizer in the outer blast radius
                        grid[newY][newX] = {
                            type: 'fertilizer',
                            color: this.defaultColor,
                            temperature: 100,
                            processed: false,
                            isPowder: true
                        };
                        this.updateOnCreate(grid[newY][newX]);
                    }
                    continue;
                }
                
                // Heat up nearby cells
                if (cell.temperature !== undefined) {
                    cell.temperature += 300 * effect;
                }
                
                // Special effect: plants in the blast radius get a temporary growth boost if they survive
                if ((cell.type === 'plant' || cell.type === 'grass') && distance > radius * 0.5) {
                    if (!cell.growthBoost) {
                        cell.growthBoost = 0;
                    }
                    cell.growthBoost = Math.min(1.0, cell.growthBoost + this.growthFactor);
                    
                    // Make plant slightly bigger to show effect
                    if (cell.scale === undefined) {
                        cell.scale = 1.0;
                    }
                    cell.scale = Math.min(1.5, cell.scale + 0.2);
                }
                
                // Destroy or damage cells based on distance and durability
                if (distance < radius * 0.7) {
                    const destructionThreshold = cell.durability || 0.5;
                    
                    if (effect > destructionThreshold * 1.5) {
                        // Complete destruction
                        grid[newY][newX] = null;
                        
                        // Chance to create debris or fertilizer
                        if (Math.random() < 0.3) {
                            grid[newY][newX] = {
                                type: Math.random() < 0.7 ? 'debris' : 'fertilizer',
                                color: Math.random() < 0.7 ? '#555555' : this.defaultColor,
                                density: 0.6,
                                temperature: 100,
                                processed: false,
                                isPowder: true,
                                lifetime: Math.random() < 0.7 ? (200 + Math.floor(Math.random() * 100)) : undefined,
                                age: 0
                            };
                            
                            if (grid[newY][newX].type === 'fertilizer') {
                                this.updateOnCreate(grid[newY][newX]);
                            }
                        }
                    } else if (effect > destructionThreshold * 0.8 && Math.random() < effect) {
                        // Damage but don't destroy
                        if (cell.flammable) {
                            cell.burning = true;
                            cell.burnDuration = cell.burnDuration || 100;
                        }
                    }
                }
                
                // Chain reaction: detonate other explosive materials
                if ((cell.type === 'explosivePowder' || cell.type === 'dynamite' || 
                     cell.type === 'c4' || cell.type === 'fertilizer' || cell.explosionRadius) && 
                     !cell.scheduledDetonation) {
                    // Set it to detonate on next frame
                    cell.scheduledDetonation = true;
                }
                
                // Apply physics force to movable objects
                if ((cell.isPowder || cell.isLiquid) && !cell.anchored) {
                    const angle = Math.atan2(j, i);
                    const pushForce = force * effect;
                    
                    // Add velocity or create if doesn't exist
                    if (!cell.velocity) {
                        cell.velocity = { x: 0, y: 0 };
                    }
                    
                    cell.velocity.x += Math.cos(angle) * -pushForce * 2;
                    cell.velocity.y += Math.sin(angle) * -pushForce * 2;
                    
                    // Apply velocity to particles
                    if (Math.abs(cell.velocity.x) > 0.1 || Math.abs(cell.velocity.y) > 0.1) {
                        const vx = Math.round(cell.velocity.x);
                        const vy = Math.round(cell.velocity.y);
                        
                        // Only move if target cell is empty
                        const targetX = newX + vx;
                        const targetY = newY + vy;
                        
                        if (isInBounds(targetX, targetY) && !grid[targetY][targetX]) {
                            grid[targetY][targetX] = cell;
                            grid[newY][newX] = null;
                        }
                    }
                }
            }
        }
    },
    
    // Helper method to blend colors
    blendColors: function(color1, color2, ratio) {
        // Simple hex color blending
        // Convert hex to RGB
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return { r, g, b };
        };
        
        // Convert RGB to hex
        const rgbToHex = (r, g, b) => {
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        };
        
        // If colors aren't in hex format, return the default color
        if (!color1.startsWith('#') || !color2.startsWith('#')) {
            return this.defaultColor;
        }
        
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        
        // Blend colors
        const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
        const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
        const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
        
        return rgbToHex(r, g, b);
    },
    
    // Custom rendering for fertilizer
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add grainy texture for powder
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        const grainCount = 7; // More grains for a granular look
        const grainSize = CELL_SIZE / 12;
        
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
        if (particle.temperature > this.burnTemperature * 0.7) {
            const heatRatio = Math.min(1, (particle.temperature - this.burnTemperature * 0.7) / (this.burnTemperature * 0.5));
            
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
        particle.scheduledDetonation = false;
        
        // Initialize velocity if not set
        if (!particle.velocity) {
            particle.velocity = { x: 0, y: 0 };
        }
        
        return particle;
    }
}; 