// Tar element module
window.TarElement = {
    name: 'tar',
    defaultColor: '#222222', // Almost black
    density: 1.5,            // Denser than water
    durability: 0.8,         // Quite durable
    flammable: true,
    burnTemperature: 400,    // Takes more heat to burn than oil
    defaultTemperature: 25,
    stickiness: 0.9,         // Very sticky
    isLiquid: true,
    isGas: false,
    isPowder: false,
    viscosity: 0.9,          // Very viscous (0-1 scale)
    burnDuration: 300,       // Burns for a long time but less than napalm
    
    // Process tar particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const tar = grid[y][x];
        tar.processed = true;
        
        // Handle burning
        if (tar.burning) {
            this.processBurning(x, y, grid, isInBounds);
            return;
        }
        
        // Check for ignition
        if (this.shouldIgnite(x, y, tar, grid, isInBounds)) {
            tar.burning = true;
            tar.temperature = this.burnTemperature;
            tar.burnDuration = this.burnDuration;
            return;
        }
        
        // Handle hardening at low temperatures
        if (tar.temperature < 0 && !tar.hardened) {
            this.hardenTar(x, y, grid);
            return;
        }
        
        // Handle softening if previously hardened
        if (tar.hardened && tar.temperature > 5) {
            tar.hardened = false;
        }
        
        // Tar moves like a very viscous liquid if not hardened
        if (!tar.hardened) {
            this.moveLikeViscousLiquid(x, y, grid, isInBounds);
        }
        
        // Tar can trap and slow down particles
        this.trapParticles(x, y, grid, isInBounds);
    },
    
    // Process burning tar
    processBurning: function(x, y, grid, isInBounds) {
        const tar = grid[y][x];
        
        // Decrease burn duration
        tar.burnDuration--;
        
        // If burn duration is over, remove the particle
        if (tar.burnDuration <= 0) {
            // Create smoke when tar is completely burned
            if (y > 0 && !grid[y-1][x]) {
                grid[y-1][x] = {
                    type: 'smoke',
                    color: '#333333', // Dark smoke
                    temperature: 100,
                    processed: false,
                    isGas: true,
                    density: 0.1,
                    lifetime: 150 + Math.floor(Math.random() * 100),
                    age: 0
                };
            }
            
            grid[y][x] = null;
            return;
        }
        
        // Generate heat
        tar.temperature = this.burnTemperature;
        
        // Create fire particles above
        if (y > 0 && !grid[y-1][x] && Math.random() < 0.3) {
            grid[y-1][x] = {
                type: 'fire',
                color: '#ff6600',
                temperature: this.burnTemperature,
                processed: true,
                burnDuration: 15 + Math.floor(Math.random() * 20),
                fromTar: true
            };
        }
        
        // Create smoke with small probability
        if (y > 0 && Math.random() < 0.1) {
            // Find a place to put the smoke (above or to the sides)
            const smokeDirections = [
                { dx: 0, dy: -1 },  // up
                { dx: -1, dy: -1 }, // up-left
                { dx: 1, dy: -1 },  // up-right
            ];
            
            for (const dir of smokeDirections) {
                const newX = x + dir.dx;
                const newY = y + dir.dy;
                
                if (isInBounds(newX, newY) && !grid[newY][newX]) {
                    grid[newY][newX] = {
                        type: 'smoke',
                        color: '#333333', // Dark smoke
                        temperature: 100,
                        processed: false,
                        isGas: true,
                        density: 0.1,
                        lifetime: 80 + Math.floor(Math.random() * 100),
                        age: 0
                    };
                    break;
                }
            }
        }
        
        // Tar ignites neighboring flammable materials
        this.spreadFire(x, y, grid, isInBounds);
    },
    
    // Check if tar should ignite
    shouldIgnite: function(x, y, tar, grid, isInBounds) {
        // Hardened tar is harder to ignite
        const ignitionTemp = tar.hardened ? this.burnTemperature + 50 : this.burnTemperature;
        
        // Ignite at high temperature
        if (tar.temperature >= ignitionTemp) {
            return true;
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
            
            // Fire ignites tar
            if (neighbor.type === 'fire') {
                return Math.random() < (tar.hardened ? 0.2 : 0.5); // Hardened tar is harder to ignite
            }
            
            // Lava ignites tar
            if (neighbor.type === 'lava') {
                return Math.random() < (tar.hardened ? 0.4 : 0.7);
            }
            
            // Burning particles can ignite tar
            if (neighbor.burning && neighbor.burnDuration > 0) {
                return Math.random() < (tar.hardened ? 0.1 : 0.3);
            }
        }
        
        return false;
    },
    
    // Spread fire to nearby flammable objects
    spreadFire: function(x, y, grid, isInBounds) {
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
            
            // Heat up neighboring particles
            if (neighbor.temperature !== undefined) {
                neighbor.temperature += 10;
            }
            
            // Ignite flammable neighbors
            if (neighbor.flammable && !neighbor.burning) {
                if (Math.random() < 0.3) { // 30% chance
                    neighbor.burning = true;
                    neighbor.burnDuration = neighbor.burnDuration || 100;
                    neighbor.temperature = Math.max(neighbor.temperature || 25, 250);
                }
            }
        }
    },
    
    // Harden tar into a solid
    hardenTar: function(x, y, grid) {
        grid[y][x].hardened = true;
        grid[y][x].isLiquid = false; // No longer behaves as a liquid
        grid[y][x].color = '#111111'; // Slightly darker when hardened
    },
    
    // Move like a viscous liquid
    moveLikeViscousLiquid: function(x, y, grid, isInBounds) {
        // High viscosity means slow movement
        const flowChance = 0.95 - this.viscosity; // Higher viscosity = lower chance to flow
        
        // Liquid movement - try to fall down first but with viscosity factored in
        if (y < grid.length - 1 && !grid[y+1][x]) {
            if (Math.random() < flowChance) {
                grid[y+1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Try to spread horizontally with even lower probability
        if (Math.random() < flowChance * 0.5) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            const newX = x + direction;
            
            if (isInBounds(newX, y) && !grid[y][newX]) {
                // Check if there's support below or if we're at bottom
                if (y >= grid.length - 1 || grid[y+1][newX]) {
                    grid[y][newX] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Trap and slow down particles that come into contact with tar
    trapParticles: function(x, y, grid, isInBounds) {
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
            
            // Skip other tar particles and very dense objects
            if (neighbor.type === 'tar' || neighbor.density > 5) continue;
            
            // Add trapped status to neighboring particles
            if (!neighbor.tarTrapped) {
                neighbor.tarTrapped = true;
                neighbor.originalDensity = neighbor.density;
                
                // Increase density to make it harder to move
                neighbor.density = Math.min(10, neighbor.density * 1.5);
                
                // Slow down any particle with velocity
                if (neighbor.velocity) {
                    neighbor.velocity.x *= 0.5;
                    neighbor.velocity.y *= 0.5;
                }
            }
        }
    },
    
    // Custom rendering for tar
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color depends on state
        let baseColor = particle.color;
        if (particle.burning) {
            // Calculate a burning color based on burn duration
            const burnPhase = particle.burnDuration / this.burnDuration;
            const r = 255;
            const g = Math.floor(102 * burnPhase);
            const b = 0;
            baseColor = `rgb(${r},${g},${b})`;
        }
        
        // Fill the cell with base color
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        if (particle.burning) {
            // Add flame effect on top
            const flameBrightness = Math.floor(Math.random() * 100) + 155;
            ctx.fillStyle = `rgba(${flameBrightness}, ${flameBrightness/2}, 0, 0.7)`;
            
            // Random flame height
            const flameHeight = CELL_SIZE * (0.3 + Math.random() * 0.3);
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
            ctx.lineTo(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE - flameHeight);
            ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE);
            ctx.fill();
        } else if (particle.hardened) {
            // Hardened tar has a crusty texture
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            
            // Create a cracked pattern
            const crackSize = CELL_SIZE * 0.15;
            const cracks = [
                {x1: 0.2, y1: 0.2, x2: 0.8, y2: 0.8},
                {x1: 0.8, y1: 0.2, x2: 0.2, y2: 0.8},
                {x1: 0.5, y1: 0.1, x2: 0.5, y2: 0.9}
            ];
            
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(40, 40, 40, 0.5)';
            
            cracks.forEach(crack => {
                ctx.beginPath();
                ctx.moveTo(
                    x * CELL_SIZE + crack.x1 * CELL_SIZE,
                    y * CELL_SIZE + crack.y1 * CELL_SIZE
                );
                ctx.lineTo(
                    x * CELL_SIZE + crack.x2 * CELL_SIZE,
                    y * CELL_SIZE + crack.y2 * CELL_SIZE
                );
                ctx.stroke();
            });
        } else {
            // Liquid tar has a glossy look
            ctx.fillStyle = 'rgba(70, 70, 70, 0.3)';
            ctx.beginPath();
            ctx.arc(
                x * CELL_SIZE + CELL_SIZE * 0.3,
                y * CELL_SIZE + CELL_SIZE * 0.3,
                CELL_SIZE * 0.2,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.burning = false;
        particle.hardened = false;
        particle.viscosity = this.viscosity;
        return particle;
    }
}; 