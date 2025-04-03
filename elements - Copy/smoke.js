// Smoke element module
window.SmokeElement = {
    name: 'smoke',
    defaultColor: '#A9A9A9',
    density: 0.2,
    durability: 1.0,
    flammable: false,
    defaultTemperature: 80,
    stickiness: 0,
    isLiquid: false,
    isGas: true,
    isPowder: false,
    
    // Process smoke particles
    process: function(x, y, grid, isInBounds) {
        if (!grid[y][x] || grid[y][x].processed) return;
        
        const particle = grid[y][x];
        particle.processed = true;
        
        // Initialize lifetime if not set
        particle.burnDuration = particle.burnDuration || 200;
        particle.burnDuration--;
        
        // Remove smoke when its lifetime is over
        if (particle.burnDuration <= 0) {
            grid[y][x] = null;
            return;
        }
        
        // Smoke fades over time
        if (particle.burnDuration < 100) {
            // Adjust opacity based on remaining lifetime
            const opacity = Math.max(0.2, particle.burnDuration / 100);
            particle.color = this.adjustOpacity(particle.color, opacity);
        }
        
        // Smoke should float upward
        if (y > 0) {
            // Try to move directly up
            if (!grid[y-1][x]) {
                grid[y-1][x] = grid[y][x];
                grid[y][x] = null;
                return;
            }
            
            // Try to move diagonally up
            const directions = Math.random() < 0.5 ? [-1, 1] : [1, -1];
            for (const dx of directions) {
                if (isInBounds(x+dx, y-1) && !grid[y-1][x+dx]) {
                    grid[y-1][x+dx] = grid[y][x];
                    grid[y][x] = null;
                    return;
                }
            }
        }
    },
    
    // Helper function to adjust opacity of a color
    adjustOpacity: function(color, opacity) {
        if (color.startsWith('rgba')) {
            // Already has opacity, update it
            return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/, 
                                `rgba($1, $2, $3, ${opacity})`);
        } else if (color.startsWith('rgb')) {
            // Convert to rgba
            return color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, 
                                `rgba($1, $2, $3, ${opacity})`);
        } else if (color.startsWith('#')) {
            // Extract RGB components
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            // Return color with opacity
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        return color;
    },
    
    // Optional custom rendering - if not provided, default rendering is used
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Calculate opacity based on lifetime
        const opacity = Math.max(0.2, particle.burnDuration / 200);
        
        // Get RGB values from the color
        let r, g, b;
        
        if (particle.color.startsWith('rgba')) {
            const match = particle.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                r = match[1];
                g = match[2];
                b = match[3];
            }
        } else if (particle.color.startsWith('rgb')) {
            const match = particle.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                r = match[1];
                g = match[2];
                b = match[3];
            }
        } else if (particle.color.startsWith('#')) {
            r = parseInt(particle.color.slice(1, 3), 16);
            g = parseInt(particle.color.slice(3, 5), 16);
            b = parseInt(particle.color.slice(5, 7), 16);
        }
        
        if (r === undefined) {
            // Fallback if color parsing failed
            ctx.fillStyle = particle.color;
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            return;
        }
        
        // Create a gradient for more realistic smoke
        const gradient = ctx.createRadialGradient(
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            0,
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            CELL_SIZE/2
        );
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            CELL_SIZE/2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
    },
    
    // Update particle on creation
    updateOnCreate: function(particle) {
        particle.burnDuration = 200; // Smoke lifetime
        return particle;
    }
}; 