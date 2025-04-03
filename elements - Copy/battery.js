// Battery element module
window.BatteryElement = {
    name: 'battery',
    defaultColor: '#3a7e3a', // Dark green 
    density: 2.0,
    durability: 0.7,
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0.1,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    conductivity: 0.9, // Very conductive
    chargeStrength: 1.0, // Full power output
    chargeColor: '#ffffaa', // Light yellow
    maxCharge: 1000, // How much charge the battery holds
    
    // Process battery particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const battery = grid[y][x];
        battery.processed = true;
        
        // Initialize battery properties if needed
        if (battery.charge === undefined) {
            battery.charge = this.maxCharge;
        }
        if (battery.outputting === undefined) {
            battery.outputting = true;
        }
        if (battery.depleted === undefined) {
            battery.depleted = false;
        }
        if (battery.chargeColor === undefined) {
            battery.chargeColor = this.chargeColor;
        }
        if (battery.chargeStrength === undefined) {
            battery.chargeStrength = this.chargeStrength;
        }
        
        // Skip further processing if depleted
        if (battery.depleted) return;
        
        // Check if battery should output charge
        if (battery.outputting) {
            this.outputCharge(x, y, battery, grid, isInBounds);
        }
        
        // Update battery status based on charge level
        this.updateBatteryStatus(battery);
        
        // Handle temperature effects
        this.handleTemperatureEffects(x, y, battery, grid, isInBounds);
    },
    
    // Output electrical charge to connected wires, bulbs, etc.
    outputCharge: function(x, y, battery, grid, isInBounds) {
        if (battery.depleted) return;
        
        // Directions to check for connections
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        let connectedCount = 0;
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Charge connected wires
            if (neighbor.type === 'wire') {
                neighbor.charged = true;
                neighbor.chargeStrength = battery.chargeStrength;
                neighbor.chargeColor = battery.chargeColor;
                connectedCount++;
            }
            
            // Power bulbs directly
            if (neighbor.type === 'bulb' && !neighbor.broken) {
                neighbor.lit = true;
                neighbor.receivingPower = true;
                neighbor.brightness = Math.max(neighbor.brightness || 0, battery.chargeStrength);
                neighbor.litColor = battery.chargeColor;
                connectedCount++;
            }
            
            // Power switches
            if (neighbor.type === 'switch') {
                neighbor.charged = true;
                neighbor.chargeStrength = battery.chargeStrength;
                neighbor.chargeColor = battery.chargeColor;
                connectedCount++;
            }
        }
        
        // Drain battery charge based on how many connections are drawing power
        if (connectedCount > 0) {
            // More connections drain battery faster
            battery.charge -= 0.1 * connectedCount;
        }
    },
    
    // Update battery status based on charge level
    updateBatteryStatus: function(battery) {
        // Check if battery is depleted
        if (battery.charge <= 0) {
            battery.depleted = true;
            battery.outputting = false;
            battery.charge = 0;
            battery.color = '#555555'; // Darkened color for depleted battery
            return;
        }
        
        // Visualize charge level with color
        if (battery.charge < this.maxCharge * 0.1) {
            // Low charge - reddish
            battery.color = '#7e3a3a';
            battery.chargeStrength = 0.6; // Reduced power
        } else if (battery.charge < this.maxCharge * 0.5) {
            // Medium charge - yellowish green
            battery.color = '#7e7e3a';
            battery.chargeStrength = 0.8; // Slightly reduced power
        } else {
            // Full charge - green
            battery.color = this.defaultColor;
            battery.chargeStrength = this.chargeStrength; // Full power
        }
    },
    
    // Handle temperature effects on battery
    handleTemperatureEffects: function(x, y, battery, grid, isInBounds) {
        // Batteries can explode or leak if too hot
        if (battery.temperature > 150) {
            // Chance to explode increases with temperature
            const explodeChance = (battery.temperature - 150) / 500;
            
            if (Math.random() < explodeChance) {
                this.explodeBattery(x, y, battery, grid, isInBounds);
                return;
            }
            
            // Chance to leak
            const leakChance = (battery.temperature - 150) / 300;
            if (Math.random() < leakChance) {
                this.leakBattery(x, y, battery, grid, isInBounds);
            }
        }
    },
    
    // Explode the battery
    explodeBattery: function(x, y, battery, grid, isInBounds) {
        // Create an explosion
        const explosionRadius = 3 + Math.floor(battery.charge / this.maxCharge * 5);
        const explosionPower = 0.3 + (battery.charge / this.maxCharge) * 0.7;
        
        for (let i = -explosionRadius; i <= explosionRadius; i++) {
            for (let j = -explosionRadius; j <= explosionRadius; j++) {
                const distance = Math.sqrt(i*i + j*j);
                if (distance > explosionRadius) continue;
                
                const newX = x + i;
                const newY = y + j;
                
                if (!isInBounds(newX, newY)) continue;
                
                // Different effects based on distance from explosion center
                if (distance < 2) {
                    // Center of explosion - create fire or empty space
                    if (Math.random() < 0.7) {
                        // Create fire
                        grid[newY][newX] = {
                            type: 'fire',
                            temperature: 800,
                            lifetime: 100 + Math.floor(Math.random() * 100),
                            color: '#ff9900',
                            processed: true
                        };
                    } else {
                        // Empty space
                        grid[newY][newX] = null;
                    }
                } else {
                    // Outer explosion - affect existing particles
                    const particle = grid[newY][newX];
                    if (particle) {
                        // Heat up particles
                        particle.temperature += 200 * (1 - distance/explosionRadius);
                        
                        // Push particles away from explosion
                        const pushForce = explosionPower * (1 - distance/explosionRadius);
                        const angle = Math.atan2(j, i);
                        
                        // Store movement vectors
                        if (!particle.velocityX) particle.velocityX = 0;
                        if (!particle.velocityY) particle.velocityY = 0;
                        
                        particle.velocityX += Math.cos(angle) * pushForce;
                        particle.velocityY += Math.sin(angle) * pushForce;
                    }
                }
            }
        }
        
        // Remove the battery itself
        grid[y][x] = null;
    },
    
    // Leak battery acid
    leakBattery: function(x, y, battery, grid, isInBounds) {
        // Find an empty adjacent space to leak into
        const directions = [
            { dx: 0, dy: 1 }, // prioritize down
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }  // up
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            if (!grid[newY][newX]) {
                // Create battery acid (a corrosive liquid)
                grid[newY][newX] = {
                    type: 'acid',
                    temperature: battery.temperature,
                    color: '#aaff00', // Bright yellowish green
                    isLiquid: true,
                    density: 1.2,
                    corrosive: true,
                    corrosionStrength: 0.1,
                    processed: true
                };
                
                // Reduce battery charge
                battery.charge -= this.maxCharge * 0.1;
                this.updateBatteryStatus(battery);
                
                break;
            }
        }
    },
    
    // Custom rendering for battery
    render: function(ctx, x, y, particle, CELL_SIZE) {
        if (!ctx || typeof ctx.fillRect !== 'function') {
            console.error('Battery render: invalid drawing context provided:', ctx);
            return;
        }
        
        // Draw base color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw battery details
        this.drawBatteryBody(ctx, x, y, particle, CELL_SIZE);
        
        // Draw charge level indicator
        if (!particle.depleted) {
            this.drawChargeIndicator(ctx, x, y, particle, CELL_SIZE);
        }
        
        // Draw terminals
        this.drawTerminals(ctx, x, y, particle, CELL_SIZE);
    },
    
    // Draw the main battery body
    drawBatteryBody: function(ctx, x, y, particle, CELL_SIZE) {
        // Draw battery outline
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.05);
        ctx.strokeRect(
            x * CELL_SIZE + CELL_SIZE * 0.15, 
            y * CELL_SIZE + CELL_SIZE * 0.1, 
            CELL_SIZE * 0.7, 
            CELL_SIZE * 0.8
        );
    },
    
    // Draw charge level indicator
    drawChargeIndicator: function(ctx, x, y, particle, CELL_SIZE) {
        // Calculate charge ratio
        const chargeRatio = particle.charge / this.maxCharge;
        
        // Draw charge level background
        ctx.fillStyle = '#222222';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.25,
            y * CELL_SIZE + CELL_SIZE * 0.3,
            CELL_SIZE * 0.5,
            CELL_SIZE * 0.4
        );
        
        // Draw charge level foreground
        let chargeColor;
        if (chargeRatio < 0.2) {
            chargeColor = '#ff3333'; // Red for low charge
        } else if (chargeRatio < 0.5) {
            chargeColor = '#ffaa33'; // Orange for medium charge
        } else {
            chargeColor = '#33ff33'; // Green for high charge
        }
        
        ctx.fillStyle = chargeColor;
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.25,
            y * CELL_SIZE + CELL_SIZE * 0.3,
            CELL_SIZE * 0.5 * chargeRatio,
            CELL_SIZE * 0.4
        );
    },
    
    // Draw battery terminals
    drawTerminals: function(ctx, x, y, particle, CELL_SIZE) {
        // Positive terminal
        ctx.fillStyle = '#dd0000'; // Red
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE * 0.3,
            y * CELL_SIZE + CELL_SIZE * 0.15,
            CELL_SIZE * 0.1,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Plus sign
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.03);
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.3, y * CELL_SIZE + CELL_SIZE * 0.1);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.3, y * CELL_SIZE + CELL_SIZE * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.25, y * CELL_SIZE + CELL_SIZE * 0.15);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.35, y * CELL_SIZE + CELL_SIZE * 0.15);
        ctx.stroke();
        
        // Negative terminal
        ctx.fillStyle = '#0000dd'; // Blue
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE * 0.7,
            y * CELL_SIZE + CELL_SIZE * 0.15,
            CELL_SIZE * 0.1,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Minus sign
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.65, y * CELL_SIZE + CELL_SIZE * 0.15);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.75, y * CELL_SIZE + CELL_SIZE * 0.15);
        ctx.stroke();
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.charge = this.maxCharge;
        particle.outputting = true;
        particle.depleted = false;
        particle.chargeColor = this.chargeColor;
        particle.chargeStrength = this.chargeStrength;
        return particle;
    }
}; 