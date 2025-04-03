// Steel Element
// A durable metal alloy that conducts electricity and heat

const SteelElement = {
    name: 'steel',
    label: 'Steel',
    description: 'A strong metal alloy that conducts electricity and heat',
    category: 'solid',
    defaultColor: '#8C8C8C',
    
    // Physical properties
    density: 7.8, // Very dense
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Doesn't move unless forced
    isSpawner: false,
    isElectrical: true, // Conducts electricity
    
    // Behavior properties
    flammable: false,
    conductive: true,
    explosive: false,
    reactive: false,
    corrosive: false,
    meltingPoint: 1500, // High melting point
    temperature: 25, // Room temperature
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.hasElectricity = false;
        particle.conductivityTimer = 0;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].hasElectricity === undefined) {
            grid[y][x].hasElectricity = false;
        }
        if (grid[y][x].conductivityTimer === undefined) {
            grid[y][x].conductivityTimer = 0;
        }
        
        // Handle electricity conduction
        if (grid[y][x].hasElectricity) {
            grid[y][x].conductivityTimer++;
            
            // Visual effect of electricity lasts for short duration
            if (grid[y][x].conductivityTimer > 5) {
                grid[y][x].hasElectricity = false;
                grid[y][x].conductivityTimer = 0;
            }
            
            // Conduct to neighboring conductive elements
            const directions = [
                { dx: 0, dy: -1 },  // up
                { dx: 1, dy: 0 },   // right
                { dx: 0, dy: 1 },   // down
                { dx: -1, dy: 0 },  // left
                { dx: 1, dy: -1 },  // up-right
                { dx: 1, dy: 1 },   // down-right
                { dx: -1, dy: 1 },  // down-left
                { dx: -1, dy: -1 }  // up-left
            ];
            
            for (const dir of directions) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (isInBounds(nx, ny) && grid[ny][nx]) {
                    const neighbor = grid[ny][nx];
                    // Only conduct to elements that can receive electricity and aren't already conducting
                    if (neighbor.conductive && !neighbor.hasElectricity) {
                        neighbor.hasElectricity = true;
                        neighbor.conductivityTimer = 0;
                    }
                }
            }
        }
        
        // Temperature effects - melting if temperature reaches melting point
        if (grid[y][x].temperature >= grid[y][x].meltingPoint) {
            // Convert to molten metal (lava)
            grid[y][x] = {
                type: 'lava',
                color: '#FF4400',
                temperature: grid[y][x].temperature,
                processed: true,
                isGas: false,
                isLiquid: true,
                isPowder: false,
                isSolid: false
            };
            return;
        }
        
        // Temperature equilibrium with surroundings
        let totalTemp = grid[y][x].temperature;
        let count = 1;
        
        // Check neighboring cells for temperature conduction
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (isInBounds(nx, ny) && grid[ny][nx]) {
                    totalTemp += grid[ny][nx].temperature;
                    count++;
                }
            }
        }
        
        // Steel conducts heat well, so temperature equilibrium happens faster
        const avgTemp = totalTemp / count;
        grid[y][x].temperature = grid[y][x].temperature * 0.8 + avgTemp * 0.2;
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base metal color
        let baseColor = particle.color || this.defaultColor;
        
        // If conducting electricity, add a blue glow
        if (particle.hasElectricity) {
            // Create a blue-white electrical effect
            const gradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                cellSize
            );
            
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                x * cellSize - cellSize * 0.5, 
                y * cellSize - cellSize * 0.5, 
                cellSize * 2, 
                cellSize * 2
            );
        }
        
        // Temperature effects on appearance
        if (particle.temperature > 500) {
            // Add a red glow for hot steel
            const redness = Math.min(1, (particle.temperature - 500) / 1000);
            baseColor = this.blendColors(baseColor, '#FF3300', redness * 0.7);
            
            // Glow effect for hot steel
            const heatRadius = cellSize * (0.5 + redness * 1.5);
            const glow = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                heatRadius
            );
            
            const glowIntensity = redness * 0.5;
            glow.addColorStop(0, `rgba(255, 100, 0, ${glowIntensity})`);
            glow.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = glow;
            ctx.fillRect(
                x * cellSize - heatRadius,
                y * cellSize - heatRadius,
                cellSize + heatRadius * 2,
                cellSize + heatRadius * 2
            );
        }
        
        // Draw the steel with metallic texture
        ctx.fillStyle = baseColor;
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Add metallic highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize / 2, 
            cellSize / 2
        );
        
        // Add metallic shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(
            x * cellSize + cellSize / 2, 
            y * cellSize + cellSize / 2, 
            cellSize / 2, 
            cellSize / 2
        );
    },
    
    // Helper function to blend colors for temperature effects
    blendColors: function(color1, color2, ratio) {
        // Convert hex to RGB
        const hex2rgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };
        
        // Convert RGB to hex
        const rgb2hex = (rgb) => {
            return '#' + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
        };
        
        const c1 = hex2rgb(color1);
        const c2 = hex2rgb(color2);
        
        if (!c1 || !c2) return color1;
        
        const blended = {
            r: Math.round(c1.r * (1 - ratio) + c2.r * ratio),
            g: Math.round(c1.g * (1 - ratio) + c2.g * ratio),
            b: Math.round(c1.b * (1 - ratio) + c2.b * ratio)
        };
        
        return rgb2hex(blended);
    }
};

// Make the element available globally
window.SteelElement = SteelElement; 