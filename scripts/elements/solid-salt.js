// Solid Salt Element
// Solid version of salt that forms when salt powder is under pressure

const SolidSaltElement = {
    name: 'solid-salt',
    label: 'Solid Salt',
    description: 'Solid version of salt formed under pressure',
    category: 'solid',
    defaultColor: '#F8F8F8', // Slightly off-white
    
    // Physical properties
    density: 2.2,
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
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.integrity = 100; // Track structural integrity
        
        // Visual variations for crystal structure
        particle.crystalPattern = Math.floor(Math.random() * 4); // 0-3 different crystal patterns
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Check if solid salt should crack or break
        // This happens if it's not supported or under impact
        
        // Check if there's support below
        let hasSupport = false;
        if (y < grid.length - 1) {
            if (grid[y + 1][x] && (grid[y + 1][x].isSolid || grid[y + 1][x].isPowder)) {
                hasSupport = true;
            }
        }
        
        // If no support and not at the bottom, chance to break into salt powder
        if (!hasSupport && y < grid.length - 1 && Math.random() < 0.1) {
            grid[y][x].integrity -= 10;
            
            if (grid[y][x].integrity <= 0) {
                this.breakIntoSalt(x, y, grid, isInBounds);
                return;
            }
        }
        
        // Solid salt dissolves very slowly in water (slower than salt powder)
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        let waterNeighbors = 0;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Count water neighbors
            if (grid[ny][nx].type === 'water') {
                waterNeighbors++;
            }
            
            // Dissolve in water very slowly
            if (grid[ny][nx].type === 'water' && Math.random() < 0.001) {
                // Increase water salinity
                grid[ny][nx].salinityLevel = (grid[ny][nx].salinityLevel || 0) + 0.2;
                
                // Update water color based on salinity
                grid[ny][nx].color = this.getWaterColor(grid[ny][nx].salinityLevel);
                
                // Reduce solid salt integrity
                grid[y][x].integrity -= 5;
                
                // If integrity is too low, convert to salt powder
                if (grid[y][x].integrity <= 0) {
                    this.breakIntoSalt(x, y, grid, isInBounds);
                    return;
                }
            }
            
            // Extremely high temperatures can crack solid salt
            if (grid[ny][nx].temperature && grid[ny][nx].temperature > 600 && Math.random() < 0.01) {
                grid[y][x].integrity -= 2;
                
                if (grid[y][x].integrity <= 0) {
                    this.breakIntoSalt(x, y, grid, isInBounds);
                    return;
                }
            }
            
            // Explosive force can shatter solid salt
            if (grid[ny][nx].type === 'fire' && grid[ny][nx].explosive) {
                this.breakIntoSalt(x, y, grid, isInBounds);
                return;
            }
        }
        
        // Increase degradation rate if surrounded by water
        if (waterNeighbors > 2 && Math.random() < 0.01) {
            grid[y][x].integrity -= 1;
            
            if (grid[y][x].integrity <= 0) {
                this.breakIntoSalt(x, y, grid, isInBounds);
                return;
            }
        }
    },
    
    // Break solid salt into salt powder
    breakIntoSalt: function(x, y, grid, isInBounds) {
        // Replace with salt powder
        grid[y][x] = {
            type: 'salt',
            color: '#FFFFFF',
            processed: true,
            temperature: grid[y][x].temperature,
            isGas: false,
            isLiquid: false,
            isPowder: true,
            isSolid: false,
            density: 0.8
        };
        
        // Try to create additional salt particles in empty adjacent cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || grid[ny][nx]) continue;
            
            // 30% chance to create additional salt particle
            if (Math.random() < 0.3) {
                grid[ny][nx] = {
                    type: 'salt',
                    color: '#FFFFFF',
                    processed: true,
                    temperature: grid[y][x].temperature,
                    isGas: false,
                    isLiquid: false,
                    isPowder: true,
                    isSolid: false,
                    density: 0.8
                };
            }
        }
    },
    
    // Helper to get color for salty water (same as in salt element)
    getWaterColor: function(salinityLevel) {
        // The higher the salinity, the more opaque/white the water becomes
        const salinity = Math.min(salinityLevel, 1);
        const r = Math.floor(100 + (salinity * 155));
        const g = Math.floor(100 + (salinity * 155));
        const b = Math.floor(200 + (salinity * 55));
        return `rgba(${r}, ${g}, ${b}, 0.8)`;
    },
    
    // Render the solid salt crystal
    render: function(ctx, x, y, particle, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Determine crystal pattern based on particle's pattern value
        const crystalPattern = particle.crystalPattern || 0;
        
        // Base color with slight variation
        const brightness = Math.floor(Math.random() * 8);
        ctx.fillStyle = `rgb(${248 + brightness}, ${248 + brightness}, ${250 + brightness})`;
        
        // Draw solid salt block with crystal structure
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Draw crystal pattern overlays
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.5;
        
        switch (crystalPattern) {
            case 0: // Grid pattern
                // Horizontal lines
                for (let i = 0.25; i < 1; i += 0.25) {
                    ctx.beginPath();
                    ctx.moveTo(x * cellSize, y * cellSize + i * cellSize);
                    ctx.lineTo(x * cellSize + cellSize, y * cellSize + i * cellSize);
                    ctx.stroke();
                }
                
                // Vertical lines
                for (let i = 0.25; i < 1; i += 0.25) {
                    ctx.beginPath();
                    ctx.moveTo(x * cellSize + i * cellSize, y * cellSize);
                    ctx.lineTo(x * cellSize + i * cellSize, y * cellSize + cellSize);
                    ctx.stroke();
                }
                break;
                
            case 1: // X pattern
                ctx.beginPath();
                ctx.moveTo(x * cellSize, y * cellSize);
                ctx.lineTo(x * cellSize + cellSize, y * cellSize + cellSize);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x * cellSize + cellSize, y * cellSize);
                ctx.lineTo(x * cellSize, y * cellSize + cellSize);
                ctx.stroke();
                break;
                
            case 2: // Diamond pattern
                ctx.beginPath();
                ctx.moveTo(x * cellSize + cellSize/2, y * cellSize);
                ctx.lineTo(x * cellSize + cellSize, y * cellSize + cellSize/2);
                ctx.lineTo(x * cellSize + cellSize/2, y * cellSize + cellSize);
                ctx.lineTo(x * cellSize, y * cellSize + cellSize/2);
                ctx.closePath();
                ctx.stroke();
                break;
                
            case 3: // Multiple small squares
                for (let i = 0.25; i < 1; i += 0.5) {
                    for (let j = 0.25; j < 1; j += 0.5) {
                        ctx.strokeRect(
                            x * cellSize + i * cellSize - cellSize * 0.15, 
                            y * cellSize + j * cellSize - cellSize * 0.15, 
                            cellSize * 0.3, 
                            cellSize * 0.3
                        );
                    }
                }
                break;
        }
        
        // If integrity is low, show cracks
        if (particle.integrity && particle.integrity < 50) {
            const crackIntensity = (50 - particle.integrity) / 50;
            ctx.strokeStyle = `rgba(100, 100, 100, ${crackIntensity * 0.8})`;
            ctx.lineWidth = 1;
            
            // Draw random cracks
            const crackCount = Math.floor(crackIntensity * 3) + 1;
            
            for (let i = 0; i < crackCount; i++) {
                ctx.beginPath();
                
                // Start at a random edge point
                const startSide = Math.floor(Math.random() * 4);
                let startX, startY;
                
                switch (startSide) {
                    case 0: // Top
                        startX = x * cellSize + Math.random() * cellSize;
                        startY = y * cellSize;
                        break;
                    case 1: // Right
                        startX = x * cellSize + cellSize;
                        startY = y * cellSize + Math.random() * cellSize;
                        break;
                    case 2: // Bottom
                        startX = x * cellSize + Math.random() * cellSize;
                        startY = y * cellSize + cellSize;
                        break;
                    case 3: // Left
                        startX = x * cellSize;
                        startY = y * cellSize + Math.random() * cellSize;
                        break;
                }
                
                ctx.moveTo(startX, startY);
                
                // Create a jagged line toward the center
                let currentX = startX;
                let currentY = startY;
                const steps = 2 + Math.floor(Math.random() * 3);
                
                for (let j = 0; j < steps; j++) {
                    // Move toward center with some randomness
                    currentX = currentX + (centerX - currentX) * (0.3 + Math.random() * 0.4);
                    currentY = currentY + (centerY - currentY) * (0.3 + Math.random() * 0.4);
                    
                    // Add some jaggedness
                    currentX += (Math.random() - 0.5) * cellSize * 0.2;
                    currentY += (Math.random() - 0.5) * cellSize * 0.2;
                    
                    ctx.lineTo(currentX, currentY);
                }
                
                ctx.stroke();
            }
        }
    }
};

// Make the element available globally
window.SolidSaltElement = SolidSaltElement; 