// Solid Ash Element
// A solid form of ash that eventually crumbles into powder

const SolidAshElement = {
    name: 'solid-ash',
    label: 'Solid Ash',
    description: 'Solid ash that will eventually crumble into powder',
    category: 'solid',
    defaultColor: '#444444',
    
    // Physical properties
    density: 0.6,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: true,
    isStatic: true,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    temperature: 100, // Warm from recent burning
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.timer = 0;
        particle.integrity = 100;
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Initialize properties if not set
        if (grid[y][x].timer === undefined) {
            grid[y][x].timer = 0;
        }
        
        // Increment timer
        grid[y][x].timer++;
        
        // Cool down over time
        if (grid[y][x].temperature > 25) {
            grid[y][x].temperature -= 0.5;
        }
        
        // After about 1 second, convert to regular ash (powder)
        if (grid[y][x].timer >= 30) {
            grid[y][x] = {
                type: 'ash',
                color: '#555555',
                temperature: grid[y][x].temperature,
                processed: true,
                isPowder: true,
                isLiquid: false,
                isGas: false,
                isSolid: false
            };
            return;
        }
    },
    
    // Custom rendering function
    render: function(ctx, x, y, particle, cellSize) {
        // Base color
        const baseColor = particle.color || this.defaultColor;
        ctx.fillStyle = baseColor;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        
        // Add texture - charred cracks
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        
        // Create a pattern of cracks
        const crackSeed = Math.floor(x * 1000 + y); // Deterministic seed based on position
        const crackCount = 3 + (crackSeed % 3);
        
        // Use the seed to create a deterministic random generator
        const rand = (n) => {
            return ((crackSeed * (n + 1)) % 100) / 100;
        };
        
        for (let i = 0; i < crackCount; i++) {
            const startX = x * cellSize + rand(i * 2) * cellSize;
            const startY = y * cellSize + rand(i * 2 + 1) * cellSize;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            // Create a jagged line for the crack
            let currentX = startX;
            let currentY = startY;
            const segments = 2 + Math.floor(rand(i + 10) * 3);
            
            for (let j = 0; j < segments; j++) {
                currentX += (rand(i * j + 5) * cellSize * 0.5) - cellSize * 0.25;
                currentY += (rand(i * j + 6) * cellSize * 0.5) - cellSize * 0.25;
                
                // Keep within cell bounds
                currentX = Math.max(x * cellSize, Math.min(currentX, (x + 1) * cellSize));
                currentY = Math.max(y * cellSize, Math.min(currentY, (y + 1) * cellSize));
                
                ctx.lineTo(currentX, currentY);
            }
            
            ctx.stroke();
        }
        
        // Add some embers if still hot
        if (particle.temperature > 70) {
            const emberCount = Math.floor((particle.temperature - 70) / 10);
            ctx.fillStyle = `rgba(255, 100, 0, ${(particle.temperature - 70) / 100})`;
            
            for (let i = 0; i < emberCount; i++) {
                const emberX = x * cellSize + rand(i + 50) * cellSize;
                const emberY = y * cellSize + rand(i + 51) * cellSize;
                const emberSize = 1 + rand(i + 52);
                
                ctx.beginPath();
                ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
};

// Make the element available globally
window.SolidAshElement = SolidAshElement; 