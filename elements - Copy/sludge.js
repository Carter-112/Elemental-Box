// Sludge element module
window.SludgeElement = {
    name: 'sludge',
    defaultColor: '#4b6a36', // Murky green
    density: 1.3,
    durability: 0.7,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.7,
    isLiquid: true,
    isGas: false,
    isPowder: false,
    isToxic: true,
    toxicity: 0.8, // 0-1 scale
    spreadRate: 0.3, // How quickly it contaminates other elements
    viscosity: 0.8, // Not as viscous as tar, but still thick
    
    // Process sludge particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const sludge = grid[y][x];
        sludge.processed = true;
        
        // Sludge reacts with extreme heat by evaporating into toxic gas
        if (sludge.temperature > 200) {
            this.evaporateIntoToxicGas(x, y, grid, isInBounds);
            return;
        }
        
        // Solidifies in extreme cold
        if (sludge.temperature < -10 && !sludge.solidified) {
            this.solidifySludge(x, y, grid);
            return;
        }
        
        // Thaws if previously solidified
        if (sludge.solidified && sludge.temperature > 0) {
            sludge.solidified = false;
            sludge.isLiquid = true;
        }
        
        // Sludge moves like a semi-viscous liquid if not solidified
        if (!sludge.solidified) {
            this.moveLikeSemiViscousLiquid(x, y, grid, isInBounds);
        }
        
        // Contaminate nearby elements
        this.contaminateNearby(x, y, grid, isInBounds);
        
        // Emit toxic gas occasionally
        if (Math.random() < 0.01 && y > 0 && !grid[y-1][x]) {
            this.emitToxicGas(x, y-1, grid);
        }
    },
    
    // Evaporate into toxic gas when heated
    evaporateIntoToxicGas: function(x, y, grid, isInBounds) {
        // Remove the sludge particle
        grid[y][x] = null;
        
        // Create toxic gas in and around the previous position
        const gasPositions = [
            { dx: 0, dy: 0 },  // current position
            { dx: 0, dy: -1 }, // above
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
        ];
        
        for (const pos of gasPositions) {
            const newX = x + pos.dx;
            const newY = y + pos.dy;
            
            if (isInBounds(newX, newY) && (!grid[newY][newX] || Math.random() < 0.7)) {
                grid[newY][newX] = {
                    type: 'toxicGas',
                    color: '#879e66', // Lighter green for gas
                    temperature: 100,
                    processed: false,
                    isGas: true,
                    isToxic: true,
                    density: 0.3,
                    lifetime: 200 + Math.floor(Math.random() * 100),
                    age: 0,
                    toxicity: 0.9 // More toxic as gas
                };
            }
        }
    },
    
    // Emit a small amount of toxic gas
    emitToxicGas: function(x, y, grid) {
        grid[y][x] = {
            type: 'toxicGas',
            color: '#879e66', // Lighter green for gas
            temperature: grid[y+1][x].temperature, // Same temp as the sludge
            processed: false,
            isGas: true,
            isToxic: true,
            density: 0.3,
            lifetime: 100 + Math.floor(Math.random() * 50),
            age: 0,
            toxicity: 0.7
        };
    },
    
    // Solidify sludge into a solid form
    solidifySludge: function(x, y, grid) {
        grid[y][x].solidified = true;
        grid[y][x].isLiquid = false; // No longer behaves as a liquid
        grid[y][x].color = '#32492a'; // Darker when solidified
    },
    
    // Move like a semi-viscous liquid
    moveLikeSemiViscousLiquid: function(x, y, grid, isInBounds) {
        // Medium viscosity means moderate movement
        const flowChance = 0.9 - this.viscosity; // Higher viscosity = lower chance to flow
        
        // Liquid movement - try to fall down first
        if (y < grid.length - 1 && !grid[y+1][x]) {
            if (Math.random() < flowChance * 1.5) { // More likely to fall than spread
                grid[y+1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Try to spread horizontally
        if (Math.random() < flowChance) {
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
        
        // Sometimes drip through small gaps (like water, but less often)
        if (y < grid.length - 1 && Math.random() < flowChance * 0.3) {
            // Try to move diagonally down
            const diagDir = Math.random() < 0.5 ? -1 : 1;
            const newX = x + diagDir;
            const newY = y + 1;
            
            if (isInBounds(newX, newY) && !grid[newY][newX]) {
                grid[newY][newX] = grid[y][x];
                grid[y][x] = null;
            }
        }
    },
    
    // Contaminate nearby elements
    contaminateNearby: function(x, y, grid, isInBounds) {
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
            
            // Don't contaminate other sludge or highly durable materials
            if (neighbor.type === 'sludge' || 
                neighbor.type === 'stone' || 
                neighbor.type === 'metal' || 
                neighbor.durability > 0.9) {
                continue;
            }
            
            // Chance to contaminate based on spreadRate and element durability
            const contaminationChance = this.spreadRate * (1 - (neighbor.durability || 0.5));
            
            if (Math.random() < contaminationChance) {
                // Different effects based on element type
                if (neighbor.isLiquid) {
                    // Contaminate liquids by turning them into sludge
                    if (Math.random() < 0.2) { // 20% chance to fully convert
                        grid[newY][newX] = {
                            type: 'sludge',
                            color: this.defaultColor,
                            density: this.density,
                            temperature: neighbor.temperature,
                            processed: true,
                            isLiquid: true,
                            isToxic: true
                        };
                        this.updateOnCreate(grid[newY][newX]);
                    } else {
                        // Otherwise just contaminate the liquid
                        neighbor.contaminated = true;
                        // Shift color towards sludge color
                        const origColor = neighbor.originalColor || neighbor.color;
                        neighbor.originalColor = origColor;
                        
                        // Simple color blending
                        neighbor.color = this.blendColors(origColor, this.defaultColor, 0.3);
                    }
                } else if (neighbor.type === 'plant' || neighbor.type === 'grass' || neighbor.type === 'seed') {
                    // Kill plants
                    grid[newY][newX] = {
                        type: 'deadMatter',
                        color: '#595941', // Dead plant color
                        density: 0.7,
                        temperature: neighbor.temperature,
                        processed: true,
                        flammable: true,
                        isPowder: true
                    };
                } else if (neighbor.type === 'wood' || neighbor.type === 'dirt') {
                    // Contaminate solid natural materials
                    neighbor.contaminated = true;
                    if (!neighbor.originalColor) {
                        neighbor.originalColor = neighbor.color;
                    }
                    neighbor.color = this.blendColors(neighbor.originalColor, this.defaultColor, 0.2);
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
        
        // If colors aren't in hex format, return the sludge color
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
    
    // Custom rendering for sludge
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color
        ctx.fillStyle = particle.color;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        if (particle.solidified) {
            // Solidified sludge has a crusty texture
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            
            // Add random crusty bits
            for (let i = 0; i < 5; i++) {
                const dotX = Math.random() * CELL_SIZE;
                const dotY = Math.random() * CELL_SIZE;
                const dotSize = Math.random() * 3 + 1;
                
                ctx.beginPath();
                ctx.arc(
                    x * CELL_SIZE + dotX,
                    y * CELL_SIZE + dotY,
                    dotSize,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        } else {
            // Liquid sludge has a bubbly look
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            
            // Add random bubbles
            for (let i = 0; i < 3; i++) {
                const bubbleX = Math.random() * CELL_SIZE;
                const bubbleY = Math.random() * CELL_SIZE;
                const bubbleSize = Math.random() * 2 + 1;
                
                ctx.beginPath();
                ctx.arc(
                    x * CELL_SIZE + bubbleX,
                    y * CELL_SIZE + bubbleY,
                    bubbleSize,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            
            // Add toxic shimmer
            if (Math.random() < 0.3) {
                ctx.fillStyle = 'rgba(143, 197, 36, 0.2)';
                ctx.beginPath();
                ctx.arc(
                    x * CELL_SIZE + CELL_SIZE/2,
                    y * CELL_SIZE + CELL_SIZE/2,
                    CELL_SIZE * 0.3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.solidified = false;
        particle.viscosity = this.viscosity;
        particle.toxicity = this.toxicity;
        particle.isToxic = true;
        return particle;
    }
}; 