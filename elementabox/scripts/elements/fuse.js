// Fuse Element
// Solid that starts burning and sparking when it touches heat, 
// with the fire slowly progressing from the heat point to the end

const FuseElement = {
    name: 'fuse',
    label: 'Fuse',
    description: 'Burns slowly from one end to the other when ignited',
    category: 'solid',
    defaultColor: '#A52A2A', // Brown fuse color
    
    // Physical properties
    density: 1.2,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true,
    conductive: false,
    explosive: false,
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.burning = false; // Track if the fuse is burning
        particle.burnProgress = 0; // Track how far along the burning has progressed (0-1)
        particle.sparkFrame = 0; // For spark animation
        particle.burnDirection = null; // Direction the fire is spreading
        
        // Small color variations
        const colorVariation = Math.floor(Math.random() * 20) - 10;
        const r = Math.min(Math.max(165 + colorVariation, 130), 180);
        const g = Math.min(Math.max(42 + colorVariation, 30), 60);
        const b = Math.min(Math.max(42 + colorVariation / 2, 20), 40);
        particle.color = `rgb(${r}, ${g}, ${b})`;
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Check if the fuse should fall (no support below)
        let hasSupport = false;
        
        if (y < grid.length - 1) {
            if (grid[y + 1][x] && (grid[y + 1][x].isSolid || grid[y + 1][x].isPowder)) {
                hasSupport = true;
            }
        } else {
            // Bottom of grid counts as support
            hasSupport = true;
        }
        
        // If no support, the fuse falls
        if (!hasSupport && y < grid.length - 1 && !grid[y + 1][x]) {
            grid[y + 1][x] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // Handle burning fuse logic
        if (grid[y][x].burning) {
            // Increment burn progress
            grid[y][x].burnProgress += 0.01; // Slow burn rate
            
            // Update spark animation frame
            grid[y][x].sparkFrame = (grid[y][x].sparkFrame || 0) + 1;
            
            // Increase temperature as it burns
            grid[y][x].temperature += 2;
            
            // Create smoke occasionally
            if (Math.random() < 0.2) {
                this.createSmoke(x, y, grid, isInBounds);
            }
            
            // Burn completely and convert to ash
            if (grid[y][x].burnProgress >= 1) {
                // Create a final spark/fire
                this.createFinalSpark(x, y, grid, isInBounds);
                
                // Convert to ash
                grid[y][x] = {
                    type: 'ash',
                    color: '#555555',
                    processed: true,
                    temperature: 80,
                    isGas: false,
                    isLiquid: false,
                    isPowder: true,
                    isSolid: false
                };
                return;
            }
            
            // Spread the fire to connected fuse parts
            if (grid[y][x].burnDirection) {
                // Try to spread in the already determined direction
                const nx = x + grid[y][x].burnDirection.dx;
                const ny = y + grid[y][x].burnDirection.dy;
                
                if (isInBounds(nx, ny) && grid[ny][nx] && grid[ny][nx].type === 'fuse' && !grid[ny][nx].burning) {
                    // Ignite the next fuse segment
                    grid[ny][nx].burning = true;
                    grid[ny][nx].temperature = 80;
                    grid[ny][nx].burnDirection = grid[y][x].burnDirection;
                }
            } else {
                // Determine burn direction based on connected fuse pieces
                this.determineBurnDirection(x, y, grid, isInBounds);
            }
        } else {
            // Check if the fuse should ignite
            // Check for heat sources or already burning adjacent fuses
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
                
                // Check for heat sources that could ignite the fuse
                if (
                    grid[ny][nx].type === 'fire' ||
                    grid[ny][nx].type === 'lava' ||
                    (grid[ny][nx].temperature && grid[ny][nx].temperature > 100) ||
                    (grid[ny][nx].type === 'fuse' && grid[ny][nx].burning)
                ) {
                    // Ignite the fuse
                    grid[y][x].burning = true;
                    grid[y][x].temperature = 80;
                    
                    // If ignited by an already burning fuse, inherit its direction
                    if (grid[ny][nx].type === 'fuse' && grid[ny][nx].burning && grid[ny][nx].burnDirection) {
                        grid[y][x].burnDirection = grid[ny][nx].burnDirection;
                    }
                    
                    break;
                }
            }
        }
    },
    
    // Determine which direction the fuse burning should spread
    determineBurnDirection: function(x, y, grid, isInBounds) {
        const directions = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Check for connected unburnt fuse pieces
        const connectedFuses = [];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            if (grid[ny][nx].type === 'fuse' && !grid[ny][nx].burning) {
                connectedFuses.push(dir);
            }
        }
        
        // If we found connected fuses, pick one direction to spread
        if (connectedFuses.length > 0) {
            // Prioritize cardinal directions (non-diagonal)
            const cardinalDirections = connectedFuses.filter(dir => 
                (Math.abs(dir.dx) + Math.abs(dir.dy)) === 1
            );
            
            if (cardinalDirections.length > 0) {
                grid[y][x].burnDirection = cardinalDirections[Math.floor(Math.random() * cardinalDirections.length)];
            } else {
                grid[y][x].burnDirection = connectedFuses[Math.floor(Math.random() * connectedFuses.length)];
            }
        }
    },
    
    // Create smoke from burning fuse
    createSmoke: function(x, y, grid, isInBounds) {
        // Try to create smoke in an empty cell above
        const smokeY = y - 1;
        
        if (isInBounds(x, smokeY) && !grid[smokeY][x]) {
            grid[smokeY][x] = {
                type: 'smoke',
                color: '#888888',
                processed: true,
                temperature: 60,
                isGas: true,
                isLiquid: false,
                isPowder: false,
                isSolid: false,
                lifetime: 50 + Math.floor(Math.random() * 50)
            };
        }
    },
    
    // Create a final spark when the fuse fully burns
    createFinalSpark: function(x, y, grid, isInBounds) {
        // Try to ignite any explosives nearby
        const directions = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Ignite any explosives
            if (grid[ny][nx].explosive) {
                grid[ny][nx].temperature = 200;
                
                if (grid[ny][nx].type === 'gunpowder' || grid[ny][nx].type === 'explosive-powder') {
                    // Set explosive powder to ignite
                    grid[ny][nx].ignited = true;
                }
                
                if (grid[ny][nx].type === 'c4' || grid[ny][nx].type === 'dynamite') {
                    // Set solid explosives to detonate
                    grid[ny][nx].detonating = true;
                }
            }
            
            // Ignite flammable materials
            if (grid[ny][nx].flammable && Math.random() < 0.5) {
                grid[ny][nx].burning = true;
                grid[ny][nx].temperature = 200;
            }
        }
        
        // Create a temporary spark/fire effect
        if (Math.random() < 0.7) {
            const directions = [
                { dx: 0, dy: -1 }, // Above
                { dx: -1, dy: -1 }, // Above left
                { dx: 1, dy: -1 }, // Above right
            ];
            
            for (const dir of directions) {
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (!isInBounds(nx, ny) || grid[ny][nx]) continue;
                
                // Create a temporary fire/spark at the end
                grid[ny][nx] = {
                    type: 'fire',
                    color: '#FFAA00',
                    processed: true,
                    temperature: 200,
                    isGas: true,
                    isLiquid: false,
                    isPowder: false,
                    isSolid: false,
                    lifetime: 5 + Math.floor(Math.random() * 10)
                };
                
                break; // Just create one fire/spark
            }
        }
    },
    
    // Render the fuse
    render: function(ctx, x, y, particle, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        if (particle.burning) {
            // Draw the burning fuse with a gradient from burnt to unburnt
            const burnProgress = particle.burnProgress || 0;
            
            // First draw the base fuse
            ctx.fillStyle = particle.color || this.defaultColor;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            
            // Draw the burnt section
            ctx.fillStyle = '#333333'; // Burnt/ash color
            
            // Determine direction of burning
            let burnStartX, burnStartY, burnEndX, burnEndY;
            
            if (particle.burnDirection) {
                // Burn in the direction of the burn
                if (particle.burnDirection.dx < 0) {
                    // Burning from right to left
                    burnStartX = x * cellSize + cellSize;
                    burnEndX = x * cellSize + cellSize * (1 - burnProgress);
                    burnStartY = y * cellSize;
                    burnEndY = y * cellSize + cellSize;
                } else if (particle.burnDirection.dx > 0) {
                    // Burning from left to right
                    burnStartX = x * cellSize;
                    burnEndX = x * cellSize + cellSize * burnProgress;
                    burnStartY = y * cellSize;
                    burnEndY = y * cellSize + cellSize;
                } else if (particle.burnDirection.dy < 0) {
                    // Burning from bottom to top
                    burnStartX = x * cellSize;
                    burnEndX = x * cellSize + cellSize;
                    burnStartY = y * cellSize + cellSize;
                    burnEndY = y * cellSize + cellSize * (1 - burnProgress);
                } else if (particle.burnDirection.dy > 0) {
                    // Burning from top to bottom
                    burnStartX = x * cellSize;
                    burnEndX = x * cellSize + cellSize;
                    burnStartY = y * cellSize;
                    burnEndY = y * cellSize + cellSize * burnProgress;
                } else {
                    // Diagonal or default - burn from one corner
                    burnStartX = x * cellSize;
                    burnEndX = x * cellSize + cellSize * burnProgress;
                    burnStartY = y * cellSize;
                    burnEndY = y * cellSize + cellSize;
                }
            } else {
                // Default burn pattern if no direction set
                burnStartX = x * cellSize;
                burnEndX = x * cellSize + cellSize * burnProgress;
                burnStartY = y * cellSize;
                burnEndY = y * cellSize + cellSize;
            }
            
            ctx.fillRect(burnStartX, burnStartY, burnEndX - burnStartX, burnEndY - burnStartY);
            
            // Add burning effect at the burn line
            ctx.fillStyle = '#FF6600'; // Orange flame color
            const burnLineWidth = cellSize * 0.1;
            
            if (particle.burnDirection && particle.burnDirection.dx !== 0) {
                // Horizontal burn line
                ctx.fillRect(
                    burnEndX - burnLineWidth/2, 
                    y * cellSize, 
                    burnLineWidth, 
                    cellSize
                );
            } else if (particle.burnDirection && particle.burnDirection.dy !== 0) {
                // Vertical burn line
                ctx.fillRect(
                    x * cellSize, 
                    burnEndY - burnLineWidth/2, 
                    cellSize, 
                    burnLineWidth
                );
            } else {
                // Default burn spot
                ctx.beginPath();
                ctx.arc(
                    x * cellSize + cellSize * burnProgress,
                    y * cellSize + cellSize / 2,
                    cellSize * 0.15,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
            
            // Add sparks at the burn point
            if (particle.sparkFrame % 3 === 0) {
                ctx.fillStyle = '#FFFF00'; // Yellow spark color
                
                for (let i = 0; i < 3; i++) {
                    const sparkSize = cellSize * (0.03 + Math.random() * 0.05);
                    const angle = Math.random() * Math.PI * 2;
                    const distance = cellSize * (0.1 + Math.random() * 0.1);
                    
                    let sparkX, sparkY;
                    
                    if (particle.burnDirection && particle.burnDirection.dx !== 0) {
                        // Sparks from horizontal burn point
                        sparkX = burnEndX + Math.cos(angle) * distance;
                        sparkY = centerY + Math.sin(angle) * distance;
                    } else if (particle.burnDirection && particle.burnDirection.dy !== 0) {
                        // Sparks from vertical burn point
                        sparkX = centerX + Math.cos(angle) * distance;
                        sparkY = burnEndY + Math.sin(angle) * distance;
                    } else {
                        // Default spark position
                        sparkX = x * cellSize + cellSize * burnProgress + Math.cos(angle) * distance;
                        sparkY = centerY + Math.sin(angle) * distance;
                    }
                    
                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else {
            // Draw normal fuse
            ctx.fillStyle = particle.color || this.defaultColor;
            
            // Draw a brown rope/string-like fuse
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            
            // Add texture with fuse fibers
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 0.5;
            
            // Draw some fiber lines
            const lineCount = 5;
            for (let i = 0; i < lineCount; i++) {
                const yOffset = cellSize * (i / lineCount);
                
                ctx.beginPath();
                ctx.moveTo(x * cellSize, y * cellSize + yOffset);
                
                // Wavy line
                for (let xPos = 0; xPos <= cellSize; xPos += cellSize / 10) {
                    const wave = Math.sin((xPos / cellSize) * Math.PI * 2) * (cellSize * 0.05);
                    ctx.lineTo(x * cellSize + xPos, y * cellSize + yOffset + wave);
                }
                
                ctx.stroke();
            }
        }
    }
};

// Make the element available globally
window.FuseElement = FuseElement; 