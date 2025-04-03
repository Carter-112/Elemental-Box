// Steam element module
// window.SteamElement = {
window.SteamElement = {
    name: 'steam',
    defaultColor: '#DCDCDC',
    density: 0.3,
    durability: 1,
    flammable: false,
    defaultTemperature: 110,
    stickiness: 0,
    isLiquid: false,
    isGas: true,
    isPowder: false,
    
    process(x, y, particle) {
        // Steam rises
        if (y > 0 && !grid[y-1][x]) {
            grid[y][x] = null;
            grid[y-1][x] = particle;
            return;
        }
        
        // Random sideways movement
        const direction = Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < 0.3 && isInBounds(x + direction, y) && !grid[y][x + direction]) {
            grid[y][x] = null;
            grid[y][x + direction] = particle;
            return;
        }
        
        // Temperature effects
        if (particle.temperature < 100) {
            // Change to water when cooled
            if (Math.random() < 0.1) {
                if (window.ElementRegistry && typeof window.ElementRegistry.createParticle === 'function') {
                    grid[y][x] = window.ElementRegistry.createParticle('water');
                } else {
                    // Fallback if ElementRegistry is not available
                    grid[y][x] = { type: 'water', color: '#4286f4', temperature: 20, processed: false };
                }
                return;
            }
        }
        
        // Natural cooling
        particle.temperature -= 0.1;
    },
    
    render(x, y, ctx, particle) {
        // Make steam partially transparent
        const alpha = Math.max(0.2, Math.min(0.6, Math.random() * 0.4 + 0.2));
        
        // Base color with transparency
        ctx.globalAlpha = alpha;
        
        // Draw steam particle with slight random variation in size
        const size = Math.max(0.7, Math.min(1.0, 0.8 + Math.random() * 0.4));
        const adjX = x + (1 - size) / 2;
        const adjY = y + (1 - size) / 2;
        
        ctx.fillStyle = particle.color;
        ctx.fillRect(adjX * CELL_SIZE, adjY * CELL_SIZE, CELL_SIZE * size, CELL_SIZE * size);
        
        // Reset transparency
        ctx.globalAlpha = 1.0;
    },
    
    updateOnCreate(particle) {
        particle.temperature = this.defaultTemperature;
        return particle;
    }
}; 