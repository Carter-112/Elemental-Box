// Bulb Element
// An electrical component that lights up when connected to power

const BulbElement = {
    name: 'bulb',
    label: 'Bulb',
    description: 'A light bulb that turns on when connected to power',
    category: 'electrical',
    defaultColor: '#F3F3F3', // Off state color
    
    // Physical properties
    density: 2.0,
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
        particle.powered = false; // Initially off
        particle.brightness = 0;  // Brightness level
        particle.connected = [];  // Track connections
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Reset power state at the beginning of each cycle
        const wasPowered = grid[y][x].powered || false;
        grid[y][x].powered = false;
        
        // Check for connected wires or batteries
        const neighbors = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];
        
        // First, check if we're connected to a power source
        let isPowered = false;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Check if connected to a powered wire or battery
            if (grid[ny][nx].type === 'wire' && grid[ny][nx].powered) {
                isPowered = true;
                break;
            }
            
            // Direct connection to a battery
            if (grid[ny][nx].type === 'battery') {
                isPowered = true;
                break;
            }
        }
        
        // Now check if a switch is in the circuit and if it's on
        let switchExists = false;
        let switchIsOn = false;
        
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || !grid[ny][nx]) continue;
            
            // Connected to a switch?
            if (grid[ny][nx].type === 'switch') {
                switchExists = true;
                switchIsOn = grid[ny][nx].on || false;
            }
            
            // Connected to a wire that's connected to a switch?
            if (grid[ny][nx].type === 'wire' && grid[ny][nx].connectedToSwitch) {
                switchExists = true;
                switchIsOn = grid[ny][nx].switchIsOn || false;
            }
        }
        
        // Update the bulb's power state
        if (isPowered) {
            if (!switchExists || (switchExists && switchIsOn)) {
                grid[y][x].powered = true;
            }
        }
        
        // Visual effects when the bulb's power state changes
        if (grid[y][x].powered) {
            // Bulb is on - bright color
            grid[y][x].color = '#FFFF99';
            
            // Bulb heats up when on
            grid[y][x].temperature = Math.min(grid[y][x].temperature + 0.5, 60);
            
            // Brightness animation
            if (grid[y][x].brightness < 1.0) {
                grid[y][x].brightness += 0.2;
            }
        } else {
            // Bulb is off - default color
            grid[y][x].color = this.defaultColor;
            
            // Bulb cools down when off
            if (grid[y][x].temperature > 25) {
                grid[y][x].temperature -= 0.5;
            }
            
            // Brightness animation
            if (grid[y][x].brightness > 0) {
                grid[y][x].brightness -= 0.2;
            } else {
                grid[y][x].brightness = 0;
            }
        }
        
        // Handle breaking if too hot
        if (grid[y][x].temperature > 150) {
            // Bulb breaks
            grid[y][x] = {
                type: 'glass-shard',
                color: '#DDDDDD',
                temperature: grid[y][x].temperature,
                processed: true,
                isGas: false,
                isLiquid: false,
                isPowder: true,
                isSolid: false
            };
            return;
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Draw bulb body
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        const bulbRadius = cellSize * 0.4;
        
        // Draw base
        ctx.fillStyle = '#999999';
        ctx.fillRect(
            x * cellSize + cellSize * 0.3, 
            y * cellSize + cellSize * 0.6, 
            cellSize * 0.4, 
            cellSize * 0.4
        );
        
        // Draw bulb glass
        ctx.fillStyle = particle.color || this.defaultColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY - cellSize * 0.1, bulbRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw filament inside
        ctx.strokeStyle = particle.powered ? '#FFCC00' : '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - bulbRadius * 0.5, centerY);
        ctx.lineTo(centerX - bulbRadius * 0.2, centerY - bulbRadius * 0.3);
        ctx.lineTo(centerX + bulbRadius * 0.2, centerY - bulbRadius * 0.3);
        ctx.lineTo(centerX + bulbRadius * 0.5, centerY);
        ctx.stroke();
        
        // Draw light glow when powered
        if (particle.brightness && particle.brightness > 0) {
            const gradient = ctx.createRadialGradient(
                centerX, centerY - cellSize * 0.1, bulbRadius,
                centerX, centerY - cellSize * 0.1, bulbRadius * 3
            );
            gradient.addColorStop(0, `rgba(255, 255, 200, ${particle.brightness * 0.7})`);
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY - cellSize * 0.1, bulbRadius * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Make the element available globally
window.BulbElement = BulbElement; 