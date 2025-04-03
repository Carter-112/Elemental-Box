// Eraser element module - acts as a tool rather than a physical element
window.EraserElement = {
    name: 'eraser',
    defaultColor: '#f0f0f0', // Very light gray/white
    density: 0,
    durability: 1.0, // Irrelevant as it's not really placed
    flammable: false,
    defaultTemperature: 25,
    stickiness: 0,
    isLiquid: false,
    isGas: false,
    isPowder: false,
    isTool: true, // Flag to indicate this is a tool rather than a physical element
    
    // Process eraser particles (not really used as eraser is a tool)
    process: function(x, y, grid, isInBounds) {
        // Eraser doesn't have actual particles to process
        return;
    },
    
    // Apply the eraser tool to a specific location
    applyTool: function(x, y, radius, grid, isInBounds) {
        // Eraser clears particles in a given radius
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const distance = Math.sqrt(i*i + j*j);
                if (distance > radius) continue;
                
                const newX = x + i;
                const newY = y + j;
                
                if (!isInBounds(newX, newY)) continue;
                
                // Simply remove the particle at this location
                grid[newY][newX] = null;
            }
        }
    },
    
    // Custom rendering for eraser tool preview
    render: function(ctx, x, y, particle, CELL_SIZE) {
        // Draw eraser preview - semi-transparent white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw eraser outline
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.05);
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw X pattern to indicate erasure
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.05);
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE + CELL_SIZE, y * CELL_SIZE);
        ctx.lineTo(x * CELL_SIZE, y * CELL_SIZE + CELL_SIZE);
        ctx.stroke();
    },
    
    // Render a larger preview when the eraser tool is active
    renderToolPreview: function(ctx, x, y, radius, CELL_SIZE) {
        // Create a circular eraser preview
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE/2, 
            y * CELL_SIZE + CELL_SIZE/2, 
            radius * CELL_SIZE,
            0,
            Math.PI * 2
        );
        
        // Fill with semi-transparent white
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.1);
        ctx.stroke();
        
        // Draw cross in the center
        const crossSize = Math.min(radius * 0.5, 1) * CELL_SIZE;
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = Math.max(1, CELL_SIZE * 0.1);
        
        ctx.beginPath();
        ctx.moveTo(
            x * CELL_SIZE + CELL_SIZE/2 - crossSize,
            y * CELL_SIZE + CELL_SIZE/2
        );
        ctx.lineTo(
            x * CELL_SIZE + CELL_SIZE/2 + crossSize,
            y * CELL_SIZE + CELL_SIZE/2
        );
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(
            x * CELL_SIZE + CELL_SIZE/2,
            y * CELL_SIZE + CELL_SIZE/2 - crossSize
        );
        ctx.lineTo(
            x * CELL_SIZE + CELL_SIZE/2,
            y * CELL_SIZE + CELL_SIZE/2 + crossSize
        );
        ctx.stroke();
    },
    
    // Update particle on creation (not used as eraser is a tool)
    updateOnCreate: function(particle) {
        // Eraser doesn't have actual particles
        return particle;
    }
}; 