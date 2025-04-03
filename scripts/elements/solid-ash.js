// Solid Ash Element
// Compacted ash that forms under pressure

const SolidAshElement = {
    name: 'solid-ash',
    label: 'Solid Ash',
    description: 'Compacted ash that has solidified under pressure',
    category: 'solid',
    defaultColor: '#696969',
    
    // Physical properties
    density: 2.0,
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
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.integrity = 1.0; // Full integrity when created
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Check if solid ash is supported - if not, it can break
        if (y < grid.length - 1 && !grid[y + 1][x]) {
            // Check if we have support on sides
            const hasLeftSupport = x > 0 && grid[y][x - 1] && grid[y][x - 1].isSolid;
            const hasRightSupport = x < grid[0].length - 1 && grid[y][x + 1] && grid[y][x + 1].isSolid;
            
            // If no supports, reduce integrity and potentially break
            if (!hasLeftSupport && !hasRightSupport) {
                if (!grid[y][x].integrity) {
                    grid[y][x].integrity = 1.0;
                }
                
                grid[y][x].integrity -= 0.1;
                
                if (grid[y][x].integrity <= 0 || Math.random() < 0.01) {
                    // Break into regular ash powder
                    const ashCount = 2 + Math.floor(Math.random() * 3);
                    
                    for (let i = 0; i < ashCount; i++) {
                        const nx = x + Math.floor(Math.random() * 3) - 1;
                        const ny = y + Math.floor(Math.random() * 2);
                        
                        if (isInBounds(nx, ny) && !grid[ny][nx]) {
                            grid[ny][nx] = {
                                type: 'ash',
                                color: '#A9A9A9',
                                temperature: grid[y][x].temperature,
                                processed: true,
                                isGas: false,
                                isLiquid: false,
                                isPowder: true,
                                isSolid: false
                            };
                        }
                    }
                    
                    grid[y][x] = null;
                    return;
                }
            }
        }
        
        // Solid ash can disintegrate if wet
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
            
            // Solid ash weakens in water
            if (grid[ny][nx].type === 'water' || grid[ny][nx].type === 'acid') {
                if (!grid[y][x].integrity) {
                    grid[y][x].integrity = 1.0;
                }
                
                grid[y][x].integrity -= 0.02;
                
                if (grid[y][x].integrity <= 0) {
                    // Turn back to regular ash
                    grid[y][x] = {
                        type: 'ash',
                        color: '#A9A9A9',
                        temperature: grid[y][x].temperature,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: true,
                        isSolid: false
                    };
                    return;
                }
            }
        }
    },
    
    // Optional custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add some texture to the solid ash
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        
        // Draw a few dark spots/cracks
        const crackCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < crackCount; i++) {
            const crackX = x * cellSize + Math.random() * cellSize;
            const crackY = y * cellSize + Math.random() * cellSize;
            const crackLength = Math.max(1, Math.random() * cellSize / 3);
            const crackWidth = Math.max(1, crackLength / 3);
            
            ctx.fillRect(crackX, crackY, crackLength, crackWidth);
        }
    }
};

// Make the element available globally
window.SolidAshElement = SolidAshElement; 