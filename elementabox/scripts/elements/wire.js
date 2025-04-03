// Wire element module
window.WireElement = {
    name: 'wire',
    defaultColor: '#cc7722', // Copper color
    density: 3.0,
    durability: 0.8,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    conductivity: 1.0, // Perfect conductor
    chargeTransferRate: 0.9, // How quickly it transfers charge (0-1)
    
    // Process wire particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const wire = grid[y][x];
        wire.processed = true;
        
        // Initialize electrical properties if needed
        if (wire.charged === undefined) {
            wire.charged = false;
        }
        if (wire.chargeStrength === undefined) {
            wire.chargeStrength = 0;
        }
        
        // Check for charge from neighboring cells
        this.checkForCharge(x, y, grid, isInBounds);
        
        // Conduct charge to neighboring wires and components
        if (wire.charged) {
            this.conductCharge(x, y, grid, isInBounds);
        }
        
        // Decay charge slightly over time
        this.decayCharge(wire);
    },
    
    // Check for charge from neighboring elements
    checkForCharge: function(x, y, grid, isInBounds) {
        const wire = grid[y][x];
        
        // Check neighboring cells for charge sources
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
            
            // Get charge from battery
            if (neighbor.type === 'battery' && neighbor.outputting) {
                wire.charged = true;
                wire.chargeStrength = Math.max(wire.chargeStrength, neighbor.chargeStrength || 1.0);
                wire.chargeColor = neighbor.chargeColor || '#ffff00'; // Default to yellow
                continue;
            }
            
            // Get charge from switch
            if (neighbor.type === 'switch' && neighbor.on) {
                wire.charged = true;
                wire.chargeStrength = Math.max(wire.chargeStrength, neighbor.chargeStrength || 1.0);
                wire.chargeColor = neighbor.chargeColor || '#ffff00';
                continue;
            }
            
            // Get charge from charged wire
            if (neighbor.type === 'wire' && neighbor.charged) {
                // Apply charge with some loss
                const transferredCharge = neighbor.chargeStrength * this.chargeTransferRate;
                if (transferredCharge > wire.chargeStrength) {
                    wire.charged = true;
                    wire.chargeStrength = transferredCharge;
                    wire.chargeColor = neighbor.chargeColor || '#ffff00';
                }
                continue;
            }
            
            // Static charge elements can charge the wire
            if (neighbor.type === 'staticCharge' || 
                (neighbor.staticCharged && neighbor.staticChargeStrength)) {
                wire.charged = true;
                wire.chargeStrength = Math.max(wire.chargeStrength, 
                    neighbor.staticChargeStrength || 0.7);
                wire.chargeColor = '#00ffff'; // Cyan for static electricity
                continue;
            }
        }
    },
    
    // Conduct charge to neighboring wires and electrical components
    conductCharge: function(x, y, grid, isInBounds) {
        const wire = grid[y][x];
        
        if (!wire.charged || wire.chargeStrength <= 0.1) return;
        
        // Check neighboring cells
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
            
            // Conduct to other wires
            if (neighbor.type === 'wire' && (!neighbor.charged || neighbor.chargeStrength < wire.chargeStrength * this.chargeTransferRate)) {
                neighbor.charged = true;
                neighbor.chargeStrength = wire.chargeStrength * this.chargeTransferRate;
                neighbor.chargeColor = wire.chargeColor;
                continue;
            }
            
            // Power bulbs
            if (neighbor.type === 'bulb') {
                neighbor.lit = true;
                neighbor.brightness = wire.chargeStrength;
                neighbor.litColor = wire.chargeColor;
                continue;
            }
            
            // Power other electrical components
            if (neighbor.conductsElectricity) {
                neighbor.charged = true;
                neighbor.chargeStrength = wire.chargeStrength * (neighbor.conductivity || 0.5);
                neighbor.chargeColor = wire.chargeColor;
                continue;
            }
        }
    },
    
    // Slightly decay charge over time
    decayCharge: function(wire) {
        if (!wire.charged) return;
        
        // Decrease charge strength slightly each frame
        wire.chargeStrength *= 0.999;
        
        // If charge gets too weak, remove it
        if (wire.chargeStrength < 0.1) {
            wire.charged = false;
            wire.chargeStrength = 0;
        }
    },
    
    // Custom rendering for wire
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base metal color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw wire connector appearance
        this.drawWireConnectors(ctx, x, y, particle, CELL_SIZE);
        
        // If charged, add a glow effect
        if (particle.charged && particle.chargeStrength > 0.1) {
            this.drawChargeEffect(ctx, x, y, particle, CELL_SIZE);
        }
    },
    
    // Draw wire connectors based on neighboring wires
    drawWireConnectors: function(ctx, x, y, particle, CELL_SIZE) {
        // Draw inner wire details
        ctx.fillStyle = '#ffcc99'; // Lighter copper color for highlights
        
        // Add central connection point
        const centerSize = CELL_SIZE * 0.4;
        const centerX = x * CELL_SIZE + CELL_SIZE / 2 - centerSize / 2;
        const centerY = y * CELL_SIZE + CELL_SIZE / 2 - centerSize / 2;
        
        ctx.fillRect(centerX, centerY, centerSize, centerSize);
        
        // Add connector lines
        ctx.strokeStyle = '#ffcc99';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.15);
        
        // Horizontal connector
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE / 2);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE / 2);
        ctx.stroke();
        
        // Vertical connector
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE);
        ctx.stroke();
    },
    
    // Draw charge effect for active wires
    drawChargeEffect: function(ctx, x, y, particle, CELL_SIZE) {
        const chargeColor = particle.chargeColor || '#ffff00';
        const alpha = Math.min(0.8, particle.chargeStrength);
        
        // Draw glow effect
        ctx.fillStyle = chargeColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        
        // Moving charge effect
        const time = Date.now() / 200; // Animation speed
        const pulseSize = 0.2 + Math.sin(time) * 0.1;
        
        // Center point
        const centerX = x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = y * CELL_SIZE + CELL_SIZE / 2;
        
        // Draw glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, CELL_SIZE * pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw charge traveling along the wire
        const animOffset = (time % 2) - 1.0; // -1 to 1 range
        
        // Horizontal charge
        ctx.fillRect(
            x * CELL_SIZE + (CELL_SIZE * (0.5 + animOffset / 2)),
            y * CELL_SIZE + CELL_SIZE * 0.4,
            CELL_SIZE * 0.2,
            CELL_SIZE * 0.2
        );
        
        // Vertical charge
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.4,
            y * CELL_SIZE + (CELL_SIZE * (0.5 + animOffset / 2)),
            CELL_SIZE * 0.2,
            CELL_SIZE * 0.2
        );
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.charged = false;
        particle.chargeStrength = 0;
        particle.chargeColor = '#ffff00';
        particle.conductsElectricity = true;
        return particle;
    }
}; 