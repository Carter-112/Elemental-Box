// Faucet Element
// A solid that spawns water

const FaucetElement = {
    name: 'faucet',
    label: 'Faucet',
    description: 'A solid that continuously spawns water',
    category: 'spawner',
    defaultColor: '#6F8FAF',
    
    // Physical properties
    density: 3.0,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,
    isSpawner: true,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: true, // Can conduct electricity
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.active = true; // Faucet is on by default
        particle.flowRate = 0.8; // Water flow rate, higher means more water
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].active === undefined) {
            grid[y][x].active = true;
        }
        
        if (grid[y][x].flowRate === undefined) {
            grid[y][x].flowRate = 0.8;
        }
        
        // Check if faucet is activated by electrical circuit
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        // Check for electrical connections
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // If connected to a powered wire, the faucet can be toggled
            if (grid[ny][nx].type === 'wire' && grid[ny][nx].powered) {
                if (grid[ny][nx].activationToggled) {
                    grid[y][x].active = !grid[y][x].active;
                    grid[ny][nx].activationToggled = false;
                }
            }
            
            // Switch can directly toggle the faucet
            if (grid[ny][nx].type === 'switch') {
                grid[y][x].active = grid[ny][nx].on || false;
            }
        }
        
        // Spawn water below if active
        if (grid[y][x].active && y < grid.length - 1) {
            // Only spawn if probability check passes based on flow rate
            if (Math.random() < grid[y][x].flowRate) {
                // The position directly below
                const belowX = x;
                const belowY = y + 1;
                
                // Only spawn water if the space below is empty
                if (isInBounds(belowX, belowY) && !grid[belowY][belowX]) {
                    grid[belowY][belowX] = {
                        type: 'water',
                        color: '#4286f4',
                        temperature: grid[y][x].temperature, // Water temp matches faucet
                        processed: false,
                        isGas: false,
                        isLiquid: true,
                        isPowder: false,
                        isSolid: false
                    };
                }
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Draw faucet base
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(
            x * cellSize + cellSize * 0.1, 
            y * cellSize + cellSize * 0.1, 
            cellSize * 0.8, 
            cellSize * 0.6
        );
        
        // Draw faucet spout
        ctx.fillRect(
            x * cellSize + cellSize * 0.3, 
            y * cellSize + cellSize * 0.6, 
            cellSize * 0.4, 
            cellSize * 0.3
        );
        
        // Draw handle
        ctx.fillStyle = '#C0C0C0';
        
        // Handle position depends on active state
        const handleX = x * cellSize + (particle.active ? cellSize * 0.7 : cellSize * 0.3);
        
        ctx.beginPath();
        ctx.arc(handleX, y * cellSize + cellSize * 0.2, cellSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw water dripping if active
        if (particle.active) {
            ctx.fillStyle = 'rgba(66, 134, 244, 0.8)';
            
            // Animate the dripping
            const drips = 3;
            const currentTime = Date.now();
            
            for (let i = 0; i < drips; i++) {
                const drip = {
                    x: x * cellSize + cellSize * 0.5,
                    y: y * cellSize + cellSize * 0.9 + 
                       ((currentTime / 100 + i * 100) % (cellSize * 2)) 
                };
                
                ctx.beginPath();
                ctx.arc(drip.x, drip.y, cellSize * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
};

// Make the element available globally
window.FaucetElement = FaucetElement; 