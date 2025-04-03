// Switch Element
// An electrical component that can be toggled to conduct electricity

const SwitchElement = {
    name: 'switch',
    label: 'Switch',
    description: 'An electrical component that conducts electricity when toggled on',
    category: 'electrical',
    defaultColor: '#555555',
    
    // Physical properties
    density: 5.0, // Moderately dense
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Doesn't move
    isSpawner: false,
    isElectrical: true, // Electrical component
    
    // Behavior properties
    flammable: false,
    conductive: true, // Can conduct electricity when toggled on
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // Room temperature
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.toggled = false; // Switch starts in off state
        particle.hasElectricity = false;
        particle.conductivityTimer = 0;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].toggled === undefined) {
            grid[y][x].toggled = false;
        }
        if (grid[y][x].hasElectricity === undefined) {
            grid[y][x].hasElectricity = false;
        }
        if (grid[y][x].conductivityTimer === undefined) {
            grid[y][x].conductivityTimer = 0;
        }
        
        // Reset electricity status at the start of each tick
        const wasElectrified = grid[y][x].hasElectricity;
        grid[y][x].hasElectricity = false;
        
        // Check neighboring cells for electricity input
        const directions = [
            { dx: 0, dy: -1 },  // up
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 },  // left
            { dx: 1, dy: -1 },  // up-right
            { dx: 1, dy: 1 },   // down-right
            { dx: -1, dy: 1 },  // down-left
            { dx: -1, dy: -1 }  // up-left
        ];
        
        // Check for electricity in neighbors
        for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (isInBounds(nx, ny) && grid[ny][nx]) {
                // Detect if neighbor has electricity
                if (grid[ny][nx].hasElectricity && grid[ny][nx].type !== 'switch') {
                    grid[y][x].hasElectricity = true;
                    break;
                }
            }
        }
        
        // Handle electricity conduction
        if (grid[y][x].hasElectricity) {
            grid[y][x].conductivityTimer = 5; // Visual effect timer
            
            // Only conduct if toggled on
            if (grid[y][x].toggled) {
                // Conduct to neighboring conductive elements
                for (const dir of directions) {
                    const nx = x + dir.dx;
                    const ny = y + dir.dy;
                    
                    if (isInBounds(nx, ny) && grid[ny][nx]) {
                        const neighbor = grid[ny][nx];
                        // Only conduct to elements that can receive electricity
                        if (neighbor.conductive && neighbor.type !== 'switch') {
                            neighbor.hasElectricity = true;
                            if (neighbor.conductivityTimer !== undefined) {
                                neighbor.conductivityTimer = 0;
                            }
                        }
                    }
                }
            }
        } else if (grid[y][x].conductivityTimer > 0) {
            // Fade out electricity visual effect
            grid[y][x].conductivityTimer--;
        }
    },
    
    // Handle user interaction - toggle the switch when clicked
    onInteract: function(x, y, grid) {
        if (grid[y][x].type === 'switch') {
            // Toggle the switch state
            grid[y][x].toggled = !grid[y][x].toggled;
            
            // Play a click sound
            if (window.playSound) {
                window.playSound('click', 0.3);
            }
            
            return true; // Interaction handled
        }
        return false; // Not handled
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base color - darker when off, brighter when on
        const toggledColor = particle.toggled ? '#999999' : '#555555';
        
        // Draw the switch base
        ctx.fillStyle = toggledColor;
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Draw a border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            x * cellSize + 1, 
            y * cellSize + 1, 
            cellSize - 2, 
            cellSize - 2
        );
        
        // Draw the toggle lever
        const leverWidth = cellSize * 0.4;
        const leverHeight = cellSize * 0.6;
        const leverX = x * cellSize + (cellSize - leverWidth) / 2;
        let leverY;
        
        if (particle.toggled) {
            // Lever position when on (down)
            leverY = y * cellSize + (cellSize - leverHeight) / 2 + (leverHeight * 0.3);
        } else {
            // Lever position when off (up)
            leverY = y * cellSize + (cellSize - leverHeight) / 2 - (leverHeight * 0.3);
        }
        
        // Draw lever with metallic color
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(
            leverX,
            leverY,
            leverWidth,
            leverHeight
        );
        
        // Add a highlight to the lever
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(
            leverX,
            leverY,
            leverWidth / 2,
            leverHeight / 2
        );
        
        // If electricity is flowing, draw electrical effect
        if ((particle.hasElectricity || particle.conductivityTimer > 0) && particle.toggled) {
            // Calculate opacity based on timer
            const opacity = particle.hasElectricity ? 0.7 : (particle.conductivityTimer / 5) * 0.7;
            
            // Draw electricity glow
            const gradient = ctx.createRadialGradient(
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                0,
                x * cellSize + cellSize / 2,
                y * cellSize + cellSize / 2,
                cellSize * 0.8
            );
            
            gradient.addColorStop(0, `rgba(50, 150, 255, ${opacity})`);
            gradient.addColorStop(1, 'rgba(50, 150, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
                x * cellSize - cellSize * 0.3, 
                y * cellSize - cellSize * 0.3, 
                cellSize * 1.6, 
                cellSize * 1.6
            );
            
            // Draw small electricity arcs
            if (Math.random() < 0.5) {
                ctx.strokeStyle = `rgba(100, 200, 255, ${opacity + 0.2})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                
                const arcX1 = x * cellSize + Math.random() * cellSize * 0.8 + cellSize * 0.1;
                const arcY1 = y * cellSize + Math.random() * cellSize * 0.8 + cellSize * 0.1;
                const arcX2 = x * cellSize + Math.random() * cellSize * 0.8 + cellSize * 0.1;
                const arcY2 = y * cellSize + Math.random() * cellSize * 0.8 + cellSize * 0.1;
                
                ctx.moveTo(arcX1, arcY1);
                
                // Create a jagged line for the arc
                const midX = (arcX1 + arcX2) / 2 + (Math.random() * cellSize * 0.2 - cellSize * 0.1);
                const midY = (arcY1 + arcY2) / 2 + (Math.random() * cellSize * 0.2 - cellSize * 0.1);
                
                ctx.lineTo(midX, midY);
                ctx.lineTo(arcX2, arcY2);
                
                ctx.stroke();
            }
        }
    }
};

// Make the element available globally
window.SwitchElement = SwitchElement; 