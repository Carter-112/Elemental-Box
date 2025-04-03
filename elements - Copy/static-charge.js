// Static Charge element module
window.StaticChargeElement = {
    name: 'static-charge', // Using hyphenated name to avoid conflict with JavaScript reserved word
    defaultColor: '#FFFF00',
    density: 0.1,    // Very light
    durability: 0.7,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: true,
    isPowder: false,
    
    // Process static charge particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const staticCharge = grid[y][x];
        staticCharge.processed = true;
        
        // Static charge has a chance to move upward (it's lighter than air)
        if (y > 0 && !grid[y-1][x] && Math.random() < 0.7) {
            grid[y-1][x] = staticCharge;
            grid[y][x] = null;
            return;
        }
        
        // It can also move diagonally upward
        const upDirections = [
            { dx: -1, dy: -1 }, // up-left
            { dx: 1, dy: -1 }   // up-right
        ];
        
        // Shuffle for random movement
        if (Math.random() < 0.5) {
            upDirections.reverse();
        }
        
        for (const dir of upDirections) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX] && Math.random() < 0.3) {
                grid[newY][newX] = staticCharge;
                grid[y][x] = null;
                return;
            }
        }
        
        // It can also move horizontally
        const horizDirections = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 }   // right
        ];
        
        // Shuffle for random movement
        if (Math.random() < 0.5) {
            horizDirections.reverse();
        }
        
        for (const dir of horizDirections) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX] && Math.random() < 0.1) {
                grid[newY][newX] = staticCharge;
                grid[y][x] = null;
                return;
            }
        }
        
        // Static charge interacts with other particles:
        
        // 1. Charges metal and creates electricity in wires
        this.energizeNearby(x, y, grid, isInBounds);
        
        // 2. Has a small chance to dissipate
        if (Math.random() < 0.01) {
            grid[y][x] = null;
            return;
        }
        
        // 3. If near water, has a chance to create a spark
        if (this.isNearWater(x, y, grid, isInBounds) && Math.random() < 0.1) {
            this.createSpark(x, y, grid, isInBounds);
        }
    },
    
    // Check if static charge is near water
    isNearWater: function(x, y, grid, isInBounds) {
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
            
            if (isInBounds(newX, newY) && grid[newY][newX]) {
                const neighbor = grid[newY][newX];
                if (neighbor.type === 'water') {
                    return true;
                }
            }
        }
        
        return false;
    },
    
    // Energize nearby conductive materials
    energizeNearby: function(x, y, grid, isInBounds) {
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
            
            if (!isInBounds(newX, newY) || !grid[newY][newX]) continue;
            
            const neighbor = grid[newY][newX];
            
            // Charge conductors like metal and wire
            if (neighbor.type === 'metal' || neighbor.type === 'steel') {
                neighbor.charged = true;
                neighbor.chargeLevel = (neighbor.chargeLevel || 0) + 1;
                
                // If overcharged, create a spark
                if (neighbor.chargeLevel > 5 && Math.random() < 0.2) {
                    this.createSpark(newX, newY, grid, isInBounds);
                }
            }
            
            // Activate wires
            if (neighbor.type === 'wire') {
                neighbor.active = true;
                neighbor.activeDuration = 10; // Stays active for 10 frames
            }
            
            // Power bulbs
            if (neighbor.type === 'bulb') {
                neighbor.lit = true;
                neighbor.litDuration = 20; // Stays lit for 20 frames
            }
            
            // Chance to ignite flammable materials
            if (neighbor.flammable && Math.random() < 0.05) {
                neighbor.burning = true;
                neighbor.burnDuration = 60; // Standard burn duration
            }
        }
    },
    
    // Create a spark effect (small fire/electricity particle)
    createSpark: function(x, y, grid, isInBounds) {
        // Find an empty cell nearby to place the spark
        const directions = [
            { dx: 0, dy: -1 }, // up
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                grid[newY][newX] = {
                    type: 'fire',
                    color: '#FFFFFF', // White/blue electric spark
                    temperature: 150,
                    processed: false,
                    burnDuration: 5,  // Very short duration
                    flammable: false,
                    isElectricSpark: true // Special flag for rendering
                };
                return;
            }
        }
    },
    
    // Custom rendering for static charge
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add electric effect with random "lightning" patterns
        const time = Date.now() * 0.01; // For animation
        
        // "Lightning bolt" effect
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(
            x * CELL_SIZE + CELL_SIZE / 2, 
            y * CELL_SIZE
        );
        
        // Create a jagged lightning path
        let currentY = 0;
        const segments = 3;
        const segmentHeight = CELL_SIZE / segments;
        
        for (let i = 0; i < segments; i++) {
            const xOffset = Math.sin(time + i * 2) * (CELL_SIZE * 0.3);
            currentY += segmentHeight;
            
            ctx.lineTo(
                x * CELL_SIZE + CELL_SIZE / 2 + xOffset,
                y * CELL_SIZE + currentY
            );
        }
        
        ctx.stroke();
        
        // Add glow effect
        const glowRadius = CELL_SIZE * (0.7 + Math.sin(time * 0.5) * 0.3);
        const gradient = ctx.createRadialGradient(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            0,
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            glowRadius
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            x * CELL_SIZE - glowRadius / 2,
            y * CELL_SIZE - glowRadius / 2,
            CELL_SIZE + glowRadius,
            CELL_SIZE + glowRadius
        );
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.lifespan = 200 + Math.random() * 300; // Random lifespan
        return particle;
    }
}; 