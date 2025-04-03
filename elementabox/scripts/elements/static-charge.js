// Static Charge Element
// Electric intense temporary fast moving charge that flies in all directions and disappears quickly
// It's not affected by gravity, makes a lot of heat very close to it, and can end up on wires to give power

const StaticChargeElement = {
    name: 'static-charge',
    label: 'Static Charge',
    description: 'Electric charge that moves quickly, creates heat, and powers electrical components',
    category: 'electrical',
    defaultColor: '#FFFF80', // Bright yellow
    
    // Physical properties
    density: 0.1, // Very light
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: true,
    
    // Behavior properties
    flammable: false,
    conductive: true,
    explosive: false,
    reactive: true,
    corrosive: false,
    temperature: 100, // Static charge is hot
    
    // Called when the element is created
    updateOnCreate: function(particle) {
        particle.processed = false;
        particle.temperature = this.temperature;
        particle.lifetime = 20 + Math.floor(Math.random() * 30); // Short lifetime
        
        // Direction of movement
        const angle = Math.random() * Math.PI * 2;
        particle.direction = {
            dx: Math.cos(angle),
            dy: Math.sin(angle)
        };
        
        // Intensity of the charge
        particle.intensity = 0.8 + (Math.random() * 0.4);
        
        // Visual effects
        particle.size = 0.3 + (Math.random() * 0.3);
        particle.opacity = 0.7 + (Math.random() * 0.3);
        
        // Color variations from yellow to white
        const brightness = Math.floor(Math.random() * 30);
        particle.color = `rgb(${255 - brightness}, ${255 - brightness}, ${128 + brightness})`;
        
        // Branch count for rendering forked lightning
        particle.branchCount = Math.floor(Math.random() * 3) + 1;
        
        return particle;
    },
    
    // Process the element's behavior
    process: function(x, y, grid, isInBounds) {
        // Skip if already processed
        if (grid[y][x].processed) return;
        
        // Mark as processed
        grid[y][x].processed = true;
        
        // Decrease lifetime
        grid[y][x].lifetime -= 1;
        
        // Disappear if lifetime is up
        if (grid[y][x].lifetime <= 0) {
            grid[y][x] = null;
            return;
        }
        
        // Update size and opacity based on lifetime - fades as it disappears
        const lifeRatio = grid[y][x].lifetime / (20 + 30); // based on initial lifetime range
        grid[y][x].size = Math.max(0.1, grid[y][x].size * 0.98);
        grid[y][x].opacity = Math.max(0.2, lifeRatio);
        
        // Determine next position using direction vector
        const moveSpeed = 0.8 + (Math.random() * 0.4); // Randomize movement speed
        
        // Quantize direction to grid coordinates and add randomness
        let moveX = Math.round(grid[y][x].direction.dx * moveSpeed);
        let moveY = Math.round(grid[y][x].direction.dy * moveSpeed);
        
        // Add some randomness to the movement for erratic behavior
        if (Math.random() < 0.3) {
            moveX += Math.floor(Math.random() * 3) - 1;
            moveY += Math.floor(Math.random() * 3) - 1;
        }
        
        // Limit movement to 1 cell per tick for processing stability
        moveX = Math.min(1, Math.max(-1, moveX));
        moveY = Math.min(1, Math.max(-1, moveY));
        
        // Calculate the next position
        const newX = x + moveX;
        const newY = y + moveY;
        
        // Check for interactions with surrounding cells
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
            
            // Heat up nearby cells
            if (grid[ny][nx].temperature !== undefined) {
                grid[ny][nx].temperature += 2;
            }
            
            // Interact with conductive materials
            if (grid[ny][nx].conductive) {
                // Transfer charge to conductive material
                if (grid[ny][nx].type === 'wire') {
                    // Activate the wire with power
                    grid[ny][nx].powered = true;
                    grid[ny][nx].powerLevel = Math.max(grid[ny][nx].powerLevel || 0, grid[y][x].intensity);
                    grid[ny][nx].powerDuration = 100; // Power duration in ticks
                    
                    // Consume the static charge when it powers something
                    grid[y][x] = null;
                    return;
                } else if (grid[ny][nx].type === 'glass' || grid[ny][nx].type === 'metal') {
                    // Start a spark on glass or metal
                    grid[ny][nx].hasSpark = true;
                    grid[ny][nx].sparkStrength = grid[y][x].intensity;
                    grid[ny][nx].sparkProgress = 0;
                    
                    // Determine direction (away from the static charge)
                    grid[ny][nx].sparkDirection = {
                        dx: -dir.dx,
                        dy: -dir.dy
                    };
                    
                    // Consume the static charge
                    grid[y][x] = null;
                    return;
                } else if (grid[ny][nx].type === 'bulb') {
                    // Light up the bulb temporarily
                    grid[ny][nx].powered = true;
                    grid[ny][nx].powerLevel = grid[y][x].intensity;
                    grid[ny][nx].powerDuration = 30;
                    
                    // Consume the static charge
                    grid[y][x] = null;
                    return;
                }
            }
            
            // Ignite flammable materials if they're not already burning
            if (grid[ny][nx].flammable && !grid[ny][nx].burning && Math.random() < 0.1) {
                grid[ny][nx].burning = true;
                grid[ny][nx].temperature = Math.max(grid[ny][nx].temperature || 0, 100);
            }
            
            // Static charge is neutralized by water
            if (grid[ny][nx].type === 'water') {
                // Chance to electrify the water briefly
                if (Math.random() < 0.5) {
                    grid[ny][nx].electrified = true;
                    grid[ny][nx].electrifyDuration = 10;
                }
                
                // Dissipate in water
                grid[y][x] = null;
                return;
            }
        }
        
        // Bounce off boundaries
        if (!isInBounds(newX, newY)) {
            // Reflect direction when hitting a boundary
            if (newX < 0 || newX >= grid[0].length) {
                grid[y][x].direction.dx *= -1;
            }
            if (newY < 0 || newY >= grid.length) {
                grid[y][x].direction.dy *= -1;
            }
            
            // Stay in place this tick
            return;
        }
        
        // Bounce off solid materials
        if (isInBounds(newX, newY) && grid[newY][newX] && grid[newY][newX].isSolid) {
            // Reflect direction based on which side was hit
            if (moveX !== 0 && newX !== x) {
                grid[y][x].direction.dx *= -1;
            }
            if (moveY !== 0 && newY !== y) {
                grid[y][x].direction.dy *= -1;
            }
            
            // Sometimes split the charge when it hits a solid
            if (Math.random() < 0.2) {
                this.splitCharge(x, y, grid, isInBounds);
            }
            
            // Stay in place this tick
            return;
        }
        
        // Move to new position if empty
        if (isInBounds(newX, newY) && !grid[newY][newX]) {
            grid[newY][newX] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // If we get here, the charge couldn't move in its intended direction
        // Try random directions until one works
        const shuffledNeighbors = [...neighbors].sort(() => Math.random() - 0.5);
        
        for (const dir of shuffledNeighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (!isInBounds(nx, ny) || grid[ny][nx]) continue;
            
            // Update direction to match the chosen path
            grid[y][x].direction = { dx: dir.dx, dy: dir.dy };
            
            // Move the charge
            grid[ny][nx] = grid[y][x];
            grid[y][x] = null;
            return;
        }
        
        // If still can't move, start fading faster
        grid[y][x].lifetime -= 2;
    },
    
    // Split the static charge into two smaller charges
    splitCharge: function(x, y, grid, isInBounds) {
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        // Filter to find empty cells
        const emptyNeighbors = [];
        for (const dir of neighbors) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (isInBounds(nx, ny) && !grid[ny][nx]) {
                emptyNeighbors.push({ x: nx, y: ny, dir });
            }
        }
        
        // If there's at least one empty cell, create a split charge
        if (emptyNeighbors.length > 0) {
            const targetCell = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
            
            // Create a new static charge with reduced intensity
            grid[targetCell.y][targetCell.x] = {
                type: 'static-charge',
                color: grid[y][x].color,
                processed: true,
                temperature: grid[y][x].temperature,
                lifetime: grid[y][x].lifetime * 0.7,
                isGas: false,
                isLiquid: false,
                isPowder: false,
                isSolid: false,
                isElectrical: true,
                direction: {
                    dx: targetCell.dir.dx,
                    dy: targetCell.dir.dy
                },
                intensity: grid[y][x].intensity * 0.6,
                size: grid[y][x].size * 0.8,
                opacity: grid[y][x].opacity,
                branchCount: 1
            };
            
            // Reduce original charge's intensity
            grid[y][x].intensity *= 0.8;
            grid[y][x].lifetime *= 0.9;
        }
    },
    
    // Render the static charge
    render: function(ctx, x, y, particle, cellSize) {
        const centerX = x * cellSize + cellSize / 2;
        const centerY = y * cellSize + cellSize / 2;
        
        // Set transparency based on particle opacity
        ctx.globalAlpha = particle.opacity || 0.8;
        
        // Draw the charge glow
        const radius = cellSize * 0.4 * (particle.size || 1);
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.3, particle.color || this.defaultColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw lightning branches if intensity is high enough
        if ((particle.intensity || 1) > 0.6) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            
            const branchCount = particle.branchCount || 2;
            
            for (let i = 0; i < branchCount; i++) {
                const angle = (i / branchCount) * Math.PI * 2;
                const length = radius * 1.2;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                
                // Create a jagged lightning path
                let currentX = centerX;
                let currentY = centerY;
                const segments = 3;
                
                for (let j = 1; j <= segments; j++) {
                    const segmentLength = length * (j / segments);
                    const segmentAngle = angle + (Math.random() - 0.5) * 0.5;
                    
                    const nextX = centerX + Math.cos(segmentAngle) * segmentLength;
                    const nextY = centerY + Math.sin(segmentAngle) * segmentLength;
                    
                    ctx.lineTo(nextX, nextY);
                }
                
                ctx.stroke();
            }
        }
        
        // Draw a bright center
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellSize * 0.1 * (particle.size || 1), 0, Math.PI * 2);
        ctx.fill();
        
        // Reset opacity
        ctx.globalAlpha = 1.0;
    }
};

// Make the element available globally
window.StaticChargeElement = StaticChargeElement; 