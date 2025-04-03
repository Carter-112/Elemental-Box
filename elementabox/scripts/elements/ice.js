// Ice Element
// Solid that slowly melts to water with heat and can freeze nearby water

const IceElement = {
    name: 'ice',
    label: 'Ice',
    description: 'Solid frozen water that melts with heat and can freeze nearby water',
    category: 'solid',
    defaultColor: '#BFDFFF', // Light blue
    
    // Physical properties
    density: 0.92, // Ice is less dense than water, which is why it floats
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
    reactive: true,
    corrosive: false,
    temperature: -2, // Below freezing
    transparency: 0.4, // Somewhat transparent
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.meltLevel = 0; // Track how much the ice has melted
        
        // Give slight variations to color
        const blueVariation = Math.floor(Math.random() * 15);
        particle.color = `rgb(${191 + blueVariation}, ${223 + blueVariation}, ${255})`;
        
        // Some ice has crystal patterns
        particle.crystalPattern = Math.floor(Math.random() * 5); // 0-4 different patterns
        
        // Small chance to create a crack in the ice
        particle.hasCrack = Math.random() < 0.2;
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Ice maintains its cold temperature unless heated
        if (grid[y][x].temperature > 0 && Math.random() < 0.1) {
            grid[y][x].temperature = Math.max(grid[y][x].temperature - 0.2, -5);
        }
        
        // Check if the ice should fall (no support below)
        let hasSupport = false;
        
        if (y < grid.length - 1) {
            if (grid[y + 1][x] && (grid[y + 1][x].isSolid || grid[y + 1][x].isPowder)) {
                hasSupport = true;
            }
        } else {
            // Bottom of grid counts as support
            hasSupport = true;
        }
        
        // If no support, ice falls
        if (!hasSupport && y < grid.length - 1 && !grid[y + 1][x]) {
            grid[y + 1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Ice floating on water
        if (y < grid.length - 1 && grid[y + 1][x] && grid[y + 1][x].type === 'water') {
            // Check if there's space to the left or right to float into
            const goLeft = Math.random() < 0.5;
            
            if (goLeft && x > 0 && !grid[y][x - 1]) {
                grid[y][x - 1] = grid[y][x];
                grid[y][x] = grid[y + 1][x];
                grid[y + 1][x] = null;
                return;
            } else if (!goLeft && x < grid[0].length - 1 && !grid[y][x + 1]) {
                grid[y][x + 1] = grid[y][x];
                grid[y][x] = grid[y + 1][x];
                grid[y + 1][x] = null;
                return;
            }
            
            // Small chance to just swap with water below (bobbing effect)
            if (Math.random() < 0.05) {
                const temp = grid[y][x];
                grid[y][x] = grid[y + 1][x];
                grid[y + 1][x] = temp;
                return;
            }
        }
        
        // Check for interactions with neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Count number of water neighbors for freezing effect
        let waterNeighbors = 0;
        let heatNeighbors = 0;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Temperature exchange with neighbors
            if (grid[ny][nx].temperature !== undefined) {
                // Ice warms up when in contact with warm elements
                if (grid[ny][nx].temperature > 0) {
                    grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.02;
                    
                    if (grid[ny][nx].temperature > 30) {
                        heatNeighbors++;
                    }
                }
                
                // Ice cools nearby elements
                if (grid[ny][nx].temperature > grid[y][x].temperature) {
                    grid[ny][nx].temperature -= 0.1;
                }
            }
            
            // Count adjacent water cells
            if (grid[ny][nx].type === 'water') {
                waterNeighbors++;
                
                // Chance to freeze adjacent water
                if (grid[y][x].temperature < 0 && Math.random() < 0.01) {
                    grid[ny][nx] = {
                        type: 'ice',
                        color: this.defaultColor,
                        processed: true,
                        temperature: grid[y][x].temperature,
                        isGas: false,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: true,
                        density: this.density,
                        transparency: this.transparency,
                        crystalPattern: Math.floor(Math.random() * 5),
                        hasCrack: false,
                        meltLevel: 0
                    };
                }
            }
            
            // Fire and very hot elements accelerate melting
            if (grid[ny][nx].type === 'fire' || grid[ny][nx].type === 'lava' || 
                (grid[ny][nx].temperature && grid[ny][nx].temperature > 100)) {
                grid[y][x].meltLevel += 0.2;
                grid[y][x].temperature += 1;
            }
        }
        
        // Melt ice if temperature is above freezing
        if (grid[y][x].temperature > 0) {
            // Increase melt level based on temperature
            grid[y][x].meltLevel += 0.001 * grid[y][x].temperature;
            
            // Accelerate melting when surrounded by heat
            if (heatNeighbors > 0) {
                grid[y][x].meltLevel += 0.002 * heatNeighbors;
            }
            
            // Update appearance as ice melts
            if (grid[y][x].meltLevel > 0.2) {
                // Make more transparent as it melts
                grid[y][x].transparency = 0.4 + (grid[y][x].meltLevel * 0.3);
                
                // Add bluish tint as it melts
                const meltFactor = Math.min(grid[y][x].meltLevel, 1);
                const r = Math.floor(191 - (meltFactor * 50));
                const g = Math.floor(223 - (meltFactor * 50));
                const b = 255;
                grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            }
            
            // Turn to water if melt level is high enough
            if (grid[y][x].meltLevel >= 1.0) {
                grid[y][x] = {
                    type: 'water',
                    color: '#5099DB', // Water blue
                    processed: true,
                    temperature: 1, // Cold water
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false,
                    density: 1.0
                };
                return;
            }
        }
        
        // Ice can generate water droplets when melting
        if (grid[y][x].meltLevel > 0.5 && Math.random() < 0.01) {
            // Try to create a water droplet in an empty adjacent cell
            const emptyNeighbors = [];
            
            for (const dir of neighbors) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                // Preferably create droplets below the ice
                if (!isInBounds(nx, ny) || grid[ny][nx]) continue;
                
                // Favor downward directions
                const weight = dir.dy > 0 ? 3 : 1;
                for (let i = 0; i < weight; i++) {
                    emptyNeighbors.push({ x: nx, y: ny });
                }
            }
            
            if (emptyNeighbors.length > 0) {
                const targetCell = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
                
                // Create water droplet
                grid[targetCell.y][targetCell.x] = {
                    type: 'water',
                    color: '#5099DB',
                    processed: true,
                    temperature: 1,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false,
                    density: 1.0
                };
                
                // Reduce ice melt level slightly after creating a droplet
                grid[y][x].meltLevel -= 0.1;
            }
        }
    },
    
    // Render the ice
    render: function(ctx, x, y, particle, cellSize) {
        // Use particle color or default
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Set transparency
        const transparency = particle.transparency !== undefined ? 
            particle.transparency : this.transparency;
        
        ctx.globalAlpha = transparency;
        
        // Fill the cell with ice
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw ice crystal patterns, unless heavily melted
        if (particle.meltLevel < 0.7) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 0.5;
            
            const crystalPattern = particle.crystalPattern || 0;
            
            switch (crystalPattern) {
                case 0: // Snowflake-like pattern
                    this.drawSnowflakePattern(ctx, x, y, cellSize);
                    break;
                    
                case 1: // Fractured lines
                    this.drawFracturedPattern(ctx, x, y, cellSize);
                    break;
                    
                case 2: // Hexagonal pattern
                    this.drawHexagonalPattern(ctx, x, y, cellSize);
                    break;
                    
                case 3: // Crystalline blocks
                    this.drawCrystallineBlocks(ctx, x, y, cellSize);
                    break;
                    
                case 4: // No pattern (clear ice)
                    // Add just a slight highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fillRect(
                        x * cellSize + cellSize * 0.25,
                        y * cellSize + cellSize * 0.25,
                        cellSize * 0.2,
                        cellSize * 0.2
                    );
                    break;
            }
        }
        
        // Add cracks to some ice pieces
        if (particle.hasCrack && particle.meltLevel < 0.6) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 0.8;
            
            const centerX = x * cellSize + cellSize / 2;
            const centerY = y * cellSize + cellSize / 2;
            
            // Draw a random crack
            ctx.beginPath();
            const crackType = Math.floor(Math.random() * 3);
            
            switch (crackType) {
                case 0: // Linear crack
                    const angle = Math.random() * Math.PI;
                    const length = cellSize * 0.7;
                    
                    ctx.moveTo(
                        centerX - Math.cos(angle) * length / 2,
                        centerY - Math.sin(angle) * length / 2
                    );
                    ctx.lineTo(
                        centerX + Math.cos(angle) * length / 2,
                        centerY + Math.sin(angle) * length / 2
                    );
                    break;
                    
                case 1: // Branched crack
                    ctx.moveTo(centerX, centerY);
                    
                    for (let i = 0; i < 3; i++) {
                        const branchAngle = (i / 3) * Math.PI * 2;
                        const branchLength = cellSize * (0.3 + Math.random() * 0.3);
                        
                        ctx.lineTo(
                            centerX + Math.cos(branchAngle) * branchLength,
                            centerY + Math.sin(branchAngle) * branchLength
                        );
                        ctx.moveTo(centerX, centerY);
                    }
                    break;
                    
                case 2: // Circular crack
                    const radius = cellSize * (0.2 + Math.random() * 0.2);
                    const startAngle = Math.random() * Math.PI * 2;
                    const endAngle = startAngle + (Math.random() * Math.PI);
                    
                    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                    break;
            }
            
            ctx.stroke();
        }
        
        // Add melting effect if the ice is melting
        if (particle.meltLevel > 0.3) {
            // Draw water droplets
            const dropCount = Math.floor(particle.meltLevel * 3) + 1;
            
            ctx.fillStyle = 'rgba(80, 153, 219, 0.6)'; // Semi-transparent water color
            
            for (let i = 0; i < dropCount; i++) {
                const dropX = x * cellSize + (Math.random() * cellSize);
                const dropY = y * cellSize + (Math.random() * cellSize * 0.7) + (cellSize * 0.3);
                const dropSize = cellSize * (0.05 + Math.random() * 0.05);
                
                ctx.beginPath();
                ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Add small droplet trail
                if (Math.random() < 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(dropX, dropY);
                    ctx.lineTo(dropX, dropY + cellSize * 0.1);
                    ctx.lineWidth = dropSize;
                    ctx.strokeStyle = 'rgba(80, 153, 219, 0.4)';
                    ctx.stroke();
                }
            }
        }
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    },
    
    // Helper methods for drawing crystal patterns
    
    drawSnowflakePattern: function(ctx, x, y, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Draw snowflake arms
        ctx.beginPath();
        const armCount = 6;
        
        for (let i = 0; i < armCount; i++) {
            const angle = (i / armCount) * Math.PI * 2;
            const armLength = cellSize * 0.4;
            
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * armLength,
                centerY + Math.sin(angle) * armLength
            );
        }
        
        ctx.stroke();
    },
    
    drawFracturedPattern: function(ctx, x, y, cellSize) {
        // Draw random fracture lines
        ctx.beginPath();
        
        const lineCount = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < lineCount; i++) {
            const startX = x * cellSize + Math.random() * cellSize;
            const startY = y * cellSize + Math.random() * cellSize;
            const endX = x * cellSize + Math.random() * cellSize;
            const endY = y * cellSize + Math.random() * cellSize;
            
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
        }
        
        ctx.stroke();
    },
    
    drawHexagonalPattern: function(ctx, x, y, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Draw hexagon
        ctx.beginPath();
        const sides = 6;
        const radius = cellSize * 0.3;
        
        for (let i = 0; i <= sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            
            if (i === 0) {
                ctx.moveTo(
                    centerX + Math.cos(angle) * radius,
                    centerY + Math.sin(angle) * radius
                );
            } else {
                ctx.lineTo(
                    centerX + Math.cos(angle) * radius,
                    centerY + Math.sin(angle) * radius
                );
            }
        }
        
        ctx.stroke();
    },
    
    drawCrystallineBlocks: function(ctx, x, y, cellSize) {
        // Draw small squares in a grid pattern
        const gridSize = 3;
        const blockSize = cellSize / gridSize;
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                // Only draw some of the blocks for a crystal-like pattern
                if (Math.random() < 0.7) {
                    const blockX = x * cellSize + i * blockSize;
                    const blockY = y * cellSize + j * blockSize;
                    
                    ctx.strokeRect(
                        blockX + blockSize * 0.1,
                        blockY + blockSize * 0.1,
                        blockSize * 0.8,
                        blockSize * 0.8
                    );
                }
            }
        }
    }
};

// Make the element available globally
window.IceElement = IceElement; 