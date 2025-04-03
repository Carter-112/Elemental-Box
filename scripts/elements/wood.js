// Wood Element
// A flammable solid material

const WoodElement = {
    name: 'wood',
    label: 'Wood',
    description: 'A flammable solid material that burns',
    category: 'solid',
    defaultColor: '#8B4513', // Brown wood color
    
    // Physical properties
    density: 0.7, // Less dense than water
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Doesn't move unless burned
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true,
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // Room temperature
    ignitionTemp: 200, // Temperature at which it catches fire
    burnRate: 0.2, // Medium burn rate
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.burning = false;
        particle.burnTimer = 0;
        particle.integrity = 100; // Wood integrity, decreases as it burns
        particle.grainPattern = Math.floor(Math.random() * 4); // Wood grain pattern variation
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].burning === undefined) {
            grid[y][x].burning = false;
        }
        if (grid[y][x].burnTimer === undefined) {
            grid[y][x].burnTimer = 0;
        }
        if (grid[y][x].integrity === undefined) {
            grid[y][x].integrity = 100;
        }
        if (grid[y][x].grainPattern === undefined) {
            grid[y][x].grainPattern = Math.floor(Math.random() * 4);
        }
        
        // Temperature effects
        if (grid[y][x].temperature >= grid[y][x].ignitionTemp && !grid[y][x].burning) {
            grid[y][x].burning = true;
            grid[y][x].burnTimer = 0;
        }
        
        // Handle burning state
        if (grid[y][x].burning) {
            // Increase temperature while burning
            grid[y][x].temperature += 2;
            
            // Increment burn timer
            grid[y][x].burnTimer++;
            
            // Reduce integrity as it burns
            grid[y][x].integrity -= grid[y][x].burnRate;
            
            // Check if water is nearby to extinguish fire
            let waterNearby = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (isInBounds(nx, ny) && grid[ny][nx] && grid[ny][nx].type === 'water') {
                        waterNearby = true;
                        
                        // Consume some water in the process
                        if (Math.random() < 0.2) {
                            grid[ny][nx] = {
                                type: 'steam',
                                color: '#DDDDDD',
                                temperature: 110,
                                processed: true,
                                isGas: true,
                                isLiquid: false,
                                isPowder: false,
                                isSolid: false
                            };
                        }
                        
                        break;
                    }
                }
                if (waterNearby) break;
            }
            
            // Extinguish if water is nearby
            if (waterNearby) {
                grid[y][x].burning = false;
                grid[y][x].temperature = Math.max(25, grid[y][x].temperature - 50);
            } else {
                // Chance to spread fire to flammable neighbors if no water
                if (grid[y][x].burnTimer % 10 === 0) {
                    // Look at neighboring cells
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (isInBounds(nx, ny) && grid[ny][nx]) {
                                // If neighbor is flammable, chance to ignite it
                                if (grid[ny][nx].flammable && !grid[ny][nx].burning && 
                                    grid[ny][nx].temperature < grid[ny][nx].ignitionTemp) {
                                    // Heat up neighbor
                                    grid[ny][nx].temperature += 15;
                                    
                                    // Small chance to directly ignite
                                    if (Math.random() < 0.15) {
                                        grid[ny][nx].burning = true;
                                        grid[ny][nx].burnTimer = 0;
                                    }
                                }
                            }
                        }
                    }
                
                    // Generate smoke while burning
                    if (isInBounds(x, y - 1) && !grid[y - 1][x] && Math.random() < 0.3) {
                        grid[y - 1][x] = {
                            type: 'smoke',
                            color: '#777777',
                            temperature: grid[y][x].temperature * 0.7,
                            processed: true,
                            isGas: true,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false,
                            lifetime: 100 + Math.floor(Math.random() * 100),
                            velocity: {
                                x: (Math.random() * 0.4) - 0.2,
                                y: -0.5 - (Math.random() * 0.3)
                            }
                        };
                    }
                }
            }
            
            // Wood burns down to ash
            if (grid[y][x].integrity <= 0) {
                // Turn into ash
                grid[y][x] = {
                    type: 'ash',
                    color: '#555555',
                    temperature: Math.min(grid[y][x].temperature, 200),
                    processed: true,
                    isPowder: true,
                    isLiquid: false,
                    isGas: false,
                    isSolid: false
                };
                return;
            }
        } else {
            // Slowly cool down if not burning
            if (grid[y][x].temperature > 25) {
                grid[y][x].temperature -= 0.5;
            }
            
            // Heat conduction from surroundings
            let totalTemp = grid[y][x].temperature;
            let count = 1;
            
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
            
            // Update temperature based on surroundings (wood is a poor heat conductor)
            const avgTemp = totalTemp / count;
            grid[y][x].temperature = grid[y][x].temperature * 0.9 + avgTemp * 0.1;
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base wood color, adjusted by burning/integrity
        let baseColor = particle.color || this.defaultColor;
        
        // Adjust color based on integrity (darkens as it burns)
        if (particle.integrity < 100) {
            const burnRatio = (100 - particle.integrity) / 100;
            baseColor = this.blendColors(baseColor, '#000000', burnRatio * 0.7);
        }
        
        // Draw the wood
        ctx.fillStyle = baseColor;
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Add wood grain texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        
        // Different grain patterns
        switch (particle.grainPattern % 4) {
            case 0: // Vertical grain
                const grainWidth = cellSize * 0.1;
                for (let i = 0; i < 3; i++) {
                    const grainX = x * cellSize + cellSize * 0.2 + i * grainWidth * 2;
                    ctx.fillRect(
                        grainX,
                        y * cellSize,
                        grainWidth,
                        cellSize
                    );
                }
                break;
                
            case 1: // Horizontal grain
                const hgrainHeight = cellSize * 0.1;
                for (let i = 0; i < 3; i++) {
                    const grainY = y * cellSize + cellSize * 0.2 + i * hgrainHeight * 2;
                    ctx.fillRect(
                        x * cellSize,
                        grainY,
                        cellSize,
                        hgrainHeight
                    );
                }
                break;
                
            case 2: // Ring pattern
                const centerX = x * cellSize + cellSize / 2;
                const centerY = y * cellSize + cellSize / 2;
                const ringCount = 2 + Math.floor(Math.random() * 2);
                
                for (let i = 0; i < ringCount; i++) {
                    const ringRadius = cellSize * (0.2 + i * 0.15);
                    ctx.beginPath();
                    ctx.arc(
                        centerX,
                        centerY,
                        ringRadius,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                }
                break;
                
            case 3: // Knot pattern
                const knotX = x * cellSize + cellSize * (0.3 + Math.random() * 0.4);
                const knotY = y * cellSize + cellSize * (0.3 + Math.random() * 0.4);
                const knotSize = cellSize * 0.15;
                
                // Dark knot center
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.beginPath();
                ctx.arc(
                    knotX,
                    knotY,
                    knotSize,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
                
                // Knot rings
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                for (let i = 1; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.arc(
                        knotX,
                        knotY,
                        knotSize + i * knotSize * 0.7,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                }
                break;
        }
        
        // If burning, add fire effect
        if (particle.burning) {
            // Flicker intensity based on burn timer
            const flickerIntensity = 0.6 + Math.sin(particle.burnTimer * 0.2) * 0.3;
            
            // Fire gradient
            const fireGradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                cellSize * 0.8
            );
            
            fireGradient.addColorStop(0, `rgba(255, 150, 50, ${flickerIntensity * 0.8})`);
            fireGradient.addColorStop(0.6, `rgba(200, 50, 0, ${flickerIntensity * 0.6})`);
            fireGradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
            
            ctx.fillStyle = fireGradient;
            ctx.fillRect(
                x * cellSize - cellSize * 0.25,
                y * cellSize - cellSize * 0.25,
                cellSize * 1.5,
                cellSize * 1.5
            );
            
            // Add fire embers occasionally
            if (Math.random() < 0.3) {
                ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
                const emberX = x * cellSize + Math.random() * cellSize;
                const emberY = y * cellSize + Math.random() * cellSize;
                const emberSize = cellSize * 0.05;
                
                ctx.beginPath();
                ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Show cracks in the wood as it burns
            if (particle.integrity < 70) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.lineWidth = 1;
                
                const crackCount = Math.floor((100 - particle.integrity) / 20);
                for (let i = 0; i < crackCount; i++) {
                    const startX = x * cellSize + Math.random() * cellSize;
                    const startY = y * cellSize + Math.random() * cellSize;
                    
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    
                    // Create a jagged line for the crack
                    let currentX = startX;
                    let currentY = startY;
                    const segments = 2 + Math.floor(Math.random() * 3);
                    
                    for (let j = 0; j < segments; j++) {
                        currentX += (Math.random() * cellSize * 0.4) - cellSize * 0.2;
                        currentY += (Math.random() * cellSize * 0.4) - cellSize * 0.2;
                        
                        // Keep within cell bounds
                        currentX = Math.max(x * cellSize, Math.min(currentX, (x + 1) * cellSize));
                        currentY = Math.max(y * cellSize, Math.min(currentY, (y + 1) * cellSize));
                        
                        ctx.lineTo(currentX, currentY);
                    }
                    
                    ctx.stroke();
                }
            }
        }
    },
    
    // Helper function to blend colors
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
window.WoodElement = WoodElement; 