// Faucet element module
window.FaucetElement = {
    name: 'faucet',
    defaultColor: '#a0a0d0', // Light bluish gray
    density: 3.0, // Heavy, stays in place
    durability: 0.9,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    emissionRate: 0.3, // Chance to emit water each frame
    
    // Process faucet particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const faucet = grid[y][x];
        faucet.processed = true;
        
        // Initialize faucet properties if needed
        if (faucet.on === undefined) {
            faucet.on = true; // Default is on
        }
        if (faucet.fluid === undefined) {
            faucet.fluid = 'water'; // Default fluid type
        }
        if (faucet.emissionRate === undefined) {
            faucet.emissionRate = this.emissionRate;
        }
        
        // Check if we should toggle the faucet
        this.checkForToggle(x, y, faucet, grid, isInBounds);
        
        // Only emit fluid if turned on
        if (faucet.on) {
            this.emitFluid(x, y, faucet, grid, isInBounds);
        }
    },
    
    // Check if the faucet should be toggled on/off
    checkForToggle: function(x, y, faucet, grid, isInBounds) {
        // User can click on the faucet to toggle it
        if (faucet.clicked) {
            faucet.on = !faucet.on;
            faucet.clicked = false;
            
            // Play a sound effect (if supported)
            if (typeof window !== 'undefined' && window.playSound) {
                window.playSound('tap', 0.5);
            }
        }
        
        // Faucet can also be controlled by switches or water pressure
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Turn on/off based on switch
            if (neighbor.type === 'switch') {
                if (neighbor.on !== undefined) {
                    faucet.on = neighbor.on;
                }
            }
        }
    },
    
    // Emit fluid from the faucet
    emitFluid: function(x, y, faucet, grid, isInBounds) {
        // Check the space below the faucet
        const emitX = x;
        const emitY = y + 1;
        
        if (!isInBounds(emitX, emitY)) return;
        
        // Only emit if the space below is empty
        if (!grid[emitY][emitX] && Math.random() < faucet.emissionRate) {
            // Create the appropriate fluid particle
            switch (faucet.fluid) {
                case 'water':
                    grid[emitY][emitX] = {
                        type: 'water',
                        color: '#4444ff',
                        density: 1.0,
                        temperature: 20, // Cool water
                        isLiquid: true,
                        stickiness: 0,
                        velocityY: 0.2, // Initial downward velocity
                        processed: true
                    };
                    break;
                case 'oil':
                    grid[emitY][emitX] = {
                        type: 'oil',
                        color: '#8a6642',
                        density: 0.8,
                        temperature: faucet.temperature || 25,
                        isLiquid: true,
                        flammable: true,
                        stickiness: 0.1,
                        velocityY: 0.2,
                        processed: true
                    };
                    break;
                case 'lava':
                    grid[emitY][emitX] = {
                        type: 'lava',
                        color: '#ff4400',
                        density: 1.8,
                        temperature: 1000,
                        isLiquid: true,
                        stickiness: 0.2,
                        velocityY: 0.15, // Lava flows more slowly
                        processed: true
                    };
                    break;
                case 'acid':
                    grid[emitY][emitX] = {
                        type: 'acid',
                        color: '#aaff00', // Bright yellowish green
                        density: 1.2,
                        temperature: faucet.temperature || 25,
                        isLiquid: true,
                        corrosive: true,
                        corrosionStrength: 0.1,
                        velocityY: 0.2,
                        processed: true
                    };
                    break;
                default:
                    // Default to water if unknown fluid type
                    grid[emitY][emitX] = {
                        type: 'water',
                        color: '#4444ff',
                        density: 1.0,
                        temperature: 20,
                        isLiquid: true,
                        stickiness: 0,
                        velocityY: 0.2,
                        processed: true
                    };
            }
            
            // Add some randomness to the fluid's velocity for realism
            const particle = grid[emitY][emitX];
            particle.velocityX = (Math.random() - 0.5) * 0.1;
        }
    },
    
    // Custom rendering for faucet
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw faucet shape
        this.drawFaucetBody(ctx, x, y, particle, CELL_SIZE);
        
        // Draw spout
        this.drawFaucetSpout(ctx, x, y, particle, CELL_SIZE);
        
        // Draw handle
        this.drawFaucetHandle(ctx, x, y, particle, CELL_SIZE);
        
        // Draw drip effect if on
        if (particle.on) {
            this.drawWaterDrip(ctx, x, y, particle, CELL_SIZE);
        }
    },
    
    // Draw the main body of the faucet
    drawFaucetBody: function(ctx, x, y, particle, CELL_SIZE) {
        // Main pipe/body
        ctx.fillStyle = '#888888'; // Metallic gray
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.3, 
            y * CELL_SIZE, 
            CELL_SIZE * 0.4, 
            CELL_SIZE * 0.6
        );
        
        // Highlight
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.35, 
            y * CELL_SIZE, 
            CELL_SIZE * 0.1, 
            CELL_SIZE * 0.6
        );
    },
    
    // Draw the spout of the faucet
    drawFaucetSpout: function(ctx, x, y, particle, CELL_SIZE) {
        // Spout
        ctx.fillStyle = '#777777';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.2, 
            y * CELL_SIZE + CELL_SIZE * 0.6, 
            CELL_SIZE * 0.6, 
            CELL_SIZE * 0.15
        );
        
        // Spout opening
        ctx.fillStyle = '#555555';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.35, 
            y * CELL_SIZE + CELL_SIZE * 0.75, 
            CELL_SIZE * 0.3, 
            CELL_SIZE * 0.15
        );
        
        // Spout opening inner (darker)
        ctx.fillStyle = '#333333';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.4, 
            y * CELL_SIZE + CELL_SIZE * 0.75, 
            CELL_SIZE * 0.2, 
            CELL_SIZE * 0.15
        );
    },
    
    // Draw the handle of the faucet
    drawFaucetHandle: function(ctx, x, y, particle, CELL_SIZE) {
        const handleAngle = particle.on ? Math.PI / 4 : -Math.PI / 4;
        
        // Handle base
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE * 0.7,
            y * CELL_SIZE + CELL_SIZE * 0.3,
            CELL_SIZE * 0.1,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Handle
        ctx.save();
        ctx.translate(
            x * CELL_SIZE + CELL_SIZE * 0.7,
            y * CELL_SIZE + CELL_SIZE * 0.3
        );
        ctx.rotate(handleAngle);
        
        ctx.fillStyle = '#444444';
        ctx.fillRect(
            0, 
            -CELL_SIZE * 0.05, 
            CELL_SIZE * 0.25, 
            CELL_SIZE * 0.1
        );
        
        // Handle knob
        ctx.fillStyle = '#666666';
        ctx.beginPath();
        ctx.arc(
            CELL_SIZE * 0.25,
            0,
            CELL_SIZE * 0.07,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw water dripping effect
    drawWaterDrip: function(ctx, x, y, particle, CELL_SIZE) {
        // Randomize drip positions for animation effect
        const time = Date.now() / 100;
        const drips = 3;
        
        for (let i = 0; i < drips; i++) {
            const offset = (time + i * 120) % 100 / 100;
            const size = CELL_SIZE * (0.08 - offset * 0.03);
            
            // Only draw if in the valid range
            if (offset < 0.8) {
                // Drip path is curved slightly
                const xPos = x * CELL_SIZE + CELL_SIZE * 0.5 + Math.sin(offset * Math.PI) * CELL_SIZE * 0.05;
                const yPos = y * CELL_SIZE + CELL_SIZE * 0.8 + offset * CELL_SIZE * 0.8;
                
                let fluidColor;
                switch (particle.fluid) {
                    case 'water': fluidColor = 'rgba(68, 68, 255, 0.7)'; break;
                    case 'oil': fluidColor = 'rgba(138, 102, 66, 0.7)'; break;
                    case 'lava': fluidColor = 'rgba(255, 68, 0, 0.8)'; break;
                    case 'acid': fluidColor = 'rgba(170, 255, 0, 0.7)'; break;
                    default: fluidColor = 'rgba(68, 68, 255, 0.7)';
                }
                
                // Draw drip
                ctx.fillStyle = fluidColor;
                ctx.beginPath();
                ctx.arc(xPos, yPos, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.on = true;
        particle.fluid = 'water';
        particle.emissionRate = this.emissionRate;
        return particle;
    }
}; 