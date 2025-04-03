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
        particle.burnPhase = 'none'; // none, heating, red-hot, ash
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
        if (grid[y][x].burnPhase === undefined) {
            grid[y][x].burnPhase = 'none';
        }
        
        // Temperature effects
        if (grid[y][x].temperature >= grid[y][x].ignitionTemp && !grid[y][x].burning) {
            grid[y][x].burning = true;
            grid[y][x].burnTimer = 0;
            grid[y][x].burnPhase = 'heating';
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
            
            if (waterNearby) {
                // Extinguish the fire if water is nearby
                grid[y][x].burning = false;
                grid[y][x].temperature = Math.max(25, grid[y][x].temperature - 50);
            } else {
                // Progress through burn phases
                if (grid[y][x].burnPhase === 'heating' && grid[y][x].burnTimer >= 60) {
                    // After ~2 seconds, transition to red-hot phase
                    grid[y][x].burnPhase = 'red-hot';
                    grid[y][x].burnTimer = 0;
                } else if (grid[y][x].burnPhase === 'red-hot' && grid[y][x].burnTimer >= 60) {
                    // After red-hot phase, turn to solid ash
                    grid[y][x] = {
                        type: 'solid-ash',
                        color: '#444444',
                        temperature: grid[y][x].temperature * 0.8,
                        processed: true,
                        isPowder: false,
                        isLiquid: false,
                        isGas: false,
                        isSolid: true,
                        isStatic: true,
                        burnPhase: 'solid-ash',
                        burnTimer: 0
                    };
                    return;
                }
                
                // Fire can spread to nearby flammable materials
                if (Math.random() < 0.1) {
                    const spreadDirections = [
                        { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
                    ];
                    
                    const randDir = spreadDirections[Math.floor(Math.random() * spreadDirections.length)];
                    const nx = x + randDir.dx;
                    const ny = y + randDir.dy;
                    
                    if (isInBounds(nx, ny) && grid[ny][nx] && grid[ny][nx].flammable && !grid[ny][nx].burning) {
                        grid[ny][nx].temperature += 20;
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
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base wood color, adjusted by burning/integrity
        let baseColor = particle.color || this.defaultColor;
        
        // Adjust color based on burn phase
        if (particle.burnPhase === 'heating') {
            // Gradually darken during heating phase
            const burnRatio = Math.min(1, particle.burnTimer / 60);
            baseColor = this.blendColors(baseColor, '#000000', burnRatio * 0.7);
        } else if (particle.burnPhase === 'red-hot') {
            // Red hot glow
            baseColor = this.blendColors('#8B4513', '#FF3300', Math.min(1, particle.burnTimer / 30));
        }
        
        // Draw the wood
        ctx.fillStyle = baseColor;
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Add wood grain texture (only if not in red-hot phase)
        if (particle.burnPhase !== 'red-hot') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            
            // Different grain patterns
            switch (particle.grainPattern % 4) {
                case 0: // Vertical grain
                    for (let i = 0; i < 3; i++) {
                        const grainX = x * cellSize + (cellSize / 4) * (i + 1);
                        ctx.fillRect(
                            grainX - 1, 
                            y * cellSize, 
                            1, 
                            cellSize
                        );
                    }
                    break;
                    
                case 1: // Horizontal grain
                    for (let i = 0; i < 3; i++) {
                        const grainY = y * cellSize + (cellSize / 4) * (i + 1);
                        ctx.fillRect(
                            x * cellSize, 
                            grainY - 1, 
                            cellSize, 
                            1
                        );
                    }
                    break;
                    
                case 2: // Diagonal grain (\)
                    ctx.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const offset = (cellSize / 4) * (i + 1);
                        ctx.moveTo(x * cellSize, y * cellSize + offset);
                        ctx.lineTo(x * cellSize + offset, y * cellSize);
                        
                        ctx.moveTo(x * cellSize + offset, y * cellSize + cellSize);
                        ctx.lineTo(x * cellSize + cellSize, y * cellSize + offset);
                    }
                    ctx.stroke();
                    break;
                    
                case 3: // Diagonal grain (/)
                    ctx.beginPath();
                    for (let i = 0; i < 3; i++) {
                        const offset = (cellSize / 4) * (i + 1);
                        ctx.moveTo(x * cellSize, y * cellSize + cellSize - offset);
                        ctx.lineTo(x * cellSize + offset, y * cellSize + cellSize);
                        
                        ctx.moveTo(x * cellSize + offset, y * cellSize);
                        ctx.lineTo(x * cellSize + cellSize, y * cellSize + offset);
                    }
                    ctx.stroke();
                    break;
            }
        }
        
        // Add glowing ember effect for red-hot phase
        if (particle.burnPhase === 'red-hot') {
            // Add a glow effect
            const glowSize = cellSize * 1.2;
            const gradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2, 
                y * cellSize + cellSize / 2, 
                0,
                x * cellSize + cellSize / 2, 
                y * cellSize + cellSize / 2, 
                glowSize
            );
            
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                x * cellSize - glowSize / 2, 
                y * cellSize - glowSize / 2, 
                cellSize + glowSize, 
                cellSize + glowSize
            );
            
            // Add some embers/sparks
            if (Math.random() < 0.3) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
                const sparkCount = 2 + Math.floor(Math.random() * 3);
                
                for (let i = 0; i < sparkCount; i++) {
                    const sparkX = x * cellSize + Math.random() * cellSize;
                    const sparkY = y * cellSize + Math.random() * cellSize;
                    const sparkSize = 1 + Math.random() * 2;
                    
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                    ctx.fill();
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