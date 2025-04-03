// Glass Element
// See-through solid that sparks can travel across

const GlassElement = {
    name: 'glass',
    label: 'Glass',
    description: 'Transparent solid that sparks can travel across',
    category: 'solid',
    defaultColor: '#BFEFFF', // Light blue transparent color
    
    // Physical properties
    density: 2.5,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: true, // Can conduct electricity/sparks
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    transparency: 0.7, // Glass is quite transparent
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.integrity = 100; // Track structural integrity
        particle.transparency = this.transparency;
        
        // Track if the glass has any sparks traveling across it
        particle.hasSpark = false;
        particle.sparkDirection = null;
        particle.sparkProgress = 0;
        particle.sparkStrength = 0;
        
        // Small random variations in glass appearance
        const blueVariation = Math.floor(Math.random() * 20) - 10;
        particle.color = `rgb(${191 + blueVariation}, ${239 + blueVariation}, ${255})`;
        
        // Random chance to have small imperfections
        particle.hasImperfection = Math.random() < 0.3;
        particle.imperfectionType = Math.floor(Math.random() * 3); // 0-2 different types
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Check if the glass should fall (no support below)
        let hasSupport = false;
        
        if (y < grid.length - 1) {
            if (grid[y + 1][x] && (grid[y + 1][x].isSolid || grid[y + 1][x].isPowder)) {
                hasSupport = true;
            }
        } else {
            // Bottom of grid counts as support
            hasSupport = true;
        }
        
        // If no support, the glass falls and has a chance to break
        if (!hasSupport && y < grid.length - 1 && !grid[y + 1][x]) {
            // Chance to break when falling
            if (Math.random() < 0.3) {
                this.breakGlass(x, y, grid, isInBounds);
                return;
            } else {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
        
        // Process sparks traveling across the glass
        if (grid[y][x].hasSpark) {
            this.processSparkTravel(x, y, grid, isInBounds);
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
            
            // Temperature exchange (glass is a poor conductor of heat)
            if (grid[ny][nx].temperature !== undefined) {
                grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.01;
            }
            
            // Check for static charge nearby (can start a spark)
            if (grid[ny][nx].type === 'static-charge' && !grid[y][x].hasSpark) {
                // Glass can conduct the static charge as a spark
                grid[y][x].hasSpark = true;
                grid[y][x].sparkStrength = 0.8 + (Math.random() * 0.2); // Random spark strength
                grid[y][x].sparkProgress = 0;
                
                // Determine spark direction (away from static charge)
                grid[y][x].sparkDirection = {
                    dx: -dir.dx,
                    dy: -dir.dy
                };
                
                // Remove the static charge
                grid[ny][nx] = null;
                return;
            }
            
            // Sparks from other conductive materials
            if (grid[ny][nx].hasSpark && grid[ny][nx].conductive && Math.random() < 0.4) {
                grid[y][x].hasSpark = true;
                grid[y][x].sparkStrength = grid[ny][nx].sparkStrength * 0.9; // Slightly reduced strength
                grid[y][x].sparkProgress = 0;
                
                // Random spark direction if not coming from another cell's spark
                if (grid[ny][nx].sparkDirection) {
                    // Continue in roughly the same direction
                    grid[y][x].sparkDirection = grid[ny][nx].sparkDirection;
                } else {
                    // Random direction
                    const randomDir = neighbors[Math.floor(Math.random() * neighbors.length)];
                    grid[y][x].sparkDirection = { dx: randomDir.dx, dy: randomDir.dy };
                }
                
                return;
            }
            
            // Glass cracks with extreme temperature changes
            if ((grid[ny][nx].temperature > 500 || grid[ny][nx].temperature < -50) && 
                Math.abs(grid[y][x].temperature - grid[ny][nx].temperature) > 400) {
                grid[y][x].integrity -= 5;
                
                if (grid[y][x].integrity <= 0) {
                    this.breakGlass(x, y, grid, isInBounds);
                    return;
                }
            }
            
            // Glass melts at very high temperatures
            if (grid[y][x].temperature > 1500) {
                // Turn to liquid glass (similar to lava but different color)
                grid[y][x] = {
                    type: 'lava', // Using lava type for molten glass
                    color: '#BFEFFF',
                    processed: true,
                    temperature: 1500,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false,
                    density: 2.2
                };
                return;
            }
            
            // Acid corrodes glass
            if (grid[ny][nx].type === 'acid' && Math.random() < 0.03) {
                grid[y][x].integrity -= 10;
                
                // Reduce acid as it corrodes
                grid[ny][nx].acidity = (grid[ny][nx].acidity || 1) - 0.1;
                
                if (grid[ny][nx].acidity <= 0) {
                    grid[ny][nx] = null;
                }
                
                // Frosted glass effect as acid corrodes
                grid[y][x].transparency = Math.max(0.3, grid[y][x].transparency - 0.05);
                
                if (grid[y][x].integrity <= 0) {
                    this.breakGlass(x, y, grid, isInBounds);
                    return;
                }
            }
            
            // Explosions break glass
            if (grid[ny][nx].type === 'fire' && grid[ny][nx].explosive) {
                this.breakGlass(x, y, grid, isInBounds);
                return;
            }
        }
    },
    
    // Process a spark traveling across the glass
    processSparkTravel: function(x, y, grid, isInBounds) {
        // Update the spark's progress
        grid[y][x].sparkProgress += 0.1;
        
        // If the spark has finished traveling across this cell
        if (grid[y][x].sparkProgress >= 1) {
            // Try to pass the spark to the next cell in the direction
            if (grid[y][x].sparkDirection) {
                const nx = x + grid[y][x].sparkDirection.dx;
                const ny = y + grid[y][x].sparkDirection.dy;
                
                if (isInBounds(nx, ny)) {
                    if (grid[ny][nx] && grid[ny][nx].conductive) {
                        // Pass spark to another conductive material
                        grid[ny][nx].hasSpark = true;
                        grid[ny][nx].sparkStrength = grid[y][x].sparkStrength * 0.8; // Lose some strength
                        grid[ny][nx].sparkProgress = 0;
                        grid[ny][nx].sparkDirection = grid[y][x].sparkDirection;
                    } else if (!grid[ny][nx]) {
                        // Create a static charge in empty space
                        grid[ny][nx] = {
                            type: 'static-charge',
                            color: '#FFFF80',
                            processed: true,
                            temperature: 100, // Sparks are hot
                            isGas: false,
                            isLiquid: false,
                            isPowder: false,
                            isSolid: false,
                            lifetime: 5 + Math.floor(Math.random() * 10)
                        };
                    }
                }
            }
            
            // Remove the spark from this cell
            grid[y][x].hasSpark = false;
            grid[y][x].sparkProgress = 0;
            grid[y][x].sparkDirection = null;
        }
    },
    
    // Break glass into glass shards
    breakGlass: function(x, y, grid, isInBounds) {
        // Create glass shard in the current position
        grid[y][x] = {
            type: 'glass-shard',
            color: '#E0F8FF', // Light blue/transparent color
            processed: true,
            temperature: grid[y][x].temperature,
            isGas: false,
            isLiquid: false,
            isPowder: true,
            isSolid: false,
            sharpness: 100,
            size: 0.7 + (Math.random() * 0.6),
            rotation: Math.random() * 360
        };
        
        // Create additional glass shards in neighboring cells
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Scatter a few glass shards
        const shardCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < shardCount; i++) {
            const randomDir = neighbors[Math.floor(Math.random() * neighbors.length)];
            const nx = x + randomDir.dx;
            const ny = y + randomDir.dy;
            
            if (!isInBounds(nx, ny) || grid[ny][nx]) continue;
            
            // Create glass shard
            grid[ny][nx] = {
                type: 'glass-shard',
                color: '#E0F8FF',
                processed: true,
                temperature: grid[y][x].temperature,
                isGas: false,
                isLiquid: false,
                isPowder: true,
                isSolid: false,
                sharpness: 80 + Math.floor(Math.random() * 20),
                size: 0.5 + (Math.random() * 0.5),
                rotation: Math.random() * 360
            };
        }
    },
    
    // Render the glass
    render: function(ctx, x, y, particle, cellSize) {
        // Use global transparency setting
        const transparency = particle.transparency !== undefined ? 
            particle.transparency : this.transparency;
        
        ctx.globalAlpha = transparency;
        
        // Fill with base glass color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add subtle glass edge highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add imperfections if this glass piece has them
        if (particle.hasImperfection) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            
            switch (particle.imperfectionType) {
                case 0: // Small bubbles
                    for (let i = 0; i < 3; i++) {
                        const bubbleX = x * cellSize + Math.random() * cellSize;
                        const bubbleY = y * cellSize + Math.random() * cellSize;
                        const bubbleSize = cellSize * (0.02 + Math.random() * 0.04);
                        
                        ctx.beginPath();
                        ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    break;
                    
                case 1: // Small scratch
                    ctx.beginPath();
                    const startX = x * cellSize + Math.random() * cellSize;
                    const startY = y * cellSize + Math.random() * cellSize;
                    const endX = startX + (Math.random() - 0.5) * cellSize * 0.7;
                    const endY = startY + (Math.random() - 0.5) * cellSize * 0.7;
                    
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                    break;
                    
                case 2: // Color tint
                    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 100 + 155)}, 
                                      ${Math.floor(Math.random() * 100 + 155)}, 
                                      ${Math.floor(Math.random() * 100 + 155)}, 0.1)`;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    break;
            }
        }
        
        // Render a spark if present
        if (particle.hasSpark) {
            const sparkProgress = particle.sparkProgress || 0;
            const sparkStrength = particle.sparkStrength || 1;
            
            // Calculate spark position based on direction and progress
            let sparkX, sparkY;
            
            if (particle.sparkDirection) {
                // Start from one edge, move towards the opposite edge
                const startX = x * cellSize + (particle.sparkDirection.dx < 0 ? cellSize : 0);
                const startY = y * cellSize + (particle.sparkDirection.dy < 0 ? cellSize : 0);
                const endX = x * cellSize + (particle.sparkDirection.dx <= 0 ? 0 : cellSize);
                const endY = y * cellSize + (particle.sparkDirection.dy <= 0 ? 0 : cellSize);
                
                sparkX = startX + (endX - startX) * sparkProgress;
                sparkY = startY + (endY - startY) * sparkProgress;
            } else {
                // Default movement from left to right
                sparkX = x * cellSize + cellSize * sparkProgress;
                sparkY = y * cellSize + cellSize / 2;
            }
            
            // Draw spark glow
            const glowRadius = cellSize * 0.2 * sparkStrength;
            const gradient = ctx.createRadialGradient(
                sparkX, sparkY, 0,
                sparkX, sparkY, glowRadius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 150, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 150, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, glowRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw spark center
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, cellSize * 0.05 * sparkStrength, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Reset transparency
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.GlassElement = GlassElement; 