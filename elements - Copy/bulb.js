// Bulb element module
window.BulbElement = {
    name: 'bulb',
    defaultColor: '#e0e0e0', // Light gray (glass)
    density: 1.5,
    durability: 0.3, // Fragile
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    conductivity: 0.8, // Good conductor
    lightRadius: 5, // Radius of light emission when lit
    
    // Process bulb particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const bulb = grid[y][x];
        bulb.processed = true;
        
        // Initialize bulb properties if needed
        if (bulb.lit === undefined) {
            bulb.lit = false;
        }
        if (bulb.brightness === undefined) {
            bulb.brightness = 0;
        }
        if (bulb.litColor === undefined) {
            bulb.litColor = '#ffffaa'; // Default warm light color
        }
        if (bulb.broken === undefined) {
            bulb.broken = false;
        }
        
        // Check if bulb should be lit from a connected wire or power source
        if (!bulb.broken) {
            this.checkForPower(x, y, bulb, grid, isInBounds);
        }
        
        // If lit, generate heat and light
        if (bulb.lit && !bulb.broken) {
            this.handleLitBulb(x, y, bulb, grid, isInBounds);
        }
        
        // Check if bulb should break
        if (!bulb.broken && this.shouldBreak(bulb)) {
            this.breakBulb(bulb);
        }
        
        // Gradually fade light if not receiving power
        if (!bulb.receivingPower && bulb.brightness > 0) {
            bulb.brightness *= 0.9;
            if (bulb.brightness < 0.05) {
                bulb.lit = false;
                bulb.brightness = 0;
            }
        }
        
        // Reset power flag for next frame
        bulb.receivingPower = false;
    },
    
    // Check if the bulb should be powered
    checkForPower: function(x, y, bulb, grid, isInBounds) {
        // Check adjacent cells for power sources
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
            
            // Get power from wire
            if (neighbor.type === 'wire' && neighbor.charged) {
                bulb.lit = true;
                bulb.receivingPower = true;
                bulb.brightness = Math.max(bulb.brightness, neighbor.chargeStrength || 0.8);
                bulb.litColor = neighbor.chargeColor || '#ffffaa';
                continue;
            }
            
            // Get power from battery directly
            if (neighbor.type === 'battery' && neighbor.outputting) {
                bulb.lit = true;
                bulb.receivingPower = true;
                bulb.brightness = Math.max(bulb.brightness, neighbor.chargeStrength || 1.0);
                bulb.litColor = neighbor.chargeColor || '#ffffaa';
                continue;
            }
            
            // Get power from switch
            if (neighbor.type === 'switch' && neighbor.on && neighbor.charged) {
                bulb.lit = true;
                bulb.receivingPower = true;
                bulb.brightness = Math.max(bulb.brightness, neighbor.chargeStrength || 0.9);
                bulb.litColor = neighbor.chargeColor || '#ffffaa';
                continue;
            }
        }
    },
    
    // Handle effects when bulb is lit
    handleLitBulb: function(x, y, bulb, grid, isInBounds) {
        // Increase temperature based on brightness
        bulb.temperature += bulb.brightness * 0.5;
        
        // Too hot can cause the bulb to break
        if (bulb.temperature > 150 && Math.random() < 0.001 * (bulb.temperature - 150) / 50) {
            this.breakBulb(bulb);
            return;
        }
        
        // Generate light particles in empty spaces around the bulb
        if (Math.random() < 0.05 * bulb.brightness) {
            this.emitLight(x, y, bulb, grid, isInBounds);
        }
    },
    
    // Emit light particles around the bulb
    emitLight: function(x, y, bulb, grid, isInBounds) {
        // Check in a radius around the bulb
        const radius = Math.floor(this.lightRadius * bulb.brightness);
        
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                // Skip center (bulb itself)
                if (i === 0 && j === 0) continue;
                
                const distance = Math.sqrt(i*i + j*j);
                if (distance > radius) continue;
                
                const newX = x + i;
                const newY = y + j;
                
                if (!isInBounds(newX, newY)) continue;
                
                // Only emit light in empty spaces, with probability decreasing with distance
                if (!grid[newY][newX] && Math.random() < (1 - distance/radius) * 0.1) {
                    // Create a temporary light particle
                    grid[newY][newX] = {
                        type: 'light',
                        color: this.getLightColor(bulb.litColor, distance/radius),
                        density: 0.01,
                        temperature: bulb.temperature * 0.5,
                        processed: true,
                        isGas: true,
                        lifetime: 5 + Math.floor(Math.random() * 5),
                        age: 0,
                        fromBulb: true,
                        sourceX: x,
                        sourceY: y
                    };
                }
            }
        }
    },
    
    // Get adjusted light color based on distance
    getLightColor: function(baseColor, distanceRatio) {
        // Convert hex to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Extract RGB components
        let rgb = hexToRgb(baseColor);
        if (!rgb) {
            rgb = { r: 255, g: 255, b: 170 }; // Default warm light
        }
        
        // Calculate alpha based on distance
        const alpha = Math.max(0.1, 1 - distanceRatio);
        
        // Return rgba color with adjusted alpha
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    },
    
    // Check if bulb should break
    shouldBreak: function(bulb) {
        // Bulbs can break due to:
        
        // 1. High temperature
        if (bulb.temperature > 200 && Math.random() < 0.01) {
            return true;
        }
        
        // 2. Power surges (very bright)
        if (bulb.brightness > 1.5 && Math.random() < 0.05 * bulb.brightness) {
            return true;
        }
        
        return false;
    },
    
    // Break the bulb
    breakBulb: function(bulb) {
        bulb.broken = true;
        bulb.lit = false;
        bulb.brightness = 0;
        bulb.color = '#888888'; // Darkened, broken glass
    },
    
    // Custom rendering for bulb
    render: function(ctx, x, y, particle, CELL_SIZE) {
        if (particle.broken) {
            // Render broken bulb
            this.renderBrokenBulb(ctx, x, y, particle, CELL_SIZE);
        } else {
            // Render normal bulb
            this.renderNormalBulb(ctx, x, y, particle, CELL_SIZE);
            
            // Add light effect when lit
            if (particle.lit && particle.brightness > 0.1) {
                this.renderLightEffect(ctx, x, y, particle, CELL_SIZE);
            }
        }
    },
    
    // Render normal bulb
    renderNormalBulb: function(ctx, x, y, particle, CELL_SIZE) {
        // Base glass color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Bulb shape
        const bulbWidth = CELL_SIZE * 0.7;
        const bulbHeight = CELL_SIZE * 0.7;
        const bulbX = x * CELL_SIZE + (CELL_SIZE - bulbWidth) / 2;
        const bulbY = y * CELL_SIZE + (CELL_SIZE - bulbHeight) / 2;
        
        // Draw bulb glass (slightly transparent)
        ctx.fillStyle = 'rgba(250, 250, 250, 0.7)';
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE/2,
            y * CELL_SIZE + CELL_SIZE * 0.4,
            CELL_SIZE * 0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw metal base
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.3,
            y * CELL_SIZE + CELL_SIZE * 0.7,
            CELL_SIZE * 0.4,
            CELL_SIZE * 0.3
        );
        
        // Draw filament
        ctx.strokeStyle = particle.lit ? particle.litColor : '#888888';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.05);
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.4, y * CELL_SIZE + CELL_SIZE * 0.7);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.4, y * CELL_SIZE + CELL_SIZE * 0.4);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.6, y * CELL_SIZE + CELL_SIZE * 0.4);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.6, y * CELL_SIZE + CELL_SIZE * 0.7);
        ctx.stroke();
    },
    
    // Render broken bulb
    renderBrokenBulb: function(ctx, x, y, particle, CELL_SIZE) {
        // Darker base color
        ctx.fillStyle = particle.color || '#888888';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Broken bulb appearance
        // Draw metal base
        ctx.fillStyle = '#777777';
        ctx.fillRect(
            x * CELL_SIZE + CELL_SIZE * 0.3,
            y * CELL_SIZE + CELL_SIZE * 0.7,
            CELL_SIZE * 0.4,
            CELL_SIZE * 0.3
        );
        
        // Draw broken glass shards
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        
        // Random shards
        for (let i = 0; i < 5; i++) {
            const shardX = x * CELL_SIZE + Math.random() * CELL_SIZE;
            const shardY = y * CELL_SIZE + Math.random() * CELL_SIZE * 0.7;
            const shardSize = Math.random() * CELL_SIZE * 0.15 + CELL_SIZE * 0.05;
            
            ctx.save();
            ctx.translate(shardX, shardY);
            ctx.rotate(Math.random() * Math.PI);
            
            // Triangle shard
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(shardSize, -shardSize/3);
            ctx.lineTo(shardSize/2, shardSize);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
        
        // Broken filament
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.05);
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.4, y * CELL_SIZE + CELL_SIZE * 0.7);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.4, y * CELL_SIZE + CELL_SIZE * 0.55);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE * 0.6, y * CELL_SIZE + CELL_SIZE * 0.7);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.6, y * CELL_SIZE + CELL_SIZE * 0.5);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE * 0.5, y * CELL_SIZE + CELL_SIZE * 0.4);
        ctx.stroke();
    },
    
    // Render light effect
    renderLightEffect: function(ctx, x, y, particle, CELL_SIZE) {
        // Create a radial gradient for the light
        const gradient = ctx.createRadialGradient(
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            0,
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            CELL_SIZE * particle.brightness * 1.2
        );
        
        // Get base light color
        const lightColor = particle.litColor || '#ffffaa';
        
        // Extract RGB from hex
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : { r: 255, g: 255, b: 170 };
        };
        
        const rgb = hexToRgb(lightColor);
        
        // Create glowing effect
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.brightness * 0.8})`);
        gradient.addColorStop(0.7, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.brightness * 0.2})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE/2,
            y * CELL_SIZE + CELL_SIZE/2,
            CELL_SIZE * particle.brightness * 1.2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Add inner glow
        const innerGlow = ctx.createRadialGradient(
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE * 0.4, 
            0,
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE * 0.4, 
            CELL_SIZE * 0.3
        );
        
        innerGlow.addColorStop(0, `rgba(255, 255, 255, ${particle.brightness})`);
        innerGlow.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.brightness * 0.5})`);
        innerGlow.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE/2,
            y * CELL_SIZE + CELL_SIZE * 0.4,
            CELL_SIZE * 0.3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.temperature = this.defaultTemperature;
        particle.lit = false;
        particle.brightness = 0;
        particle.litColor = '#ffffaa';
        particle.broken = false;
        particle.conductsElectricity = true;
        return particle;
    }
}; 