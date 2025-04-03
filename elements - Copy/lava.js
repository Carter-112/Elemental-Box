// Lava element module
window.LavaElement = {
    name: 'lava',
    defaultColor: '#FF4500',
    density: 1.8,
    durability: 1.0,
    flammable: false,
    defaultTemperature: 1000,
    stickiness: 0,
    isLiquid: true,
    isGas: false,
    isPowder: false,
    
    // Process lava particles
    process: function(x, y, grid, isInBounds, helpers) {
        // Standard liquid movement - reuse water processing for movement
        helpers.processLiquid(x, y, grid, isInBounds);
        
        // If the particle was moved, return early
        if (!grid[y][x]) return;
        
        const lava = grid[y][x];
        
        // Lava slowly cools down over time
        if (Math.random() < 0.001) {
            lava.temperature -= 1;
            
            // When lava cools enough, it turns to stone
            if (lava.temperature < 700 && Math.random() < 0.05) {
                grid[y][x] = this.createStoneParticle();
                return;
            }
        }
        
        // Lava interacts with nearby materials
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 },  // down
        ];
        
        for (const dir of directions) {
            const newX = x + dir.dx;
            const newY = y + dir.dy;
            
            if (!isInBounds(newX, newY)) continue;
            
            const neighbor = grid[newY][newX];
            if (!neighbor) continue;
            
            // Special case: steel is resistant to lava
            if (neighbor.type === 'steel') continue;
            
            // Special case: acid + lava = steam
            if (neighbor.type === 'acid') {
                grid[newY][newX] = null;
                if (Math.random() < 0.5) {
                    if (isInBounds(newX, newY - 1) && !grid[newY - 1][newX]) {
                        grid[newY - 1][newX] = this.createSteamParticle();
                    }
                }
                continue;
            }
            
            // Lava melts materials gradually
            const meltChance = neighbor.type === 'metal' ? 0.04 :
                            neighbor.type === 'stone' || neighbor.type === 'brick' ? 0.05 :
                            neighbor.type === 'glass' ? 0.1 :
                            neighbor.type === 'dirt' ? 0.15 :
                            neighbor.type === 'ash' ? 0.3 : 0.05;
            
            if (Math.random() < meltChance) {
                // Different materials react differently
                if (neighbor.type === 'water') {
                    grid[newY][newX] = this.createSteamParticle();
                } else if (neighbor.type === 'ice') {
                    grid[newY][newX] = helpers.createParticle('water');
                } else if (neighbor.type === 'sand' || neighbor.type === 'salt') {
                    grid[newY][newX] = helpers.createParticle('glass');
                } else if (neighbor.flammable && !neighbor.burning) {
                    // Flammable materials ignite
                    neighbor.burning = true;
                    neighbor.burnDuration = this.getBurnDuration(neighbor.type);
                } else {
                    // Default behavior is to melt through, leaving empty space
                    grid[newY][newX] = null;
                }
            }
        }
        
        // Lava can emit fire particles upward
        if (y > 0 && !grid[y-1][x] && Math.random() < 0.05) {
            grid[y-1][x] = helpers.createParticle('fire');
            grid[y-1][x].burnDuration = 15; // Short duration
        }
    },
    
    // Create stone particle when lava cools
    createStoneParticle: function() {
        return {
            type: 'stone',
            color: '#888888',
            temperature: 30,
            processed: false,
            flammable: false
        };
    },
    
    // Create steam particle for lava-water interactions
    createSteamParticle: function() {
        return {
            type: 'steam',
            color: '#DCDCDC',
            temperature: 110,
            processed: false,
            burnDuration: 200,
            flammable: false
        };
    },
    
    // Get burn duration for different materials
    getBurnDuration: function(type) {
        switch (type) {
            case 'wood': return 400;
            case 'plant': return 60;
            case 'oil': return 200;
            case 'fuse': return 120;
            default: return 100;
        }
    },
    
    // Custom rendering for lava
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Base lava color
        const baseColor = particle.color;
        
        // Add a pulsing effect
        const pulse = Math.sin(Date.now() / 200) * 0.2;
        const brightness = 0.8 + pulse;
        
        // Adjust color brightness for pulsing glow
        let r = parseInt(baseColor.slice(1, 3), 16);
        let g = parseInt(baseColor.slice(3, 5), 16);
        let b = parseInt(baseColor.slice(5, 7), 16);
        
        r = Math.min(255, Math.floor(r * brightness));
        g = Math.min(255, Math.floor(g * brightness));
        b = Math.min(255, Math.floor(b * brightness));
        
        const adjustedColor = `rgb(${r}, ${g}, ${b})`;
        
        // Create a gradient for lava glow
        const gradient = ctx.createRadialGradient(
            x * CELL_SIZE + CELL_SIZE / 2, 
            y * CELL_SIZE + CELL_SIZE / 2, 
            CELL_SIZE / 4,
            x * CELL_SIZE + CELL_SIZE / 2, 
            y * CELL_SIZE + CELL_SIZE / 2, 
            CELL_SIZE / 2
        );
        
        gradient.addColorStop(0, '#FFFF00'); // Yellow hot center
        gradient.addColorStop(0.4, adjustedColor); // Normal lava color
        gradient.addColorStop(1, '#992200'); // Darker edge
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Add random bright spots for texture
        if (Math.random() < 0.3) {
            const spotX = x * CELL_SIZE + Math.random() * CELL_SIZE;
            const spotY = y * CELL_SIZE + Math.random() * CELL_SIZE;
            const spotSize = CELL_SIZE / 6;
            
            ctx.fillStyle = '#FFFF00';
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        // No special properties needed for lava on creation
        return particle;
    }
}; 