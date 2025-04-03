// Snow Element
// Powder that turns to ice with cold, turns to water with heat, and water also melts it into water

const SnowElement = {
    name: 'snow',
    label: 'Snow',
    description: 'Cold powder that turns to ice with cold and water with heat',
    category: 'solid-powder',
    defaultColor: '#F0F4FF', // Very light blue-white
    
    // Physical properties
    density: 0.5, // Light, fluffy snow
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
    reactive: true,
    corrosive: false,
    temperature: 0, // Snow starts cold
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.wetness = 0; // Track how wet/melty the snow is
        particle.ageFrames = 0; // Track how long the snow has existed
        
        // Small random variations in color for visual interest
        const brightness = Math.floor(Math.random() * 10);
        particle.color = `rgb(${240 + brightness}, ${244 + brightness}, ${255})`;
        
        // Random flake size for visual variety
        particle.flakeSize = 0.8 + (Math.random() * 0.4);
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Increment age
        grid[y][x].ageFrames = (grid[y][x].ageFrames || 0) + 1;
        
        // Natural decrease in temperature over time (snow stays cold)
        // This helps prevent immediate melting in room temperature
        if (grid[y][x].temperature > 0 && Math.random() < 0.05) {
            grid[y][x].temperature = Math.max(grid[y][x].temperature - 0.5, -5);
        }
        
        // Check temperature conditions
        
        // Turn to ice if very cold
        if (grid[y][x].temperature < -10 && Math.random() < 0.05) {
            grid[y][x] = {
                type: 'ice',
                color: '#BFDFFF', // Light blue for ice
                processed: true,
                temperature: grid[y][x].temperature,
                isGas: false,
                isLiquid: false,
                isPowder: false,
                isSolid: true,
                density: 0.9
            };
            return;
        }
        
        // Turn to water if too warm
        if (grid[y][x].temperature > 2) {
            grid[y][x].wetness += 0.02 * (grid[y][x].temperature - 2);
            
            // Change color as it gets wetter
            const wetness = Math.min(grid[y][x].wetness, 1);
            const r = Math.floor(240 - (wetness * 140));
            const g = Math.floor(244 - (wetness * 120));
            const b = Math.floor(255 - (wetness * 55));
            grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            
            // Turn to water if too wet
            if (grid[y][x].wetness >= 1) {
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
        
        // Fall behavior with slight random drift (like real snow)
        if (y < grid.length - 1) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Add slight randomness to falling direction
            const leftProbability = 0.4 + (Math.sin(grid[y][x].ageFrames * 0.1) * 0.1);
            const goLeft = Math.random() < leftProbability;
            
            if (goLeft && x > 0 && !grid[y + 1][x - 1]) {
                grid[y + 1][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!goLeft && x < grid[0].length - 1 && !grid[y + 1][x + 1]) {
                grid[y + 1][x + 1] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Occasional sideways drift, even when not falling
        if (Math.random() < 0.05) {
            const goLeft = Math.random() < 0.5;
            
            if (goLeft && x > 0 && !grid[y][x - 1]) {
                grid[y][x - 1] = grid[y][x];
                grid[y][x] = null;
                return;
            } else if (!goLeft && x < grid[0].length - 1 && !grid[y][x + 1]) {
                grid[y][x + 1] = grid[y][x];
                grid[y][x] = null;
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
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Temperature exchange with neighbors
            if (grid[ny][nx].temperature !== undefined) {
                // Snow melts faster when touching water
                if (grid[ny][nx].type === 'water') {
                    // Water warms up snow more efficiently
                    grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.1;
                    grid[y][x].wetness += 0.01;
                    
                    // Cool down the water slightly
                    grid[ny][nx].temperature -= 0.1;
                    if (grid[ny][nx].temperature < 0 && Math.random() < 0.01) {
                        grid[ny][nx] = {
                            type: 'ice',
                            color: '#BFDFFF',
                            processed: true,
                            temperature: -1,
                            isGas: false,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: true,
                            density: 0.9
                        };
                    }
                } else {
                    // Normal temperature exchange with other elements
                    grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.02;
                }
            }
            
            // Fire and hot elements instantly melt snow
            if ((grid[ny][nx].type === 'fire' || grid[ny][nx].temperature > 80) && Math.random() < 0.8) {
                grid[y][x] = {
                    type: 'water',
                    color: '#5099DB',
                    processed: true,
                    temperature: 5,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false,
                    density: 1.0
                };
                return;
            }
            
            // When many snow cells are adjacent and cold, chance to form ice
            if (grid[ny][nx].type === 'snow' && grid[y][x].temperature < -5) {
                // Count how many adjacent snow cells there are
                let snowNeighbors = 0;
                for (const checkDir of neighbors) {
                    const checkX = x + checkDir.dx;
                    const checkY = y + checkDir.dy;
                    
                    if (!isInBounds(checkX, checkY) || !grid[checkY][checkX]) continue;
                    
                    if (grid[checkY][checkX].type === 'snow') {
                        snowNeighbors++;
                    }
                }
                
                // If surrounded by many snow cells and it's cold, chance to form ice
                if (snowNeighbors >= 5 && Math.random() < 0.001) {
                    grid[y][x] = {
                        type: 'ice',
                        color: '#BFDFFF',
                        processed: true,
                        temperature: grid[y][x].temperature,
                        isGas: false,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: true,
                        density: 0.9
                    };
                    return;
                }
            }
        }
    },
    
    // Render the snow
    render: function(ctx, x, y, particle, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Use particle color if available, default otherwise
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Draw based on wetness
        const wetness = particle.wetness || 0;
        
        if (wetness > 0.6) {
            // Very wet snow - draw as a small melting blob
            const meltSize = cellSize * 0.4 * (1 - (wetness - 0.6) / 0.4);
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, meltSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add water droplet effect below
            ctx.fillStyle = 'rgba(80, 153, 219, 0.4)'; // Translucent water color
            ctx.beginPath();
            ctx.ellipse(
                centerX, 
                centerY + cellSize * 0.2, 
                cellSize * 0.2, 
                cellSize * 0.1, 
                0, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        } else if (wetness > 0.3) {
            // Moderately wet snow - draw as a slightly melting flake
            const flakeSize = cellSize * 0.4 * particle.flakeSize;
            
            // Draw main blob
            ctx.beginPath();
            ctx.arc(centerX, centerY, flakeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some melting effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, flakeSize * 0.7, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Dry snow - draw as a snowflake
            const flakeSize = cellSize * 0.35 * particle.flakeSize;
            
            // Draw the base
            ctx.beginPath();
            ctx.arc(centerX, centerY, flakeSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw the arms of the snowflake
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const armLength = flakeSize;
                
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + Math.cos(angle) * armLength,
                    centerY + Math.sin(angle) * armLength
                );
                
                // Add small branches on each arm
                const branchStart = 0.5; // How far along the arm the branch starts
                const branchLength = flakeSize * 0.4;
                const branchAngle = Math.PI / 4; // 45 degree branch
                
                const branchX = centerX + Math.cos(angle) * armLength * branchStart;
                const branchY = centerY + Math.sin(angle) * armLength * branchStart;
                
                ctx.moveTo(branchX, branchY);
                ctx.lineTo(
                    branchX + Math.cos(angle + branchAngle) * branchLength,
                    branchY + Math.sin(angle + branchAngle) * branchLength
                );
                
                ctx.moveTo(branchX, branchY);
                ctx.lineTo(
                    branchX + Math.cos(angle - branchAngle) * branchLength,
                    branchY + Math.sin(angle - branchAngle) * branchLength
                );
            }
            
            ctx.lineWidth = cellSize * 0.06;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.stroke();
        }
    }
};

// Make the element available globally
window.SnowElement = SnowElement; 