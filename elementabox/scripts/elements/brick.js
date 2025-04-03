// Brick Element
// Solid that forms a brick wall

const BrickElement = {
    name: 'brick',
    label: 'Brick',
    description: 'Solid material that forms a brick wall',
    category: 'solid',
    defaultColor: '#A52A2A', // Brick red
    
    // Physical properties
    density: 3.0, // Dense material
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: false, // Not very reactive
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.integrity = 100; // Track structural integrity
        
        // Random brick color variation
        const colorVariation = Math.floor(Math.random() * 40) - 20;
        const r = Math.min(Math.max(165 + colorVariation, 130), 180);
        const g = Math.min(Math.max(42 + colorVariation / 2, 30), 60);
        const b = Math.min(Math.max(42 + colorVariation / 2, 30), 50);
        particle.color = `rgb(${r}, ${g}, ${b})`;
        
        // Determine brick pattern position for rendering
        // Each brick is part of a larger pattern (standard brick wall)
        particle.brickRow = Math.floor(Math.random() * 1000); // Just needs to be consistent, not actual row number
        particle.brickCol = Math.floor(Math.random() * 1000);
        
        // Random variations for mortar (cement between bricks)
        particle.mortarWidth = 0.1 + (Math.random() * 0.05);
        particle.mortarColor = `rgb(${180 + Math.floor(Math.random() * 20)}, ${180 + Math.floor(Math.random() * 20)}, ${180 + Math.floor(Math.random() * 20)})`;
        
        // Random chance to add small cracks or imperfections
        particle.hasCracks = Math.random() < 0.3;
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Check if the brick should fall (no support below)
        let hasSupport = false;
        
        // Check directly below
        if (y < grid.length - 1) {
            if (grid[y + 1][x] && grid[y + 1][x].isSolid) {
                hasSupport = true;
            }
        } else {
            // Bottom of grid counts as support
            hasSupport = true;
        }
        
        // If no support, the brick falls
        if (!hasSupport && y < grid.length - 1 && !grid[y + 1][x]) {
            grid[y + 1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Temperature exchange with neighbors (slow)
            if (grid[ny][nx].temperature !== undefined) {
                grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.01;
            }
            
            // Acid corrodes brick slowly
            if (grid[ny][nx].type === 'acid' && Math.random() < 0.05) {
                grid[y][x].integrity -= 5;
                
                // Reduce acid as it corrodes the brick
                grid[ny][nx].acidity = (grid[ny][nx].acidity || 1) - 0.1;
                
                if (grid[ny][nx].acidity <= 0) {
                    grid[ny][nx] = null;
                }
                
                // If integrity gets too low, the brick crumbles
                if (grid[y][x].integrity <= 0) {
                    this.crumbleBrick(x, y, grid, isInBounds);
                    return;
                }
            }
            
            // Extreme heat can damage brick
            if ((grid[ny][nx].type === 'lava' || grid[ny][nx].temperature > 1000) && Math.random() < 0.01) {
                grid[y][x].integrity -= 1;
                
                // Heat up the brick
                grid[y][x].temperature += 10;
                
                // If the brick gets too hot, it develops cracks
                if (grid[y][x].temperature > 500 && !grid[y][x].hasCracks) {
                    grid[y][x].hasCracks = true;
                }
                
                // If integrity gets too low, the brick crumbles
                if (grid[y][x].integrity <= 0) {
                    this.crumbleBrick(x, y, grid, isInBounds);
                    return;
                }
            }
            
            // Explosion nearby damages brick
            if (grid[ny][nx].type === 'fire' && grid[ny][nx].explosive) {
                grid[y][x].integrity -= 50;
                
                // If integrity gets too low, the brick crumbles
                if (grid[y][x].integrity <= 0) {
                    this.crumbleBrick(x, y, grid, isInBounds);
                    return;
                }
            }
        }
        
        // Brick responds slightly to extreme temperatures
        if (grid[y][x].temperature > 1200) {
            // At extremely high temperatures, brick can melt to lava
            if (Math.random() < 0.001) {
                grid[y][x] = {
                    type: 'lava',
                    color: '#FF4500', // Orange-red lava
                    processed: true,
                    temperature: 1200,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false,
                    density: 2.5
                };
                return;
            }
        }
        
        // Update brick appearance based on temperature
        if (grid[y][x].temperature > 500) {
            // Brick gets redder when hot
            const heatFactor = Math.min((grid[y][x].temperature - 500) / 700, 1);
            const r = Math.min(Math.floor(165 + heatFactor * 90), 255);
            const g = Math.max(Math.floor(42 - heatFactor * 42), 0);
            const b = Math.max(Math.floor(42 - heatFactor * 42), 0);
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
        }
    },
    
    // Break brick into rubble
    crumbleBrick: function(x, y, grid, isInBounds) {
        // Replace with sand-like rubble
        grid[y][x] = {
            type: 'sand', // Using sand for brick dust/rubble
            color: '#B25D51', // Brick dust color
            processed: true,
            temperature: grid[y][x].temperature,
            isGas: false,
            isLiquid: false,
            isPowder: true,
            isSolid: false,
            density: 1.8
        };
        
        // Try to create additional rubble particles in empty adjacent cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || grid[ny][nx]) continue;
            
            // 40% chance to create additional rubble
            if (Math.random() < 0.4) {
                grid[ny][nx] = {
                    type: 'sand',
                    color: '#B25D51',
                    processed: true,
                    temperature: grid[y][x].temperature,
                    isGas: false,
                    isLiquid: false,
                    isPowder: true,
                    isSolid: false,
                    density: 1.8
                };
            }
        }
    },
    
    // Render the brick
    render: function(ctx, x, y, particle, cellSize) {
        // Base brick color
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // First fill the entire cell with the brick color
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Now add the mortar pattern
        // We need to determine if this brick is on an odd or even row for proper pattern
        const row = (particle.brickRow || y);
        const col = (particle.brickCol || x);
        const isOffsetRow = row % 2 === 1;
        
        // Draw the mortar (cement between bricks)
        ctx.fillStyle = particle.mortarColor || '#C0C0C0';
        const mortarWidth = (particle.mortarWidth || 0.1) * cellSize;
        
        // Horizontal mortar lines (top and bottom of brick)
        if (row % 2 === 0) {
            // Draw top mortar if on top row of a brick
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, mortarWidth);
            
            // Draw bottom mortar if on bottom row of a brick
            ctx.fillRect(x * cellSize, y * cellSize + cellSize - mortarWidth, cellSize, mortarWidth);
        }
        
        // Vertical mortar lines
        // In standard brick pattern, vertical lines appear offset in alternating rows
        let drawLeftMortar = false;
        let drawRightMortar = false;
        
        if (isOffsetRow) {
            // Offset rows have vertical mortars at different positions
            drawLeftMortar = col % 2 === 0;
            drawRightMortar = col % 2 === 0;
        } else {
            // Even rows have vertical mortars at half-brick offsets
            drawLeftMortar = col % 2 === 1;
            drawRightMortar = col % 2 === 1;
        }
        
        if (drawLeftMortar) {
            ctx.fillRect(x * cellSize, y * cellSize, mortarWidth, cellSize);
        }
        
        if (drawRightMortar) {
            ctx.fillRect(x * cellSize + cellSize - mortarWidth, y * cellSize, mortarWidth, cellSize);
        }
        
        // Add cracks if the brick has them
        if (particle.hasCracks) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = cellSize * 0.03;
            
            // Draw random cracks
            const crackCount = 1 + Math.floor(Math.random() * 2);
            
            for (let i = 0; i < crackCount; i++) {
                ctx.beginPath();
                
                // Start at a random point
                const startX = x * cellSize + Math.random() * cellSize;
                const startY = y * cellSize + Math.random() * cellSize;
                
                ctx.moveTo(startX, startY);
                
                // Create a jagged line
                let currentX = startX;
                let currentY = startY;
                const points = 2 + Math.floor(Math.random() * 3);
                
                for (let j = 0; j < points; j++) {
                    // Move in a random direction
                    currentX += (Math.random() - 0.5) * cellSize * 0.5;
                    currentY += (Math.random() - 0.5) * cellSize * 0.5;
                    
                    // Keep within cell boundaries
                    currentX = Math.max(x * cellSize, Math.min(currentX, (x + 1) * cellSize));
                    currentY = Math.max(y * cellSize, Math.min(currentY, (y + 1) * cellSize));
                    
                    ctx.lineTo(currentX, currentY);
                }
                
                ctx.stroke();
            }
        }
        
        // Add brick texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        
        // Add some random dots for texture
        for (let i = 0; i < 5; i++) {
            const dotX = x * cellSize + Math.random() * cellSize;
            const dotY = y * cellSize + Math.random() * cellSize;
            const dotSize = cellSize * (0.02 + Math.random() * 0.03);
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Make the element available globally
window.BrickElement = BrickElement; 