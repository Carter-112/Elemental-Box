// Switch element module
window.SwitchElement = {
    name: 'switch',
    defaultColor: '#888888', // Gray
    density: 2.5,
    durability: 0.7,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    conductivity: 1.0, // Perfect conductor when on
    
    // Process switch particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const switchElem = grid[y][x];
        switchElem.processed = true;
        
        // Initialize switch properties if needed
        if (switchElem.on === undefined) {
            switchElem.on = false;
        }
        if (switchElem.chargeStrength === undefined) {
            switchElem.chargeStrength = 0;
        }
        if (switchElem.toggled === undefined) {
            switchElem.toggled = false;
        }
        
        // Check for user interaction (toggle)
        if (switchElem.toggled) {
            switchElem.on = !switchElem.on;
            switchElem.toggled = false;
            
            // Sound effect or visual feedback could be added here
        }
        
        // Check for incoming charge
        this.checkForCharge(x, y, switchElem, grid, isInBounds);
        
        // If switch is on, output charge to connected wires
        if (switchElem.on) {
            this.outputCharge(x, y, switchElem, grid, isInBounds);
        }
    },
    
    // Check for incoming charge from batteries or powered wires
    checkForCharge: function(x, y, switchElem, grid, isInBounds) {
        // Check in each direction for power sources
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        // Start fresh - will collect new charge amount
        switchElem.charged = false;
        switchElem.chargeStrength = 0;
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Get charge from battery
            if (neighbor.type === 'battery' && neighbor.outputting) {
                switchElem.charged = true;
                switchElem.chargeStrength = Math.max(switchElem.chargeStrength, 
                    neighbor.chargeStrength || 1.0);
                switchElem.chargeColor = neighbor.chargeColor || '#ffff00';
                continue;
            }
            
            // Get charge from powered wire
            if (neighbor.type === 'wire' && neighbor.charged) {
                switchElem.charged = true;
                switchElem.chargeStrength = Math.max(switchElem.chargeStrength, 
                    neighbor.chargeStrength || 0.9);
                switchElem.chargeColor = neighbor.chargeColor || '#ffff00';
                continue;
            }
            
            // Get charge from another switch
            if (neighbor.type === 'switch' && neighbor.on && neighbor.charged) {
                switchElem.charged = true;
                switchElem.chargeStrength = Math.max(switchElem.chargeStrength, 
                    neighbor.chargeStrength || 0.9);
                switchElem.chargeColor = neighbor.chargeColor || '#ffff00';
                continue;
            }
        }
    },
    
    // Output charge to connected wires when switch is on
    outputCharge: function(x, y, switchElem, grid, isInBounds) {
        if (!switchElem.on || !switchElem.charged || switchElem.chargeStrength <= 0.1) {
            return;
        }
        
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
            
            // Output to wire
            if (neighbor.type === 'wire') {
                neighbor.charged = true;
                neighbor.chargeStrength = switchElem.chargeStrength * 0.95; // Slight loss
                neighbor.chargeColor = switchElem.chargeColor;
                continue;
            }
            
            // Output to bulb directly
            if (neighbor.type === 'bulb') {
                neighbor.lit = true;
                neighbor.brightness = switchElem.chargeStrength;
                neighbor.litColor = switchElem.chargeColor;
                continue;
            }
            
            // Output to other electrical components
            if (neighbor.conductsElectricity) {
                neighbor.charged = true;
                neighbor.chargeStrength = switchElem.chargeStrength * 
                    (neighbor.conductivity || 0.5);
                neighbor.chargeColor = switchElem.chargeColor;
                continue;
            }
        }
    },
    
    // Toggle the switch state (called externally)
    toggle: function(switchElem) {
        if (!switchElem || switchElem.type !== 'switch') return;
        switchElem.toggled = true;
    },
    
    // Custom rendering for switch
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base color varies based on state
        const baseColor = particle.on ? '#444444' : '#888888';
        
        // Fill background
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw the switch lever
        this.drawSwitchLever(ctx, x, y, particle, CELL_SIZE);
        
        // Draw charge effect if on and charged
        if (particle.on && particle.charged && particle.chargeStrength > 0.1) {
            this.drawChargeEffect(ctx, x, y, particle, CELL_SIZE);
        }
    },
    
    // Draw the switch lever in different positions
    drawSwitchLever: function(ctx, x, y, particle, CELL_SIZE) {
        const padding = CELL_SIZE * 0.1;
        const switchHeight = CELL_SIZE * 0.6;
        const switchWidth = CELL_SIZE * 0.2;
        
        // Draw switch base
        ctx.fillStyle = '#222222';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE/2 - switchWidth/2,
            y * CELL_SIZE + CELL_SIZE - padding - switchHeight/4,
            switchWidth,
            switchHeight/4
        );
        
        // Draw switch lever
        ctx.fillStyle = particle.charged && particle.on ? 
            (particle.chargeColor || '#ffff00') : '#cccccc';
            
        // Calculate angle based on switch position
        const angle = particle.on ? -Math.PI/4 : Math.PI/4;
        const centerX = x * CELL_SIZE + CELL_SIZE/2;
        const centerY = y * CELL_SIZE + CELL_SIZE - padding - switchHeight/4;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        // Draw lever
        ctx.fillRect(-switchWidth/2, -switchHeight, switchWidth, switchHeight);
        
        // Draw rounded end of lever
        ctx.beginPath();
        ctx.arc(0, -switchHeight, switchWidth/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    },
    
    // Draw charge effect when switch is on and powered
    drawChargeEffect: function(ctx, x, y, particle, CELL_SIZE) {
        const chargeColor = particle.chargeColor || '#ffff00';
        const alpha = Math.min(0.5, particle.chargeStrength * 0.7);
        
        // Create a glow around the switch
        ctx.fillStyle = chargeColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        
        // Pulsing effect
        const time = Date.now() / 150;
        const pulseSize = 0.5 + Math.sin(time) * 0.1;
        
        // Draw glow
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE/2,
            y * CELL_SIZE + CELL_SIZE/2,
            CELL_SIZE * pulseSize,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Add small sparks
        if (Math.random() < 0.3) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            const sparkX = x * CELL_SIZE + CELL_SIZE/2 + 
                (Math.random() - 0.5) * CELL_SIZE * 0.8;
            const sparkY = y * CELL_SIZE + CELL_SIZE/2 + 
                (Math.random() - 0.5) * CELL_SIZE * 0.8;
            const sparkSize = CELL_SIZE * 0.05 + Math.random() * CELL_SIZE * 0.05;
            
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.on = false;
        particle.charged = false;
        particle.chargeStrength = 0;
        particle.chargeColor = '#ffff00';
        particle.toggled = false;
        particle.conductsElectricity = true;
        return particle;
    }
}; 