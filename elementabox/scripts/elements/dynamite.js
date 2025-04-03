// Dynamite Element
// A solid explosive with a high blast radius

const DynamiteElement = {
    name: 'dynamite',
    label: 'Dynamite',
    description: 'An explosive solid with high blast radius, can form under pressure',
    category: 'solid',
    defaultColor: '#E22222',
    
    // Physical properties
    density: 1.6,
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
    explosive: true,
    reactive: true,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.fuseTimer = 0; // Timer before explosion
        particle.ignited = false; // Track if it's been lit
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].fuseTimer === undefined) {
            grid[y][x].fuseTimer = 0;
        }
        
        if (grid[y][x].ignited === undefined) {
            grid[y][x].ignited = false;
        }
        
        // Check for heat/fire to ignite
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
            { dx: -1, dy: -1 }, // top-left
            { dx: 1, dy: -1 },  // top-right
            { dx: -1, dy: 1 },  // bottom-left
            { dx: 1, dy: 1 }    // bottom-right
        ];
        
        // Check if any neighbors can ignite the dynamite
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Check for fire
            if (grid[ny][nx].type === 'fire') {
                grid[y][x].ignited = true;
                grid[y][x].fuseTimer += 5; // Fast ignition from direct fire
            }
            
            // Check for extreme heat
            if (grid[ny][nx].temperature > 80) {
                grid[y][x].ignited = true;
                grid[y][x].fuseTimer += 1;
            }
            
            // Check for fuse
            if (grid[ny][nx].type === 'fuse' && grid[ny][nx].burning) {
                grid[y][x].ignited = true;
                grid[y][x].fuseTimer += 3;
            }
        }
        
        // If ignited, count down to explosion
        if (grid[y][x].ignited) {
            // Visual indication of ignition
            grid[y][x].color = '#FF0000';
            
            // Tick the fuse timer
            grid[y][x].fuseTimer++;
            
            // Create smoke while waiting to explode
            if (Math.random() < 0.1) {
                const smokeX = x + (Math.random() < 0.5 ? -1 : 1);
                const smokeY = y - 1;
                
                if (isInBounds(smokeX, smokeY) && !grid[smokeY][smokeX]) {
                    grid[smokeY][smokeX] = {
                        type: 'smoke',
                        color: '#999999',
                        temperature: 60,
                        processed: true,
                        isGas: true,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: false
                    };
                }
            }
            
            // Explode after fuse timer reaches threshold
            if (grid[y][x].fuseTimer >= 30) {
                // Explode!
                grid[y][x] = null;
                
                // Large blast radius
                const blastRadius = 8;
                
                // Create explosion effect
                for (let dy = -blastRadius; dy <= blastRadius; dy++) {
                    for (let dx = -blastRadius; dx <= blastRadius; dx++) {
                        const distance = Math.sqrt(dx*dx + dy*dy);
                        
                        if (distance <= blastRadius) {
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            if (!isInBounds(nx, ny)) continue;
                            
                            // Destroy elements in blast radius with falloff based on distance
                            if (grid[ny][nx] && Math.random() < (1 - distance / blastRadius)) {
                                // Some chance to create fire
                                if (Math.random() < 0.3 && distance < blastRadius * 0.7) {
                                    grid[ny][nx] = {
                                        type: 'fire',
                                        color: '#FF9900',
                                        temperature: 120,
                                        processed: true,
                                        isGas: true,
                                        isLiquid: false,
                                        isPowder: false,
                                        isSolid: false
                                    };
                                } else {
                                    grid[ny][nx] = null;
                                }
                            }
                            
                            // Add smoke and fire at the edge of explosion
                            if (!grid[ny][nx] && Math.random() < 0.4 && distance > blastRadius * 0.5) {
                                grid[ny][nx] = {
                                    type: 'smoke',
                                    color: '#AAAAAA',
                                    temperature: 80,
                                    processed: true,
                                    isGas: true,
                                    isLiquid: false,
                                    isPowder: false,
                                    isSolid: false
                                };
                            }
                        }
                    }
                }
                
                return;
            }
        }
        
        // Dynamite falls with gravity
        if (y < grid.length - 1 && !grid[y][x].ignited) {
            // Try to move directly down
            if (!grid[y + 1][x]) {
                grid[y + 1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base dynamite color
        ctx.fillStyle = particle.color || this.defaultColor;
        
        // Draw the dynamite stick
        ctx.fillRect(
            x * cellSize + cellSize * 0.2, 
            y * cellSize + cellSize * 0.1, 
            cellSize * 0.6, 
            cellSize * 0.8
        );
        
        // Draw fuse on top
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x * cellSize + cellSize * 0.5, y * cellSize + cellSize * 0.1);
        
        // Make the fuse wiggle if ignited
        if (particle.ignited) {
            const wiggle = Math.sin(Date.now() * 0.01) * cellSize * 0.1;
            ctx.lineTo(
                x * cellSize + cellSize * 0.5 + wiggle, 
                y * cellSize - cellSize * 0.3
            );
            
            // Add orange glow to fuse tip
            ctx.strokeStyle = '#FF7700';
        } else {
            ctx.lineTo(
                x * cellSize + cellSize * 0.5, 
                y * cellSize - cellSize * 0.2
            );
        }
        
        ctx.stroke();
        
        // Add "TNT" label
        if (cellSize >= 6) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `${Math.max(8, cellSize * 0.4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('TNT', x * cellSize + cellSize / 2, y * cellSize + cellSize * 0.6);
        }
        
        // Show glow if ignited
        if (particle.ignited) {
            const fuseProgress = particle.fuseTimer / 30;
            
            // Make dynamite flash faster as it's about to explode
            if (fuseProgress > 0.7 && Math.random() < fuseProgress) {
                ctx.fillStyle = '#FFFF00';
                ctx.globalAlpha = 0.5;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                ctx.globalAlpha = 1.0;
            }
        }
    }
};

// Make the element available globally
window.DynamiteElement = DynamiteElement; 