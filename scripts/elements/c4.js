// C4 Element
// A stable plastic explosive that only detonates when triggered

const C4Element = {
    name: 'c4',
    label: 'C4',
    description: 'Stable plastic explosive that only detonates when triggered',
    category: 'solid',
    defaultColor: '#F5F5DC', // Light beige color
    
    // Physical properties
    density: 1.6,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Make it static so it doesn't fall
    hasGravity: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: true,
    conductive: false,
    explosive: true,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.isStatic = true;  // Ensure it remains static
        particle.hasGravity = false;
        particle.stability = 100;  // Very stable until triggered
        particle.blastRadius = 10; // Large blast radius
        particle.detonated = false;
        particle.triggered = false;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // C4 doesn't fall - it stays where it's placed
        
        // Check neighbors for detonators
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
            
            // Check for triggers
            if (grid[ny][nx].type === 'fire' || 
                grid[ny][nx].type === 'electricity' || 
                grid[ny][nx].type === 'plasma' ||
                (grid[ny][nx].explosive && grid[ny][nx].detonated)) {
                
                grid[y][x].triggered = true;
            }
            
            // Heat transfer from neighbors
            if (grid[ny][nx].temperature && grid[ny][nx].temperature > grid[y][x].temperature) {
                grid[y][x].temperature += (grid[ny][nx].temperature - grid[y][x].temperature) * 0.05;
            }
        }
        
        // Check for detonation
        if (grid[y][x].triggered || grid[y][x].temperature > 150) {
            this.explode(x, y, grid, isInBounds);
            return;
        }
    },
    
    // Explode the C4
    explode: function(x, y, grid, isInBounds) {
        const radius = grid[y][x].blastRadius || 10;
        grid[y][x].detonated = true;
        
        // Clear the original C4 cell
        grid[y][x] = null;
        
        // Create explosion effect
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                // Calculate distance from explosion center
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Skip if outside blast radius
                if (distance > radius) continue;
                
                const nx = x + dx;
                const ny = y + dy;
                
                // Skip if outside grid
                if (!isInBounds(nx, ny)) continue;
                
                // Calculate effect based on distance
                const intensity = 1 - (distance / radius);
                
                // Chance to destroy decreases with distance
                const destroyChance = Math.pow(intensity, 1.5);
                
                // Destroy or affect existing cells
                if (grid[ny][nx]) {
                    // More likely to destroy nearby cells
                    if (Math.random() < destroyChance) {
                        grid[ny][nx] = null;
                    } else if (grid[ny][nx].flammable && Math.random() < destroyChance * 0.8) {
                        // Set flammable cells on fire
                        grid[ny][nx] = {
                            type: 'fire',
                            color: '#FF4500',
                            processed: true,
                            temperature: 500,
                            isGas: true,
                            lifespan: 20 + Math.random() * 30
                        };
                    }
                }
                
                // Create explosion effects in empty cells
                if (!grid[ny][nx] && Math.random() < intensity * 0.8) {
                    if (distance < radius * 0.3 && Math.random() < 0.8) {
                        // Core of explosion - hot plasma
                        grid[ny][nx] = {
                            type: 'plasma',
                            color: '#FFFFFF',
                            processed: true,
                            temperature: 3000,
                            isGas: true,
                            lifespan: 5 + Math.random() * 10
                        };
                    } else if (Math.random() < 0.7) {
                        // Fire in the blast radius
                        grid[ny][nx] = {
                            type: 'fire',
                            color: '#FF4500',
                            processed: true,
                            temperature: 500,
                            isGas: true,
                            lifespan: 10 + Math.random() * 20
                        };
                    } else if (Math.random() < 0.4) {
                        // Smoke from the explosion
                        grid[ny][nx] = {
                            type: 'smoke',
                            color: '#555555',
                            processed: true,
                            temperature: 200,
                            isGas: true,
                            lifespan: 30 + Math.random() * 50
                        };
                    }
                }
            }
        }
    },
    
    // Render the C4
    render: function(x, y, ctx, cellSize) {
        ctx.fillStyle = this.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add C4 texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(x * cellSize + cellSize * 0.2, y * cellSize + cellSize * 0.2, 
                     cellSize * 0.6, cellSize * 0.6);
        
        // Add text "C4"
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = `${cellSize * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C4', x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
    }
};

// Register the element
if (typeof window !== 'undefined') {
    window.C4Element = C4Element;
} 