// Salt Element
// A powder that turns into solid salt under pressure

const SaltElement = {
    name: 'salt',
    label: 'Salt',
    description: 'A powder that compacts into solid salt under pressure',
    category: 'solid-powder',
    defaultColor: '#FFFFFF',
    
    // Physical properties
    density: 2.1, // Heavier than ash, lighter than sand
    isGas: false,
    isLiquid: false,
    isPowder: true,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: true, // Dissolves in water
    corrosive: false,
    temperature: 25, // Room temperature
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.compressionLevel = 0; // Tracks how much pressure is applied
        particle.crystalStructure = Math.floor(Math.random() * 4); // Visual variation
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].compressionLevel === undefined) {
            grid[y][x].compressionLevel = 0;
        }
        
        if (grid[y][x].crystalStructure === undefined) {
            grid[y][x].crystalStructure = Math.floor(Math.random() * 4);
        }
        
        // Salt falls with gravity
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to slide to bottom-left or bottom-right
            const randomDirection = Math.random() < 0.5;
            
            if (randomDirection && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try the other diagonal if the first one was blocked
            if (randomDirection && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!randomDirection && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Check for compression - salt turns to solid salt under pressure
        if (y > 0) {
            // Count how many particles are on top of this salt grain
            let pressureCount = 0;
            for (let checkY = y-1; checkY >= 0 && checkY >= y-5; checkY--) {
                if (isInBounds(x, checkY) && grid[checkY][x]) {
                    pressureCount++;
                } else {
                    break;
                }
            }
            
            // Increase compression level based on pressure
            if (pressureCount > 0) {
                grid[y][x].compressionLevel += pressureCount * 0.01;
                
                // Update color based on compression level
                const compressionFactor = Math.min(1, grid[y][x].compressionLevel);
                const brightness = 255 - Math.floor(compressionFactor * 20);
                grid[y][x].color = `rgb(${brightness}, ${brightness}, ${brightness})`;
                
                // If compression reaches threshold, turn into solid salt
                if (grid[y][x].compressionLevel >= 1.0) {
                    grid[y][x] = {
                        type: 'solid-salt',
                        color: '#F0F0F0', // Slightly off-white for solid salt
                        temperature: grid[y][x].temperature,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: true,
                        isStatic: true,
                        crystalStructure: grid[y][x].crystalStructure
                    };
                    return;
                }
            }
        }
        
        // Salt dissolves in water
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Dissolve in water
            if (grid[ny][nx].type === 'water') {
                // Make water salty (change color slightly)
                grid[ny][nx].color = '#D6E7FF'; // Slightly bluish-white for salt water
                grid[ny][nx].saltContent = (grid[ny][nx].saltContent || 0) + 0.25;
                
                // Salt dissolves over time in water
                if (Math.random() < 0.3) {
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base color
        const baseColor = particle.color || this.defaultColor;
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add crystalline texture
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        
        // Different crystal patterns based on the assigned structure
        const crystalType = particle.crystalStructure || 0;
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        switch (crystalType % 4) {
            case 0: // Cubic crystal
                ctx.fillRect(
                    centerX - cellSize * 0.3,
                    centerY - cellSize * 0.3,
                    cellSize * 0.6,
                    cellSize * 0.6
                );
                break;
                
            case 1: // Diamond crystal
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - cellSize * 0.3);
                ctx.lineTo(centerX + cellSize * 0.25, centerY);
                ctx.lineTo(centerX, centerY + cellSize * 0.3);
                ctx.lineTo(centerX - cellSize * 0.25, centerY);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 2: // Hexagonal crystal
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = Math.PI / 3 * i;
                    const pointX = centerX + Math.cos(angle) * cellSize * 0.3;
                    const pointY = centerY + Math.sin(angle) * cellSize * 0.3;
                    
                    if (i === 0) {
                        ctx.moveTo(pointX, pointY);
                    } else {
                        ctx.lineTo(pointX, pointY);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case 3: // Multiple small crystals
                for (let i = 0; i < 3; i++) {
                    const smallX = x * cellSize + cellSize * (0.2 + i * 0.3);
                    const smallY = y * cellSize + cellSize * (0.3 + (i % 2) * 0.4);
                    const smallSize = cellSize * 0.15;
                    
                    ctx.fillRect(
                        smallX - smallSize / 2,
                        smallY - smallSize / 2,
                        smallSize,
                        smallSize
                    );
                }
                break;
        }
        
        // Add reflective highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const hlSize = cellSize * 0.08;
        
        // Add 1-2 small highlights
        const hlCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < hlCount; i++) {
            const hlX = x * cellSize + cellSize * (0.2 + Math.random() * 0.6);
            const hlY = y * cellSize + cellSize * (0.2 + Math.random() * 0.6);
            
            ctx.beginPath();
            ctx.arc(hlX, hlY, hlSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Make the element available globally
window.SaltElement = SaltElement; 