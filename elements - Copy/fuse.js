// Fuse element module
window.FuseElement = {
    name: 'fuse',
    defaultColor: '#c39e84', // Tan/brown
    density: 0.7,
    durability: 0.4,
    flammable: true,
    burnTemperature: 100,
    defaultTemperature: 25,
    stickiness: 0.2,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    burnSpeed: 0.05, // How quickly the fuse burns (0-1, higher is faster)
    
    // Process fuse particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const fuse = grid[y][x];
        fuse.processed = true;
        
        // Initialize burn progress if needed
        if (fuse.burning && fuse.burnProgress === undefined) {
            fuse.burnProgress = 0;
        }
        
        // Handle burning
        if (fuse.burning) {
            this.processBurning(x, y, grid, isInBounds);
            return;
        }
        
        // Check if fuse should be lit
        if (this.shouldIgnite(x, y, fuse, grid, isInBounds)) {
            fuse.burning = true;
            fuse.burnProgress = 0;
            return;
        }
    },
    
    // Process burning fuse
    processBurning: function(x, y, grid, isInBounds) {
        const fuse = grid[y][x];
        
        // Increase burn progress
        fuse.burnProgress += this.burnSpeed;
        
        // Create visual burning effects
        this.createBurningEffects(x, y, grid, isInBounds, fuse.burnProgress);
        
        // Check if fuse is completely burned
        if (fuse.burnProgress >= 1.0) {
            // Fuse is consumed
            grid[y][x] = null;
            
            // Create a small fire/ember at the end
            if (Math.random() < 0.7) {
                grid[y][x] = {
                    type: 'fire',
                    color: '#ff6600',
                    temperature: 200,
                    processed: true,
                    burnDuration: 10 + Math.floor(Math.random() * 10),
                    fromFuse: true,
                    age: 0
                };
            }
            
            // Ignite neighboring explosives or other fuses
            this.igniteNeighbors(x, y, grid, isInBounds);
            return;
        }
        
        // Propagate burning to connected fuses
        if (Math.random() < 0.8) { // 80% chance per frame to check for propagation
            this.propagateBurning(x, y, grid, isInBounds);
        }
    },
    
    // Create visual effects for burning fuse
    createBurningEffects: function(x, y, grid, isInBounds, burnProgress) {
        // Chance to create smoke above burning fuse
        if (y > 0 && !grid[y-1][x] && Math.random() < 0.2) {
            grid[y-1][x] = {
                type: 'smoke',
                color: '#bbbbbb',
                temperature: 100,
                processed: false,
                isGas: true,
                density: 0.1,
                lifetime: 20 + Math.floor(Math.random() * 20),
                age: 0
            };
        }
        
        // Chance to create sparks
        if (Math.random() < 0.1) {
            // Find a random empty adjacent cell
            const directions = [
                { dx: -1, dy: -1 }, // up-left
                { dx: 0, dy: -1 },  // up
                { dx: 1, dy: -1 },  // up-right
                { dx: -1, dy: 0 },  // left
                { dx: 1, dy: 0 },   // right
            ];
            
            // Choose a random direction
            const randomDir = directions[Math.floor(Math.random() * directions.length)];
            const sparkX = x + randomDir.dx;
            const sparkY = y + randomDir.dy;
            
            if (isInBounds(sparkX, sparkY) && !grid[sparkY][sparkX]) {
                // Create a temporary spark
                grid[sparkY][sparkX] = {
                    type: 'spark',
                    color: '#ffcc00',
                    temperature: 150,
                    processed: true,
                    isGas: false,
                    density: 0.1,
                    lifetime: 3 + Math.floor(Math.random() * 3),
                    age: 0,
                    fromFuse: true
                };
            }
        }
    },
    
    // Check if fuse should be ignited
    shouldIgnite: function(x, y, fuse, grid, isInBounds) {
        // Check for temperature
        if (fuse.temperature >= this.burnTemperature) {
            return true;
        }
        
        // Check neighboring cells for ignition sources
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
            
            // Direct fire contact
            if (neighbor.type === 'fire' || neighbor.type === 'lava') {
                return true;
            }
            
            // Burning fuse connection
            if (neighbor.type === 'fuse' && neighbor.burning) {
                return Math.random() < 0.5; // 50% chance per frame
            }
            
            // Other burning materials
            if (neighbor.burning && neighbor.burnDuration > 0) {
                return Math.random() < 0.3; // 30% chance per frame
            }
            
            // Sparks can ignite the fuse
            if (neighbor.type === 'spark') {
                return Math.random() < 0.4; // 40% chance per frame
            }
            
            // Very hot neighboring cells
            if (neighbor.temperature && neighbor.temperature > this.burnTemperature * 1.5) {
                return Math.random() < 0.2; // 20% chance per frame
            }
        }
        
        return false;
    },
    
    // Propagate burning to connected fuses
    propagateBurning: function(x, y, grid, isInBounds) {
        // Check neighboring cells for other fuses
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
            
            // If it's a fuse and not burning, light it
            if (neighbor.type === 'fuse' && !neighbor.burning) {
                neighbor.burning = true;
                neighbor.burnProgress = 0;
                return; // Only propagate to one direction per frame for a chain effect
            }
        }
    },
    
    // Ignite explosives or other materials when fuse is completely burned
    igniteNeighbors: function(x, y, grid, isInBounds) {
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
            
            // Light dynamite fuse
            if (neighbor.type === 'dynamite' && !neighbor.fuseLit) {
                neighbor.fuseLit = true;
                continue;
            }
            
            // Detonate explosives directly
            if (neighbor.type === 'c4' || neighbor.type === 'explosivePowder') {
                neighbor.scheduledDetonation = true;
                continue;
            }
            
            // Light other flammable things on fire
            if (neighbor.flammable && !neighbor.burning) {
                neighbor.burning = true;
                if (neighbor.burnDuration === undefined) {
                    neighbor.burnDuration = 100;
                }
                continue;
            }
        }
    },
    
    // Custom rendering for fuse
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        const baseColor = particle.burning ? 
            this.getBurnedColor(particle.burnProgress) : 
            particle.color;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw fuse texture
        this.drawFuseTexture(ctx, x, y, particle, CELL_SIZE);
        
        // If burning, draw the burning effect
        if (particle.burning) {
            this.drawBurningEffect(ctx, x, y, particle, CELL_SIZE);
        }
    },
    
    // Get color based on burn progress
    getBurnedColor: function(burnProgress) {
        // Transition from tan to black as it burns
        const r = Math.floor(195 * (1 - burnProgress));
        const g = Math.floor(158 * (1 - burnProgress));
        const b = Math.floor(132 * (1 - burnProgress));
        
        return `rgb(${r}, ${g}, ${b})`;
    },
    
    // Draw fuse texture
    drawFuseTexture: function(ctx, x, y, particle, CELL_SIZE) {
        // Draw spiral pattern for unburnt part
        if (!particle.burning || particle.burnProgress < 1.0) {
            ctx.strokeStyle = '#8b7355'; // Darker brown
            ctx.lineWidth = Math.max(1, CELL_SIZE * 0.1);
            
            // Determine how much of the fuse to show (for burning effect)
            const spiralLength = particle.burning ? 
                1.0 - particle.burnProgress : 1.0;
            
            if (spiralLength > 0) {
                // Draw a spiral pattern or zigzag
                ctx.beginPath();
                
                const centerX = x * CELL_SIZE + CELL_SIZE / 2;
                const centerY = y * CELL_SIZE + CELL_SIZE / 2;
                const radius = CELL_SIZE * 0.3;
                
                // Simple zigzag pattern
                ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.2, 
                           y * CELL_SIZE + CELL_SIZE * 0.5);
                
                const steps = 6;
                for (let i = 1; i <= steps * spiralLength; i++) {
                    const xOffset = (i % 2 === 0) ? 0.2 : 0.8;
                    const yOffset = 0.5 - 0.3 + (i / steps) * 0.6;
                    
                    ctx.lineTo(x * CELL_SIZE + CELL_SIZE * xOffset,
                              y * CELL_SIZE + CELL_SIZE * yOffset);
                }
                
                ctx.stroke();
            }
        }
    },
    
    // Draw burning effect
    drawBurningEffect: function(ctx, x, y, particle, CELL_SIZE) {
        // Draw burning front
        const burnPos = 1.0 - particle.burnProgress;
        
        // Position along the fuse
        const burnX = x * CELL_SIZE + CELL_SIZE * (0.2 + burnPos * 0.6);
        const burnY = y * CELL_SIZE + CELL_SIZE * (0.5 - 0.3 + burnPos * 0.6);
        
        // Draw glowing ember at burn front
        const gradientSize = CELL_SIZE * 0.3;
        const gradient = ctx.createRadialGradient(
            burnX, burnY, 0,
            burnX, burnY, gradientSize
        );
        
        gradient.addColorStop(0, 'rgba(255, 150, 0, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(burnX, burnY, gradientSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Add random sparks around burning front
        if (Math.random() < 0.7) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            
            for (let i = 0; i < 2; i++) {
                const sparkX = burnX + (Math.random() - 0.5) * CELL_SIZE * 0.4;
                const sparkY = burnY + (Math.random() - 0.5) * CELL_SIZE * 0.4;
                const sparkSize = CELL_SIZE * 0.05 * (Math.random() + 0.5);
                
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.burning = false;
        particle.burnProgress = 0;
        return particle;
    }
}; 