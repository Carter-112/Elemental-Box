// Wire Element
// An electrical element that conducts electricity

const WireElement = {
    name: 'wire',
    label: 'Wire',
    description: 'Conducts electricity between components',
    category: 'electrical',
    defaultColor: '#CC0000', // Red wire
    
    // Physical properties
    density: 3.0,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true, // Doesn't move
    isSpawner: false,
    isElectrical: true, // Electrical component
    
    // Behavior properties
    flammable: false,
    conductive: true, // Conducts electricity
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 25, // Room temperature
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.hasElectricity = false;
        particle.conductivityTimer = 0;
        particle.connections = [false, false, false, false]; // Up, Right, Down, Left
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].hasElectricity === undefined) {
            grid[y][x].hasElectricity = false;
        }
        if (grid[y][x].conductivityTimer === undefined) {
            grid[y][x].conductivityTimer = 0;
        }
        if (grid[y][x].connections === undefined) {
            grid[y][x].connections = [false, false, false, false]; // Up, Right, Down, Left
        }
        
        // Update connections based on neighbors
        const dirs = [
            { dx: 0, dy: -1, idx: 0 }, // Up
            { dx: 1, dy: 0, idx: 1 },  // Right
            { dx: 0, dy: 1, idx: 2 },  // Down
            { dx: -1, dy: 0, idx: 3 }  // Left
        ];
        
        for (const dir of dirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (isInBounds(nx, ny) && grid[ny][nx]) {
                const neighbor = grid[ny][nx];
                // Connect to conductive elements
                grid[y][x].connections[dir.idx] = neighbor.conductive || neighbor.isElectrical;
            } else {
                grid[y][x].connections[dir.idx] = false;
            }
        }
        
        // Reset electricity status at the start of each tick
        const wasElectrified = grid[y][x].hasElectricity;
        grid[y][x].hasElectricity = false;
        
        // Check neighboring cells for electricity input
        for (const dir of dirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (isInBounds(nx, ny) && grid[ny][nx]) {
                // Detect if neighbor has electricity
                if (grid[ny][nx].hasElectricity) {
                    grid[y][x].hasElectricity = true;
                    grid[y][x].conductivityTimer = 0;
                    break;
                }
            }
        }
        
        // Handle electricity conduction
        if (grid[y][x].hasElectricity) {
            // Conduct to connected neighbors
            for (const dir of dirs) {
                // Only conduct in directions where there are connections
                if (!grid[y][x].connections[dir.idx]) continue;
                
                const nx = x + dir.dx;
                const ny = y + dir.dy;
                
                if (isInBounds(nx, ny) && grid[ny][nx]) {
                    const neighbor = grid[ny][nx];
                    // Only conduct to elements that can receive electricity
                    if (neighbor.conductive && !neighbor.hasElectricity) {
                        neighbor.hasElectricity = true;
                        if (neighbor.conductivityTimer !== undefined) {
                            neighbor.conductivityTimer = 0;
                        }
                    }
                }
            }
        } else {
            // If no longer has electricity, start fading the visual effect
            if (wasElectrified) {
                grid[y][x].conductivityTimer = 5; // Start fade timer
            } else if (grid[y][x].conductivityTimer > 0) {
                // Continue fading if timer is still active
                grid[y][x].conductivityTimer--;
            }
        }
        
        // Temperature effects - overheating
        // Wires heat up slightly when conducting electricity
        if (grid[y][x].hasElectricity) {
            grid[y][x].temperature += 0.1;
            
            // If too hot, the wire can melt and break
            if (grid[y][x].temperature > 400) {
                // Small chance to break when overheated
                if (Math.random() < 0.01) {
                    // Turn into metal
                    grid[y][x] = {
                        type: 'metal',
                        color: '#AAAAAA',
                        temperature: grid[y][x].temperature,
                        processed: true,
                        isGas: false,
                        isLiquid: false,
                        isPowder: false,
                        isSolid: true,
                        isStatic: true
                    };
                    return;
                }
            }
        } else {
            // Cool down when not conducting
            if (grid[y][x].temperature > 25) {
                grid[y][x].temperature -= 0.05;
            }
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base wire color
        const baseColor = particle.color || this.defaultColor;
        
        // Create wire connections visual
        const connections = particle.connections || [false, false, false, false];
        const center = { x: x * cellSize + cellSize / 2, y: y * cellSize + cellSize / 2 };
        const wireWidth = cellSize * 0.4;
        
        // Background/base for the wire
        ctx.fillStyle = '#777777'; // Metal background
        ctx.fillRect(
            x * cellSize, 
            y * cellSize, 
            cellSize, 
            cellSize
        );
        
        // Draw the wire based on connections
        ctx.fillStyle = baseColor;
        
        // Always draw center point
        ctx.fillRect(
            center.x - wireWidth / 2,
            center.y - wireWidth / 2,
            wireWidth,
            wireWidth
        );
        
        // Draw connections
        const connectionPoints = [
            { x: center.x, y: y * cellSize },           // Up
            { x: (x + 1) * cellSize, y: center.y },     // Right
            { x: center.x, y: (y + 1) * cellSize },     // Down
            { x: x * cellSize, y: center.y }            // Left
        ];
        
        for (let i = 0; i < 4; i++) {
            if (connections[i]) {
                ctx.fillRect(
                    Math.min(center.x, connectionPoints[i].x),
                    Math.min(center.y, connectionPoints[i].y),
                    i % 2 === 0 ? wireWidth : Math.abs(center.x - connectionPoints[i].x),
                    i % 2 === 0 ? Math.abs(center.y - connectionPoints[i].y) : wireWidth
                );
            }
        }
        
        // If conducting electricity or recently conducted, add electrical effect
        if (particle.hasElectricity || particle.conductivityTimer > 0) {
            // Calculate opacity based on timer
            const opacity = particle.hasElectricity ? 0.8 : (particle.conductivityTimer / 5) * 0.8;
            
            // Draw electricity effect along the wire
            ctx.strokeStyle = `rgba(100, 200, 255, ${opacity})`;
            ctx.lineWidth = wireWidth * 0.4;
            
            // Draw electrical arcs
            // For each connection, draw small arcs
            for (let i = 0; i < 4; i++) {
                if (connections[i]) {
                    ctx.beginPath();
                    
                    if (i % 2 === 0) { // Vertical connections (up/down)
                        const startY = i === 0 ? y * cellSize : center.y;
                        const endY = i === 0 ? center.y : (y + 1) * cellSize;
                        
                        // Zigzag pattern for electricity
                        ctx.moveTo(center.x, startY);
                        
                        const segmentCount = 3;
                        const segmentLength = Math.abs(endY - startY) / segmentCount;
                        
                        for (let j = 1; j <= segmentCount; j++) {
                            const zigzagX = center.x + (Math.random() * wireWidth - wireWidth / 2) * 0.7;
                            const segmentY = startY + j * segmentLength;
                            ctx.lineTo(zigzagX, segmentY);
                        }
                    } else { // Horizontal connections (left/right)
                        const startX = i === 3 ? x * cellSize : center.x;
                        const endX = i === 3 ? center.x : (x + 1) * cellSize;
                        
                        // Zigzag pattern for electricity
                        ctx.moveTo(startX, center.y);
                        
                        const segmentCount = 3;
                        const segmentLength = Math.abs(endX - startX) / segmentCount;
                        
                        for (let j = 1; j <= segmentCount; j++) {
                            const zigzagY = center.y + (Math.random() * wireWidth - wireWidth / 2) * 0.7;
                            const segmentX = startX + j * segmentLength;
                            ctx.lineTo(segmentX, zigzagY);
                        }
                    }
                    
                    ctx.stroke();
                }
            }
            
            // Draw a glow effect
            const glowRadius = cellSize * 0.6;
            const glowGradient = ctx.createRadialGradient(
                center.x,
                center.y,
                0,
                center.x,
                center.y,
                glowRadius
            );
            
            glowGradient.addColorStop(0, `rgba(100, 200, 255, ${opacity * 0.6})`);
            glowGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
            
            ctx.fillStyle = glowGradient;
            ctx.fillRect(
                center.x - glowRadius,
                center.y - glowRadius,
                glowRadius * 2,
                glowRadius * 2
            );
        }
        
        // Temperature effect - wire gets redder when hot
        if (particle.temperature > 100) {
            const heatRatio = Math.min(1, (particle.temperature - 100) / 300);
            
            // Apply a red overlay for heat
            ctx.fillStyle = `rgba(255, 0, 0, ${heatRatio * 0.5})`;
            ctx.fillRect(
                x * cellSize,
                y * cellSize,
                cellSize,
                cellSize
            );
            
            // Add a glow for very hot wires
            if (particle.temperature > 200) {
                const heatGlow = ctx.createRadialGradient(
                    center.x,
                    center.y,
                    0,
                    center.x,
                    center.y,
                    cellSize
                );
                
                const glowIntensity = heatRatio * 0.4;
                heatGlow.addColorStop(0, `rgba(255, 100, 0, ${glowIntensity})`);
                heatGlow.addColorStop(1, 'rgba(255, 100, 0, 0)');
                
                ctx.fillStyle = heatGlow;
                ctx.fillRect(
                    x * cellSize - cellSize / 2,
                    y * cellSize - cellSize / 2,
                    cellSize * 2,
                    cellSize * 2
                );
            }
        }
    }
};

// Make the element available globally
window.WireElement = WireElement; 