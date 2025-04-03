// Eraser Element
// A special element that erases other elements

const EraserElement = {
    name: 'eraser',
    label: 'Eraser',
    description: 'Removes particles from the grid',
    category: 'eraser',
    defaultColor: 'transparent',
    
    // Physical properties
    density: 0,
    isGas: false,
    isLiquid: false,
    isPowder: false,
    isSolid: false,
    isStatic: false,
    isSpawner: false,
    isElectrical: false,
    
    // Behavior properties
    flammable: false,
    conductive: false,
    explosive: false,
    reactive: false,
    corrosive: false,
    
    // Called when the element is created - never actually creates eraser particles
    updateOnCreate: function(particle) {
        return null; // Eraser doesn't actually create particles
    },
    
    // Process the element's behavior - not used for eraser
    process: function(x, y, grid, isInBounds) {
        // Eraser has no processing behavior
        return;
    },
    
    // Custom rendering for eraser preview
    render: function(ctx, x, y, particle, cellSize) {
        // Eraser is represented as an outline that is visible against the background
        const isDarkMode = document.body.classList.contains('dark-mode');
        ctx.strokeStyle = isDarkMode ? '#FFFFFF' : '#000000';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
        ctx.setLineDash([]);
    }
};

// Make the element available globally
window.EraserElement = EraserElement; 