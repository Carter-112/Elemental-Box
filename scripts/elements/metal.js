// Metal Element
// A solid material that conducts electricity and heat

const MetalElement = {
    name: 'metal',
    label: 'Metal',
    description: 'A solid material that conducts electricity and heat',
    category: 'solid',
    defaultColor: '#A9A9A9',
    
    // Physical properties
    density: 7.0,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,
    isSpawner: false,
    isElectrical: true,
    
    // Behavior properties
    flammable: false,
    conductive: true,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // room temperature by default
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.conductivity = 0.95; // Excellent conductor
        particle.charge = 0; // No initial charge
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].conductivity === undefined) {
            grid[y][x].conductivity = 0.95;
        }
        
        if (grid[y][x].charge === undefined) {
            grid[y][x].charge = 0;
        }
        
        // Metal conducts heat effectively
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
        
        // Process heat conduction
        let totalNeighborTemp = 0;
        let neighborCount = 0;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Count neighboring temperatures for heat equilibrium
            if (grid[ny][nx].temperature !== undefined) {
                totalNeighborTemp += grid[ny][nx].temperature;
                neighborCount++;
            }
            
            // Conduct electricity through metal or to connected electrical components
            if (grid[ny][nx].type === 'battery' || 
                (grid[ny][nx].type === 'static-charge' && grid[ny][nx].charge > 0)) {
                // Receive power from a battery or static charge
                grid[y][x].charge = Math.min(1.0, grid[y][x].charge + 0.2);
            } else if (grid[ny][nx].type === 'metal' && grid[ny][nx].charge > grid[y][x].charge) {
                // Conduct charge from another metal piece
                grid[y][x].charge = grid[ny][nx].charge * 0.95;
            } else if (grid[ny][nx].type === 'wire') {
                // Interact with wires
                if (grid[ny][nx].powered) {
                    grid[y][x].charge = 1.0;
                } else if (grid[y][x].charge > 0.5) {
                    grid[ny][nx].powered = true;
                }
            }
            
            // Special interactions with other elements
            if (grid[ny][nx].type === 'water') {
                // Electrify water if metal is charged
                if (grid[y][x].charge > 0.1) {
                    grid[ny][nx].electrified = true;
                    grid[ny][nx].color = '#7DF9FF'; // Electrified water color
                }
            }
        }
        
        // Heat equilibrium - metal tries to reach average temperature of surroundings
        if (neighborCount > 0) {
            const avgTemp = totalNeighborTemp / neighborCount;
            grid[y][x].temperature = grid[y][x].temperature * 0.8 + avgTemp * 0.2;
            
            // Metal changes color slightly when very hot
            if (grid[y][x].temperature > 200) {
                const tempFactor = Math.min(1, (grid[y][x].temperature - 200) / 800);
                const r = Math.floor(169 + tempFactor * 86);
                const g = Math.floor(169 + tempFactor * 14);
                const b = Math.floor(169 - tempFactor * 100);
                grid[y][x].color = `rgb(${r}, ${g}, ${b})`;
            } else {
                grid[y][x].color = this.defaultColor;
            }
            
            // Metal melts at extremely high temperatures
            if (grid[y][x].temperature > 1400) {
                grid[y][x] = {
                    type: 'lava',
                    color: '#FF7F00',
                    temperature: grid[y][x].temperature,
                    processed: true,
                    isGas: false,
                    isLiquid: true,
                    isPowder: false,
                    isSolid: false
                };
                return;
            }
        }
        
        // Discharge over time
        if (grid[y][x].charge > 0) {
            grid[y][x].charge *= 0.99;
            
            // Visual spark effect when charged
            if (grid[y][x].charge > 0.7 && Math.random() < 0.05) {
                // Create a static charge particle nearby
                const sparkDir = neighbors[Math.floor(Math.random() * neighbors.length)];
                const sparkX = x + sparkDir.dx;
                const sparkY = y + sparkDir.dy;
                
                if (isInBounds(sparkX, sparkY) && !grid[sparkY][sparkX]) {
                    grid[sparkY][sparkX] = {
                        type: 'static-charge',
                        color: '#FFFF00',
                        temperature: grid[y][x].temperature + 20,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: true,
                        isSolid: false,
                        charge: grid[y][x].charge * 0.7,
                        lifetime: 5 + Math.floor(Math.random() * 5)
                    };
                }
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base metal color
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add metallic appearance
        const charge = particle.charge || 0;
        
        // Add highlights to give metallic look
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize * 0.2, 
            cellSize * 0.8
        );
        
        // Add shadow edge
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(
            x * cellSize + cellSize * 0.8, 
            y * cellSize, 
            cellSize * 0.2, 
            cellSize
        );
        
        // Show electrical charge if present
        if (charge > 0.1) {
            // Draw charge indicator
            ctx.fillStyle = `rgba(255, 255, 0, ${charge * 0.7})`;
            
            // Random sparks
            const sparkCount = Math.floor(charge * 3);
            for (let i = 0; i < sparkCount; i++) {
                const sparkX = x * cellSize + Math.random() * cellSize;
                const sparkY = y * cellSize + Math.random() * cellSize;
                const sparkSize = 1 + Math.random() * 2;
                
                ctx.beginPath();
                ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
                ctx.fill();
                
                // Add spark lines
                if (Math.random() < 0.5 && charge > 0.5) {
                    ctx.beginPath();
                    ctx.moveTo(sparkX, sparkY);
                    ctx.lineTo(
                        sparkX + (Math.random() * 2 - 1) * cellSize * 0.3,
                        sparkY + (Math.random() * 2 - 1) * cellSize * 0.3
                    );
                    ctx.stroke();
                }
            }
        }
    }
};

// Make the element available globally
window.MetalElement = MetalElement; 