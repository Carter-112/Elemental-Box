// Stone Element
// A solid material that can be eroded by water

const StoneElement = {
    name: 'stone',
    label: 'Stone',
    description: 'A solid material that can be eroded by water over time',
    category: 'solid',
    defaultColor: '#777777',
    
    // Physical properties
    density: 2.7, // Denser than most common materials
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Doesn't move unless forced
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: true, // Reacts with water
    corrosive: false,
    meltingPoint: 1200, // High melting point
    temperature: 25, // Room temperature
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.erosion = 0; // Track erosion level from 0 to 100
        particle.variations = Math.floor(Math.random() * 4); // Visual variations
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].erosion === undefined) {
            grid[y][x].erosion = 0;
        }
        if (grid[y][x].variations === undefined) {
            grid[y][x].variations = Math.floor(Math.random() * 4);
        }
        
        // Check for water around stone to simulate erosion
        let waterCount = 0;
        
        // Check neighboring cells for water
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                if (isInBounds(nx, ny) && grid[ny][nx] && grid[ny][nx].type === 'water') {
                    waterCount++;
                    
                    // Water movement increases erosion 
                    if (grid[ny][nx].velocity && 
                        (Math.abs(grid[ny][nx].velocity.x) > 0.2 || 
                         Math.abs(grid[ny][nx].velocity.y) > 0.2)) {
                        waterCount++;
                    }
                }
            }
        }
        
        // Apply erosion if water is present
        if (waterCount > 0) {
            // More water means faster erosion
            grid[y][x].erosion += waterCount * 0.01;
            
            // If erosion reaches threshold, turn into sand
            if (grid[y][x].erosion >= 100) {
                grid[y][x] = {
                    type: 'sand',
                    color: '#D2B48C',
                    processed: true,
                    isGas: false,
                    isLiquid: false,
                    isPowder: true,
                    isSolid: false
                };
                return;
            }
        }
        
        // Temperature effects - melting if temperature reaches melting point
        if (grid[y][x].temperature >= grid[y][x].meltingPoint) {
            // Convert to lava
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
        
        // Temperature equilibrium with surroundings (stone conducts heat slowly)
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
        
        // Stone conducts heat slowly
        const avgTemp = totalTemp / count;
        grid[y][x].temperature = grid[y][x].temperature * 0.95 + avgTemp * 0.05;
        
        // Support physics - if there's no support below, stone can fall
        if (isInBounds(x, y + 1) && !grid[y + 1][x]) {
            // Check for supports on both sides
            const leftSupport = isInBounds(x - 1, y + 1) && grid[y + 1][x - 1] && 
                               (grid[y + 1][x - 1].isSolid || grid[y + 1][x - 1].isStatic);
            const rightSupport = isInBounds(x + 1, y + 1) && grid[y + 1][x + 1] && 
                                (grid[y + 1][x + 1].isSolid || grid[y + 1][x + 1].isStatic);
            
            // If no support and nothing directly below, stone falls
            if (!leftSupport && !rightSupport) {
                // Convert to static: false to allow falling
                grid[y][x].isStatic = false;
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base color with variations
        let baseColor = particle.color || this.defaultColor;
        
        // Adjust color based on erosion level
        if (particle.erosion > 0) {
            // Gradually blend to a more sand-like color as erosion increases
            const erosionRatio = particle.erosion / 100;
            baseColor = this.blendColors(baseColor, '#D2B48C', erosionRatio * 0.7);
        }
        
        // Draw the stone with texture
        ctx.fillStyle = baseColor;
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Add texture details
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        
        // Different texture patterns based on variations
        switch (particle.variations % 4) {
            case 0:
                // Small scattered dots
                for (let i = 0; i < 3; i++) {
                    const dotX = x * cellSize + Math.random() * cellSize;
                    const dotY = y * cellSize + Math.random() * cellSize;
                    const dotSize = cellSize * 0.1;
                    
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 1:
                // Linear crack
                ctx.beginPath();
                ctx.moveTo(
                    x * cellSize + cellSize * 0.2, 
                    y * cellSize + cellSize * 0.3
                );
                ctx.lineTo(
                    x * cellSize + cellSize * 0.8, 
                    y * cellSize + cellSize * 0.7
                );
                ctx.lineWidth = cellSize * 0.05;
                ctx.stroke();
                break;
                
            case 2:
                // Corner shadow
                ctx.fillRect(
                    x * cellSize, 
                    y * cellSize, 
                    cellSize * 0.3, 
                    cellSize * 0.3
                );
                break;
                
            case 3:
                // Central darker area
                ctx.fillRect(
                    x * cellSize + cellSize * 0.3, 
                    y * cellSize + cellSize * 0.3, 
                    cellSize * 0.4, 
                    cellSize * 0.4
                );
                break;
        }
        
        // Add a highlight for dimension
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize * 0.2, 
            cellSize * 0.2
        );
        
        // If highly eroded, show cracks
        if (particle.erosion > 50) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            
            const crackCount = Math.floor(particle.erosion / 20);
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
    },
    
    // Helper function to blend colors for erosion effects
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
window.StoneElement = StoneElement; 